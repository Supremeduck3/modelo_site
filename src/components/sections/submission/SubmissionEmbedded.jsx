import Button from '@/components/ui/Button';
import Section from '@/components/ui/Section';
import { siteConfig } from '@/config/site';
import styles from './submission.module.css';

/**
 * Bloco explicativo do canal incorporado à home.
 * O formulário em si chega na fase 3 (bloco 2) e será reaproveitado aqui.
 */
const STEPS = [
  {
    title: 'Você registra',
    text: 'Escolha o tipo, descreva o ocorrido e informe um contato.',
  },
  {
    title: 'Geramos um protocolo',
    text: 'O número identifica sua manifestação e permite acompanhamento.',
  },
  {
    title: 'A equipe responde',
    text: 'A empresa analisa, classifica e retorna pelo canal informado.',
  },
];

export default function SubmissionEmbedded({ id, content }) {
  const { navigation } = siteConfig;

  return (
    <Section
      id={id}
      title={content.title ?? 'Canal de manifestações'}
      subtitle={content.text}
      tone="surface"
    >
      <ol className={styles.steps}>
        {(content.steps ?? STEPS).map((step, index) => (
          <li key={step.title} className={styles.step}>
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
