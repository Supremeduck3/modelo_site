import PanelShell from '@/components/painel/PanelShell';
import PanelThemeProvider from '@/components/painel/PanelThemeProvider';
import { features, siteConfig } from '@/config/site';
import { buildAntdTheme } from '@/config/theme';
import { can, PERMISSIONS } from '@/lib/auth/permissions';
import { requireSessionUser } from '@/server/modules/auth/session';

/**
 * Guarda do painel.
 *
 * O grupo `(interno)` existe para separar as páginas que exigem sessão do
 * `/painel/login`, que não pode exigi-la. Toda página abaixo daqui passa por
 * esta verificação, e cada rota de API do painel repete a sua: a guarda de
 * layout é conveniência de navegação, não a única barreira.
 *
 * O tema do Ant Design entra aqui, e não no layout de `/painel`: assim as
 * telas públicas de acesso não baixam a biblioteca. Ver o comentário lá.
 */
export const dynamic = 'force-dynamic';

export default async function PanelInternalLayout({ children }) {
  const user = await requireSessionUser();

  return (
    <PanelThemeProvider theme={buildAntdTheme()}>
      <PanelShell
        user={user}
        companyName={siteConfig.identity.name}
        enabledFeatures={{
          booking: features.booking,
          // O item só aparece para quem pode editar a tabela.
          pricing: features.pricing && can(user, PERMISSIONS.CATALOG_MANAGE),
        }}
      >
        {children}
      </PanelShell>
    </PanelThemeProvider>
  );
}
