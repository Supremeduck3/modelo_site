import Media from '@/components/ui/Media';
import Section from '@/components/ui/Section';
import styles from './services.module.css';

/** Variante alternando imagem/texto por item, empilhando em mobile. */
export default function ServicesImageText({ id, content = {} }) {
  const { title, subtitle, items = [] } = content;

  if (items.length === 0) {
    return <Section id={id} title={title} subtitle={subtitle} />;
  }

  return (
    <Section id={id} title={title} subtitle={subtitle}>
      <div className={styles.imageTextList}>
        {items.map((item, index) => (
          <article
            key={item.title}
            className={`${styles.imageTextRow} ${
              index % 2 === 1 ? styles.reversed : ''
            }`}
          >
            <Media
              src={item.image}
              alt={item.title || ''}
              className={styles.gridImage}
            />
            <div>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              {item.description && (
                <p className={styles.cardDescription}>{item.description}</p>
              )}
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
