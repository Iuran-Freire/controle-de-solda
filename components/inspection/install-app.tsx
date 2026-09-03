'use client';
import { useEffect, useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Panel } from './shared';

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallApp({
  offlineReady,
  stationCount,
}: {
  offlineReady: boolean;
  stationCount: number;
}) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [message, setMessage] = useState('');
  const [local, setLocal] = useState(false);
  useEffect(() => {
    const display = window.matchMedia('(display-mode: standalone)');
    setInstalled(display.matches);
    setLocal(['localhost', '127.0.0.1'].includes(window.location.hostname));
    const available = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const completed = () => {
      setInstalled(true);
      setPrompt(null);
    };
    const changed = () => setInstalled(display.matches);
    window.addEventListener('beforeinstallprompt', available);
    window.addEventListener('appinstalled', completed);
    display.addEventListener('change', changed);
    return () => {
      window.removeEventListener('beforeinstallprompt', available);
      window.removeEventListener('appinstalled', completed);
      display.removeEventListener('change', changed);
    };
  }, []);
  async function install() {
    if (!prompt) return;
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      setMessage(
        choice.outcome === 'accepted'
          ? 'Instalação solicitada. Aguarde o ícone aparecer no aparelho.'
          : 'Você pode instalar mais tarde pelo menu do Chrome.',
      );
    } catch {
      setMessage(
        'Abra o menu do Chrome e escolha Instalar aplicativo ou Adicionar à tela inicial.',
      );
    } finally {
      setPrompt(null);
    }
  }
  return (
    <Panel title="Aplicativo no Android" aside={<Smartphone size={20} />}>
      <div className="panel-body help-list">
        <p>
          Abra este sistema no Chrome do celular e entre com a conta autorizada.
          A instalação cria o ícone Controle de Solda na tela inicial.
        </p>
        {installed ? (
          <strong>Aplicativo instalado neste aparelho.</strong>
        ) : prompt ? (
          <Button className="action" onClick={() => void install()}>
            <Download /> Instalar aplicativo
          </Button>
        ) : (
          <p>
            No Chrome, toque em ⋮ → <strong>Instalar aplicativo</strong> ou{' '}
            <strong>Adicionar à tela inicial</strong>. Se o ícone já existe,
            abra por ele.
          </p>
        )}
        {local && (
          <p className="notice amber">
            Este endereço funciona apenas neste computador. No celular, use o
            link HTTPS da versão hospedada.
          </p>
        )}
        <div role="status">
          <strong>
            {offlineReady && stationCount > 0
              ? 'Preparado para preencher offline neste aparelho'
              : 'Preparação offline pendente'}
          </strong>
          <p>
            {offlineReady
              ? 'Arquivos do aplicativo disponíveis neste aparelho.'
              : 'Mantenha o aplicativo aberto com conexão até os arquivos ficarem disponíveis.'}
          </p>
          <p>
            {stationCount > 0
              ? `${stationCount} posto(s) disponível(is) neste aparelho.`
              : 'Sincronize ou cadastre os postos antes de ir para a linha.'}
          </p>
        </div>
        <p>
          Antes de usar na linha, ative o modo avião e reabra pelo ícone para
          confirmar o funcionamento. Ao voltar a ter sinal, abra o aplicativo
          para enviar as verificações pendentes.
        </p>
        {message && <p role="status">{message}</p>}
      </div>
    </Panel>
  );
}
