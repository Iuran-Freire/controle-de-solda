import type { Inspection, LocalRow } from './types';
export interface ReportFilter {
  start: string;
  end: string;
  shifts: string[];
  stationId: string;
}
function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
export function reportEnd(filter: ReportFilter) {
  return validDate(filter.start) &&
    validDate(filter.end) &&
    filter.start <= filter.end
    ? filter.end
    : '';
}
export function reportRows(rows: LocalRow<Inspection>[], filter: ReportFilter) {
  const end = reportEnd(filter);
  if (!end || !filter.shifts.length) return [];
  return rows
    .filter(
      ({ data }) =>
        data.productionDate >= filter.start &&
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
