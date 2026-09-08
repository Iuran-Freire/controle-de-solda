import type { Inspection, LocalRow } from './types';
export interface ReportFilter {
  start: string;
  period: 'day' | 'week' | 'month';
  shifts: string[];
  stationId: string;
}
export function reportEnd(filter: ReportFilter) {
  if (filter.period === 'month') {
    if (!/^\d{4}-\d{2}$/.test(filter.start)) return '';
    const date = new Date(`${filter.start}-01T12:00:00Z`);
    if (!Number.isFinite(date.getTime())) return '';
    date.setUTCMonth(date.getUTCMonth() + 1);
    date.setUTCDate(0);
    return date.toISOString().slice(0, 10);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(filter.start)) return '';
  const date = new Date(`${filter.start}T12:00:00Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== filter.start
  )
    return '';
  date.setUTCDate(date.getUTCDate() + (filter.period === 'week' ? 6 : 0));
  return date.toISOString().slice(0, 10);
}
export function reportStart(filter: ReportFilter) {
  return filter.period === 'month' ? `${filter.start}-01` : filter.start;
}
export function reportRows(rows: LocalRow<Inspection>[], filter: ReportFilter) {
  const end = reportEnd(filter);
  const start = reportStart(filter);
  if (!end || !filter.shifts.length) return [];
  return rows
    .filter(
      ({ data }) =>
        data.productionDate >= start &&
        data.productionDate <= end &&
        filter.shifts.includes(data.shift) &&
        (!filter.stationId || data.stationId === filter.stationId),
    )
    .sort(
      (a, b) =>
        a.data.productionDate.localeCompare(b.data.productionDate) ||
        a.data.stationId.localeCompare(b.data.stationId) ||
        a.data.shift.localeCompare(b.data.shift) ||
        a.data.measuredAt.localeCompare(b.data.measuredAt) ||
        a.id.localeCompare(b.id),
    );
}
