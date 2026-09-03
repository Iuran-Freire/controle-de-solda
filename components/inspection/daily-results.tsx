'use client';
import { useState } from 'react';
import { ShiftTables } from './shift-tables';
import { CHECK_DESCRIPTIONS } from '@/lib/inspection/check-descriptions';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { ChartContainer } from '@/components/ui/chart';
import { Panel, Empty } from './shared';
import { dailyResults } from '@/lib/inspection/daily-results';
import type { Station, Inspection, LocalRow } from '@/lib/inspection/types';
export function DailyResults({
  station,
  rows,
}: {
  station: Station;
  rows: LocalRow<Inspection>[];
}) {
  const [from, setFrom] = useState(''),
    [to, setTo] = useState(''),
    [shift, setShift] = useState('');
  const invalid = !!from && !!to && from > to;
  const result = dailyResults(rows, station.id, from, to, shift);
  return (
    <Panel title={`Resultados por dia e turno · ${station.code}`}>
      <div className="panel-body daily-results-content">
        <div className="toolbar">
          <label className="field">
            De
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="field">
            Até
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <label className="field">
            Turno
            <NativeSelect
              value={shift}
              onChange={(e) => setShift(e.target.value)}
            >
              <option value="">Todos os turnos</option>
              {['1', '2', '3'].map((s) => (
                <option key={s} value={s}>
                  {s}º turno
                </option>
              ))}
            </NativeSelect>
          </label>
        </div>
        <p className="subtitle">
          Agrupamento pela data de produção e turno. Cada verificação reúne os
          cinco checks. Os gráficos de medição mostram cada coleta em I.T, A.R e
          F.T, sem calcular médias.
        </p>
        {invalid ? (
          <p role="alert" className="inline-error">
            A data inicial deve ser anterior ou igual à final.
          </p>
        ) : (
          <ShiftTables station={station} rows={result.rows} />
        )}
        {invalid ? null : !result.rows.length ? (
          <Empty
            title="Ainda não há resultados neste período"
            text="Os gráficos serão preenchidos com as verificações registradas para este posto."
          />
        ) : (
          <>
            <div className="measurement-grid">
              <section className="measurement-card">
                <header className="measurement-card-header">
                  <span className="measurement-kicker">Resumo do período</span>
                  <h3>Verificações conformes e não conformes</h3>
                  <p>Quantidade de verificações por dia e turno.</p>
                </header>
                <ChartContainer
                  className="compact-chart"
                  config={{
                    ok: { label: 'Conformes', color: '#20296e' },
                    nc: { label: 'Não conformes', color: '#c45e50' },
                  }}
                >
                  <BarChart
                    data={result.groups}
                    margin={{ top: 12, right: 16, left: -15, bottom: 5 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={24}
                    />
                    <YAxis
                      allowDecimals={false}
                      width={44}
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar
                      dataKey="ok"
                      name="Conformes"
                      fill="#20296e"
                      maxBarSize={32}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="nc"
                      name="Não conformes"
                      fill="#c45e50"
                      maxBarSize={32}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </section>
              {(
                [
                  {
                    key: 'resistance',
                    name: 'Resistência',
                    title: `3 · ${CHECK_DESCRIPTIONS.resistance}`,
                    unit: 'Ω',
                    limits: ['resMax'],
                  },
                  {
                    key: 'voltage',
                    name: 'Tensão residual',
                    title: `4 · ${CHECK_DESCRIPTIONS.voltage}`,
                    unit: 'mV',
                    limits: ['voltMax'],
                  },
                  {
                    key: 'temperature',
                    name: 'Temperatura',
                    title: `5 · ${CHECK_DESCRIPTIONS.temperature}`,
                    unit: '°C',
                    limits: ['tempMin', 'tempMax'],
                  },
                ] as const
              ).map((metric) => (
                <section key={metric.key} className="measurement-card">
                  <header className="measurement-card-header">
                    <span className="measurement-kicker">
                      Medições · {result.points.length} pontos
                    </span>
                    <h3>
                      {metric.name}
                      <span className="measurement-unit">{metric.unit}</span>
                    </h3>
                    <p>{metric.title}</p>
                  </header>
                  <ChartContainer
                    className="compact-chart"
                    config={{
                      [metric.key]: { label: metric.title, color: '#ff9800' },
                    }}
                  >
                    <LineChart
                      data={result.points}
                      margin={{ top: 12, right: 18, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={24}
                        padding={{ left: 16, right: 16 }}
                      />
                      <YAxis
                        domain={['auto', 'auto']}
                        width={48}
                        tickCount={4}
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {metric.limits.map((limit) => (
                        <Line
                          key={limit}
                          dataKey={limit}
                          name={
                            limit === 'tempMin'
                              ? 'Limite mínimo'
                              : 'Limite máximo'
                          }
                          type="stepAfter"
                          stroke="#c45e50"
                          strokeDasharray="5 4"
                          dot={false}
                          isAnimationActive={false}
                        />
                      ))}
                      <Line
                        dataKey={metric.key}
                        name="Medição"
                        type="linear"
                        stroke="#ff9800"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#fff', strokeWidth: 2 }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ChartContainer>
                </section>
              ))}
            </div>
            <p className="draft-note">
              {result.rows.filter((r) => r.status === 'pending').length}{' '}
              registro(s) aguardando envio incluídos. Registros em conflito
              ficam fora dos gráficos.
            </p>
            <p className="draft-note">
              Os limites de cada ponto são os preservados no momento do
              registro. I.T: início do turno · A.R: após refeição · F.T: final
              do turno.
            </p>
          </>
        )}
      </div>
    </Panel>
  );
}
