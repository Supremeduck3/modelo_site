import Section from '@/components/ui/Section';
import TestimonialAuthor from './TestimonialAuthor';
import styles from './testimonials.module.css';

/** Variante em cartões dispostos em grade. */
export default function TestimonialsCards({ id, content = {} }) {
  const { title, subtitle, items = [] } = content;

  if (items.length === 0) {
    return <Section id={id} title={title} subtitle={subtitle} />;
  }

  return (
    <Section id={id} title={title} subtitle={subtitle} align="center">
      <div className={styles.cardsGrid}>
        {items.map((item) => (
          <blockquote key={item.author ?? item.quote} className={styles.card}>
            <p className={styles.quote}>&ldquo;{item.quote}&rdquo;</p>
            <TestimonialAuthor
              author={item.author}
              role={item.role}
              avatar={item.avatar}
            />
          </blockquote>
        ))}
      </div>
    </Section>
  );
}
