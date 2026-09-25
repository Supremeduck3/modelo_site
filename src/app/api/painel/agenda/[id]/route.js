import { after, NextResponse } from 'next/server';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { readJsonBody, requireApiPermission } from '@/server/lib/api-guard';
import {
  actOnAppointment,
  BookingError,
} from '@/server/modules/booking/service';
import { notifyAppointmentUpdated } from '@/server/modules/mail/notifications';

export const dynamic = 'force-dynamic';

const STATUS = {
  validation_error: 400,
  not_found: 404,
  invalid_transition: 409,
};

/**
 * POST /api/painel/agenda/[id] — ação da equipe sobre um pedido.
 *
 * Corpo: { action, date?, time?, message? }. Depois de gravar, avisa o
 * cliente por e-mail se ele deixou um — em `after`, para a tela não esperar o
 * SMTP. O aviso pelo WhatsApp é o link que o painel oferece em seguida.
 */
export async function POST(request, { params }) {
  const { user, response } = await requireApiPermission(
    PERMISSIONS.APPOINTMENTS_MANAGE,
  );
  if (response) return response;

  const { body, response: bodyError } = await readJsonBody(request);
  if (bodyError) return bodyError;

  const { id } = await params;

  try {
    const appointment = await actOnAppointment({
      companyId: user.companyId,
      actorId: user.id,
      id,
      input: body,
    });

    after(() => notifyAppointmentUpdated({ appointment }));

    return NextResponse.json(
      {
        appointment: {
          id: appointment.id,
          status: appointment.status,
          scheduledDate: appointment.scheduledDate,
          scheduledTime: appointment.scheduledTime,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof BookingError) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        },
        { status: STATUS[error.code] ?? 422 },
      );
    }

    console.error('[painel] falha ao agir sobre pedido de agendamento', error);
    return NextResponse.json(
      {
        error: {
          code: 'internal_error',
          message: 'Não foi possível salvar agora. Tente novamente.',
        },
      },
      { status: 500 },
    );
  }
}
