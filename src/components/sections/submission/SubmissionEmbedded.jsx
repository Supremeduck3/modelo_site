import Button from '@/components/ui/Button';
import Section from '@/components/ui/Section';
import { siteConfig } from '@/config/site';
import styles from './submission.module.css';

/**
 * Bloco explicativo do canal incorporado à home.
 * Textos e etapas vêm da configuração (content.submission), nunca do componente.
 * O formulário em si chega na fase 3 (bloco 2) e será reaproveitado aqui.
 */
export default function SubmissionEmbedded({ id, content = {}, headingLevel }) {
  const { navigation } = siteConfig;

  return (
    <Section
      id={id}
      title={content.title}
      headingLevel={headingLevel}
      // Como `h1`, é o topo da página do canal — já está na dobra. Entrar com
      // animação ali fazia o texto esperar a hidratação para aparecer: o
      // subtítulo, maior elemento da tela, pintava em 744 ms contra 196 ms do
      // primeiro texto. Mesma regra do hero (ver Reveal `imediato`).
      reveal={headingLevel !== 'h1'}
      subtitle={content.text}
      tone="surface"
    >
      <ol className={styles.steps}>
        {(content.steps ?? []).map((step, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: itens de conteúdo não têm id estável; o índice apenas desempata títulos repetidos.
          <li key={`${step.title}-${index}`} className={styles.step}>
            <span className={styles.stepNumber}>{index + 1}</span>
            <div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepText}>{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <Button href={content.ctaHref ?? navigation.ctaHref} size="lg">
        {content.ctaLabel ?? navigation.ctaLabel}
      </Button>
    </Section>
  );
}
