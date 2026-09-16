import AcceptInviteForm from '@/components/painel/AcceptInviteForm';
import { siteConfig } from '@/config/site';
import { peekInvite } from '@/server/modules/team/service';
import styles from '../login/page.module.css';

export const metadata = {
  title: `Ativar acesso — ${siteConfig.identity.name}`,
  robots: { index: false, follow: false, nocache: true },
};

/** O token vem na URL: nunca pode ser pré-renderizada. */
export const dynamic = 'force-dynamic';

/**
 * Aceite do convite.
 *
 * A página só consulta o convite para saber se ainda vale e de quem é; quem
 * decide de fato é a API, que confere hash, prazo e uso único ao gravar a
 * senha.
 */
export default async function ConvitePage({ searchParams }) {
  const params = await searchParams;
  const token = typeof params?.token === 'string' ? params.token : '';
  const invite = token ? await peekInvite(token) : null;

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>{siteConfig.identity.name}</p>
          <h1 className={styles.title}>Ativar acesso ao painel</h1>
          <p className={styles.subtitle}>
            Defina sua senha para entrar no painel da empresa.
          </p>
        </header>

        <AcceptInviteForm token={token} invite={invite} />
      </div>
    </main>
  );
}
