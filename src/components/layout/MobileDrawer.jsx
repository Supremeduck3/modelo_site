'use client';

import { useEffect, useRef } from 'react';
import Button from '@/components/ui/Button';
import BrandLogo from './BrandLogo';
import styles from './mobile-drawer.module.css';
import NavigationLinks from './NavigationLinks';

/** Menu mobile compartilhado por todas as variantes de navegação. */
/** Id do painel, referenciado pelos botões que abrem o menu (aria-controls). */
export const DRAWER_ID = 'menu-mobile';

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function MobileDrawer({ open, onClose, navigation, identity }) {
  const closeRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      // Mantém o foco dentro do painel enquanto ele está aberto.
      const focusables = panelRef.current?.querySelectorAll(FOCUSABLE);
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <button
        type="button"
        className={styles.backdrop}
        onClick={onClose}
        tabIndex={-1}
        aria-hidden="true"
      />
      <aside
        ref={panelRef}
        id={DRAWER_ID}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
      >
        <div className={styles.head}>
          <BrandLogo identity={identity} />
          <button
            ref={closeRef}
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Fechar menu"
          >
            ×
          </button>
        </div>

        <nav aria-label="Navegação principal (mobile)">
          <NavigationLinks
            items={navigation.items}
            direction="column"
            onNavigate={onClose}
          />
        </nav>

        {navigation.showCta && (
          <Button
            href={navigation.ctaHref}
            className={styles.cta}
            onClick={onClose}
          >
            {navigation.ctaLabel}
          </Button>
        )}
      </aside>
    </div>
  );
}
