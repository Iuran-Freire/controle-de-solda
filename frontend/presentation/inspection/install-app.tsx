'use client';
import { useEffect, useState } from 'react';
import { Download, MonitorSmartphone } from 'lucide-react';
import { Button } from '@/frontend/components/ui/button';
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
  const [instructions, setInstructions] = useState('');
  useEffect(() => {
    const display = window.matchMedia('(display-mode: standalone)');
    const navigatorWithStandalone = navigator as Navigator & {
      standalone?: boolean;
    };
    setInstalled(display.matches || navigatorWithStandalone.standalone === true);
    setLocal(['localhost', '127.0.0.1'].includes(window.location.hostname));
    const agent = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(agent)) {
      setInstructions(
        'No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início.',
      );
    } else if (/Android/.test(agent)) {
      setInstructions(
        'No Chrome, toque em ⋮ e escolha Instalar aplicativo ou Adicionar à tela inicial.',
      );
    } else if (/Windows/.test(agent)) {
      setInstructions(
        'No Edge ou Chrome, abra o menu do navegador e escolha Aplicativos > Instalar Controle de Solda.',
      );
    } else {
      setInstructions(
        'Abra o menu do navegador e escolha Instalar aplicativo ou Adicionar à tela inicial.',
      );
    }
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
          ? 'Instalação solicitada. Aguarde o ícone aparecer no dispositivo.'
          : 'Você pode instalar mais tarde pelo menu do navegador.',
      );
    } catch {
      setMessage(
        'Não foi possível abrir o instalador. Use a opção de instalação no menu do navegador.',
      );
    } finally {
      setPrompt(null);
    }
  }
  return (
    <Panel
      title="Instalar Controle de Solda"
      aside={<MonitorSmartphone size={20} />}
    >
      <div className="panel-body help-list">
        <p>
          Instale como aplicativo no Android ou no Windows para abrir pelo
          ícone, em uma janela própria, e manter o acesso offline preparado.
        </p>
        {installed ? (
          <strong>Aplicativo instalado neste aparelho.</strong>
        ) : prompt ? (
          <Button className="action" onClick={() => void install()}>
            <Download /> Instalar aplicativo
          </Button>
        ) : (
          <p>{instructions || 'Verificando opções de instalação…'}</p>
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
              ? 'Pronto para usar sem sinal'
              : 'Prepare o aparelho antes de ir para a linha'}
          </strong>
          <p>
            {offlineReady
              ? 'O aplicativo está salvo neste aparelho.'
              : 'Mantenha esta tela aberta com internet para concluir a preparação.'}
          </p>
          <p>
            {stationCount > 0
              ? `${stationCount} ${stationCount === 1 ? 'posto disponível' : 'postos disponíveis'}.`
              : 'Sincronize ou cadastre os postos antes de ir para a linha.'}
          </p>
        </div>
        <p>
          As verificações ficam salvas no aparelho e são enviadas quando a
          conexão voltar, com o aplicativo aberto.
        </p>
        {message && <p role="status">{message}</p>}
      </div>
    </Panel>
  );
}
