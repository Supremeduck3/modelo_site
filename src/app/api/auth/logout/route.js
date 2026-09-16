import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/server/modules/auth/session';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/logout — encerra a sessão apagando o cookie.
 *
 * Só POST: um GET de saída poderia ser disparado por qualquer `<img>` em
 * página de terceiro e derrubaria a sessão de quem está trabalhando.
 * Idempotente e sempre 200 — sair sem estar dentro não é erro.
 */
export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true }, { status: 200 });
}
