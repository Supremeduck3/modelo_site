import SubmissionEmbedded from '@/components/sections/submission/SubmissionEmbedded';
import SubmissionForm from '@/components/submissions/SubmissionForm';
import Container from '@/components/ui/Container';
import { getSectionContent, siteConfig } from '@/config/site';
import { listActiveCategories } from '@/server/modules/company/service';
import styles from './page.module.css';

export const metadata = {
  title: `Canal de manifestações — ${siteConfig.identity.name}`,
  description:
    'Registre reclamações, elogios, sugestões, dúvidas ou solicitações e acompanhe pelo protocolo.',
};

/** A lista de categorias vem do banco da implantação, então nada é estático. */
export const dynamic = 'force-dynamic';

/**
 * Página dedicada do canal de manifestações (bloco 2).
 *
 * Carrega as categorias no servidor e entrega ao formulário; o registro em si
 * passa pela API, que revalida tudo.
 */
export default async function ManifestacaoPage() {
  const content = getSectionContent('submission');
  const categories = await listActiveCategories();

  return (
    <>
      <SubmissionEmbedded id="canal" content={content} headingLevel="h1" />
      <Container>
        <div className={styles.formWrapper}>
          <SubmissionForm
            categories={categories}
            consentText={siteConfig.legal.consentText}
          />
        </div>
      </Container>
    </>
  );
}
