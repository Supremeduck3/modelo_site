import Container from '@/components/ui/Container';
import { features, siteConfig } from '@/config/site';
import styles from './site-footer.module.css';

/** Rodapé institucional: contatos, navegação secundária e páginas legais. */
export default function SiteFooter() {
  const { identity, contact, navigation } = siteConfig;
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <Container className={styles.inner}>
        <div className={styles.about}>
          <p className={styles.name}>{identity.name}</p>
          {identity.tagline && (
            <p className={styles.muted}>{identity.tagline}</p>
          )}
          {contact.address && (
            <p className={styles.muted}>
              {contact.address}
              {contact.city && ` — ${contact.city}`}
              {contact.state && `/${contact.state}`}
            </p>
          )}
        </div>

        <nav className={styles.column} aria-label="Navegação do rodapé">
          <p className={styles.columnTitle}>Navegação</p>
          <ul className={styles.list}>
            {navigation.items.map((item) => (
              <li key={`footer-${item.href}`}>
                <a className={styles.link} href={item.href}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.column}>
          <p className={styles.columnTitle}>Contato</p>
          <ul className={styles.list}>
            {contact.phone && (
              <li>
                <a
                  className={styles.link}
                  href={`tel:${contact.phone.replace(/\D/g, '')}`}
                >
                  {contact.phone}
                </a>
              </li>
            )}
            {contact.email && (
              <li>
                <a className={styles.link} href={`mailto:${contact.email}`}>
                  {contact.email}
                </a>
              </li>
            )}
            {contact.socials?.map((social) => (
              <li key={social.href}>
                <a
                  className={styles.link}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.column}>
          <p className={styles.columnTitle}>Institucional</p>
          <ul className={styles.list}>
            <li>
              <a className={styles.link} href="/privacidade">
                Política de privacidade
              </a>
            </li>
            <li>
              <a className={styles.link} href="/termos">
                Termos de uso
              </a>
            </li>
            {features.submissions && (
              <li>
                <a className={styles.link} href="/manifestacao">
                  Canal de manifestações
                </a>
              </li>
            )}
          </ul>
        </div>
      </Container>

      <Container>
        <p className={styles.legal}>
          © {year} {identity.name}. Todos os direitos reservados.
        </p>
      </Container>
    </footer>
  );
}
