import Section from '@/components/ui/Section';
import styles from './about.module.css';

/** Variante com texto de destaque e uma grade de estatísticas. */
export default function AboutStats({ id, content = {} }) {
  const { title, subtitle, text, stats = [] } = content;

  return (
    <Section id={id} title={title} subtitle={subtitle}>
      {text && <p className={styles.text}>{text}</p>}
      {stats.length > 0 && (
        <dl className={styles.statsGrid}>
          {stats.map((stat, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: itens de conteúdo não têm id estável; o índice apenas desempata títulos repetidos.
            <div key={`${stat.label}-${index}`} className={styles.statItem}>
              <dt className={styles.statValue}>{stat.value}</dt>
              <dd className={styles.statLabel}>{stat.label}</dd>
            </div>
          ))}
        </dl>
      )}
    </Section>
  );
}
