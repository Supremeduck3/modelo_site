import { after, NextResponse } from 'next/server';
import {
  enforceRouteCeiling,
  rateLimitedResponse,
  readJsonBody,
  rejectOversizedBody,
} from '@/server/lib/api-guard';
import { consumeRateLimit } from '@/server/lib/rate-limit';
import { getClientIdentifier } from '@/server/lib/request';
import {
  BookingError,
  createAppointmentRequest,
} from '@/server/modules/booking/service';
import { notifyAppointmentRequested } from '@/server/modules/mail/notifications';

/** Criação pública depende do banco: nunca pré-renderizada. */
export const dynamic = 'force-dynamic';

/**
 * Cota por cliente. Um pouco mais folgada que a do canal de manifestações:
 * quem marca para a família inteira faz vários pedidos seguidos.
 */
const RATE_LIMIT = { limit: 8, windowMs: 10 * 60 * 1000 };

/** POST /api/agendamentos — pedido de agendamento vindo do site. */
export async function POST(request) {
  const teto = enforceRouteCeiling(
    'agendamentos',
    { limit: 80, windowMs: 10 * 60 * 1000 },
    'Muitos pedidos sendo feitos agora. Tente novamente em alguns minutos.',
  );
  if (teto) return teto;

  const grande = rejectOversizedBody(request);
  if (grande) return grande;

  const rate = consumeRateLimit(
    `agendamentos:${getClientIdentifier(request)}`,
    RATE_LIMIT,
  );
  if (!rate.allowed) {
    return rateLimitedResponse(
      'Muitos pedidos enviados deste aparelho. Tente novamente mais tarde ou fale com a gente pelo WhatsApp.',
      rate.retryAfterSeconds,
    );
  }

  const { body, response: erroDeCorpo } = await readJsonBody(request);
  if (erroDeCorpo) return erroDeCorpo;

  try {
    const { appointment, forNotification } =
      await createAppointmentRequest(body);

    // Depois da resposta: o cliente vê o código na hora, sem esperar o SMTP.
    after(() => notifyAppointmentRequested({ appointment: forNotification }));

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    if (error instanceof BookingError) {
      const status =
        { validation_error: 400, not_found: 404 }[error.code] ?? 422;
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

    console.error('[agendamentos] falha ao registrar pedido', error);
    return NextResponse.json(
      {
        error: {
          code: 'internal_error',
          message:
            'Não foi possível registrar seu pedido agora. Tente novamente em instantes ou fale com a gente pelo WhatsApp.',
        },
      },
      { status: 500 },
    );
  }
}
