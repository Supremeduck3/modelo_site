'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Revela o conteúdo quando ele entra na viewport.
 *
 * É o único lugar do molde que observa scroll: seções e variantes só declaram
 * que querem entrar em cena, sem cada uma repetir observer e estado. O estado
 * inicial está em globals.css e a preferência por menos movimento vence lá,
 * então aqui não há verificação de mídia duplicada.
 */
export default function Reveal({
  as: Tag = 'div',
  className = '',
  delay = 0,
  children,
  ...rest
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return undefined;

    // Ambiente sem IntersectionObserver não pode ficar com a seção invisível.
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      // Antecipa um pouco a entrada para o movimento terminar antes de o bloco
      // chegar ao centro da tela.
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <Tag
      ref={ref}
      className={className}
      data-reveal={visible ? 'visible' : 'hidden'}
      style={delay ? { '--reveal-delay': `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
