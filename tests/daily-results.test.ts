import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dailyResults } from '../lib/inspection/daily-results';
import {
  DEFAULT_LIMITS,
  type Inspection,
  type LocalRow,
} from '../lib/inspection/types';
function row(
  id: string,
  changes: Partial<Inspection> = {},
  status: LocalRow<Inspection>['status'] = 'synced',
): LocalRow<Inspection> {
  return {
    id,
    status,
    data: {
      id,
      stationId: 'inlet',
      inspector: 'Teste',
      operator: 'Teste',
      productionDate: '2026-09-02',
      measuredAt: '2026-09-03T02:00:00Z',
      recordedAt: '2026-09-03T03:00:00Z',
      shift: '3',
      moment: 'IT',
      physical: 'OK',
      solder: 'OK',
      temperature: 450,
      resistance: 5,
      voltage: 10,
      notes: '',
      action: '',
      limits: DEFAULT_LIMITS,
      result: 'OK',
      ...changes,
    },
  };
}
void test('resultados usam data de produção e turno sem misturar postos ou conflitos', () => {
  const result = dailyResults(
    [
      row('a'),
      row('b', { moment: 'AR', result: 'NC' }, 'pending'),
      row('c', { shift: '1' }),
      row('d', { stationId: 'other' }),
      row('e', {}, 'conflict'),
    ],
    'inlet',
    '2026-09-02',
    '2026-09-02',
    '3',
  );
  assert.equal(result.rows.length, 2);
  assert.equal(result.groups.length, 1);
  assert.deepEqual(
    [result.groups[0].ok, result.groups[0].nc, result.groups[0].pending],
    [1, 1, 1],
  );
  assert.equal(result.groups[0].date, '2026-09-02');
});
void test('medição individual e limites históricos são mantidos sem média', () => {
  const result = dailyResults(
    [
      row('a'),
      row('b', {
        temperature: 490,
        moment: 'FT',
        limits: { ...DEFAULT_LIMITS, max: 475 },
        measuredAt: '2026-09-03T05:00:00Z',
      }),
    ],
    'inlet',
  );
  assert.deepEqual(
    result.points.map((p) => p.temperature),
    [450, 490],
  );
  assert.deepEqual(
    result.points.map((p) => p.tempMax),
    [480, 475],
  );
  assert.match(result.points[1].label, /FT/);
});
void test('intervalo sem registros produz resultado vazio', () => {
  assert.equal(dailyResults([row('a')], 'inlet', '2026-09-04').rows.length, 0);
});
