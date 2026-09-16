import styles from './icon.module.css';

/**
 * Ícone de um item de conteúdo. A configuração informa texto/emoji; qualquer
 * outro valor cai em um marcador neutro, para nunca quebrar o layout.
 */
export default function Icon({ icon, className = '' }) {
  if (typeof icon === 'string' && icon.trim()) {
    return (
      <span className={`${styles.icon} ${className}`.trim()} aria-hidden="true">
        {icon}
      </span>
    );
  }

  return (
    <span
      className={`${styles.fallback} ${className}`.trim()}
      aria-hidden="true"
    />
  );
}
