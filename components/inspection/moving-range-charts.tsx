'use client';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { imr, type Inspection } from '@/lib/inspection/types';
import { Panel } from './shared';

const checks = [
  { key: 'resistance', title: 'Resistência', unit: 'Ω' },
  { key: 'voltage', title: 'Tensão residual', unit: 'mV' },
  { key: 'temperature', title: 'Temperatura', unit: '°C' },
] as const;
const number = (value: number | null) =>
  value === null
    ? '—'
    : value.toLocaleString('pt-BR', { maximumFractionDigits: 6 });

export function MovingRangeCharts({ series }: { series: Inspection[] }) {
  return (
    <Panel title="Amplitude móvel por medição">
      <div className="panel-body">
        <p className="subtitle">
          Cada coleta tem uma amplitude para cada item: |valor atual − valor
          anterior|, na ordem da hora da medição deste posto, inclusive entre
          dias e turnos. A primeira coleta fica sem amplitude.
        </p>
        <div className="measurement-grid">
          {checks.map((check) => {
            const stats = imr(series, check.key);
            return (
              <section key={check.key} className="measurement-card">
                <header className="measurement-card-header">
                  <span className="measurement-kicker">
                    Amplitude móvel · {check.unit}
                  </span>
                  <h3>{check.title}</h3>
                  <p>Diferença absoluta entre duas coletas consecutivas.</p>
                </header>
                <ChartContainer
                  className="compact-chart"
                  config={{
                    mr: { label: 'Amplitude móvel', color: '#20296e' },
                  }}
                >
                  <LineChart
                    data={stats.points}
                    margin={{ top: 16, right: 24, left: 0, bottom: 12 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="index" />
                    <YAxis domain={[0, 'auto']} />
                    <Tooltip
                      labelFormatter={(_, payload) => {
                        const point = payload?.[0]?.payload;
                        return point
                          ? `${point.date} · ${point.shift}º · ${point.moment}`
                          : '';
                      }}
                    />
                    <Line
                      type="linear"
                      dataKey="mr"
                      name={`Amplitude (${check.unit})`}
                      stroke="#20296e"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ChartContainer>
                <details style={{ padding: '12px 16px' }}>
                  <summary>Ver cálculo de cada medição</summary>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Coleta</th>
                          <th>Anterior ({check.unit})</th>
                          <th>Atual ({check.unit})</th>
                          <th>Amplitude ({check.unit})</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.points.map((point) => (
                          <tr key={point.id}>
                            <td>
                              {point.date}
                              <br />
                              {point.shift}º · {point.moment}
                            </td>
                            <td>{number(point.previous)}</td>
                            <td>{number(point.value)}</td>
                            <td>{number(point.mr)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </section>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}
