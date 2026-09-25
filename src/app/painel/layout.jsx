import { siteConfig } from '@/config/site';
import styles from './painel.module.css';

/**
 * Ambiente privado. Nada do site público entra aqui, e o inverso também vale.
 *
 * A guarda de sessão não fica neste layout porque `/painel/login` também está
 * abaixo dele: quem exige sessão é o layout do grupo `(interno)`.
 *
 * O tema do Ant Design também não fica aqui, pelo mesmo motivo invertido: as
 * quatro telas públicas de acesso (entrar, esqueci a senha, redefinir, ativar
 * convite) estão abaixo deste layout, e um provider aqui obrigava cada uma
 * delas a baixar o runtime do antd — ~220 KB de JavaScript para desenhar campo,
 * aviso e botão. Ele desceu para `(interno)`, que é quem usa a biblioteca de
 * fato; as telas de acesso usam os controles de `components/auth`.
 */
export const metadata = {
  title: `Painel — ${siteConfig.identity.name}`,
  // Ambiente privado não entra em índice de busca nem em cache de buscador.
  robots: { index: false, follow: false, nocache: true },
};

export default function PanelLayout({ children }) {
  return <div className={styles.root}>{children}</div>;
}
