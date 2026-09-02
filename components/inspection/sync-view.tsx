'use client';
import { RefreshCw, Download, HardDrive, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Panel, SyncBadge, Empty, download } from './shared';
import { formatTime } from '@/lib/inspection/types';
import type { InspectionState } from '@/hooks/use-inspections';
export function SyncView({ state }: { state: InspectionState }) {
  const pending = [...state.stations, ...state.inspections].filter(
    (r) => r.status !== 'synced',
  );
  return (
    <>
      <div className="notice">
        <HardDrive />
        <span>
          <strong>
            Seus registros ficam neste aparelho até a confirmação de envio.
          </strong>
          <br />
          Mantenha o aplicativo aberto ao voltar a uma área com sinal. Não limpe
          os dados do navegador enquanto houver pendências.
        </span>
      </div>
      <Panel
        title="Central de sincronização"
        aside={
          <Button
            className="action"
            onClick={() => void state.sync()}
            disabled={state.syncing || !state.online}
          >
            <RefreshCw className={state.syncing ? 'animate-spin' : ''} />
            {state.syncing ? 'Sincronizando…' : 'Sincronizar agora'}
          </Button>
        }
      >
        <div className="panel-body">
          <div className="summary-line">
            <span>Conexão do aparelho</span>
            <strong>{state.online ? 'Rede detectada' : 'Offline'}</strong>
          </div>
          <div className="summary-line">
            <span>Última sincronização completa</span>
            <strong>
              {state.lastSync
                ? formatTime(state.lastSync)
                : 'Ainda não realizada'}
            </strong>
          </div>
          <div className="summary-line">
            <span>Aguardando envio</span>
            <strong>{state.pending}</strong>
          </div>
          <div className="summary-line">
            <span>Conflitos preservados para revisão</span>
            <strong>{state.conflicts}</strong>
          </div>
          <div className="summary-line">
            <span>Abertura offline preparada</span>
            <strong>
              {state.offlineReady
                ? 'Sim'
                : 'Abra a versão publicada com conexão'}
            </strong>
          </div>
          {state.error && (
            <p className="inline-error" role="alert">
              {state.error}
            </p>
          )}
          <div className="toolbar" style={{ marginTop: 20 }}>
            <Button
              variant="outline"
              onClick={() =>
                download(
                  `backup-solda-${Date.now()}.json`,
                  JSON.stringify(
                    {
                      version: 1,
                      exportedAt: new Date().toISOString(),
                      stations: state.stations,
                      inspections: state.inspections,
                    },
                    null,
                    2,
                  ),
                )
              }
            >
              <Download />
              Exportar cópia de segurança
            </Button>
          </div>
        </div>
      </Panel>
      <Panel title="Registros neste aparelho">
        {pending.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Identificação</th>
                  <th>Situação</th>
                  <th>Detalhe</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {'code' in r.data ? r.data.code : r.data.inspector}
                      <small>{r.id}</small>
                    </td>
                    <td>
                      <SyncBadge status={r.status} />
                    </td>
                    <td className="details">
                      {r.error || 'Aguardando confirmação da base central.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Nenhum envio pendente"
            text="Novos registros serão adicionados à fila automaticamente."
          />
        )}
      </Panel>
      {state.conflicts > 0 && (
        <div className="notice amber">
          <TriangleAlert />
          <span>
            Conflitos não são reenviados nem sobrescritos automaticamente.
            Exporte a cópia de segurança e encaminhe os registros à qualidade
            para conciliação.
          </span>
        </div>
      )}
    </>
  );
}
