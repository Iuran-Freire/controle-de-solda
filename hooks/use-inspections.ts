'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { all, setting } from '@/lib/offline/database';
import { synchronize } from '@/lib/offline/sync';
import type { Inspection, Station, LocalRow } from '@/lib/inspection/types';
export function useInspections() {
  const [stations, setStations] = useState<LocalRow<Station>[]>([]),
    [inspections, setInspections] = useState<LocalRow<Inspection>[]>([]),
    [online, setOnline] = useState(true),
    [syncing, setSyncing] = useState(false),
    [error, setError] = useState(''),
    [lastSync, setLastSync] = useState<string>(),
    [ready, setReady] = useState(false),
    [offlineReady, setOfflineReady] = useState(false),
    [updateAvailable, setUpdateAvailable] = useState(false);
  const busy = useRef(false);
  const refresh = useCallback(async () => {
    const [s, i, l] = await Promise.all([
      all<LocalRow<Station>>('stations'),
      all<LocalRow<Inspection>>('inspections'),
      setting<string>('lastSync'),
    ]);
    setStations(s);
    setInspections(
      i.sort((a, b) => b.data.measuredAt.localeCompare(a.data.measuredAt)),
    );
    setLastSync(l);
    setReady(true);
  }, []);
  const sync = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setSyncing(true);
    setError('');
    try {
      await synchronize();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha na sincronização.');
    } finally {
      try {
        await refresh();
      } catch (e) {
        setError(String(e));
      }
      busy.current = false;
      setSyncing(false);
    }
  }, [refresh]);
  useEffect(() => {
    void refresh().catch((e) => setError(String(e)));
    const changed = () => {
      setOnline(navigator.onLine);
      if (navigator.onLine) void sync();
    };
    changed();
    window.addEventListener('online', changed);
    window.addEventListener('offline', changed);
    const timer = setInterval(() => {
      if (navigator.onLine) void sync();
    }, 60000);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => navigator.serviceWorker.ready)
        .then(async () => {
          const keys = await caches.keys();
          setOfflineReady(keys.some((k) => k.startsWith('solda-')));
        })
        .catch(() => setOfflineReady(false));
    }
    return () => {
      window.removeEventListener('online', changed);
      window.removeEventListener('offline', changed);
      clearInterval(timer);
    };
  }, [refresh, sync]);
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const wasControlled = !!navigator.serviceWorker.controller;
    const changed = () => {
      if (wasControlled) setUpdateAvailable(true);
    };
    navigator.serviceWorker.addEventListener('controllerchange', changed);
    return () =>
      navigator.serviceWorker.removeEventListener('controllerchange', changed);
  }, []);
  return {
    stations,
    inspections,
    online,
    syncing,
    error,
    lastSync,
    ready,
    offlineReady,
    updateAvailable,
    refresh,
    sync,
    pending:
      stations.filter((r) => r.status === 'pending').length +
      inspections.filter((r) => r.status === 'pending').length,
    conflicts:
      stations.filter((r) => r.status === 'conflict').length +
      inspections.filter((r) => r.status === 'conflict').length,
  };
}
export type InspectionState = ReturnType<typeof useInspections>;
