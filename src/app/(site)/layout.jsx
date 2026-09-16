import AppShell from '@/components/layout/AppShell';

/**
 * Casca do ambiente público.
 *
 * O grupo `(site)` não aparece na URL: existe para que a navegação e o rodapé
 * envolvam apenas as páginas públicas, deixando `/painel` com casca própria.
 */
export default function SiteLayout({ children }) {
  return <AppShell>{children}</AppShell>;
}
