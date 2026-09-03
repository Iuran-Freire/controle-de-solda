import type { Inspection, LocalRow, Moment } from './types';
export type NumericCheck = 'resistance' | 'voltage' | 'temperature';
export function shiftComparisons(
  rows: LocalRow<Inspection>[],
  stationId: string,
) {
  const groups = new Map<
    string,
    {
      date: string;
      shift: string;
      moments: Record<Moment, LocalRow<Inspection>[]>;
    }
  >();
  for (const row of rows) {
    const i = row.data;
    if (i.stationId !== stationId || row.status === 'conflict') continue;
    const key = `${i.productionDate}|${i.shift}`;
    const group = groups.get(key) ?? {
      date: i.productionDate,
      shift: i.shift,
      moments: { IT: [], AR: [], FT: [] },
    };
    group.moments[i.moment].push(row);
    groups.set(key, group);
  }
  return [...groups.values()].sort(
    (a, b) => a.date.localeCompare(b.date) || a.shift.localeCompare(b.shift),
  );
}
export function momentValue(
  rows: LocalRow<Inspection>[],
  key: NumericCheck,
): number | null {
  return rows.length === 1 ? rows[0].data[key] : null;
}
export function difference(
  later: number | null,
  earlier: number | null,
): number | null {
  return later === null || earlier === null
    ? null
    : Number((later - earlier).toFixed(2));
}
