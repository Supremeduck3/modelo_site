import SubmissionEmbedded from '@/components/sections/submission/SubmissionEmbedded';
import Container from '@/components/ui/Container';
import { getSectionContent, siteConfig } from '@/config/site';
import styles from './page.module.css';

export const metadata = {
  title: `Canal de manifestações — ${siteConfig.identity.name}`,
  description:
    'Registre reclamações, elogios, sugestões, dúvidas ou solicitações e acompanhe pelo protocolo.',
};

/**
 * Página dedicada do canal de manifestações (bloco 2).
 * O formulário, a API e o protocolo entram na fase 3; por ora a página
 * apresenta o canal e encaminha para os contatos diretos da empresa.
 */
export default function ManifestacaoPage() {
  const content = getSectionContent('submission');
  const { contact } = siteConfig;

  return (
    <>
      <SubmissionEmbedded id="manifestacao" content={content} />
      <Container>
        <p className={styles.notice}>
          O formulário de registro será disponibilizado nesta página. Enquanto
          isso, fale com a equipe por{' '}
          {contact.email ? (
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
          ) : (
            'um dos canais informados no rodapé'
          )}
          .
        </p>
      </Container>
    </>
  );
}
