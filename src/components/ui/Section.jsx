import Container from './Container';
import Reveal from './Reveal';
import styles from './section.module.css';

const TONE_CLASS = {
  default: styles.default,
  surface: styles.surface,
  accent: styles.accent,
  contrast: styles.contrast,
};

/**
 * Casca comum de toda seção da home: id de âncora, espaçamento vertical,
 * fundo, cabeçalho e entrada em cena. As variantes cuidam só do miolo.
 *
 * `aside` existe para o cabeçalho poder ser assimétrico — título à esquerda,
 * apoio ou CTA à direita — sem que cada variante remonte um grid próprio.
 */
export default function Section({
  id,
  title,
  subtitle,
  eyebrow,
  aside,
  headingLevel = 'h2',
  tone = 'default',
  align = 'left',
  fullWidth = false,
  reveal = true,
  className = '',
  children,
}) {
  const Heading = headingLevel;
  const hasHeader = Boolean(eyebrow || title || subtitle || aside);

  const headerBlock = hasHeader && (
    <header
      className={`${styles.header} ${styles[align] ?? ''} ${aside ? styles.withAside : ''}`.trim()}
    >
      <div className={styles.headerMain}>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        {title && <Heading className={styles.title}>{title}</Heading>}
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {aside && <div className={styles.headerAside}>{aside}</div>}
    </header>
  );

  const body = (
    <>
      {headerBlock}
      {children}
    </>
  );

  const content = reveal ? <Reveal>{body}</Reveal> : body;

  return (
    <section
      id={id}
      className={[
        styles.section,
        TONE_CLASS[tone] ?? styles.default,
        // A alternância de fundo da home é decidida pela posição (globals.css)
        // e só vale para quem não pediu um tom explícito.
        tone === 'default' ? 'section-rhythm' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {fullWidth ? content : <Container>{content}</Container>}
    </section>
  );
}
