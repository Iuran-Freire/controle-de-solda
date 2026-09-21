/** Zoom visual; não altera medições nem limites de especificação. */
export function measurementTicks(values: number[]): number[] {
  const finite = values.filter(Number.isFinite);
  if (!finite.length) return [0, 0.25, 0.5, 0.75, 1];
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const padding =
    max > min ? (max - min) * 0.15 : Math.max(Math.abs(max) * 0.05, 0.1);
  const lower = Math.max(0, min - padding);
  const upper = max + padding;
  const rough = (upper - lower) / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step =
    ([1, 2, 2.5, 5, 10].find((n) => n * magnitude >= rough) ?? 10) * magnitude;
  const start = Math.floor(lower / step);
  const end = Math.ceil(upper / step);
  return Array.from({ length: end - start + 1 }, (_, index) =>
    Number(((start + index) * step).toPrecision(12)),
  );
}

export function measurementDomain(values: number[]): [number, number] {
  const ticks = measurementTicks(values);
  return [ticks[0], ticks[ticks.length - 1]];
}

export const chartNumber = (value: number) =>
  value.toLocaleString('pt-BR', { maximumFractionDigits: 6 });
