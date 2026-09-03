import { businessKey, resultOf, type Inspection, type Station } from './types';
const text = (x: unknown, max = 160): x is string =>
  typeof x === 'string' && x.trim().length > 0 && x.length <= max;
const optionalText = (x: unknown): x is string =>
  typeof x === 'string' && x.length <= 160;
const num = (x: unknown, max = 2000): x is number =>
  typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= max;
const date = (x: unknown) =>
  typeof x === 'string' && Number.isFinite(Date.parse(x));
export function validateStation(x: unknown): Station {
  const s = x as Station;
  if (
    !s ||
    !text(s.id, 80) ||
    !text(s.line) ||
    !text(s.code) ||
    !text(s.model) ||
    !optionalText(s.instrument) ||
    !s.limits ||
    !num(s.limits.min) ||
    !num(s.limits.max) ||
    s.limits.min >= s.limits.max ||
    !num(s.limits.resistance) ||
    !num(s.limits.voltage) ||
    !optionalText(s.approvedBy) ||
    !date(s.createdAt)
  )
    throw new Error(
      'Preencha a linha, o posto, o modelo e os limites. Campos pendentes devem ficar em branco.',
    );
  return {
    id: s.id,
    line: s.line.trim(),
    code: s.code.trim(),
    model: s.model.trim(),
    instrument: s.instrument.trim(),
    limits: {
      min: s.limits.min,
      max: s.limits.max,
      resistance: s.limits.resistance,
      voltage: s.limits.voltage,
    },
    approvedBy: s.approvedBy.trim(),
    createdAt: s.createdAt,
  };
}
export function validateInspection(x: unknown): Inspection {
  const i = x as Inspection;
  if (
    !i ||
    !text(i.id, 80) ||
    !text(i.stationId, 80) ||
    !text(i.inspector) ||
    !text(i.operator) ||
    !date(i.measuredAt) ||
    !date(i.recordedAt) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(i.productionDate) ||
    !['1', '2', '3'].includes(i.shift) ||
    !['IT', 'AR', 'FT'].includes(i.moment) ||
    !['OK', 'NC'].includes(i.physical) ||
    !['OK', 'NC'].includes(i.solder) ||
    !num(i.temperature) ||
    !num(i.resistance) ||
    !num(i.voltage) ||
    !i.limits ||
    !num(i.limits.min) ||
    !num(i.limits.max) ||
    i.limits.min >= i.limits.max ||
    !num(i.limits.resistance) ||
    !num(i.limits.voltage) ||
    typeof i.notes !== 'string' ||
    i.notes.length > 2000 ||
    typeof i.action !== 'string' ||
    i.action.length > 2000
  )
    throw new Error('Revise os campos obrigatórios e as medições.');
  if (Date.parse(i.measuredAt) > Date.now() + 60000)
    throw new Error('A medição não pode estar no futuro.');
  if (resultOf(i) === 'NC' && (!i.notes.trim() || !i.action.trim()))
    throw new Error('Registre a observação e a ação para a não conformidade.');
  return { ...i, result: resultOf(i) };
}
export { businessKey };
