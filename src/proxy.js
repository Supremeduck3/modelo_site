import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth/cookie';
import {
  ACCEPT_INVITE_PATH,
  FORGOT_PASSWORD_PATH,
  LOGIN_PATH,
  RESET_PASSWORD_PATH,
} from '@/lib/auth/next-path';

/**
 * Atalho de navegação do painel: quem chega sem cookie de sessão vai direto ao
 * login, com `?next=` para voltar ao que tentou abrir.
 *
 * **Não é o controle de acesso.** Aqui só se olha a presença do cookie, nunca a
 * assinatura: validar exigiria o segredo no runtime edge e ainda assim não
 * diria se a conta segue ativa. Quem autoriza é `requireSessionUser()`, no
 * servidor, a cada página e rota do painel — um cookie forjado passa por este
 * middleware e é recusado lá.
 */
export default function proxy(request) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const url = request.nextUrl.clone();
  const next = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  url.pathname = LOGIN_PATH;
  url.search = '';
  url.searchParams.set('next', next);

  return NextResponse.redirect(url);
}

export const config = {
  // Tudo sob /painel menos as telas de acesso, que não podem exigir sessão:
  // login, as duas etapas da recuperação de senha e o aceite de convite —
  // quem foi convidado ainda não tem conta ativa para logar. Mandar essa gente
  // para o login seria um laço.
  //
  // O matcher precisa ser literal: o Next o lê em tempo de build e não resolve
  // variáveis. As constantes ao lado existem para que uma renomeação de rota
  // quebre o build aqui, em vez de silenciosamente deixar a página protegida.
  matcher: [
    '/painel',
    '/painel/((?!login(?:/|$)|esqueci-senha(?:/|$)|redefinir-senha(?:/|$)|convite(?:/|$)).*)',
  ],
};

// Se algum destes caminhos mudar, o matcher acima precisa mudar junto.
const PUBLIC_PANEL_PATHS = [
  LOGIN_PATH,
  FORGOT_PASSWORD_PATH,
  RESET_PASSWORD_PATH,
  ACCEPT_INVITE_PATH,
];

for (const path of PUBLIC_PANEL_PATHS) {
  const slug = path.replace('/painel/', '');
  if (!config.matcher[1].includes(`${slug}(?:/|$)`)) {
    throw new Error(
      `A rota pública "${path}" não está isenta no matcher do proxy do painel.`,
    );
  }
}
