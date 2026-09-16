import ForgotPasswordForm from '@/components/painel/ForgotPasswordForm';
import { siteConfig } from '@/config/site';
import styles from '../login/page.module.css';

export const metadata = {
  title: `Recuperar acesso — ${siteConfig.identity.name}`,
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Pedido de recuperação de senha.
 *
 * Diferente do login, esta página não redireciona quem já está autenticado:
 * pedir o link com uma sessão aberta é legítimo — por exemplo, quem está no
 * painel e não lembra a senha para confirmar uma ação.
 */
export default function EsqueciSenhaPage() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>{siteConfig.identity.name}</p>
          <h1 className={styles.title}>Recuperar acesso</h1>
          <p className={styles.subtitle}>
            Informe o e-mail cadastrado no painel. Enviaremos um link para você
            definir uma nova senha.
          </p>
        </header>

        <ForgotPasswordForm />
      </div>
    </main>
  );
}
