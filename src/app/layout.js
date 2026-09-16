import './globals.css';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { Toaster } from 'react-hot-toast';
import AppShell from '@/components/layout/AppShell';
import { siteConfig } from '@/config/site';
import { buildThemeStyleSheet } from '@/config/theme';

const { identity, seo } = siteConfig;

/** Metadados vêm da configuração da implantação — nada é hardcoded por cliente. */
export const metadata = {
  title:
    seo.title ??
    `${identity.name}${identity.tagline ? ` — ${identity.tagline}` : ''}`,
  description: seo.description ?? identity.description,
  keywords: seo.keywords,
  icons: { icon: identity.favicon },
  metadataBase: seo.siteUrl ? new URL(seo.siteUrl) : undefined,
  openGraph: {
    type: 'website',
    locale: seo.locale,
    siteName: identity.name,
    title: seo.title ?? identity.name,
    description: seo.description ?? identity.description,
    images: seo.openGraphImage ? [seo.openGraphImage] : undefined,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: siteConfig.theme.colors.primary,
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Tokens da implantação injetados como variáveis CSS antes da primeira pintura. */}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: CSS gerado a partir da configuração local, sem entrada de usuário. */}
        <style dangerouslySetInnerHTML={{ __html: buildThemeStyleSheet() }} />
      </head>
      <body>
        <AntdRegistry>
          <AppShell>{children}</AppShell>
          <Toaster position="top-right" />
        </AntdRegistry>
      </body>
    </html>
  );
}
