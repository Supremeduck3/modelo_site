import styles from './services.module.css';

/** Renderiza o ícone de um item: texto/emoji configurado ou marcador neutro. */
export default function ServiceIcon({ icon }) {
  if (typeof icon === 'string' && icon.trim()) {
    return (
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
    );
  }

  return <span className={styles.iconFallback} aria-hidden="true" />;
}
