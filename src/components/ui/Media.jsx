import styles from './media.module.css';

/**
 * Imagem configurável com fallback seguro: quando a implantação ainda não
 * definiu a mídia, mostramos um placeholder neutro em vez de quebrar o layout.
 */
export default function Media({
  src,
  alt = '',
  ratio = null,
  className = '',
  /**
   * Imagem acima da dobra (hero, primeira seção).
   *
   * `loading="lazy"` numa imagem já visível atrasa a maior pintura da página:
   * o navegador só começa a baixá-la depois do layout. Para essas, carregamento
   * ansioso e prioridade alta; para o resto, preguiçoso, que é o padrão.
   */
  priority = false,
}) {
  // Sem proporção declarada, quem manda é a direção de arte da implantação.
  const aspectRatio = ratio ?? 'var(--image-ratio)';
  if (!src) {
    return (
      <div
        className={`${styles.placeholder} ${className}`.trim()}
        style={{ aspectRatio }}
        role="img"
        aria-label={alt || 'Imagem não configurada'}
      />
    );
  }

  return (
    // biome-ignore lint/performance/noImgElement: a mídia vem de URLs arbitrárias da implantação.
    <img
      className={`${styles.image} ${className}`.trim()}
      style={{ aspectRatio }}
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      // Decodificar fora da thread principal evita travar a rolagem em imagem
      // grande.
      decoding="async"
    />
  );
}
