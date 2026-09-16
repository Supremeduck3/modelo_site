'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import BrandLogo from './BrandLogo';
import MobileDrawer, { DRAWER_ID } from './MobileDrawer';
import NavigationLinks from './NavigationLinks';
import styles from './sidebar-navigation.module.css';

/**
 * Navegação lateral (esquerda ou direita). No mobile degrada para uma barra
 * superior + drawer, reaproveitando os mesmos itens de configuração.
 */
export default function SidebarNavigation({ navigation, identity }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const side = navigation.position === 'right' ? styles.right : styles.left;

  return (
    <>
      <aside
        className={`${styles.sidebar} ${side}`}
        aria-label="Navegação principal"
      >
        <BrandLogo identity={identity} />
        <nav className={styles.nav}>
          <NavigationLinks items={navigation.items} direction="column" />
        </nav>
        {navigation.showCta && (
          <Button href={navigation.ctaHref} className={styles.cta}>
            {navigation.ctaLabel}
          </Button>
        )}
      </aside>

      <div className={styles.mobileBar}>
        <BrandLogo identity={identity} />
        <button
          type="button"
          className={styles.menuButton}
          aria-label={drawerOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={drawerOpen}
          aria-controls={DRAWER_ID}
          onClick={() => setDrawerOpen(true)}
        >
          <span className={styles.menuIcon} aria-hidden="true" />
        </button>
      </div>

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        navigation={navigation}
        identity={identity}
      />
    </>
  );
}
