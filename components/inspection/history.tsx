'use client';
import { useState } from 'react';
import { Download } from 'lucide-react';
import { ExportPdf } from './export-pdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Panel, Empty, SyncBadge, download } from './shared';
import {
  MOMENTS,
  formatTime,
  localDate,
  type Inspection,
  type Station,
  type LocalRow,
} from '@/lib/inspection/types';
export function InspectionTable({
  rows,
  stations,
}: {
  rows: LocalRow<Inspection>[];
  stations: LocalRow<Station>[];
}) {
  const [expanded, setExpanded] = useState('');
  if (!rows.length) return <Empty />;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Estação / linha</th>
            <th>Medição</th>
            <th>Inspetor</th>
            <th>Temperatura</th>
            <th>Resultado</th>
            <th>Envio</th>
            <th>Registro</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const i = r.data,
              s = stations.find((s) => s.id === i.stationId)?.data;
            return (
              <Row
                key={r.id}
                row={r}
                station={s}
                expanded={expanded === r.id}
                toggle={() => setExpanded(expanded === r.id ? '' : r.id)}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
function Row({
  row,
  station,
  expanded,
  toggle,
}: {
  row: LocalRow<Inspection>;
  station?: Station;
  expanded: boolean;
  toggle: () => void;
}) {
  const i = row.data;
  return (
    <>
      <tr>
        <td>
          <strong>{station?.code ?? 'Estação indisponível'}</strong>
          <small>{station?.line ?? i.stationId}</small>
        </td>
        <td>
          {formatTime(i.measuredAt)}
          <small>
            {i.shift}º turno · {i.moment}
          </small>
        </td>
        <td>{i.inspector}</td>
        <td>
          <strong>{i.temperature.toFixed(1)} °C</strong>
        </td>
        <td>
          <span className={`status ${i.result === 'OK' ? 'good' : 'bad'}`}>
            {i.result === 'OK' ? 'Conforme' : 'Não conforme'}
          </span>
        </td>
        <td>
          <SyncBadge status={row.status} />
        </td>
        <td>
          <Button variant="ghost" size="sm" onClick={toggle}>
            {expanded ? 'Fechar' : 'Detalhes'}
          </Button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="details">
            <strong>Registro {i.id}</strong>
            <br />
            Operador: {i.operator} · Data de produção: {i.productionDate} ·{' '}
            {MOMENTS[i.moment]}
            <br />
            Integridade: {i.physical} · Validade da solda: {i.solder} ·
            Resistência: {i.resistance} Ω · Tensão: {i.voltage} mV
            <br />
            Critérios na medição: {i.limits.min}–{i.limits.max} °C / ≤{' '}
            {i.limits.resistance} Ω / ≤ {i.limits.voltage} mV
            <br />
            Lançado em: {formatTime(i.recordedAt)}
            <br />
            Observação: {i.notes || '—'}
            <br />
            Ação: {i.action || '—'}
            {row.error && <p className="alert-text">{row.error}</p>}
            <p className="draft-note">
              Registro preservado sem edição. Identificação declarada pelo
              inspetor no piloto.
            </p>
          </td>
        </tr>
      )}
    </>
  );
}
export function HistoryView({
  rows,
  stations,
}: {
  rows: LocalRow<Inspection>[];
  stations: LocalRow<Station>[];
}) {
  const [search, setSearch] = useState(''),
    [line, setLine] = useState(''),
    [date, setDate] = useState(''),
    [result, setResult] = useState('');
  const filtered = rows.filter((r) => {
    const s = stations.find((s) => s.id === r.data.stationId)?.data;
    return (
      (!line || s?.line === line) &&
      (!date || r.data.productionDate === date) &&
      (!result || r.data.result === result) &&
      [r.data.inspector, s?.code, s?.line]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  });
  function csv() {
    const escape = (v: string | number | undefined) => {
      let text = String(v ?? '');
      if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
      return `"${text.replaceAll('"', '""')}"`;
    };
    const data = [
      [
        'ID',
        'Linha',
        'Estação',
        'Inspetor',
        'Operador',
        'Data produção',
        'Medição ISO',
        'Lançamento ISO',
        'Turno',
        'Momento',
        'Integridade',
        'Validade solda',
        'Temperatura °C',
        'Resistência Ω',
        'Tensão mV',
        'Resultado',
        'Envio',
        'Observação',
        'Ação',
      ],
      ...filtered.map((r) => {
        const i = r.data,
          s = stations.find((s) => s.id === i.stationId)?.data;
        return [
          i.id,
          s?.line,
          s?.code,
          i.inspector,
          i.operator,
          i.productionDate,
          i.measuredAt,
          i.recordedAt,
          i.shift,
          MOMENTS[i.moment],
          i.physical,
          i.solder,
          i.temperature,
          i.resistance,
          i.voltage,
          i.result,
          r.status,
          i.notes,
          i.action,
        ];
      }),
    ];
    download(
      `inspecoes-${localDate()}.csv`,
      '\uFEFF' + data.map((row) => row.map(escape).join(';')).join('\r\n'),
      'text/csv;charset=utf-8',
    );
  }
  return (
    <>
      <ExportPdf rows={rows} stations={stations} />
      <Panel
        title="Histórico de verificações"
        aside={
          <Button variant="outline" onClick={csv} disabled={!filtered.length}>
            <Download />
            Exportar CSV
          </Button>
        }
      >
        <div className="filterbar">
          <div className="toolbar">
            <label className="field">
              Buscar
              <Input
                placeholder="Estação ou inspetor"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <label className="field">
              Linha
              <NativeSelect
                value={line}
                onChange={(e) => setLine(e.target.value)}
              >
                <option value="">Todas as linhas</option>
                {[...new Set(stations.map((s) => s.data.line))]
                  .sort()
                  .map((l) => (
                    <option key={l}>{l}</option>
                  ))}
              </NativeSelect>
            </label>
            <label className="field">
              Data de produção
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label className="field">
              Resultado
              <NativeSelect
                value={result}
                onChange={(e) => setResult(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="OK">Conforme</option>
                <option value="NC">Não conforme</option>
              </NativeSelect>
            </label>
          </div>
          <small className="text-muted">{filtered.length} registro(s)</small>
        </div>
        <InspectionTable rows={filtered} stations={stations} />
      </Panel>
    </>
  );
}
