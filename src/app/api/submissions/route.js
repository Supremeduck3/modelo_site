import { NextResponse } from 'next/server';
import { consumeRateLimit } from '@/server/lib/rate-limit';
import { getClientIdentifier } from '@/server/lib/request';
import {
  createSubmission,
  SubmissionError,
} from '@/server/modules/submissions/service';

/** A criação pública depende do banco: nunca pode ser pré-renderizada. */
export const dynamic = 'force-dynamic';

const RATE_LIMIT = { limit: 5, windowMs: 10 * 60 * 1000 };

/**
 * POST /api/submissions — registro público de uma manifestação.
 *
 * Toda a autorização e validação acontece aqui, no servidor: a validação do
 * formulário existe para dar retorno rápido, não como controle.
 */
export async function POST(request) {
  const clientId = getClientIdentifier(request);
  const rate = consumeRateLimit(`submissions:${clientId}`, RATE_LIMIT);

  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: {
          code: 'rate_limited',
          message:
            'Muitas manifestações enviadas deste dispositivo. Tente novamente mais tarde.',
          retryAfterSeconds: rate.retryAfterSeconds,
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
    const submission = await createSubmission(payload);

    // TODO(fase 6): disparar e-mail de confirmação ao visitante e aviso à equipe.
    return NextResponse.json({ submission }, { status: 201 });
  } catch (error) {
    if (error instanceof SubmissionError) {
      const status = error.code === 'validation_error' ? 400 : 422;
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        },
        { status },
      );
    }

    // Erro inesperado: log no servidor, mensagem genérica para o visitante.
    console.error('[submissions] falha ao registrar manifestação', error);
    return NextResponse.json(
      {
        error: {
          code: 'internal_error',
          message:
            'Não foi possível registrar sua manifestação agora. Tente novamente em instantes.',
        },
      },
      { status: 500 },
    );
  }
}
