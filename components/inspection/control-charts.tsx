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
import { DailyResults } from './daily-results';
import { MovingRangeCharts } from './moving-range-charts';
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
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [shift, setShift] = useState('');
  const station =
    stations.find((s) => s.id === selected)?.data ?? stations[0]?.data;
  const series = rows
    .filter(
      (r) =>
        r.data.stationId === station?.id &&
        r.status !== 'conflict' &&
        (!from || r.data.productionDate >= from) &&
        (!to || r.data.productionDate <= to) &&
        (!shift || r.data.shift === shift),
    )
    .map((r) => r.data);
  const stats = imr(series);
  return (
    <>
      <Panel
        title="Acompanhamento por posto"
        aside={
          <label className="field">
            Linha / posto
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
        <div />
      </Panel>
      {station && (
        <DailyResults
          station={station}
          rows={rows}
          from={from}
          to={to}
          shift={shift}
          onFromChange={setFrom}
          onToChange={setTo}
          onShiftChange={setShift}
        />
      )}
      <p className="subtitle" style={{ marginBottom: 20 }}>
        Cartas I-MR abaixo: medições do posto, período e turno selecionados,
        ordenadas pela hora da coleta.
      </p>
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
                  temperature: { label: 'Temperatura', color: '#ff9800' },
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
                    stroke="#888b8d"
                    strokeDasharray="2 3"
                    label="Média"
                  />
                  {series.length > 1 && (
                    <>
                      <ReferenceLine
                        y={stats.ucl}
                        stroke="#54585a"
                        strokeDasharray="4 4"
                        label="LSC"
                      />
                      <ReferenceLine
                        y={stats.lcl}
                        stroke="#54585a"
                        strokeDasharray="4 4"
                        label="LIC"
                      />
                    </>
                  )}
                  <Line
                    type="linear"
                    dataKey="temperature"
                    name="Temperatura °C"
                    stroke="#ff9800"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#ff9800' }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ChartContainer>
              <p className="draft-note">
                Vermelho: especificação · Cinza: controle estatístico estimado ·
                Média: {stats.mean.toFixed(2)} °C
              </p>
            </div>
          </Panel>
          <MovingRangeCharts series={series} />
        </>
      )}
    </>
  );
}
