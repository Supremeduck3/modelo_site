import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth/cookie';
import { LOGIN_PATH } from '@/lib/auth/next-path';

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
  // Tudo sob /painel menos o próprio login, que não pode exigir sessão.
  matcher: ['/painel', '/painel/((?!login(?:/|$)).*)'],
};
