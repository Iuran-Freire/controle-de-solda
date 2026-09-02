export type SyncStatus = 'pending' | 'synced' | 'conflict';
export type Moment = 'IT' | 'AR' | 'FT';
export const MOMENTS: Record<Moment, string> = {
  IT: 'Início do turno',
  AR: 'Após refeição',
  FT: 'Final do turno',
};
export interface Limits {
  min: number;
  max: number;
  resistance: number;
  voltage: number;
}
export interface Station {
  id: string;
  line: string;
  code: string;
  model: string;
  instrument: string;
  limits: Limits;
  approvedBy: string;
  createdAt: string;
}
export interface Inspection {
  id: string;
  stationId: string;
  inspector: string;
  operator: string;
  measuredAt: string;
  productionDate: string;
  recordedAt: string;
  shift: string;
  moment: Moment;
  physical: 'OK' | 'NC';
  solder: 'OK' | 'NC';
  temperature: number;
  resistance: number;
  voltage: number;
  notes: string;
  action: string;
  limits: Limits;
  result: 'OK' | 'NC';
}
export interface LocalRow<T> {
  id: string;
  data: T;
  status: SyncStatus;
  error?: string;
}
export const DEFAULT_LIMITS: Limits = {
  min: 420,
  max: 480,
  resistance: 10,
  voltage: 20,
};
export function resultOf(
  i: Pick<
    Inspection,
    'physical' | 'solder' | 'temperature' | 'resistance' | 'voltage' | 'limits'
  >,
): 'OK' | 'NC' {
  return i.physical === 'NC' ||
    i.solder === 'NC' ||
    i.temperature < i.limits.min ||
    i.temperature > i.limits.max ||
    i.resistance > i.limits.resistance ||
    i.voltage > i.limits.voltage
    ? 'NC'
    : 'OK';
}
export function businessKey(i: Inspection) {
  return [i.stationId, i.productionDate, i.shift, i.moment].join('|');
}
export function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function localDateTime(d = new Date()) {
  return `${localDate(d)}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
export function formatTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
export function imr(records: Inspection[]) {
  const sorted = [...records].sort(
    (a, b) =>
      a.measuredAt.localeCompare(b.measuredAt) || a.id.localeCompare(b.id),
  );
  const points = sorted.map((r, index) => ({
    index: index + 1,
    temperature: r.temperature,
    mr: index ? Math.abs(r.temperature - sorted[index - 1].temperature) : null,
    date: formatTime(r.measuredAt),
  }));
  const mean = points.length
    ? points.reduce((s, p) => s + p.temperature, 0) / points.length
    : 0;
  const mrMean =
    points.length > 1
      ? points.slice(1).reduce((s, p) => s + (p.mr ?? 0), 0) /
        (points.length - 1)
      : 0;
  return {
    points,
    mean,
    mrMean,
    lcl: mean - 2.66 * mrMean,
    ucl: mean + 2.66 * mrMean,
    mrUcl: 3.267 * mrMean,
  };
}
