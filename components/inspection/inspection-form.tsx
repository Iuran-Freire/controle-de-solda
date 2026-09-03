'use client';
import { useEffect, useState, type SubmitEvent } from 'react';
import { Save, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
import { Panel } from './shared';
import { PostChecks } from './post-checks';
import {
  MOMENTS,
  localDate,
  localDateTime,
  resultOf,
  type Moment,
  type Inspection,
  type Station,
  type LocalRow,
} from '@/lib/inspection/types';
import { validateInspection } from '@/lib/inspection/validation';
import { addInspection, setting, setSetting } from '@/lib/offline/database';
type Draft = {
  stationId: string;
  inspector: string;
  operator: string;
  measuredAt: string;
  productionDate: string;
  shift: string;
  moment: Moment;
  physical: string;
  solder: string;
  temperature: string;
  resistance: string;
  voltage: string;
  notes: string;
  action: string;
};
const fresh = (): Draft => ({
  stationId: '',
  inspector: '',
  operator: '',
  measuredAt: localDateTime(),
  productionDate: localDate(),
  shift: '1',
  moment: 'IT',
  physical: '',
  solder: '',
  temperature: '',
  resistance: '',
  voltage: '',
  notes: '',
  action: '',
});
export function InspectionForm({
  stations,
  selected,
  onSaved,
}: {
  stations: LocalRow<Station>[];
  selected: string;
  onSaved: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft>(fresh),
    [loaded, setLoaded] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState('');
  useEffect(() => {
    Promise.all([setting<Draft>('draft'), setting<string>('inspector')])
      .then(([saved, inspector]) => {
        setDraft({
          ...fresh(),
          ...saved,
          inspector: saved?.inspector || inspector || '',
          ...(selected ? { stationId: selected } : {}),
        });
        setLoaded(true);
      })
      .catch(() => setError('Não foi possível recuperar o rascunho.'));
  }, [selected]);
  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => {
      void setSetting('draft', draft).catch(() =>
        setError('Não foi possível guardar o rascunho neste aparelho.'),
      );
    }, 350);
    return () => clearTimeout(timer);
  }, [draft, loaded]);
  useEffect(() => {
    if (!loaded) return;
    const flush = (event: Event) => {
      const detail = (
        event as CustomEvent<{ waitUntil: (p: Promise<unknown>) => void }>
      ).detail;
      detail.waitUntil(setSetting('draft', draft));
    };
    window.addEventListener('solda:before-update', flush);
    return () => window.removeEventListener('solda:before-update', flush);
  }, [draft, loaded]);
  function change(name: keyof Draft, value: string) {
    setDraft((d) => ({ ...d, [name]: value }));
    setMessage('');
  }
  const station = stations.find((r) => r.id === draft.stationId)?.data;
  const completeNumbers = ['temperature', 'resistance', 'voltage'].every(
    (k) => draft[k as keyof Draft] !== '',
  );
  const nc =
    station &&
    completeNumbers &&
    resultOf({
      ...draft,
      physical: draft.physical as 'OK' | 'NC',
      solder: draft.solder as 'OK' | 'NC',
      temperature: Number(draft.temperature),
      resistance: Number(draft.resistance),
      voltage: Number(draft.voltage),
      limits: station.limits,
    }) === 'NC';
  async function submit(event: SubmitEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (!station) throw new Error('Selecione uma estação cadastrada.');
      if (!completeNumbers) throw new Error('Informe todas as medições.');
      const record = validateInspection({
        ...draft,
        id: crypto.randomUUID(),
        measuredAt: new Date(draft.measuredAt).toISOString(),
        recordedAt: new Date().toISOString(),
        temperature: Number(draft.temperature),
        resistance: Number(draft.resistance),
        voltage: Number(draft.voltage),
        limits: station.limits,
      } as Inspection);
      await addInspection(record);
      const next = {
        ...fresh(),
        inspector: draft.inspector,
        stationId: draft.stationId,
        operator: draft.operator,
        shift: draft.shift,
        moment: draft.moment,
      };
      setDraft(next);
      await setSetting('draft', next);
      await setSetting('inspector', draft.inspector);
      setMessage(
        'Verificação salva neste aparelho. O envio será confirmado na sincronização.',
      );
      await onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <div className="notice amber">
        <ShieldCheck />
        <span>
          <strong>Projeto piloto · critérios precisam de validação.</strong>
          <br />
          Confira os limites cadastrados para cada estação com a qualidade.
          Identificação do inspetor é declarada; não equivale a assinatura
          autenticada.
        </span>
      </div>
      <Panel title="01 · Identificação da verificação">
        <div className="panel-body fields">
          <label className="field">
            Linha / posto
            <NativeSelect
              required
              value={draft.stationId}
              onChange={(e) => change('stationId', e.target.value)}
            >
              <option value="">Selecione a estação</option>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.data.line} · {s.data.code}
                </option>
              ))}
            </NativeSelect>
          </label>
          <label className="field">
            Inspetor / matrícula
            <Input
              required
              maxLength={160}
              value={draft.inspector}
              onChange={(e) => change('inspector', e.target.value)}
              placeholder="Nome e matrícula"
            />
          </label>
          <label className="field">
            Operador
            <Input
              required
              maxLength={160}
              value={draft.operator}
              onChange={(e) => change('operator', e.target.value)}
              placeholder="Responsável pela estação"
            />
          </label>
          <label className="field">
            Data e hora da medição
            <Input
              type="datetime-local"
              required
              value={draft.measuredAt}
              onChange={(e) => change('measuredAt', e.target.value)}
            />
          </label>
          <label className="field">
            Data de produção
            <Input
              type="date"
              required
              value={draft.productionDate}
              onChange={(e) => change('productionDate', e.target.value)}
            />
          </label>
          <label className="field">
            Turno
            <NativeSelect
              value={draft.shift}
              onChange={(e) => change('shift', e.target.value)}
            >
              {['1', '2', '3'].map((t) => (
                <option key={t} value={t}>
                  {t}º turno
                </option>
              ))}
            </NativeSelect>
          </label>
          <label className="field">
            Momento
            <NativeSelect
              value={draft.moment}
              onChange={(e) => change('moment', e.target.value)}
            >
              {Object.entries(MOMENTS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </NativeSelect>
          </label>
          {station && (
            <div className="field">
              <span>Instrumento de medição</span>
              <strong>
                {station.instrument || 'Pendente de identificação'}
              </strong>
              <small>{station.model}</small>
            </div>
          )}
        </div>
      </Panel>
      <PostChecks station={station} values={draft} onChange={change} />
      <Panel title="Observações e conclusão">
        <div className="panel-body">
          {nc && (
            <div
              className="notice amber"
              style={{ marginTop: 20, marginBottom: 0 }}
            >
              <AlertTriangle />
              <span>
                Resultado não conforme. Registre a observação e a ação tomada
                abaixo.
              </span>
            </div>
          )}
          <div className="fields" style={{ marginTop: 22 }}>
            <label className="field wide">
              Observações
              <Textarea
                maxLength={2000}
                required={!!nc}
                value={draft.notes}
                onChange={(e) => change('notes', e.target.value)}
                placeholder="Descreva a condição observada"
              />
            </label>
            <label className="field wide">
              Ação tomada
              <Textarea
                maxLength={2000}
                required={!!nc}
                value={draft.action}
                onChange={(e) => change('action', e.target.value)}
                placeholder="Ex.: estação segregada e manutenção comunicada"
              />
            </label>
          </div>
          {error && (
            <p role="alert" className="inline-error">
              {error}
            </p>
          )}
          {message && (
            <output className="notice" style={{ marginTop: 16 }}>
              {message}
            </output>
          )}
          <div className="form-footer">
            <p>
              Rascunho guardado neste aparelho.
              <br />A hora do lançamento é registrada automaticamente.
            </p>
            <Button
              type="submit"
              className="action"
              disabled={busy || !loaded || !stations.length}
            >
              <Save />
              {busy ? 'Salvando…' : 'Salvar verificação'}
            </Button>
          </div>
        </div>
      </Panel>
    </form>
  );
}
