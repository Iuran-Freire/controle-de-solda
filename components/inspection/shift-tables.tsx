import { CHECK_DESCRIPTIONS } from '@/lib/inspection/check-descriptions';
import {
  shiftComparisons,
  momentValue,
  difference,
  type NumericCheck,
} from '@/lib/inspection/shift-comparison';
import type {
  Inspection,
  LocalRow,
  Station,
  Moment,
} from '@/lib/inspection/types';
const checks = [
  { key: 'resistance', number: 3, unit: 'Ω' },
  { key: 'voltage', number: 4, unit: 'mV' },
  { key: 'temperature', number: 5, unit: '°C' },
] as const;
const moments = ['IT', 'AR', 'FT'] as const;
const number = (value: number) =>
  value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
function delta(value: number | null, unit: string) {
  return value === null
    ? '—'
    : `${value > 0 ? '+' : ''}${number(value)} ${unit}`;
}
export function ShiftTables({
  station,
  rows,
}: {
  station: Station;
  rows: LocalRow<Inspection>[];
}) {
  const groups = shiftComparisons(rows, station.id);
  // Empty cells show the paper layout even before the first inspection, without fabricated data.
  const visible = groups.length
    ? groups
    : [{ date: '', shift: '', moments: { IT: [], AR: [], FT: [] } }];
  return (
    <div className="shift-tables">
      <p className="subtitle">
        Somente os itens numéricos do papel. A.R é a verificação após refeição,
        usada como o momento do meio do turno. Cada conjunto abaixo pertence ao
        mesmo posto, dia de produção e turno.
      </p>
      {visible.map((group) => (
        <section
          key={`${group.date}|${group.shift}`}
          className="shift-table-group"
        >
          <h3>
            {station.line} · {station.code} ·{' '}
            {group.date
              ? group.date.split('-').reverse().join('/')
              : 'Aguardando registros'}
            {group.shift ? ` · ${group.shift}º turno` : ''}
          </h3>
          <h4>Valores medidos — disposição do papel</h4>
          <div className="table-wrap">
            <table className="paper-results">
              <thead>
                <tr>
                  <th scope="col">Item de verificação</th>
                  <th scope="col">I.T · Início</th>
                  <th scope="col">A.R · Após refeição</th>
                  <th scope="col">F.T · Fim</th>
                </tr>
              </thead>
              <tbody>
                {checks.map((check) => (
                  <tr key={check.key}>
                    <th scope="row">
                      {check.number} · {CHECK_DESCRIPTIONS[check.key]}
                    </th>
                    {moments.map((moment) => (
                      <td key={moment}>
                        <Reading
                          rows={group.moments[moment]}
                          check={check.key}
                          unit={check.unit}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h4>Variação entre início, meio e fim</h4>
          <div className="table-wrap">
            <table className="paper-results">
              <thead>
                <tr>
                  <th scope="col">Item de verificação</th>
                  <th scope="col">
                    Meio − início
                    <br />
                    (A.R − I.T)
                  </th>
                  <th scope="col">
                    Fim − meio
                    <br />
                    (F.T − A.R)
                  </th>
                  <th scope="col">
                    Fim − início
                    <br />
                    (F.T − I.T)
                  </th>
                </tr>
              </thead>
              <tbody>
                {checks.map((check) => {
                  const it = momentValue(group.moments.IT, check.key),
                    ar = momentValue(group.moments.AR, check.key),
                    ft = momentValue(group.moments.FT, check.key);
                  return (
                    <tr key={check.key}>
                      <th scope="row">
                        {check.number} · {CHECK_DESCRIPTIONS[check.key]}
                      </th>
                      <td>{delta(difference(ar, it), check.unit)}</td>
                      <td>{delta(difference(ft, ar), check.unit)}</td>
                      <td>{delta(difference(ft, it), check.unit)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="draft-note">
            + indica aumento; − indica redução; 0 indica valor igual. “—” indica
            medição ausente ou duplicada. Variação não é classificação de
            conformidade nem amplitude móvel I-MR.
          </p>
        </section>
      ))}
    </div>
  );
}
function Reading({
  rows,
  check,
  unit,
}: {
  rows: LocalRow<Inspection>[];
  check: NumericCheck;
  unit: string;
}) {
  const value = momentValue(rows, check);
  if (rows.length > 1)
    return <span className="status warn">Revisar duplicidade</span>;
  if (value === null) return <span aria-label="Sem medição">—</span>;
  const r = rows[0],
    limits = r.data.limits;
  const ok =
    check === 'temperature'
      ? value >= limits.min && value <= limits.max
      : value <= limits[check];
  return (
    <>
      <strong>
        {number(value)} {unit}
      </strong>
      <small>
        {ok ? 'OK' : 'NC'}
        {r.status === 'pending' ? ' · Pendente de envio' : ''}
      </small>
    </>
  );
}
