import type { LocalRow, Station, Inspection } from '../inspection/types';
export type StoreName = 'stations' | 'inspections' | 'settings';
let connection: Promise<IDBDatabase> | undefined;
function db() {
  if (!connection)
    connection = new Promise((resolve, reject) => {
      const r = indexedDB.open('inventus-solda-v1', 1);
      r.onupgradeneeded = () => {
        for (const name of ['stations', 'inspections', 'settings'])
          r.result.createObjectStore(name, { keyPath: 'id' });
      };
      r.onsuccess = () => {
        r.result.onversionchange = () => {
          r.result.close();
          connection = undefined;
        };
        resolve(r.result);
      };
      r.onerror = () => {
        connection = undefined;
        reject(
          new Error(
            'Não foi possível abrir o armazenamento local. Verifique as permissões do navegador.',
          ),
        );
      };
    });
  return connection;
}
export async function all<T>(name: StoreName): Promise<T[]> {
  const d = await db();
  return new Promise((resolve, reject) => {
    const r = d.transaction(name).objectStore(name).getAll();
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
export async function put<T extends { id: string }>(name: StoreName, value: T) {
  const d = await db();
  return new Promise<void>((resolve, reject) => {
    const tx = d.transaction(name, 'readwrite');
    tx.objectStore(name).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () =>
      reject(tx.error ?? new Error('Falha ao salvar no aparelho.'));
  });
}
export async function addInspection(data: Inspection) {
  const d = await db();
  return new Promise<void>((resolve, reject) => {
    const tx = d.transaction('inspections', 'readwrite');
    const store = tx.objectStore('inspections');
    const request = store.getAll();
    let duplicate = false;
    request.onsuccess = () => {
      duplicate = (request.result as LocalRow<Inspection>[]).some(
        (r) =>
          r.data.stationId === data.stationId &&
          r.data.productionDate === data.productionDate &&
          r.data.shift === data.shift &&
          r.data.moment === data.moment,
      );
      if (duplicate) tx.abort();
      else store.add({ id: data.id, data, status: 'pending' });
    };
    tx.oncomplete = () => resolve();
    tx.onabort = () =>
      reject(
        new Error(
          duplicate
            ? 'Já existe uma inspeção para esta estação, data de produção, turno e momento. Consulte o histórico.'
            : 'Não foi possível salvar. O formulário foi mantido.',
        ),
      );
    tx.onerror = () => reject(tx.error);
  });
}
export async function addStation(data: Station) {
  const existing = await all<LocalRow<Station>>('stations');
  if (
    existing.some(
      (r) =>
        r.data.line.toLowerCase() === data.line.toLowerCase() &&
        r.data.code.toLowerCase() === data.code.toLowerCase(),
    )
  )
    throw new Error('Esta estação já está cadastrada nesta linha.');
  await put('stations', { id: data.id, data, status: 'pending' });
}
export async function setting<T>(id: string): Promise<T | undefined> {
  const rows = await all<{ id: string; value: T }>('settings');
  return rows.find((r) => r.id === id)?.value;
}
export async function setSetting(id: string, value: unknown) {
  await put('settings', { id, value });
}
