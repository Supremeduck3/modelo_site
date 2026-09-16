import { NextResponse } from 'next/server';
import { consumeRateLimit } from '@/server/lib/rate-limit';
import { getClientIdentifier } from '@/server/lib/request';
import { acceptInvite, TeamError } from '@/server/modules/team/service';

export const dynamic = 'force-dynamic';

/** Limite de tentativas, contra quem tenta adivinhar token de convite. */
const RATE_LIMIT = { limit: 10, windowMs: 30 * 60 * 1000 };

/**
 * POST /api/auth/convite — a pessoa convidada define a própria senha.
 *
 * Rota pública por necessidade: quem aceita o convite ainda não tem sessão. A
 * autorização é o próprio token, conferido por hash, prazo e uso único.
 */
export async function POST(request) {
  const clientId = getClientIdentifier(request);
  const rate = consumeRateLimit(`convite:${clientId}`, RATE_LIMIT);

  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: {
          code: 'rate_limited',
          message: 'Muitas tentativas. Aguarde alguns minutos.',
          details: { retryAfterSeconds: rate.retryAfterSeconds },
        },
      },
      {
        status: 429,
        headers: { 'Retry-After': String(rate.retryAfterSeconds) },
      },
    );
  }

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
    await acceptInvite(payload);

    return NextResponse.json(
      { message: 'Acesso criado. Entre no painel com a sua senha.' },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof TeamError) {
      // Convite inválido e dados inválidos são ambos 400: de fora, "este link
      // não vale" e "esta senha não serve" são o mesmo tipo de recusa.
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        },
        { status: 400 },
      );
    }

    console.error('[auth] falha ao aceitar convite', error);
    return NextResponse.json(
      {
        error: {
          code: 'internal_error',
          message: 'Não foi possível concluir agora. Tente novamente.',
        },
      },
      { status: 500 },
    );
  }
}
