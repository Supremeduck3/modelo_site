import { NextResponse } from 'next/server';
import {
  enforceRouteCeiling,
  readJsonBody,
  rejectOversizedBody,
} from '@/server/lib/api-guard';
import { getClientIdentifier } from '@/server/lib/request';
import { AuthError, authenticate } from '@/server/modules/auth/service';
import { setSessionCookie } from '@/server/modules/auth/session';

/** Autenticação depende do banco e do cookie: nunca pode ser pré-renderizada. */
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/login — entrada no painel da empresa.
 *
 * Devolve apenas o usuário; a sessão vai no cookie httpOnly, fora do alcance
 * de qualquer script da página.
 */
export async function POST(request) {
  // Teto da rota e do corpo antes de qualquer trabalho: os dois protegem
  // contra quem falsifica o identificador de cliente ou anuncia um corpo
  // gigante. Ver src/server/lib/api-guard.js.
  const teto = enforceRouteCeiling(
    'login',
    { limit: 120, windowMs: 10 * 60 * 1000 },
    'Muitas tentativas de acesso no momento. Tente novamente em alguns minutos.',
  );
  if (teto) return teto;

  const grande = rejectOversizedBody(request);
  if (grande) return grande;

  // `readJsonBody` conta os bytes de verdade: o tamanho anunciado acima pode
  // faltar ou mentir.
  const { body: payload, response: erroDeCorpo } = await readJsonBody(request);
  if (erroDeCorpo) return erroDeCorpo;

  try {
    const { token, user } = await authenticate(payload, {
      clientId: getClientIdentifier(request),
    });

    await setSessionCookie(token);
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        },
        {
          status: STATUS_BY_CODE[error.code] ?? 401,
          headers:
            error.code === 'rate_limited'
              ? {
                  'Retry-After': String(error.details.retryAfterSeconds ?? 60),
                }
              : undefined,
        },
      );
    }

    // Erro inesperado (inclui AUTH_SECRET ausente): log no servidor, mensagem
    // genérica para quem tenta entrar.
    console.error('[auth] falha ao autenticar', error);
    return NextResponse.json(
      {
        error: {
          code: 'internal_error',
          message:
            'Não foi possível entrar agora. Tente novamente em instantes.',
        },
      },
      { status: 500 },
    );
  }
}

const STATUS_BY_CODE = {
  validation_error: 400,
  invalid_credentials: 401,
  rate_limited: 429,
};
