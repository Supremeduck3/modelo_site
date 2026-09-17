import { Card } from 'antd';
import CategoriesManager from '@/components/painel/CategoriesManager';
import { can, PERMISSIONS } from '@/lib/auth/permissions';
import { requireSessionUser } from '@/server/modules/auth/session';
import { listCategoriesForPanel } from '@/server/modules/company/settings';

export const metadata = { robots: { index: false, follow: false } };

export const dynamic = 'force-dynamic';

/**
 * Categorias de manifestação.
 *
 * São dado operacional da empresa, e não configuração do site: por isso vivem
 * no banco e não no arquivo de configuração da implantação.
 */
export default async function CategoriasPage() {
  const user = await requireSessionUser('/painel/categorias');
  const categories = await listCategoriesForPanel(user.companyId);

  return (
    <Card title="Categorias de manifestação">
      <CategoriesManager
        categories={categories}
        canManage={can(user, PERMISSIONS.SETTINGS_MANAGE)}
      />
    </Card>
  );
}
