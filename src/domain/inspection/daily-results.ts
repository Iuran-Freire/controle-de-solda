import { MOMENTS, type Inspection, type LocalRow } from './types';
export function dailyResults(
  rows: LocalRow<Inspection>[],
  stationId: string,
  from = '',
  to = '',
  shift = '',
) {
  const selected = rows
    .filter(
      (r) =>
        r.status !== 'conflict' &&
        r.data.stationId === stationId &&
        (!from || r.data.productionDate >= from) &&
        (!to || r.data.productionDate <= to) &&
        (!shift || r.data.shift === shift),
    )
    .sort(
      (a, b) =>
        a.data.productionDate.localeCompare(b.data.productionDate) ||
        a.data.shift.localeCompare(b.data.shift) ||
        a.data.measuredAt.localeCompare(b.data.measuredAt) ||
        a.id.localeCompare(b.id),
    );
  const groups = new Map<
    string,
    {
      label: string;
      date: string;
      shift: string;
      ok: number;
      nc: number;
      pending: number;
    }
  >();
  for (const r of selected) {
    const i = r.data,
      key = `${i.productionDate}|${i.shift}`;
    const g = groups.get(key) ?? {
      label: `${i.productionDate.slice(8, 10)}/${i.productionDate.slice(5, 7)} · ${i.shift}º`,
      date: i.productionDate,
      shift: i.shift,
      ok: 0,
      nc: 0,
      pending: 0,
    };
    g[i.result === 'OK' ? 'ok' : 'nc']++;
    if (r.status === 'pending') g.pending++;
    groups.set(key, g);
  }
  return {
    rows: selected,
    groups: [...groups.values()],
    points: selected.map((r) => ({
      ...r.data,
      label: `${r.data.productionDate.slice(8, 10)}/${r.data.productionDate.slice(5, 7)} · ${r.data.shift}º · ${r.data.moment}`,
      momentLabel: MOMENTS[r.data.moment],
      tempMin: r.data.limits.min,
      tempMax: r.data.limits.max,
      resMax: r.data.limits.resistance,
      voltMax: r.data.limits.voltage,
    })),
  };
}
