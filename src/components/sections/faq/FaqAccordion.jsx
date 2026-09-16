'use client';

import { useState } from 'react';
import Section from '@/components/ui/Section';
import styles from './faq.module.css';

/** Variante acordeão: uma pergunta expandida por vez, controlada por botões. */
export default function FaqAccordion({ id, content = {} }) {
  const { title, subtitle, items = [] } = content;
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <Section id={id} title={title} subtitle={subtitle}>
      <div className={styles.accordion}>
        {items.map((item, index) => {
          const isOpen = index === openIndex;
          const panelId = `${id}-panel-${index}`;
          const buttonId = `${id}-button-${index}`;

          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: perguntas não têm identificador estável
            <div key={index} className={styles.item}>
              <h3 className={styles.itemHeading}>
                <button
                  id={buttonId}
                  type="button"
                  className={styles.trigger}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                >
                  <span>{item.question}</span>
                  <span className={styles.icon} aria-hidden="true">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
              </h3>
              {isOpen && (
                /* div em vez de section: evita criar um landmark por pergunta. */
                <div id={panelId} className={styles.panel}>
                  <p>{item.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
