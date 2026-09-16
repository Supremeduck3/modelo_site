import Section from '@/components/ui/Section';
import TestimonialAuthor from './TestimonialAuthor';
import styles from './testimonials.module.css';

/** Variante com um único depoimento em destaque. */
export default function TestimonialsSingle({ id, content = {} }) {
  const { title, subtitle, items = [] } = content;
  const item = items[0];

  if (!item) {
    return <Section id={id} title={title} subtitle={subtitle} />;
  }

  return (
    <Section id={id} title={title} subtitle={subtitle} align="center">
      <blockquote className={styles.single}>
        <p className={styles.singleQuote}>&ldquo;{item.quote}&rdquo;</p>
        <TestimonialAuthor
          author={item.author}
          role={item.role}
          avatar={item.avatar}
        />
      </blockquote>
    </Section>
  );
}
