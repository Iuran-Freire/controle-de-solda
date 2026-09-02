'use client';
import { useState } from 'react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
} from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { NativeSelect } from '@/components/ui/native-select';
import { Panel, Empty } from './shared';
import {
  imr,
  type Station,
  type Inspection,
  type LocalRow,
} from '@/lib/inspection/types';
export function ControlCharts({
  stations,
  rows,
}: {
  stations: LocalRow<Station>[];
  rows: LocalRow<Inspection>[];
}) {
  const [selected, setSelected] = useState('');
  const station =
    stations.find((s) => s.id === selected)?.data ?? stations[0]?.data;
  const series = rows
    .filter((r) => r.data.stationId === station?.id && r.status !== 'conflict')
    .map((r) => r.data);
  const stats = imr(series);
  return (
    <>
      <Panel
        title="Acompanhamento por estação"
        aside={
          <label className="field">
            Estação
            <NativeSelect
              value={station?.id ?? ''}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="" disabled>
                Selecione
              </option>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.data.line} · {s.data.code}
                </option>
              ))}
            </NativeSelect>
          </label>
        }
      >
        <div className="panel-body">
          <p className="text-muted">
            As medições são ordenadas pela hora da coleta. Cada estação possui
            sua própria série.
          </p>
        </div>
      </Panel>
      {!series.length ? (
        <Empty
          title="Aguardando medições"
          text="Registre a temperatura de uma estação para iniciar sua carta de controle."
        />
      ) : (
        <>
          <div className="notice amber">
            Limites estatísticos exploratórios calculados com a série visível,
            sem linha de base aprovada. Não substituem os limites de
            especificação. A qualidade deve validar a estabilidade, o método e a
            quantidade de amostras.
          </div>
          <Panel
            title="Carta I · Temperaturas individuais"
            aside={
              <span className="status neutral">
                {series.length} medições · °C
              </span>
            }
          >
            <div className="panel-body">
              <ChartContainer
                className="chart-box"
                config={{
                  temperature: { label: 'Temperatura', color: '#638e35' },
                }}
              >
                <LineChart
                  data={stats.points}
                  margin={{ top: 20, right: 60, left: 0, bottom: 15 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="index" />
                  <YAxis domain={['auto', 'auto']} />
                  <Tooltip
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload.date ?? ''
                    }
                  />
                  <ReferenceLine
                    y={station!.limits.min}
                    stroke="#c45e50"
                    strokeDasharray="5 4"
                    label="LIE"
                  />
                  <ReferenceLine
                    y={station!.limits.max}
                    stroke="#c45e50"
                    strokeDasharray="5 4"
                    label="LSE"
                  />
                  <ReferenceLine
                    y={stats.mean}
                    stroke="#91a371"
                    strokeDasharray="2 3"
                    label="Média"
                  />
                  {series.length > 1 && (
                    <>
                      <ReferenceLine
                        y={stats.ucl}
                        stroke="#6c859a"
                        strokeDasharray="4 4"
                        label="LSC"
                      />
                      <ReferenceLine
                        y={stats.lcl}
                        stroke="#6c859a"
                        strokeDasharray="4 4"
                        label="LIC"
                      />
                    </>
                  )}
                  <Line
                    type="linear"
                    dataKey="temperature"
                    name="Temperatura °C"
                    stroke="#638e35"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#638e35' }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ChartContainer>
              <p className="draft-note">
                Vermelho: especificação · Azul: controle estatístico estimado ·
                Média: {stats.mean.toFixed(2)} °C
              </p>
            </div>
          </Panel>
          <Panel title="Carta MR · Amplitude móvel">
            <div className="panel-body">
              {series.length < 2 ? (
                <Empty
                  title="São necessárias duas medições"
                  text="A amplitude móvel é a diferença absoluta entre medições consecutivas."
                />
              ) : (
                <>
                  <ChartContainer
                    className="chart-box"
                    config={{
                      mr: { label: 'Amplitude móvel', color: '#2c6078' },
                    }}
                  >
                    <LineChart
                      data={stats.points}
                      margin={{ top: 20, right: 60, left: 0, bottom: 15 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="index" />
                      <YAxis domain={[0, 'auto']} />
                      <Tooltip />
                      <ReferenceLine
                        y={stats.mrUcl}
                        stroke="#6c859a"
                        strokeDasharray="4 4"
                        label="LSC"
                      />
                      <ReferenceLine
                        y={stats.mrMean}
                        stroke="#91a371"
                        strokeDasharray="2 3"
                        label="MR média"
                      />
                      <Line
                        type="linear"
                        dataKey="mr"
                        name="Amplitude °C"
                        stroke="#2c6078"
                        strokeWidth={2.5}
                        dot={{ r: 4 }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ChartContainer>
                  <p className="draft-note">
                    MR = |medição atual − anterior| · MR média:{' '}
                    {stats.mrMean.toFixed(2)} °C · LSC: {stats.mrUcl.toFixed(2)}{' '}
                    °C · LIC: 0 °C
                  </p>
                </>
              )}
            </div>
          </Panel>
        </>
      )}
    </>
  );
}
