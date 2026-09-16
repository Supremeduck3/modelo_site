import styles from './container.module.css';

/** Largura máxima e gutters do molde, controlados por token de tema. */
export default function Container({
  as: Tag = 'div',
  className = '',
  children,
}) {
  return (
    <Tag className={`${styles.container} ${className}`.trim()}>{children}</Tag>
  );
}
