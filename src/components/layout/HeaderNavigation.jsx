'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import BrandLogo from './BrandLogo';
import styles from './header-navigation.module.css';
import MobileDrawer, { DRAWER_ID } from './MobileDrawer';
import NavigationLinks from './NavigationLinks';

/**
 * Navegação em topo. Cobre as variantes "header" e "header-compact" e os
 * comportamentos fixed / static / shrink-on-scroll definidos na config.
 */
export default function HeaderNavigation({ navigation, identity, compact }) {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const shrinks = navigation.behavior === 'shrink-on-scroll';

  useEffect(() => {
    if (!shrinks) return undefined;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [shrinks]);

  const classes = [
    styles.header,
    navigation.behavior === 'static' ? styles.static : styles.fixed,
    compact ? styles.compact : '',
    shrinks && scrolled ? styles.scrolled : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={classes}>
      <Container className={styles.inner}>
        <BrandLogo identity={identity} />

        <nav className={styles.desktopNav} aria-label="Navegação principal">
          <NavigationLinks items={navigation.items} />
        </nav>

        <div className={styles.actions}>
          {navigation.showCta && (
            <Button className={styles.cta} href={navigation.ctaHref} size="sm">
              {navigation.ctaLabel}
            </Button>
          )}
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
      </Container>

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        navigation={navigation}
        identity={identity}
      />
    </header>
  );
}
