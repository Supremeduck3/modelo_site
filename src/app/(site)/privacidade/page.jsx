import LegalPage from '@/components/ui/LegalPage';
import { siteConfig } from '@/config/site';

export const metadata = {
  title: `Política de privacidade — ${siteConfig.identity.name}`,
  description: 'Como tratamos os dados pessoais coletados neste site.',
};

export default function PrivacidadePage() {
  return (
    <LegalPage
      title="Política de privacidade"
      content={siteConfig.legal.privacyPolicy}
      fallback="O texto da política de privacidade ainda não foi preenchido nesta implantação. Informe-o em legal.privacyPolicy na configuração do site — o conteúdo jurídico deve ser fornecido e revisado pelo responsável pelo projeto."
    />
  );
}
