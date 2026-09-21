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
    <Panel title="Controle de Solda no celular" aside={<Smartphone size={20} />}>
      <div className="panel-body help-list">
        <p>
          Tenha o Controle de Solda na tela inicial para acessar na linha.
        </p>
        {installed ? (
          <strong>Aplicativo instalado neste aparelho.</strong>
        ) : prompt ? (
          <Button className="action" onClick={() => void install()}>
            <Download /> Instalar no celular
          </Button>
        ) : (
          <p>
            No Chrome do Android, toque em ⋮ e escolha{' '}
            <strong>Instalar aplicativo</strong> ou{' '}
            <strong>Adicionar à tela inicial</strong>.
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
