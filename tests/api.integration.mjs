// Run against the local pilot only. Fixture IDs are reserved for automated checks.
import assert from 'node:assert/strict';
const origin = 'http://localhost:3000';
const limits = { min: 420, max: 480, resistance: 10, voltage: 20 };
const station = {
  id: 'test-api-station',
  line: 'TESTE AUTOMATIZADO',
  code: 'TEST-001',
  model: 'Teste',
  instrument: 'Teste',
  limits,
  approvedBy: 'Teste automatizado',
  createdAt: '2026-09-01T12:00:00Z',
};
const inspection = {
  id: 'test-api-inspection',
  stationId: station.id,
  inspector: 'Teste',
  operator: 'Teste',
  measuredAt: '2026-09-01T12:00:00Z',
  productionDate: '2026-09-01',
  recordedAt: '2026-09-01T13:00:00Z',
  shift: '1',
  moment: 'IT',
  physical: 'OK',
  solder: 'OK',
  temperature: 450,
  resistance: 2,
  voltage: 4,
  notes: '',
  action: '',
  limits,
  result: 'OK',
};
async function post(kind, records) {
  const r = await fetch(origin + '/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify({ kind, records }),
  });
  assert.equal(r.status, 200);
  return r.json();
}
assert.equal((await post('stations', [station])).results[0].status, 'synced');
assert.equal(
  (await post('inspections', [inspection])).results[0].status,
  'synced',
);
assert.equal(
  (await post('inspections', [inspection])).results[0].status,
  'synced',
);
assert.equal(
  (await post('inspections', [{ ...inspection, id: 'test-api-duplicate' }]))
    .results[0].status,
  'conflict',
);
assert.equal(
  (await post('inspections', [{ ...inspection, temperature: 451 }])).results[0]
    .status,
  'conflict',
);
assert.equal(
  (
    await post('inspections', [
      { ...inspection, id: 'test-api-invalid', moment: 'FT', temperature: 900 },
    ])
  ).results[0].status,
  'conflict',
);
const r = await fetch(origin + '/api/sync?kind=inspections&cursor=0');
const data = await r.json();
assert.equal(data.records.filter((i) => i.stationId === station.id).length, 1);
const denied = await fetch(origin + '/api/sync', {
  method: 'POST',
  headers: { Origin: 'https://other.example' },
  body: '{}',
});
assert.equal(denied.status, 403);
console.log(
  'API: cadastro, persistência, idempotência, duplicidade, conteúdo imutável, NC e origem validados.',
);
