import { test } from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {
  DEFAULT_LIMITS,
  resultOf,
  imr,
  businessKey,
  type Inspection,
  type LocalRow,
} from '../lib/inspection/types';
import {
  validateInspection,
  validateStation,
} from '../lib/inspection/validation';
import { addInspection, all } from '../lib/offline/database';
import { synchronize } from '../lib/offline/sync';
void test('cadastro por posto preserva dados desconhecidos em branco', () => {
  const station = {
    id: 'posto-teste',
    line: 'Linha 2',
    code: 'Soldagem Inlet',
    model: 'LG 24W',
    instrument: '',
    approvedBy: '',
    limits: DEFAULT_LIMITS,
    createdAt: '2026-09-01T12:00:00Z',
  };
  assert.equal(validateStation(station).instrument, '');
  assert.equal(validateStation(station).approvedBy, '');
  assert.throws(() => validateStation({ ...station, code: '' }));
  assert.throws(() => validateStation({ ...station, instrument: 123 }));
});
const record = (id: string, temperature = 450): Inspection => ({
  id,
  stationId: 'station-test',
  inspector: 'Inspetor de teste',
  operator: 'Operador de teste',
  measuredAt: '2026-09-01T12:00:00Z',
  productionDate: '2026-09-01',
  recordedAt: '2026-09-01T13:00:00Z',
  shift: '1',
  moment: 'IT',
  physical: 'OK',
  solder: 'OK',
  temperature,
  resistance: 3,
  voltage: 5,
  notes: '',
  action: '',
  limits: DEFAULT_LIMITS,
  result: 'OK',
});
void test('limites inclusivos e não conformidade por critérios independentes', () => {
  assert.equal(resultOf(record('a', 420)), 'OK');
  assert.equal(resultOf(record('a', 480)), 'OK');
  assert.equal(resultOf(record('a', 480.1)), 'NC');
  assert.equal(resultOf({ ...record('a'), resistance: 10.1 }), 'NC');
  assert.equal(resultOf({ ...record('a'), voltage: 20.1 }), 'NC');
  assert.equal(resultOf({ ...record('a'), physical: 'NC' }), 'NC');
});
void test('rejeita NC sem ação, números ausentes e data futura', () => {
  assert.throws(() => validateInspection(record('a', 490)));
  assert.throws(() => validateInspection({ ...record('a'), temperature: NaN }));
  assert.throws(() =>
    validateInspection({ ...record('a'), measuredAt: '2099-01-01T00:00:00Z' }),
  );
  assert.equal(
    validateInspection({
      ...record('a', 490),
      notes: 'Temperatura alta',
      action: 'Manutenção comunicada',
    }).result,
    'NC',
  );
});
void test('amplitude móvel usa sequência cronológica e primeira amplitude nula', () => {
  const a = record('a', 450),
    b = { ...record('b', 454), measuredAt: '2026-09-01T13:00:00Z' },
    c = { ...record('c', 448), measuredAt: '2026-09-01T14:00:00Z' };
  const stats = imr([c, a, b]);
  assert.deepEqual(
    stats.points.map((p) => p.mr),
    [null, 4, 6],
  );
  assert.equal(stats.mrMean, 5);
  assert.equal(stats.mrUcl, 16.335);
  assert.equal(stats.points[0].temperature, 450);
});
void test('amplitudes independentes por item e coleta, sem misturar postos', () => {
  const a = { ...record('a', 450), resistance: 8, voltage: 12 };
  const b = {
    ...record('b', 436),
    resistance: 6,
    voltage: 14,
    measuredAt: '2026-09-01T14:00:00Z',
  };
  const c = {
    ...record('c', 440),
    resistance: 6,
    voltage: 13,
    measuredAt: '2026-09-02T12:00:00Z',
  };
  for (const [metric, expected] of [
    ['temperature', [null, 14, 4]],
    ['resistance', [null, 2, 0]],
    ['voltage', [null, 2, 1]],
  ] as const) {
    assert.deepEqual(
      imr([c, a, b], metric).points.map((p) => p.mr),
      expected,
    );
  }
  assert.throws(() => imr([a, { ...b, stationId: 'outro-posto' }]));
});
void test('chave de duplicidade diferencia turno e momento', () => {
  assert.notEqual(
    businessKey(record('a')),
    businessKey({ ...record('a'), moment: 'FT' }),
  );
  assert.equal(businessKey(record('a')), businessKey(record('b')));
});
void test('salvamento local sobrevive à leitura e bloqueia duplicatas concorrentes', async () => {
  const results = await Promise.allSettled([
    addInspection(record('local-a')),
    addInspection(record('local-b')),
  ]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  const rows = await all<LocalRow<Inspection>>('inspections');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].status, 'pending');
  assert.equal(rows[0].data.recordedAt, '2026-09-01T13:00:00Z');
});
void test('falha de rede conserva registro; ACK correto sincroniza; conflito preserva conteúdo', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => {
      throw new TypeError('offline');
    };
    await assert.rejects(synchronize());
    let rows = await all<LocalRow<Inspection>>('inspections');
    assert.equal(rows[0].status, 'pending');
    globalThis.fetch = async (_url, init) => {
      if (init?.method === 'POST') return Response.json({ results: [] });
      return Response.json({ records: [], nextCursor: null });
    };
    await assert.rejects(synchronize());
    rows = await all<LocalRow<Inspection>>('inspections');
    assert.equal(rows[0].status, 'pending');
    globalThis.fetch = async (_url, init) => {
      if (init?.method === 'POST') {
        const body = JSON.parse(init.body as string);
        return Response.json({
          results: body.records.map((r: Inspection) => ({
            id: r.id,
            status: 'synced',
          })),
        });
      }
      return Response.json({ records: [], nextCursor: null });
    };
    await synchronize();
    rows = await all<LocalRow<Inspection>>('inspections');
    assert.equal(rows[0].status, 'synced');
    const conflict = { ...record('conflict'), moment: 'FT' as const };
    await addInspection(conflict);
    globalThis.fetch = async (_url, init) =>
      init?.method === 'POST'
        ? Response.json({
            results: [
              {
                id: 'conflict',
                status: 'conflict',
                error: 'Duplicado na base',
              },
            ],
          })
        : Response.json({ records: [], nextCursor: null });
    await synchronize();
    rows = await all<LocalRow<Inspection>>('inspections');
    assert.equal(rows.find((r) => r.id === 'conflict')?.status, 'conflict');
    assert.equal(rows.find((r) => r.id === 'conflict')?.data.temperature, 450);
  } finally {
    globalThis.fetch = original;
  }
});
