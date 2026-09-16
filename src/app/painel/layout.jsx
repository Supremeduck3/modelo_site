import PanelThemeProvider from '@/components/painel/PanelThemeProvider';
import { siteConfig } from '@/config/site';
import { buildAntdTheme } from '@/config/theme';
import styles from './painel.module.css';

/**
 * Ambiente privado. Nada do site público entra aqui, e o inverso também vale.
 *
 * A guarda de sessão não fica neste layout porque `/painel/login` também está
 * abaixo dele: quem exige sessão é o layout do grupo `(interno)`.
 */
export const metadata = {
  title: `Painel — ${siteConfig.identity.name}`,
  // Ambiente privado não entra em índice de busca nem em cache de buscador.
  robots: { index: false, follow: false, nocache: true },
};

export default function PanelLayout({ children }) {
  return (
    <PanelThemeProvider theme={buildAntdTheme()}>
      <div className={styles.root}>{children}</div>
    </PanelThemeProvider>
  );
}
