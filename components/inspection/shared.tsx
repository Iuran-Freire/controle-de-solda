import { ClipboardCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import type { SyncStatus } from '@/lib/inspection/types';
export function Panel({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
export function Empty({
  title = 'Nenhum registro encontrado',
  text = 'Os resultados aparecerão aqui após a primeira verificação.',
}: {
  title?: string;
  text?: string;
}) {
  return (
    <div className="empty">
      <ClipboardCheck size={34} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
export function SyncBadge({ status }: { status: SyncStatus }) {
  return (
    <span
      className={`status ${status === 'synced' ? 'good' : status === 'conflict' ? 'bad' : 'warn'}`}
    >
      {status === 'synced'
        ? 'Sincronizado'
        : status === 'conflict'
          ? 'Revisão necessária'
          : 'Salvo no aparelho'}
    </span>
  );
}
export function download(
  name: string,
  content: string,
  type = 'application/json',
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
