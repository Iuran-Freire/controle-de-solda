'use client';
import { useState } from 'react';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Panel } from './shared';
import {
  reportEnd,
  reportRows,
  type ReportFilter,
} from '@/lib/inspection/report';
import {
  localDate,
  type Inspection,
  type LocalRow,
  type Station,
} from '@/lib/inspection/types';
async function asset(path: string) {
  const response = await fetch(path);
  if (!response.ok)
    throw new Error(
      'Arquivos do PDF indisponíveis. Abra o aplicativo com conexão e tente novamente.',
    );
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
export function ExportPdf({
  rows,
  stations,
}: {
  rows: LocalRow<Inspection>[];
  stations: LocalRow<Station>[];
}) {
  const [filter, setFilter] = useState<ReportFilter>({
    start: localDate(),
    period: 'day',
    shifts: ['1', '2', '3'],
    stationId: '',
  });
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  const end = reportEnd(filter),
    selected = reportRows(rows, filter);
  async function generate() {
    setBusy(true);
    setMessage('');
    try {
      const [{ createReportPdf }, font, logo] = await Promise.all([
        import('@/lib/inspection/report-pdf'),
        asset('/fonts/NotoSans-Regular.ttf'),
        asset('/inventus-report-logo.png'),
      ]);
      const doc = createReportPdf(rows, stations, filter, font, logo);
      doc.save(
        `controle-solda-${filter.start}-a-${end}-turnos-${filter.shifts.join('-')}.pdf`,
      );
      setMessage('PDF gerado. Confira os downloads do aparelho.');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível gerar o PDF.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Panel title="Exportar relatório em PDF">
      <div className="panel-body">
        <div className="toolbar">
          <label className="field">
            Período
            <NativeSelect
              value={filter.period}
              onChange={(e) =>
                setFilter({
                  ...filter,
                  period: e.target.value as 'day' | 'week',
                })
              }
            >
              <option value="day">Um dia</option>
              <option value="week">Uma semana (7 dias)</option>
            </NativeSelect>
          </label>
          <label className="field">
            {filter.period === 'day'
              ? 'Data de produção'
              : 'Primeiro dia da semana'}
            <Input
              type="date"
              value={filter.start}
              onChange={(e) => setFilter({ ...filter, start: e.target.value })}
            />
          </label>
          <label className="field">
            Linha / posto
            <NativeSelect
              value={filter.stationId}
              onChange={(e) =>
                setFilter({ ...filter, stationId: e.target.value })
              }
            >
              <option value="">Todos os postos</option>
              {stations.map(({ data: s }) => (
                <option key={s.id} value={s.id}>
                  {s.line} · {s.code}
                </option>
              ))}
            </NativeSelect>
          </label>
        </div>
        <fieldset style={{ border: 0, padding: 0, margin: '16px 0' }}>
          <legend style={{ marginBottom: 8 }}>Turnos incluídos</legend>
          <div className="toolbar">
            {['1', '2', '3'].map((shift) => (
              <label
                key={shift}
                style={{ display: 'flex', gap: 8, alignItems: 'center' }}
              >
                <input
                  type="checkbox"
                  checked={filter.shifts.includes(shift)}
                  onChange={(e) =>
                    setFilter({
                      ...filter,
                      shifts: e.target.checked
                        ? [...filter.shifts, shift].sort()
                        : filter.shifts.filter((s) => s !== shift),
                    })
                  }
                />
                {shift}º turno
              </label>
            ))}
          </div>
        </fieldset>
        <p className="subtitle">
          {end
            ? `${filter.start.split('-').reverse().join('/')} a ${end.split('-').reverse().join('/')} · ${selected.length} registro(s)`
            : 'Selecione uma data válida.'}
        </p>
        <p className="draft-note">
          Exporta três tabelas: resistência, tensão e temperatura, cada uma com
          seu gráfico e resultados em I.T, A.R e F.T por posto. Pendências são
          incluídas e conflitos ficam fora dos gráficos, com a quantidade
          informada no PDF. Sincronize antes para obter os dados mais recentes
          da equipe.
        </p>
        <Button
          onClick={() => void generate()}
          disabled={busy || !selected.length}
        >
          <FileDown />
          {busy ? 'Gerando PDF…' : 'Baixar PDF'}
        </Button>
        {!filter.shifts.length && (
          <p role="status">Selecione pelo menos um turno.</p>
        )}
        {message && (
          <p role="status" style={{ marginTop: 12 }}>
            {message}
          </p>
        )}
      </div>
    </Panel>
  );
}
