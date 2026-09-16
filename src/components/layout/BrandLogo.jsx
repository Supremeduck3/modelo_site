import Link from 'next/link';
import styles from './brand-logo.module.css';

/** Logo da implantação com fallback textual quando nenhuma imagem é configurada. */
export default function BrandLogo({ identity, href = '/' }) {
  return (
    <Link className={styles.brand} href={href} aria-label={identity.name}>
      {identity.logo ? (
        // biome-ignore lint/performance/noImgElement: logo vem de URL configurável da implantação.
        <img className={styles.logo} src={identity.logo} alt={identity.name} />
      ) : (
        <span className={styles.wordmark}>
          {identity.shortName || identity.name}
        </span>
      )}
    </Link>
  );
}
