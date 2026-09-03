import type { Metadata } from 'next';
import { env } from 'cloudflare:workers';
import './globals.css';
const baseMetadata: Metadata = {
  title: 'Inventus Power | Controle de Solda',
  description:
    'Verificação de estações de solda, registros offline e acompanhamento da qualidade.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/inventus-icon.png', apple: '/inventus-icon.png' },
  openGraph: {
    title: 'Controle de Solda',
    description: 'Inventus Power · Qualidade na linha',
    images: [],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Controle de Solda',
    description: 'Inventus Power · Qualidade na linha',
    images: [],
  },
};
export function generateMetadata(): Metadata {
  const configured = (env as unknown as { SITE_URL?: string }).SITE_URL;
  const origin = configured
    ? new URL(configured)
    : new URL('http://localhost:3000');
  const image = new URL('/og.png', origin).href;
  return {
    ...baseMetadata,
    metadataBase: origin,
    openGraph: { ...baseMetadata.openGraph, images: [image] },
    twitter: { ...baseMetadata.twitter, images: [image] },
  };
}
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
