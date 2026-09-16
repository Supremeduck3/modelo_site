import Container from './Container';
import styles from './section.module.css';

/**
 * Casca comum de toda seção da home: id de âncora, espaçamento vertical,
 * fundo alternável e cabeçalho opcional. As variantes cuidam só do miolo.
 */
export default function Section({
  id,
  title,
  subtitle,
  eyebrow,
  headingLevel = 'h2',
  tone = 'default',
  align = 'left',
  fullWidth = false,
  className = '',
  children,
}) {
  const Heading = headingLevel;
  const body = (
    <>
      {(eyebrow || title || subtitle) && (
        <header className={`${styles.header} ${styles[align] ?? ''}`.trim()}>
          {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
          {title && <Heading className={styles.title}>{title}</Heading>}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </header>
      )}
      {children}
    </>
  );

  return (
    <section
      id={id}
      className={`${styles.section} ${styles[tone] ?? styles.default} ${className}`.trim()}
    >
      {fullWidth ? body : <Container>{body}</Container>}
    </section>
  );
}
