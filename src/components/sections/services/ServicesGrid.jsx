import Media from '@/components/ui/Media';
import Section from '@/components/ui/Section';
import styles from './services.module.css';

/** Variante em grade com imagem por item. */
export default function ServicesGrid({ id, content = {} }) {
  const { title, subtitle, items = [] } = content;

  if (items.length === 0) {
    return <Section id={id} title={title} subtitle={subtitle} />;
  }

  return (
    <Section id={id} title={title} subtitle={subtitle} align="center">
      <div className={styles.grid}>
        {items.map((item) => (
          <article key={item.title} className={styles.gridItem}>
            <Media
              src={item.image}
              alt={item.title || ''}
              ratio="16 / 10"
              className={styles.gridImage}
            />
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
