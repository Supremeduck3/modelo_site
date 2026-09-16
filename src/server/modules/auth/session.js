import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/lib/auth/cookie';
import { LOGIN_PATH } from '@/lib/auth/next-path';
import {
  SESSION_TTL_SECONDS,
  verifySessionToken,
} from '@/server/lib/session-token';
import { loadSessionUser } from './service';

/**
 * Sessão do painel no cookie.
 *
 * Único lugar que conhece o nome e as opções do cookie: rotas e páginas pedem
 * "o usuário da sessão", não "o cookie".
 */

export { SESSION_COOKIE };

/** Opções do cookie de sessão. */
function cookieOptions() {
  return {
    httpOnly: true,
    // Nunca em 'none': o painel não é embutido em terceiros.
    sameSite: 'lax',
    // Em desenvolvimento o painel roda em http://localhost.
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  };
}

/** Grava o cookie de sessão na resposta em curso. */
export async function setSessionCookie(token) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, cookieOptions());
}

/** Apaga o cookie de sessão. */
export async function clearSessionCookie() {
  const store = await cookies();
  store.set(SESSION_COOKIE, '', { ...cookieOptions(), maxAge: 0 });
}

/**
 * Sessão assinada do cookie, sem ir ao banco.
 * Serve para decidir "tem token válido?"; para autorizar, use `getSessionUser`.
 */
export async function getSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  // Segredo ausente é erro de configuração da implantação e precisa aparecer
  // no log do servidor — não pode virar "ninguém está logado".
  return verifySessionToken(token);
}

/**
 * Usuário autenticado, já confirmado no banco, ou `null`.
 * É esta a função que autoriza: o token sozinho não prova que a conta segue
 * ativa.
 */
export async function getSessionUser() {
  const session = await getSession();
  if (!session) return null;
  return loadSessionUser(session);
}

/**
 * Exige um usuário autenticado e devolve-o; redireciona ao login quando não há.
 *
 * `next` leva o visitante de volta ao que ele tentou abrir depois de entrar.
 */
export async function requireSessionUser(nextPath) {
  const user = await getSessionUser();
  if (user) return user;

  const target = nextPath
    ? `${LOGIN_PATH}?next=${encodeURIComponent(nextPath)}`
    : LOGIN_PATH;
  redirect(target);
}
