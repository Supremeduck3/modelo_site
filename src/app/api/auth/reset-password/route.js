import { NextResponse } from 'next/server';
import {
  enforceRouteCeiling,
  rejectOversizedBody,
} from '@/server/lib/api-guard';
import { getClientIdentifier } from '@/server/lib/request';
import { confirmPasswordReset } from '@/server/modules/auth/password-reset';
import { AuthError } from '@/server/modules/auth/service';
import { clearSessionCookie } from '@/server/modules/auth/session';

export const dynamic = 'force-dynamic';

const STATUS_BY_CODE = {
  validation_error: 400,
  invalid_token: 400,
  rate_limited: 429,
};

/** POST /api/auth/reset-password — define a nova senha a partir do link. */
export async function POST(request) {
  // Teto da rota e do corpo antes de qualquer trabalho: os dois protegem
  // contra quem falsifica o identificador de cliente ou anuncia um corpo
  // gigante. Ver src/server/lib/api-guard.js.
  const teto = enforceRouteCeiling(
    'reset-password',
    { limit: 60, windowMs: 30 * 60 * 1000 },
    'Muitas tentativas agora. Tente novamente em alguns minutos.',
  );
  if (teto) return teto;

  const grande = rejectOversizedBody(request);
  if (grande) return grande;

  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'invalid_json', message: 'Requisição inválida.' } },
      { status: 400 },
    );
  }

  try {
    await confirmPasswordReset(payload, {
      clientId: getClientIdentifier(request),
    });

    // Quem redefiniu a senha entra de novo. Se estava logado neste navegador, o
    // cookie antigo já não vale — a guarda o recusaria; limpamos para não
    // deixar o painel piscando uma sessão morta.
    await clearSessionCookie();

    return NextResponse.json(
      {
        message:
          'Senha alterada. Entre no painel com a nova senha. Os acessos abertos em outros dispositivos foram encerrados.',
      },
      { status: 200 },
    );
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
          status: STATUS_BY_CODE[error.code] ?? 400,
          headers:
            error.code === 'rate_limited'
              ? { 'Retry-After': String(error.details.retryAfterSeconds ?? 60) }
              : undefined,
        },
      );
    }

    console.error('[auth] falha ao redefinir senha', error);
    return NextResponse.json(
      {
        error: {
          code: 'internal_error',
          message:
            'Não foi possível redefinir a senha agora. Tente novamente em instantes.',
        },
      },
      { status: 500 },
    );
  }
}
