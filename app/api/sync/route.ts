import { database } from '@/lib/server/database';
import {
  validateStation,
  validateInspection,
  businessKey,
} from '@/lib/inspection/validation';
import type { Station } from '@/lib/inspection/types';
const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const kind = url.searchParams.get('kind');
    if (kind !== 'stations' && kind !== 'inspections')
      return json({ error: 'Tipo inválido' }, 400);
    const cursor = Number(url.searchParams.get('cursor') ?? 0);
    if (!Number.isSafeInteger(cursor) || cursor < 0)
      return json({ error: 'Cursor inválido' }, 400);
    const { results } = await database()
      .prepare(
        `SELECT seq,payload FROM ${kind} WHERE seq > ? ORDER BY seq LIMIT 200`,
      )
      .bind(cursor)
      .all<{ seq: number; payload: string }>();
    return json({
      records: results.map((r) => JSON.parse(r.payload)),
      nextCursor: results.length === 200 ? results.at(-1)!.seq : null,
    });
  } catch {
    return json({ error: 'Base indisponível' }, 503);
  }
}
export async function POST(request: Request) {
  if (
    request.headers.get('origin') &&
    request.headers.get('origin') !== new URL(request.url).origin
  )
    return json({ error: 'Origem inválida' }, 403);
  try {
    const raw = await request.text();
    if (raw.length > 500000) return json({ error: 'Lote muito grande' }, 413);
    const { kind, records } = JSON.parse(raw);
    if (
      !['stations', 'inspections'].includes(kind) ||
      !Array.isArray(records) ||
      records.length > 50
    )
      return json({ error: 'Lote inválido' }, 400);
    const db = database();
    const results = [];
    for (const input of records) {
      try {
        const data =
          kind === 'stations'
            ? validateStation(input)
            : validateInspection(input);
        const payload = JSON.stringify(data);
        const existing = await db
          .prepare(`SELECT payload FROM ${kind} WHERE id = ?`)
          .bind(data.id)
          .first<{ payload: string }>();
        if (existing) {
          results.push({
            id: data.id,
            status: existing.payload === payload ? 'synced' : 'conflict',
            error: 'Este identificador já existe com outro conteúdo.',
          });
          continue;
        }
        if (kind === 'stations') {
          const s = validateStation(data);
          const key = `${s.line.toLowerCase()}|${s.code.toLowerCase()}`;
          await db
            .prepare(
              'INSERT INTO stations (id,station_key,payload) VALUES (?,?,?) ON CONFLICT DO NOTHING',
            )
            .bind(s.id, key, payload)
            .run();
        } else {
          const i = validateInspection(data);
          const station = await db
            .prepare('SELECT payload FROM stations WHERE id = ?')
            .bind(i.stationId)
            .first<{ payload: string }>();
          if (!station)
            throw new Error('A estação precisa ser sincronizada primeiro.');
          const limits = (JSON.parse(station.payload) as Station).limits;
          if (JSON.stringify(limits) !== JSON.stringify(i.limits))
            throw new Error(
              'Os limites diferem do cadastro da estação. Revise o registro.',
            );
          await db
            .prepare(
              'INSERT INTO inspections (id,business_key,station_id,payload) VALUES (?,?,?,?) ON CONFLICT DO NOTHING',
            )
            .bind(i.id, businessKey(i), i.stationId, payload)
            .run();
        }
        const saved = await db
          .prepare(`SELECT payload FROM ${kind} WHERE id = ?`)
          .bind(data.id)
          .first<{ payload: string }>();
        results.push(
          saved?.payload === payload
            ? { id: data.id, status: 'synced' }
            : {
                id: data.id,
                status: 'conflict',
                error:
                  'Já existe um cadastro ou uma inspeção equivalente na base. Seu registro local foi preservado para revisão.',
              },
        );
      } catch (error) {
        if (error instanceof Error && /D1|SQLITE|database/i.test(error.message))
          throw error;
        results.push({
          id: input?.id,
          status: 'conflict',
          error: error instanceof Error ? error.message : 'Registro inválido',
        });
      }
    }
    return json({ results });
  } catch {
    return json({ error: 'Falha ao processar o lote. Tente novamente.' }, 503);
  }
}
