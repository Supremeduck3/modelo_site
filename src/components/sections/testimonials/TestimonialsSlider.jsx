'use client';

import { useState } from 'react';
import Section from '@/components/ui/Section';
import TestimonialAuthor from './TestimonialAuthor';
import styles from './testimonials.module.css';

/** Variante em slider: um depoimento por vez, navegável por botões e teclado. */
export default function TestimonialsSlider({ id, content = {} }) {
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
        className={styles.slider}
        aria-roledescription="carrossel de depoimentos"
        aria-label={title || 'Depoimentos'}
        onKeyDown={handleKeyDown}
      >
        <button
          type="button"
          className={styles.sliderControl}
          onClick={() => goTo(safeIndex - 1)}
          aria-label="Depoimento anterior"
        >
          ‹
        </button>

        <blockquote className={styles.single}>
          <p className={styles.singleQuote}>&ldquo;{active.quote}&rdquo;</p>
          <TestimonialAuthor
            author={active.author}
            role={active.role}
            avatar={active.avatar}
          />
        </blockquote>

        <button
          type="button"
          className={styles.sliderControl}
          onClick={() => goTo(safeIndex + 1)}
          aria-label="Próximo depoimento"
        >
          ›
        </button>
      </section>

      <div className={styles.dots}>
        {items.map((item, index) => (
          <button
            key={item.author ?? index}
            type="button"
            className={`${styles.dot} ${
              index === safeIndex ? styles.dotActive : ''
            }`}
            aria-label={`Ir para depoimento ${index + 1}`}
            aria-current={index === safeIndex}
            onClick={() => goTo(index)}
          />
        ))}
      </div>
    </Section>
  );
}
