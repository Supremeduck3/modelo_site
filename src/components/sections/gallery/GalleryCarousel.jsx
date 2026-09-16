'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Media from '@/components/ui/Media';
import Section from '@/components/ui/Section';
import styles from './gallery.module.css';

/**
 * Variante carrossel: trilho com rolagem nativa e encaixe por imagem.
 *
 * A rolagem é do próprio navegador, não um índice trocando a imagem no lugar.
 * Isso entrega de graça o que um carrossel controlado por estado não tem:
 * arrastar com o dedo, inércia, rolagem por trackpad e a próxima imagem
 * espiando na lateral — que é o que faz o visitante perceber que há mais fotos.
 * Botões, bolinhas e setas do teclado continuam funcionando para quem não
 * arrasta.
 */
export default function GalleryCarousel({ id, content = {} }) {
  const { title, subtitle, items = [] } = content;
  const trackRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  /* Quem manda no índice é a posição do trilho: arrastar, clicar e usar o
     teclado convergem para a mesma fonte de verdade. */
  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          setActiveIndex(Number(visible.target.dataset.index));
        }
      },
      { root: track, threshold: 0.6 },
    );

    for (const slide of track.children) observer.observe(slide);
    return () => observer.disconnect();
  }, []);

  const goTo = useCallback(
    (index) => {
      const track = trackRef.current;
      if (!track) return;

      const target = (index + items.length) % items.length;
      const slide = track.children[target];
      if (!slide) return;

      // Centralizar o slide no trilho em vez de usar scrollIntoView, que
      // arrastaria a página inteira junto.
      const left =
        slide.offsetLeft - (track.clientWidth - slide.clientWidth) / 2;
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;

      track.scrollTo({
        left,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    },
    [items.length],
  );

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(activeIndex + 1);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(activeIndex - 1);
    }
  };

  return (
    // Os controles vão para o `aside` do cabeçalho: título à esquerda, setas
    // à direita, na mesma linha de base — em vez de setas ladeando a imagem.
    <Section
      id={id}
      title={title}
      subtitle={subtitle}
      aside={
        <div className={styles.carouselControls}>
          <button
            type="button"
            className={styles.carouselControl}
            onClick={() => goTo(activeIndex - 1)}
            aria-label="Imagem anterior"
          >
            ‹
          </button>
          <button
            type="button"
            className={styles.carouselControl}
            onClick={() => goTo(activeIndex + 1)}
            aria-label="Próxima imagem"
          >
            ›
          </button>
        </div>
      }
    >
      {/* <section> nomeada vira uma região: quem navega por teclado alcança o
          trilho, e daí as setas percorrem as imagens. */}
      <section
        ref={trackRef}
        className={styles.carouselTrack}
        aria-roledescription="carrossel"
        aria-label={title || 'Galeria de imagens'}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: região rolável precisa ser alcançável pelo teclado (WCAG 2.1.1); sem foco, as setas não chegam ao trilho.
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {items.map((item, index) => (
          <figure
            key={item.src ?? index}
            className={styles.carouselSlide}
            data-index={index}
            aria-label={`Imagem ${index + 1} de ${items.length}`}
          >
            <Media src={item.src} alt={item.alt ?? ''} ratio="16 / 9" />
            {item.caption && (
              <figcaption className={styles.caption}>{item.caption}</figcaption>
            )}
          </figure>
        ))}
      </section>

      <div className={styles.dots}>
        {items.map((item, index) => (
          <button
            key={item.src ?? index}
            type="button"
            className={`${styles.dot} ${
              index === activeIndex ? styles.dotActive : ''
            }`}
            aria-label={`Ir para imagem ${index + 1}`}
            aria-current={index === activeIndex}
            onClick={() => goTo(index)}
          />
        ))}
      </div>
    </Section>
  );
}
