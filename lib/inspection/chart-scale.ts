/** Zoom visual; não altera medições nem limites de especificação. */
export function measurementDomain(values: number[]): [number, number] {
  const finite = values.filter(Number.isFinite);
  if (!finite.length) return [0, 1];
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const padding =
    max > min ? (max - min) * 0.15 : Math.max(Math.abs(max) * 0.05, 0.1);
  return [Math.max(0, min - padding), max + padding];
}

export const chartNumber = (value: number) =>
  value.toLocaleString('pt-BR', { maximumFractionDigits: 6 });
