'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Revela o conteúdo quando ele entra na viewport.
 *
 * É o único lugar do molde que observa scroll: seções e variantes só declaram
 * que querem entrar em cena, sem cada uma repetir observer e estado. O estado
 * inicial está em globals.css e a preferência por menos movimento vence lá,
 * então aqui não há verificação de mídia duplicada.
 *
 * `imediato` é para o que já está na dobra, e existe por medição: o conteúdo
 * nasce em opacidade 0 e só aparece depois de hidratar, observar e animar.
 * Enquanto o hero passava por isso, o título da home — o maior elemento da
 * página, que é o que o LCP mede — pintava em 772 ms, contra 164 ms do
 * primeiro texto. Animar o que o visitante já está olhando não premia
 * rolagem nenhuma; só atrasa a leitura.
 */
export default function Reveal({
  as: Tag = 'div',
  className = '',
  delay = 0,
  imediato = false,
  children,
  ...rest
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(imediato);

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
