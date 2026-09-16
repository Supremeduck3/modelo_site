import styles from './media.module.css';

/**
 * Imagem configurável com fallback seguro: quando a implantação ainda não
 * definiu a mídia, mostramos um placeholder neutro em vez de quebrar o layout.
 */
export default function Media({
  src,
  alt = '',
  ratio = '4 / 3',
  className = '',
}) {
  if (!src) {
    return (
      <div
        className={`${styles.placeholder} ${className}`.trim()}
        style={{ aspectRatio: ratio }}
        role="img"
        aria-label={alt || 'Imagem não configurada'}
      />
    );
  }

  return (
    // biome-ignore lint/performance/noImgElement: a mídia vem de URLs arbitrárias da implantação.
    <img
      className={`${styles.image} ${className}`.trim()}
      style={{ aspectRatio: ratio }}
      src={src}
      alt={alt}
      loading="lazy"
    />
  );
}
