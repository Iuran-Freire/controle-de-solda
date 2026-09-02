'use client';
import { useState, useCallback, useEffect } from 'react';
import {
  Activity,
  ClipboardCheck,
  LayoutDashboard,
  Radio,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Plus,
  Factory,
  History,
  Wifi,
  WifiOff,
  Menu,
  QrCode,
  ArrowUpRight,
  CloudUpload,
  TriangleAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { Input } from '@/components/ui/input';
import { useInspections } from '@/hooks/use-inspections';
import { InspectionForm } from './inspection-form';
import { Stations, Scanner } from './stations';
import { HistoryView, InspectionTable } from './history';
import { ControlCharts } from './control-charts';
import { SyncView } from './sync-view';
import { Panel } from './shared';
import { localDate } from '@/lib/inspection/types';
import { setting, setSetting } from '@/lib/offline/database';
type View =
  | 'overview'
  | 'inspection'
  | 'history'
  | 'charts'
  | 'stations'
  | 'sync'
  | 'settings';
const NAV = [
  { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'inspection', label: 'Nova verificação', icon: ClipboardCheck },
  { id: 'history', label: 'Histórico', icon: History },
  { id: 'charts', label: 'Cartas I-MR', icon: Activity },
  { id: 'stations', label: 'Estações', icon: Factory },
  { id: 'sync', label: 'Sincronização', icon: RefreshCw },
  { id: 'settings', label: 'Configurações', icon: Settings2 },
] as const;
const descriptions: Record<View, string> = {
  overview: 'Acompanhe as verificações e a qualidade das estações de solda.',
  inspection: 'Registre os resultados da inspeção, mesmo sem conexão.',
  history: 'Rastreabilidade de cada medição, da linha à qualidade.',
  charts: 'Temperatura e amplitude móvel, estação por estação.',
  stations: 'Organize os equipamentos e gere suas etiquetas de identificação.',
  sync: 'Do aparelho para a base central, com confirmação de recebimento.',
  settings: 'Prepare este aparelho para a rotina de inspeção.',
};
export function Workspace() {
  const state = useInspections();
  const [view, setView] = useState<View>('overview'),
    [selected, setSelected] = useState(''),
    [menu, setMenu] = useState(false),
    [scan, setScan] = useState(false),
    [toast, setToast] = useState(''),
    [line, setLine] = useState(''),
    [date, setDate] = useState(localDate()),
    [inspector, setInspector] = useState('');
  function navigate(v: View) {
    setView(v);
    setMenu(false);
    setScan(false);
  }
  const inspect = useCallback((id: string) => {
    setSelected(id);
    setView('inspection');
    setScan(false);
    setMenu(false);
  }, []);
  const readQR = useCallback(
    (id: string) => {
      if (!state.stations.some((s) => s.id === id)) {
        setScan(false);
        setToast(
          'Estação não disponível neste aparelho. Sincronize os cadastros com conexão.',
        );
        return;
      }
      inspect(id);
    },
    [state.stations, inspect],
  );
  useEffect(() => {
    const fromHash = () => {
      const id = new URLSearchParams(location.hash.slice(1)).get('station');
      if (id) {
        inspect(id);
      }
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    void setting<string>('inspector').then((v) => setInspector(v ?? ''));
    return () => window.removeEventListener('hashchange', fromHash);
  }, [inspect]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 7000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const context = (
      document as unknown as {
        modelContext?: {
          registerTool: (tool: unknown, options: unknown) => void;
        };
      }
    ).modelContext;
    if (!context) return;
    const lifecycle = new AbortController();
    try {
      context.registerTool(
        {
          name: 'start_station_inspection',
          description:
            'Abre o formulário de uma estação cadastrada. Não salva uma inspeção.',
          inputSchema: {
            type: 'object',
            properties: { stationId: { type: 'string' } },
            required: ['stationId'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false },
          execute: (input: unknown) => {
            const id = (input as { stationId?: string })?.stationId;
            if (!id || !state.stations.some((s) => s.id === id))
              throw new Error('Estação não encontrada');
            inspect(id);
            return { stationId: id, formOpened: true };
          },
        },
        { signal: lifecycle.signal },
      );
    } catch {
      /* Optional browser capability. */
    }
    return () => lifecycle.abort();
  }, [state.stations, inspect]);
  async function saved() {
    await state.refresh();
    if (navigator.onLine) void state.sync();
  }
  const stationIds = state.stations
    .filter((s) => !line || s.data.line === line)
    .map((s) => s.id);
  const visible = state.inspections.filter(
    (r) =>
      r.data.productionDate === date && stationIds.includes(r.data.stationId),
  );
  const nonconforming = visible.filter((r) => r.data.result === 'NC').length;
  return (
    <div className="app">
      <aside className={`sidebar ${menu ? 'open' : ''}`}>
        <div className="brand">
          INVENTUS<span>POWER</span>
          <small>MANUFACTURING QUALITY</small>
        </div>
        <div className="nav-label">CONTROLE DE SOLDA</div>
        <nav className="nav" aria-label="Menu principal">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => navigate(n.id)}
              className={view === n.id ? 'active' : ''}
              aria-current={view === n.id ? 'page' : undefined}
            >
              <n.icon />
              {n.label}
              {n.id === 'sync' && state.pending > 0 && (
                <span className="pill-count">{state.pending}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <ShieldCheck size={20} />
          <strong>Qualidade em cada conexão.</strong>Verificação digital de
          estações
          <br />
          Projeto piloto · Manaus
          <button
            className="mobile-menu"
            onClick={() => setMenu(false)}
            style={{ marginTop: 12 }}
          >
            Fechar menu
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <Button
            className="mobile-menu"
            variant="ghost"
            onClick={() => setMenu(!menu)}
            aria-label="Abrir menu"
          >
            <Menu />
          </Button>
          <span className="breadcrumb">
            Qualidade <span style={{ margin: '0 12px' }}>/</span>{' '}
            <b>Estações de solda</b>
          </span>
          <div className="top-actions">
            <button
              onClick={() => navigate('sync')}
              className={`status ${state.online ? 'good' : 'warn'}`}
            >
              {state.online ? <Wifi size={13} /> : <WifiOff size={13} />}{' '}
              {state.online ? 'Rede detectada' : 'Modo offline'}
            </button>
            <span className="hide-mobile text-muted" style={{ fontSize: 11 }}>
              PILOTO
            </span>
            <button
              className="avatar"
              aria-label="Identificação do inspetor"
              onClick={() => navigate('settings')}
            >
              {inspector ? inspector.slice(0, 2).toUpperCase() : 'IP'}
            </button>
          </div>
        </header>
        <div className="content">
          <div className="heading">
            <div>
              <p className="eyebrow">CONTROLE DO PROCESSO</p>
              <h1>{NAV.find((n) => n.id === view)?.label}</h1>
              <p className="subtitle">{descriptions[view]}</p>
            </div>
            <div className="toolbar">
              {(view === 'overview' || view === 'inspection') && (
                <Button
                  variant="outline"
                  className="action"
                  onClick={() => setScan(!scan)}
                >
                  <QrCode />
                  Ler QR Code
                </Button>
              )}
              {view !== 'inspection' && view !== 'stations' && (
                <Button
                  className="action"
                  onClick={() => {
                    setSelected('');
                    navigate('inspection');
                  }}
                >
                  <Plus />
                  Nova verificação
                </Button>
              )}
            </div>
          </div>
          {scan && <Scanner onScan={readQR} onClose={() => setScan(false)} />}
          {!state.ready && state.error && (
            <p className="inline-error" role="alert">
              {state.error}
            </p>
          )}
          {view === 'overview' && (
            <>
              <div className="toolbar" style={{ marginBottom: 22 }}>
                <label className="field">
                  Linha
                  <NativeSelect
                    value={line}
                    onChange={(e) => setLine(e.target.value)}
                  >
                    <option value="">Todas as linhas</option>
                    {[...new Set(state.stations.map((s) => s.data.line))]
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
                <span className="status neutral" style={{ marginLeft: 'auto' }}>
                  Dados disponíveis neste aparelho
                </span>
              </div>
              <div className="stats">
                {[
                  {
                    title: 'Verificações no dia',
                    value: visible.length,
                    caption: 'Na data e linha selecionadas',
                    icon: ClipboardCheck,
                  },
                  {
                    title: 'Estações cadastradas',
                    value: stationIds.length,
                    caption: 'Na linha selecionada',
                    icon: Factory,
                  },
                  {
                    title: 'Não conformidades',
                    value: nonconforming,
                    caption: 'Verificações que exigem atenção',
                    icon: TriangleAlert,
                  },
                  {
                    title: 'Aguardando envio',
                    value: state.pending,
                    caption: 'Registros e cadastros deste aparelho',
                    icon: CloudUpload,
                  },
                ].map((s) => (
                  <div className="stat" key={s.title}>
                    <div className="stat-top">
                      {s.title}
                      <s.icon />
                    </div>
                    <strong>{s.value.toString().padStart(2, '0')}</strong>
                    <small>{s.caption}</small>
                  </div>
                ))}
              </div>
              <div className="notice">
                <Radio />
                <span>
                  <strong>A inspeção continua, mesmo sem sinal.</strong>
                  <br />
                  Prepare o aparelho com conexão, registre na linha e sincronize
                  ao retornar.{' '}
                  {state.offlineReady
                    ? 'Aplicativo preparado para abrir offline.'
                    : 'Preparando o acesso offline.'}
                </span>
                <Button
                  variant="ghost"
                  className="hide-mobile"
                  style={{ marginLeft: 'auto' }}
                  onClick={() => navigate('sync')}
                >
                  Ver sincronização <ArrowUpRight />
                </Button>
              </div>
              <Panel
                title="Verificações recentes"
                aside={
                  <Button variant="ghost" onClick={() => navigate('history')}>
                    Ver histórico <ArrowUpRight />
                  </Button>
                }
              >
                <InspectionTable
                  rows={visible.slice(0, 6)}
                  stations={state.stations}
                />
              </Panel>
              <div className="grid2">
                <Panel title="Visão por linha">
                  <div className="panel-body">
                    {state.stations.length ? (
                      [...new Set(state.stations.map((s) => s.data.line))]
                        .sort()
                        .map((l) => {
                          const ids = state.stations
                            .filter((s) => s.data.line === l)
                            .map((s) => s.id);
                          const count = state.inspections.filter(
                            (i) =>
                              i.data.productionDate === date &&
                              ids.includes(i.data.stationId),
                          ).length;
                          return (
                            <div className="summary-line" key={l}>
                              <span>
                                <Factory
                                  size={15}
                                  style={{ display: 'inline', marginRight: 9 }}
                                />
                                {l}
                              </span>
                              <strong>{count} verificação(ões)</strong>
                            </div>
                          );
                        })
                    ) : (
                      <div className="help-list">
                        <strong>Comece pelo cadastro dos equipamentos.</strong>
                        <p>
                          Adicione a linha, a estação e o instrumento usado na
                          medição.
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => navigate('stations')}
                        >
                          Cadastrar estações <ArrowUpRight />
                        </Button>
                      </div>
                    )}
                  </div>
                </Panel>
                <Panel title="Uma rotina, dois caminhos">
                  <div className="panel-body help-list">
                    <div>
                      <strong>01 · Direto na linha</strong>
                      <p>
                        Use o corporativo, leia o QR Code e registre as
                        medições.
                      </p>
                    </div>
                    <div>
                      <strong>02 · Pelo computador</strong>
                      <p>
                        Transcreva o papel, informando a hora real da coleta.
                      </p>
                    </div>
                    <div>
                      <strong>03 · Um histórico compartilhado</strong>
                      <p>
                        A base reúne os registros após a confirmação de envio.
                      </p>
                    </div>
                  </div>
                </Panel>
              </div>
            </>
          )}
          {view === 'inspection' && (
            <InspectionForm
              stations={state.stations}
              selected={selected}
              onSaved={saved}
            />
          )}
          {view === 'stations' && (
            <Stations
              stations={state.stations}
              onSaved={saved}
              onInspect={inspect}
            />
          )}
          {view === 'history' && (
            <HistoryView rows={state.inspections} stations={state.stations} />
          )}
          {view === 'charts' && (
            <ControlCharts rows={state.inspections} stations={state.stations} />
          )}
          {view === 'sync' && <SyncView state={state} />}
          {view === 'settings' && (
            <>
              <Panel title="Identificação neste aparelho">
                <form
                  className="panel-body"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void setSetting('inspector', inspector)
                      .then(() =>
                        setToast('Identificação salva neste aparelho.'),
                      )
                      .catch(() =>
                        setToast('Não foi possível salvar a identificação.'),
                      );
                  }}
                >
                  <label className="field">
                    Nome / matrícula do inspetor
                    <Input
                      required
                      maxLength={160}
                      value={inspector}
                      onChange={(e) => setInspector(e.target.value)}
                      placeholder="Ex.: Maria Silva · 12345"
                    />
                  </label>
                  <p className="subtitle">
                    Identificação declarada para o piloto. Em aparelhos
                    compartilhados, confira o nome a cada inspeção.
                  </p>
                  <Button
                    type="submit"
                    className="action"
                    style={{ marginTop: 20 }}
                  >
                    Salvar identificação
                  </Button>
                </form>
              </Panel>
              <Panel title="Preparação para a fábrica">
                <div className="panel-body help-list">
                  <div>
                    <strong>Acesso offline</strong>
                    <p>
                      Abra a versão publicada com conexão e aguarde o preparo.
                      Adicione à tela inicial pelo menu do navegador. A primeira
                      abertura e a atualização dos cadastros precisam de
                      conexão.
                    </p>
                  </div>
                  <div>
                    <strong>Critérios de inspeção</strong>
                    <p>
                      Temperatura, resistência e tensão são configuradas no
                      cadastro de cada estação. Valide as unidades e os limites
                      dos documentos FGQ-81 R00 e carta I-MR antes de uso
                      oficial.
                    </p>
                  </div>
                  <div>
                    <strong>Dados preservados</strong>
                    <p>
                      Inspeções não são editadas ou excluídas neste piloto.
                      Duplicidades ficam sinalizadas para conciliação pela
                      qualidade. Exporte uma cópia na tela de sincronização.
                    </p>
                  </div>
                  <div>
                    <strong>Acesso da equipe</strong>
                    <p>
                      Esta versão é um piloto privado. A liberação para vários
                      inspetores, autenticação corporativa, política de acesso e
                      hospedagem definitiva devem ser configuradas com a TI
                      antes da produção.
                    </p>
                  </div>
                  <div>
                    <strong>Identidade visual</strong>
                    <p>
                      Interface inspirada na Inventus Power. A marca foi
                      representada tipograficamente; a aprovação visual e o
                      logotipo oficial podem ser incorporados pela empresa.
                    </p>
                  </div>
                </div>
              </Panel>
            </>
          )}
          <footer className="page-foot">
            <span>INVENTUS POWER · CONTROLE DE SOLDA</span>
            <span>
              Projeto piloto · Critérios e acesso sujeitos à validação da
              qualidade e TI
            </span>
          </footer>
        </div>
      </main>
      {toast && <output className="toast">{toast}</output>}
    </div>
  );
}
