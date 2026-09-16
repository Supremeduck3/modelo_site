import { siteConfig } from '@/config/site';
import styles from './app-shell.module.css';
import SiteFooter from './SiteFooter';
import SiteNavigation from './SiteNavigation';

/**
 * Casca do ambiente público. É ela que reage à variante de navegação — por isso
 * uma implantação pode ter menu lateral e outra menu superior sem que páginas
 * ou seções mudem uma linha.
 */
export default function AppShell({ children }) {
  const { variant, position, behavior } = siteConfig.navigation;
  const isSidebar = variant === 'sidebar';
  // Sem header fixo no topo não há o que compensar no scroll das âncoras.
  const hasFixedHeader = !isSidebar && behavior !== 'static';
  const shellClass = [
    styles.shell,
    isSidebar ? styles.withSidebar : '',
    isSidebar && position === 'right' ? styles.sidebarRight : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={shellClass}
      style={hasFixedHeader ? undefined : { '--header-height': '0px' }}
    >
      {/* Primeiro elemento focável do documento, antes da navegação. */}
      <a className={styles.skipLink} href="#conteudo">
        Pular para o conteúdo
      </a>
      <SiteNavigation />
      <div className={styles.content}>
        <main id="conteudo">{children}</main>
        <SiteFooter />
      </div>
    </div>
  );
}
