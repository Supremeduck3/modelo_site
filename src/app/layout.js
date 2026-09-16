import './globals.css';
import { Toaster } from 'react-hot-toast';
import { siteConfig } from '@/config/site';
import { buildThemeVariables } from '@/config/theme';

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

/**
 * Só o documento e os tokens da implantação. A casca do site público vive em
 * `(site)/layout.jsx` e a do painel em `painel/layout.jsx`, para que o ambiente
 * público não carregue nada do painel nem o contrário.
 */
export default function RootLayout({ children }) {
  return (
    // Os tokens da implantação vão como style inline no <html>: assim vencem
    // os defaults de globals.css sem depender da ordem das folhas de estilo.
    <html lang="pt-BR" style={buildThemeVariables()}>
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
