import './globals.css';
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
  // Esta marca é o que de fato tira a implantação de homologação do índice. O
  // robots.txt libera o rastreio justamente para o buscador chegar até aqui e
  // ler isto; bloquear lá impediria a leitura e a página indexada continuaria
  // no índice.
  robots: seo.noindex ? { index: false, follow: false } : undefined,
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
  // A direção de arte pode pedir webfont; sem ela, seguimos com fonte de
  // sistema e nenhuma requisição extra.
  const fontImport = siteConfig.theme.typography.fontImport;

  return (
    // Os tokens da implantação vão como style inline no <html>: assim vencem
    // os defaults de globals.css sem depender da ordem das folhas de estilo.
    <html lang="pt-BR" style={buildThemeVariables()}>
      <head>
        {fontImport && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
              rel="preconnect"
              href="https://fonts.gstatic.com"
              crossOrigin=""
            />
            <link rel="stylesheet" href={fontImport} />
          </>
        )}
        {/* Sem JavaScript, o conteúdo que espera a entrada em cena aparece
            imediatamente: animação nunca é requisito para ler a página. */}
        <noscript>
          <style>
            {
              '[data-reveal],[data-reveal] .stagger>*{opacity:1!important;transform:none!important}'
            }
          </style>
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}
