import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  shiftComparisons,
  momentValue,
  difference,
} from '../lib/inspection/shift-comparison';
import {
  DEFAULT_LIMITS,
  type Inspection,
  type LocalRow,
} from '../lib/inspection/types';
const make = (changes: Partial<Inspection> = {}): LocalRow<Inspection> => {
  const data: Inspection = {
    id: crypto.randomUUID(),
    stationId: 'inlet',
    productionDate: '2026-09-02',
    shift: '1',
    moment: 'IT',
    measuredAt: '2026-09-02T12:00:00Z',
    recordedAt: '2026-09-02T13:00:00Z',
    inspector: 'Teste',
    operator: 'Teste',
    physical: 'OK',
    solder: 'OK',
    temperature: 450,
    resistance: 0,
    voltage: 10,
    notes: '',
    action: '',
    result: 'OK',
    limits: DEFAULT_LIMITS,
    ...changes,
  };
  return { id: data.id, data, status: 'synced' };
};
void test('compara somente o mesmo posto, data e turno', () => {
  const groups = shiftComparisons(
    [
      make(),
      make({ moment: 'AR', temperature: 454 }),
      make({ moment: 'FT', temperature: 448 }),
      make({ shift: '2' }),
      make({ productionDate: '2026-09-03' }),
      make({ stationId: 'other' }),
    ],
    'inlet',
  );
  assert.equal(groups.length, 3);
  const g = groups[0];
  const it = momentValue(g.moments.IT, 'temperature'),
    ar = momentValue(g.moments.AR, 'temperature'),
    ft = momentValue(g.moments.FT, 'temperature');
  assert.deepEqual(
    [difference(ar, it), difference(ft, ar), difference(ft, it)],
    [4, -6, -2],
  );
});
void test('ausência não vira zero e zero medido é preservado', () => {
  assert.equal(momentValue([make()], 'resistance'), 0);
  assert.equal(momentValue([], 'resistance'), null);
  assert.equal(difference(null, 0), null);
  assert.equal(difference(0, 0), 0);
  assert.equal(difference(0.3, 0.1), 0.2);
});
void test('duplicidade e conflito não produzem comparação silenciosa', () => {
  assert.equal(momentValue([make(), make()], 'temperature'), null);
  const r = make();
  r.status = 'conflict';
  assert.equal(shiftComparisons([r], 'inlet').length, 0);
});
