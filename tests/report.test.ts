import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  reportEnd,
  reportRows,
  type ReportFilter,
} from '../lib/inspection/report';
import type { Inspection, LocalRow } from '../lib/inspection/types';
const filter: ReportFilter = {
  start: '2026-09-28',
  period: 'week',
  shifts: ['1', '3'],
  stationId: 'a',
};
const row = (
  id: string,
  productionDate: string,
  shift: string,
  stationId = 'a',
): LocalRow<Inspection> => ({
  id,
  status: 'pending',
  data: {
    id,
    productionDate,
    shift,
    stationId,
    measuredAt: `${productionDate}T12:00:00Z`,
  } as Inspection,
});
void test('semana inclui sete dias e atravessa mês, filtrando turnos e posto', () => {
  assert.equal(reportEnd(filter), '2026-10-04');
  const rows = [
    row('a', '2026-09-27', '1'),
    row('b', '2026-09-28', '1'),
    row('c', '2026-10-04', '3'),
    row('d', '2026-10-05', '1'),
    row('e', '2026-09-29', '2'),
    row('f', '2026-09-29', '1', 'b'),
  ];
  assert.deepEqual(
    reportRows(rows, filter).map((r) => r.id),
    ['b', 'c'],
  );
  assert.deepEqual(
    reportRows(rows, { ...filter, period: 'day' }).map((r) => r.id),
    ['b'],
  );
  assert.deepEqual(reportRows(rows, { ...filter, shifts: [] }), []);
  assert.equal(reportEnd({ ...filter, start: '2026-02-30' }), '');
});
void test('relatório preserva pendências e conflitos sem alterar registros', () => {
  const input = [
    { ...row('x', '2026-09-28', '1'), status: 'conflict' as const },
    row('y', '2026-09-28', '3'),
  ];
  const before = JSON.stringify(input);
  assert.deepEqual(
    reportRows(input, filter).map((r) => r.status),
    ['conflict', 'pending'],
  );
  assert.equal(JSON.stringify(input), before);
});
