import { test } from 'node:test';
import assert from 'node:assert/strict';
import { measurementDomain, chartNumber } from '../lib/inspection/chart-scale';
void test('escala mostra frações de mV sem ser comprimida pelo limite de 20', () => {
  const [min, max] = measurementDomain([0.6, 0.9, 0.5, 0.4]);
  assert.ok(min < 0.4 && min >= 0);
  assert.ok(max > 0.9 && max < 2);
  assert.equal(chartNumber(0.6), '0,6');
});
void test('escala mantém espaço com medição única, constante ou zero', () => {
  for (const values of [[0], [0.6], [400, 400]]) {
    const [min, max] = measurementDomain(values);
    assert.ok(max > min);
    assert.ok(values.every((value) => value >= min && value <= max));
  }
});
