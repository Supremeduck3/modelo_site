'use client';

import { useState } from 'react';
import Media from '@/components/ui/Media';
import Section from '@/components/ui/Section';
import styles from './gallery.module.css';

/** Variante carrossel: um item por vez, navegável por botões e teclado. */
export default function GalleryCarousel({ id, content = {} }) {
  const { title, subtitle, items = [] } = content;
  const [activeIndex, setActiveIndex] = useState(0);

  const goTo = (index) => {
    setActiveIndex((index + items.length) % items.length);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowRight') goTo(activeIndex + 1);
    if (event.key === 'ArrowLeft') goTo(activeIndex - 1);
  };

  // Se a configuração encolher a lista, o índice guardado pode sair do intervalo.
  const safeIndex = Math.min(activeIndex, items.length - 1);
  const active = items[safeIndex];

  return (
    <Section id={id} title={title} subtitle={subtitle} align="center">
      <section
        className={styles.carousel}
        aria-roledescription="carrossel"
        aria-label={title || 'Galeria de imagens'}
        onKeyDown={handleKeyDown}
      >
        <button
          type="button"
          className={styles.carouselControl}
          onClick={() => goTo(safeIndex - 1)}
          aria-label="Imagem anterior"
        >
          ‹
        </button>

        <figure className={styles.carouselSlide} aria-live="polite">
          <Media src={active.src} alt={active.alt ?? ''} ratio="16 / 9" />
          {active.caption && (
            <figcaption className={styles.caption}>{active.caption}</figcaption>
          )}
        </figure>

        <button
          type="button"
          className={styles.carouselControl}
          onClick={() => goTo(safeIndex + 1)}
          aria-label="Próxima imagem"
        >
          ›
        </button>
      </section>

      <div className={styles.dots}>
        {items.map((item, index) => (
          <button
            key={item.src ?? index}
            type="button"
            className={`${styles.dot} ${
              index === safeIndex ? styles.dotActive : ''
            }`}
            aria-label={`Ir para imagem ${index + 1}`}
            aria-current={index === safeIndex}
            onClick={() => goTo(index)}
          />
        ))}
      </div>
    </Section>
  );
}
