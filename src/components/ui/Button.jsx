import Link from 'next/link';
import styles from './button.module.css';

/**
 * Botão/CTA do molde. Aceita href (vira link) ou onClick.
 * A aparência vem dos tokens de tema — nunca de cores literais na seção.
 */
export default function Button({
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}) {
  const classes =
    `${styles.button} ${styles[variant]} ${styles[size]} ${className}`.trim();

  if (!href) {
    return (
      <button type="button" className={classes} {...rest}>
        {children}
      </button>
    );
  }

  const isExternal = /^(https?:|mailto:|tel:)/.test(href);
  if (isExternal || href.startsWith('#')) {
    return (
      <a className={classes} href={href} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <Link className={classes} href={href} {...rest}>
      {children}
    </Link>
  );
}
