import { Card } from 'antd';
import { notFound } from 'next/navigation';
import CatalogManager from '@/components/painel/CatalogManager';
import { features } from '@/config/site';
import { can, PERMISSIONS } from '@/lib/auth/permissions';
import { requireSessionUser } from '@/server/modules/auth/session';
import { listOfferingsForPanel } from '@/server/modules/catalog/service';

export const metadata = { robots: { index: false, follow: false } };

export const dynamic = 'force-dynamic';

/**
 * Tabela de serviços e preços.
 *
 * Vive no banco, não no arquivo de configuração: preço muda toda hora e quem
 * muda é a empresa, sem depender de quem implantou o site.
 */
export default async function ServicosPage() {
  // Com a funcionalidade desligada a página não existe, em vez de abrir uma
  // tela cujo resultado não aparece em lugar nenhum do site.
  if (!features.pricing) notFound();

  const user = await requireSessionUser('/painel/servicos');
  const offerings = await listOfferingsForPanel(user.companyId);

  return (
    <Card title="Serviços e preços">
      <CatalogManager
        offerings={offerings}
        canManage={can(user, PERMISSIONS.CATALOG_MANAGE)}
      />
    </Card>
  );
}
