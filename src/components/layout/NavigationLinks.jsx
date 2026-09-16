import Link from 'next/link';
import styles from './navigation-links.module.css';

/** Lista de links da navegação; itens vêm sempre da configuração. */
export default function NavigationLinks({
  items,
  direction = 'row',
  onNavigate,
}) {
  return (
    <ul className={`${styles.list} ${styles[direction]}`}>
      {items.map((item) => {
        const isAnchor =
          item.href?.startsWith('#') || /^https?:/.test(item.href);
        return (
          <li key={`${item.label}-${item.href}`}>
            {isAnchor ? (
              <a className={styles.link} href={item.href} onClick={onNavigate}>
                {item.label}
              </a>
            ) : (
              <Link
                className={styles.link}
                href={item.href}
                onClick={onNavigate}
              >
                {item.label}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
