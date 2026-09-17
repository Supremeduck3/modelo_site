import { Alert, Card } from 'antd';
import CompanySettingsForm from '@/components/painel/CompanySettingsForm';
import { siteConfig } from '@/config/site';
import { deploymentModeInfo } from '@/config/site/schema';
import { can, PERMISSIONS } from '@/lib/auth/permissions';
import { requireSessionUser } from '@/server/modules/auth/session';
import { getCompanySettings } from '@/server/modules/company/settings';

export const metadata = { robots: { index: false, follow: false } };

export const dynamic = 'force-dynamic';

/**
 * Dados da empresa usados na operação.
 *
 * O nome da configuração do site vai junto para a tela poder avisar quando os
 * dois divergirem — o visitante veria um nome no site e outro no e-mail.
 */
export default async function ConfiguracoesPage() {
  const user = await requireSessionUser('/painel/configuracoes');
  const company = await getCompanySettings(user.companyId);
  const mode = deploymentModeInfo(siteConfig.deployment.mode);

  return (
    <>
      <Card title="Contratação" style={{ marginBottom: 16 }}>
        {/*
          Registro administrativo, não uma chave que liga funcionalidade:
          nenhuma parte do código consulta serviço externo para decidir se o
          site funciona. Ver a nota em README.md.
        */}
        <Alert
          type="info"
          showIcon
          message={`Modelo desta implantação: ${mode.label}`}
          description={mode.description}
        />
      </Card>

      <Card title="Dados da empresa">
        <CompanySettingsForm
          company={company}
          siteIdentityName={siteConfig.identity.name}
          canManage={can(user, PERMISSIONS.SETTINGS_MANAGE)}
        />
      </Card>
    </>
  );
}
