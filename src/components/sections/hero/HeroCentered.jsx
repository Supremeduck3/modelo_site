import Container from '@/components/ui/Container';
import Reveal from '@/components/ui/Reveal';
import HeroContent from './HeroContent';
import styles from './hero.module.css';

/**
 * Texto centralizado em medida estreita — bom para negócios com pouca
 * fotografia, onde a tipografia precisa carregar a dobra sozinha.
 *
 * `content.highlights` (opcional) vira a linha de apoio sob o filete: números,
 * credenciais ou praças de atendimento.
 */
export default function HeroCentered({ id, content = {} }) {
  const highlights = content.highlights ?? [];

  return (
    <section id={id} className={styles.centeredSection}>
      <Container>
        <HeroContent content={content} align="center" />
        <Reveal delay={260}>
          <div className={styles.centeredRule} />
          {highlights.length > 0 && (
            <ul className={styles.centeredMeta}>
              {highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </Reveal>
      </Container>
    </section>
  );
}
