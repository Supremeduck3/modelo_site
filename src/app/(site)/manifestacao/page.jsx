import { Toaster } from 'react-hot-toast';
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
      {/*
        Nesta página o CTA do bloco apontava para ela mesma. Aqui ele leva ao
        formulário logo abaixo — útil no celular, onde os passos ocupam a dobra.
      */}
      <SubmissionEmbedded
        id="canal"
        content={{
          ...content,
          ctaHref: '#formulario',
          ctaLabel: 'Preencher o formulário',
        }}
        headingLevel="h1"
      />
      {/*
        O Toaster vive aqui, e não no layout raiz: só o formulário de
        manifestação dispara toast, e no layout ele fazia toda página do site —
        e do painel, que tem o próprio sistema de mensagens — baixar a
        biblioteca sem usar.
      */}
      <Toaster position="top-right" />
      <Container>
        <div id="formulario" className={styles.formWrapper}>
          <header className={styles.formHeader}>
            <h2 className={styles.formTitle}>Registrar manifestação</h2>
            <p className={styles.privacy}>
              Seus dados são usados apenas para responder a esta manifestação e
              ficam visíveis só para a equipe responsável.
            </p>
          </header>
          <SubmissionForm
            categories={categories}
            consentText={siteConfig.legal.consentText}
          />
        </div>
      </Container>
    </>
  );
}
