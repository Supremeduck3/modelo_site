import PanelShell from '@/components/painel/PanelShell';
import { siteConfig } from '@/config/site';
import { requireSessionUser } from '@/server/modules/auth/session';

/**
 * Guarda do painel.
 *
 * O grupo `(interno)` existe para separar as páginas que exigem sessão do
 * `/painel/login`, que não pode exigi-la. Toda página abaixo daqui passa por
 * esta verificação, e cada rota de API do painel repete a sua: a guarda de
 * layout é conveniência de navegação, não a única barreira.
 */
export const dynamic = 'force-dynamic';

export default async function PanelInternalLayout({ children }) {
  const user = await requireSessionUser();

  return (
    <PanelShell user={user} companyName={siteConfig.identity.name}>
      {children}
    </PanelShell>
  );
}
