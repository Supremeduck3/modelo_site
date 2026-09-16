import { siteConfig } from '@/config/site';
import HeaderNavigation from './HeaderNavigation';
import SidebarNavigation from './SidebarNavigation';

/**
 * Ponto único de escolha da navegação da implantação.
 * Trocar `navigation.variant` na config muda a estrutura sem tocar em páginas.
 */
const NAVIGATION_COMPONENTS = {
  header: HeaderNavigation,
  'header-compact': HeaderNavigation,
  sidebar: SidebarNavigation,
};

export default function SiteNavigation() {
  const nav = siteConfig.navigation;
  const Component = NAVIGATION_COMPONENTS[nav.variant] ?? HeaderNavigation;
  return (
    <Component
      navigation={nav}
      identity={siteConfig.identity}
      compact={nav.variant === 'header-compact'}
    />
  );
}
