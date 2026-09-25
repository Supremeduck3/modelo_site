import AppShell from '@/components/layout/AppShell';
import WhatsAppButton from '@/components/layout/WhatsAppButton';

/**
 * Casca do ambiente público.
 *
 * O grupo `(site)` não aparece na URL: existe para que a navegação e o rodapé
 * envolvam apenas as páginas públicas, deixando `/painel` com casca própria.
 * O botão de WhatsApp fica aqui pelo mesmo motivo — no painel ele não faz
 * sentido.
 */
export default function SiteLayout({ children }) {
  return (
    <>
      <AppShell>{children}</AppShell>
      <WhatsAppButton />
    </>
  );
}
