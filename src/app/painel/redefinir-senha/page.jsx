import ResetPasswordForm from '@/components/painel/ResetPasswordForm';
import { siteConfig } from '@/config/site';
import styles from '../login/page.module.css';

export const metadata = {
  title: `Definir nova senha — ${siteConfig.identity.name}`,
  robots: { index: false, follow: false, nocache: true },
};

/** O token vem na URL, então a página nunca pode ser pré-renderizada. */
export const dynamic = 'force-dynamic';

/**
 * Definição da nova senha.
 *
 * A página só repassa o token adiante: quem decide se ele vale é a API, que
 * confere hash, prazo e uso único no banco.
 */
export default async function RedefinirSenhaPage({ searchParams }) {
  const params = await searchParams;
  const token = typeof params?.token === 'string' ? params.token : '';

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>{siteConfig.identity.name}</p>
          <h1 className={styles.title}>Definir nova senha</h1>
          <p className={styles.subtitle}>
            Escolha uma senha nova para entrar no painel.
          </p>
        </header>

        <ResetPasswordForm token={token} />
      </div>
    </main>
  );
}
