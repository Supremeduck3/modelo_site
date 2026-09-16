import Container from './Container';
import styles from './legal-page.module.css';

/**
 * Casca das páginas legais. O texto é sempre fornecido pela implantação —
 * o molde nunca inventa conteúdo jurídico.
 */
export default function LegalPage({ title, content, fallback }) {
  return (
    <article className={styles.page}>
      <Container>
        <h1 className={styles.title}>{title}</h1>
        {content ? (
          <div className={styles.body}>
            {content.split('\n\n').map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
          </div>
        ) : (
          <p className={styles.pending}>{fallback}</p>
        )}
      </Container>
    </article>
  );
}
