import Media from '@/components/ui/Media';
import Section from '@/components/ui/Section';
import styles from './services.module.css';

/** Variante em grade com imagem por item. */
export default function ServicesGrid({ id, content = {} }) {
  const { title, subtitle, items = [] } = content;

  return (
    <Section id={id} title={title} subtitle={subtitle} align="center">
      <div className={styles.grid}>
        {items.map((item, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: itens de conteúdo não têm id estável; o índice apenas desempata títulos repetidos.
          <article key={`${item.title}-${index}`} className={styles.gridItem}>
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
