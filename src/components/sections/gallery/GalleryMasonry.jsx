import Media from '@/components/ui/Media';
import Section from '@/components/ui/Section';
import styles from './gallery.module.css';

/** Variante em colunas estilo masonry (CSS columns, sem libs). */
export default function GalleryMasonry({ id, content = {} }) {
  const { title, subtitle, items = [] } = content;

  if (items.length === 0) {
    return <Section id={id} title={title} subtitle={subtitle} />;
  }

  return (
    <Section id={id} title={title} subtitle={subtitle} align="center">
      <div className={styles.masonry}>
        {items.map((item, index) => (
          <figure key={item.src ?? index} className={styles.masonryItem}>
            <Media src={item.src} alt={item.alt ?? ''} ratio="auto" />
            {item.caption && (
              <figcaption className={styles.caption}>{item.caption}</figcaption>
            )}
          </figure>
        ))}
      </div>
    </Section>
  );
}
