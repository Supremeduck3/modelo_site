import styles from './icon.module.css';

/**
 * Ícone de um item de conteúdo. A configuração informa texto/emoji.
 *
 * Sem ícone configurado não desenhamos marcador nenhum: uma fileira de caixas
 * vazias custa mais à composição do que a ausência do ícone, e o título já
 * ancora o item.
 */
export default function Icon({ icon, className = '' }) {
  if (typeof icon === 'string' && icon.trim()) {
    return (
      <span className={`${styles.icon} ${className}`.trim()} aria-hidden="true">
        {icon}
      </span>
    );
  }

  return null;
}
