import { after, NextResponse } from 'next/server';
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
