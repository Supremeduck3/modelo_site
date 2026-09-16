import Icon from '@/components/ui/Icon';
import Section from '@/components/ui/Section';
import styles from './services.module.css';

/** Variante em cartões com ícone, título e descrição. */
export default function ServicesCards({ id, content = {} }) {
  const { title, subtitle, items = [] } = content;

  return (
    <Section id={id} title={title} subtitle={subtitle} align="center">
      <div className={styles.cardsGrid}>
        {items.map((item, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: itens de conteúdo não têm id estável; o índice apenas desempata títulos repetidos.
          <article key={`${item.title}-${index}`} className={styles.card}>
            <Icon icon={item.icon} />
            <h3 className={styles.cardTitle}>{item.title}</h3>
            {item.description && (
              <p className={styles.cardDescription}>{item.description}</p>
            )}
          </article>
        ))}
      </div>
    </Section>
  );
}
