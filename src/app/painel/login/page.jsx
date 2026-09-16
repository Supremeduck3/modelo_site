import { redirect } from 'next/navigation';
import LoginForm from '@/components/painel/LoginForm';
import { siteConfig } from '@/config/site';
import { safeNextPath } from '@/lib/auth/next-path';
import { getSessionUser } from '@/server/modules/auth/session';
import styles from './page.module.css';

export const metadata = {
  title: `Entrar no painel — ${siteConfig.identity.name}`,
  robots: { index: false, follow: false, nocache: true },
};

/** Depende do cookie de sessão: nunca pode ser pré-renderizada. */
export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const nextPath = safeNextPath(params?.next);

  // Quem já está autenticado não vê o formulário.
  const user = await getSessionUser();
  if (user) redirect(nextPath);

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>{siteConfig.identity.name}</p>
          <h1 className={styles.title}>Painel da empresa</h1>
          <p className={styles.subtitle}>
            Acesso restrito à equipe. Use o e-mail cadastrado pelo responsável.
          </p>
        </header>

        <LoginForm nextPath={nextPath} />
      </div>
    </main>
  );
}
