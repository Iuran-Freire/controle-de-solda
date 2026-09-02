'use client';
import { useState, useEffect, useRef, type SubmitEvent } from 'react';
import { Factory, QrCode, Plus, Printer, X } from 'lucide-react';
import QRCode from 'qrcode';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Panel, Empty, SyncBadge } from './shared';
import {
  DEFAULT_LIMITS,
  type Station,
  type LocalRow,
} from '@/lib/inspection/types';
import { validateStation } from '@/lib/inspection/validation';
import { addStation } from '@/lib/offline/database';
export function Stations({
  stations,
  onSaved,
  onInspect,
}: {
  stations: LocalRow<Station>[];
  onSaved: () => Promise<void>;
  onInspect: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false),
    [qr, setQr] = useState<Station>(),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function submit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const form = e.currentTarget;
    const f = new FormData(form);
    try {
      const s = validateStation({
        id: crypto.randomUUID(),
        line: f.get('line'),
        code: f.get('code'),
        model: f.get('model'),
        instrument: f.get('instrument'),
        approvedBy: f.get('approvedBy'),
        limits: {
          min: Number(f.get('min')),
          max: Number(f.get('max')),
          resistance: Number(f.get('resistance')),
          voltage: Number(f.get('voltage')),
        },
        createdAt: new Date().toISOString(),
      });
      await addStation(s);
      await onSaved();
      setAdding(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha no cadastro');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="toolbar no-print" style={{ marginBottom: 22 }}>
        <Button className="action" onClick={() => setAdding(!adding)}>
          <Plus />
          Cadastrar estação
        </Button>
      </div>
      {adding && (
        <Panel title="Cadastro de estação">
          <form className="panel-body" onSubmit={submit}>
            <p className="notice amber">
              Os valores iniciais foram transcritos das fotos. Confira os
              critérios e as unidades com a qualidade antes de usar o cadastro.
            </p>
            <div className="fields">
              {[
                ['line', 'Linha', 'Linha 02'],
                ['code', 'Identificação da estação', 'ES-005'],
                ['model', 'Modelo', 'LG 24W'],
                [
                  'instrument',
                  'Nº do instrumento de medição',
                  'Identificação patrimonial',
                ],
                [
                  'approvedBy',
                  'Responsável pela configuração',
                  'Nome / matrícula',
                ],
              ].map(([name, label, placeholder]) => (
                <label className="field" key={name}>
                  {label}
                  <Input
                    required
                    name={name}
                    maxLength={160}
                    placeholder={placeholder}
                  />
                </label>
              ))}
              {[
                ['min', 'Temperatura mínima (°C)'],
                ['max', 'Temperatura máxima (°C)'],
                ['resistance', 'Resistência máxima (Ω)'],
                ['voltage', 'Tensão residual máxima (mV)'],
              ].map(([name, label]) => (
                <label className="field" key={name}>
                  {label}
                  <Input
                    required
                    type="number"
                    name={name}
                    min="0"
                    max="2000"
                    step="0.01"
                    defaultValue={
                      DEFAULT_LIMITS[name as keyof typeof DEFAULT_LIMITS]
                    }
                  />
                </label>
              ))}
            </div>
            {error && (
              <p className="inline-error" role="alert">
                {error}
              </p>
            )}
            <div className="form-footer">
              <p>Identificações não podem se repetir na mesma linha.</p>
              <Button type="submit" disabled={busy} className="action">
                {busy ? 'Salvando…' : 'Salvar estação'}
              </Button>
            </div>
          </form>
        </Panel>
      )}
      {qr ? (
        <Panel
          title={`Etiqueta · ${qr.code}`}
          aside={
            <Button
              variant="ghost"
              aria-label="Fechar etiqueta"
              onClick={() => setQr(undefined)}
            >
              <X />
            </Button>
          }
        >
          <StationQR station={qr} />
        </Panel>
      ) : null}
      {!stations.length && !adding ? (
        <Empty
          title="Cadastre a primeira estação"
          text="Organize os equipamentos por linha. Cada estação terá um formulário e seu próprio QR Code."
        />
      ) : (
        <div className="station-grid">
          {stations.map((s) => (
            <article className="station-card" key={s.id}>
              <header>
                <span className="station-symbol">
                  <Factory size={22} />
                </span>
                <SyncBadge status={s.status} />
              </header>
              <p>{s.data.line}</p>
              <h2>{s.data.code}</h2>
              <p>
                {s.data.model} · Instrumento {s.data.instrument}
              </p>
              <div className="separator" />
              <p>
                Temperatura{' '}
                <strong>
                  {s.data.limits.min}–{s.data.limits.max} °C
                </strong>
              </p>
              <p>Configurado por {s.data.approvedBy}</p>
              <footer>
                <Button variant="outline" onClick={() => onInspect(s.id)}>
                  Verificar
                </Button>
                <Button variant="ghost" onClick={() => setQr(s.data)}>
                  <QrCode />
                  Etiqueta QR
                </Button>
              </footer>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
function StationQR({ station }: { station: Station }) {
  const [image, setImage] = useState(''),
    [link, setLink] = useState('');
  useEffect(() => {
    const url = `${location.origin}/#station=${encodeURIComponent(station.id)}`;
    void QRCode.toDataURL(url, {
      width: 260,
      margin: 3,
      errorCorrectionLevel: 'M',
    })
      .then((value) => {
        setImage(value);
        setLink(url);
      })
      .catch(() =>
        setLink('Não foi possível gerar a etiqueta. Tente novamente.'),
      );
  }, [station]);
  return (
    <div className="qr-card">
      <p className="eyebrow">INVENTUS POWER · CONTROLE DE SOLDA</p>
      <h2>
        {station.line} · {station.code}
      </h2>
      {image && (
        <Image
          unoptimized
          src={image}
          width={260}
          height={260}
          alt={`QR Code da estação ${station.code}`}
        />
      )}
      <p>Abra o aplicativo e escaneie para verificar.</p>
      <p className="draft-note">Sem câmera? Selecione a estação manualmente.</p>
      <code>{link}</code>
      <div
        className="toolbar no-print"
        style={{ justifyContent: 'center', marginTop: 20 }}
      >
        <Button variant="outline" onClick={() => window.print()}>
          <Printer />
          Imprimir etiqueta
        </Button>
      </div>
    </div>
  );
}
export function Scanner({
  onScan,
  onClose,
}: {
  onScan: (id: string) => void;
  onClose: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let stopped = false;
    const videoElement = video.current;
    let controls: { stop: () => void } | undefined;
    void import('@zxing/browser')
      .then(async ({ BrowserQRCodeReader }) => {
        const reader = new BrowserQRCodeReader();
        const c = await reader.decodeFromVideoDevice(
          undefined,
          videoElement!,
          (result) => {
            if (result && !stopped) {
              try {
                const url = new URL(result.getText());
                const id = new URLSearchParams(url.hash.slice(1)).get(
                  'station',
                );
                if (!id) throw new Error();
                stopped = true;
                controls?.stop();
                onScan(id);
              } catch {
                setError('Este QR Code não identifica uma estação.');
              }
            }
          },
        );
        controls = c;
        if (stopped) c.stop();
      })
      .catch(() =>
        setError(
          'Não foi possível acessar a câmera. Permita o acesso ou selecione a estação manualmente.',
        ),
      );
    return () => {
      stopped = true;
      controls?.stop();
      const stream = videoElement?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onScan]);
  return (
    <Panel
      title="Ler QR Code"
      aside={
        <Button variant="ghost" onClick={onClose} aria-label="Fechar câmera">
          <X />
        </Button>
      }
    >
      <div className="panel-body">
        <video
          ref={video}
          muted
          playsInline
          style={{
            width: '100%',
            maxHeight: 350,
            background: '#123348',
            borderRadius: 8,
          }}
        />
        {error && (
          <p className="inline-error" role="alert">
            {error}
          </p>
        )}
        <p className="subtitle">
          Aponte para a etiqueta. A estação precisa estar disponível neste
          aparelho para uso offline.
        </p>
      </div>
    </Panel>
  );
}
