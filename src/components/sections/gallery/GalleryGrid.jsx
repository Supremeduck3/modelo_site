import Media from '@/components/ui/Media';
import Section from '@/components/ui/Section';
import styles from './gallery.module.css';

/** Variante em grade uniforme. */
export default function GalleryGrid({ id, content = {} }) {
  const { title, subtitle, items = [] } = content;

  if (items.length === 0) {
    return <Section id={id} title={title} subtitle={subtitle} />;
  }

  return (
    <Section id={id} title={title} subtitle={subtitle} align="center">
      <div className={styles.grid}>
        {items.map((item, index) => (
          <figure key={item.src ?? index} className={styles.gridItem}>
            <Media src={item.src} alt={item.alt ?? ''} ratio="1 / 1" />
            {item.caption && (
              <figcaption className={styles.caption}>{item.caption}</figcaption>
            )}
          </figure>
        ))}
      </div>
    </Section>
  );
}
