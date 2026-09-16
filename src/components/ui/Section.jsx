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
  tone = 'default',
  align = 'left',
  fullWidth = false,
  className = '',
  children,
}) {
  const body = (
    <>
      {(eyebrow || title || subtitle) && (
        <header className={`${styles.header} ${styles[align]}`}>
          {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
          {title && <h2 className={styles.title}>{title}</h2>}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </header>
      )}
      {children}
    </>
  );

  return (
    <section
      id={id}
      className={`${styles.section} ${styles[tone]} ${className}`.trim()}
    >
      {fullWidth ? body : <Container>{body}</Container>}
    </section>
  );
}
