import { after, NextResponse } from 'next/server';
import {
  enforceRouteCeiling,
  readJsonBody,
  rejectOversizedBody,
} from '@/server/lib/api-guard';
import { getClientIdentifier } from '@/server/lib/request';
import { requestPasswordReset } from '@/server/modules/auth/password-reset';
import { AuthError } from '@/server/modules/auth/service';
import { notifyPasswordResetRequested } from '@/server/modules/mail/notifications';

export const dynamic = 'force-dynamic';

/**
 * Resposta única do pedido de recuperação.
 *
 * Vale para conta existente, inexistente, inativa e até para falha no envio:
 * variar aqui transformaria o formulário num verificador de quais e-mails têm
 * acesso ao painel.
 */
const NEUTRAL_MESSAGE =
  'Se houver uma conta com esse e-mail, enviaremos um link de recuperação em instantes. O link vale por uma hora.';

/** POST /api/auth/forgot-password — pede o link de recuperação. */
export async function POST(request) {
  // Teto da rota e do corpo antes de qualquer trabalho: os dois protegem
  // contra quem falsifica o identificador de cliente ou anuncia um corpo
  // gigante. Ver src/server/lib/api-guard.js.
  const teto = enforceRouteCeiling(
    'forgot-password',
    { limit: 60, windowMs: 30 * 60 * 1000 },
    'Muitos pedidos agora. Tente novamente em alguns minutos.',
  );
  if (teto) return teto;

  const grande = rejectOversizedBody(request);
  if (grande) return grande;

  // `readJsonBody` conta os bytes de verdade: o tamanho anunciado acima pode
  // faltar ou mentir.
  const { body: payload, response: erroDeCorpo } = await readJsonBody(request);
  if (erroDeCorpo) return erroDeCorpo;

  try {
    const { token, user } = await requestPasswordReset(payload, {
      clientId: getClientIdentifier(request),
    });

    // Depois da resposta: quem pediu não espera o SMTP, e uma caixa fora do ar
    // não vira erro de um pedido que foi registrado.
    if (token && user) {
      after(() => notifyPasswordResetRequested({ user, token }));
    }

    return NextResponse.json({ message: NEUTRAL_MESSAGE }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      // Erro de formato e excesso de tentativas são os únicos que o visitante
      // vê: os dois independem de a conta existir.
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        },
        {
          status: error.code === 'validation_error' ? 400 : 429,
          headers:
            error.code === 'rate_limited'
              ? { 'Retry-After': String(error.details.retryAfterSeconds ?? 60) }
              : undefined,
        },
      );
    }

    console.error('[auth] falha ao registrar pedido de recuperação', error);
    return NextResponse.json(
      {
        error: {
          code: 'internal_error',
          message:
            'Não foi possível processar o pedido agora. Tente novamente em instantes.',
        },
      },
      { status: 500 },
    );
  }
}
