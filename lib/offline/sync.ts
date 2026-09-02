import { all, put, setSetting } from './database';
import type { Inspection, Station, LocalRow } from '../inspection/types';
let running: Promise<{ sent: number }> | undefined;
type SyncResponse = {
  results?: { id: string; status: string; error?: string }[];
  records?: (Station | Inspection)[];
  nextCursor: number | null;
};
async function request(
  path: string,
  init?: RequestInit,
): Promise<SyncResponse> {
  const response = await fetch(path, {
    ...init,
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new Error(
      response.status === 401 || response.status === 403
        ? 'Acesso à base expirado. Abra o sistema com conexão para entrar novamente.'
        : 'Base indisponível. Os registros continuam guardados neste aparelho.',
    );
  if (!response.headers.get('content-type')?.includes('application/json'))
    throw new Error(
      'A base não confirmou o recebimento. Entre novamente com conexão.',
    );
  return (await response.json()) as SyncResponse;
}
export function synchronize() {
  if (running) return running;
  running = perform().finally(() => {
    running = undefined;
  });
  return running;
}
async function perform() {
  let sent = 0;
  for (const kind of ['stations', 'inspections'] as const) {
    const local = await all<LocalRow<Station | Inspection>>(kind);
    const pending = local.filter((r) => r.status === 'pending');
    for (let i = 0; i < pending.length; i += 50) {
      const batch = pending.slice(i, i + 50);
      const response = await request('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, records: batch.map((r) => r.data) }),
      });
      if (!Array.isArray(response.results))
        throw new Error('Resposta de sincronização inválida.');
      for (const row of batch) {
        const ack = response.results!.find(
          (a: { id: string; status: string }) => a.id === row.id,
        );
        if (ack?.status === 'synced') {
          await put(kind, { ...row, status: 'synced', error: undefined });
          sent++;
        } else if (ack?.status === 'conflict') {
          await put(kind, {
            ...row,
            status: 'conflict',
            error: String(ack.error),
          });
        } else
          throw new Error(
            'Registro sem confirmação. Envio mantido como pendente.',
          );
      }
    }
    let cursor = 0;
    for (;;) {
      const response = await request(`/api/sync?kind=${kind}&cursor=${cursor}`);
      if (!Array.isArray(response.records))
        throw new Error('Resposta inválida ao atualizar o histórico.');
      const current = new Map(
        (await all<LocalRow<Station | Inspection>>(kind)).map((r) => [r.id, r]),
      );
      for (const data of response.records) {
        const existing = current.get(data.id);
        if (!existing || existing.status === 'synced')
          await put(kind, { id: data.id, data, status: 'synced' });
      }
      if (response.nextCursor === null) break;
      cursor = response.nextCursor;
    }
  }
  await setSetting('lastSync', new Date().toISOString());
  return { sent };
}
