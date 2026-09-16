import LegalPage from '@/components/ui/LegalPage';
import { siteConfig } from '@/config/site';

export const metadata = {
  title: `Termos de uso — ${siteConfig.identity.name}`,
  description: 'Condições de uso deste site e dos seus canais de atendimento.',
};

export default function TermosPage() {
  return (
    <LegalPage
      title="Termos de uso"
      content={siteConfig.legal.terms}
      fallback="O texto dos termos de uso ainda não foi preenchido nesta implantação. Informe-o em legal.terms na configuração do site — o conteúdo jurídico deve ser fornecido e revisado pelo responsável pelo projeto."
    />
  );
}
