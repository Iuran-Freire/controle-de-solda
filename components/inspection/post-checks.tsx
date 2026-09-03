'use client';
import { Input } from '@/components/ui/input';
import { Panel } from './shared';
import type { Station } from '@/lib/inspection/types';
import { CHECK_DESCRIPTIONS } from '@/lib/inspection/check-descriptions';
type CheckKey =
  | 'physical'
  | 'solder'
  | 'resistance'
  | 'voltage'
  | 'temperature';
type Values = Record<CheckKey, string>;
export function PostChecks({
  station,
  values,
  onChange,
}: {
  station?: Station;
  values: Values;
  onChange: (key: CheckKey, value: string) => void;
}) {
  const answered = Object.values({
    physical: values.physical,
    solder: values.solder,
    resistance: values.resistance,
    voltage: values.voltage,
    temperature: values.temperature,
  }).filter((v) => v !== '').length;
  const numeric = [
    {
      key: 'resistance' as const,
      number: 3,
      title: CHECK_DESCRIPTIONS.resistance,
      unit: 'Ω',
      criterion: station
        ? `≤ ${station.limits.resistance} Ω`
        : 'Selecione o posto',
      valid: (v: number) => !!station && v <= station.limits.resistance,
    },
    {
      key: 'voltage' as const,
      number: 4,
      title: CHECK_DESCRIPTIONS.voltage,
      unit: 'mV',
      criterion: station
        ? `≤ ${station.limits.voltage} mV`
        : 'Selecione o posto',
      valid: (v: number) => !!station && v <= station.limits.voltage,
    },
    {
      key: 'temperature' as const,
      number: 5,
      title: CHECK_DESCRIPTIONS.temperature,
      unit: '°C',
      criterion: station
        ? `${station.limits.min} °C a ${station.limits.max} °C`
        : 'Selecione o posto',
      valid: (v: number) =>
        !!station && v >= station.limits.min && v <= station.limits.max,
    },
  ];
  return (
    <Panel
      title={`Checklist do posto · ${station?.code ?? 'Selecione o posto'}`}
      aside={
        <span className="status neutral">{answered} de 5 preenchidos</span>
      }
    >
      <div className="panel-body post-checklist">
        <p className="checklist-intro">
          Preencha os cinco itens abaixo para o dia, turno e momento
          selecionados. Nos testes 3, 4 e 5, informe a medição: o resultado OK /
          NC é calculado automaticamente.
        </p>
        {(
          [
            {
              key: 'physical',
              number: 1,
              title: CHECK_DESCRIPTIONS.physical,
            },
            {
              key: 'solder',
              number: 2,
              title: CHECK_DESCRIPTIONS.solder,
            },
          ] as const
        ).map((item) => (
          <div className="post-check" key={item.key}>
            <span className="check-number">{item.number}</span>
            <div className="check-description">
              <h3>{item.title}</h3>
            </div>
            <fieldset className="choice" aria-label={item.title}>
              {['OK', 'NC'].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={values[item.key] === value}
                  className={`${values[item.key] === value ? 'selected' : ''} ${value === 'NC' ? 'nc' : ''}`}
                  onClick={() => onChange(item.key, value)}
                >
                  {value === 'OK' ? 'OK · Conforme' : 'NC · Não conforme'}
                </button>
              ))}
            </fieldset>
          </div>
        ))}
        {numeric.map((item) => {
          const value = values[item.key];
          const number = Number(value);
          const hasResult =
            !!station &&
            value !== '' &&
            Number.isFinite(number) &&
            number >= 0 &&
            number <= 2000;
          const ok = hasResult && item.valid(number);
          return (
            <div className="post-check" key={item.key}>
              <span className="check-number">{item.number}</span>
              <div className="check-description">
                <h3>{item.title}</h3>
                <p>
                  Critério cadastrado: <strong>{item.criterion}</strong>
                </p>
              </div>
              <div className="check-measurement">
                <label className="field" htmlFor={`check-${item.key}`}>
                  Valor medido ({item.unit})
                  <Input
                    id={`check-${item.key}`}
                    required
                    type="number"
                    min="0"
                    max="2000"
                    step="0.01"
                    inputMode="decimal"
                    value={value}
                    placeholder="Informe a medição"
                    onChange={(e) => onChange(item.key, e.target.value)}
                  />
                </label>
                <output
                  className={`status ${hasResult ? (ok ? 'good' : 'bad') : 'neutral'}`}
                >
                  {hasResult
                    ? ok
                      ? 'OK · Conforme'
                      : 'NC · Não conforme'
                    : 'Aguardando medição'}
                </output>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
