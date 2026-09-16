import { after, NextResponse } from 'next/server';
import { PERMISSIONS } from '@/lib/auth/permissions';
import {
  readJsonBody,
  requireApiPermission,
  submissionErrorResponse,
} from '@/server/lib/api-guard';
import { notifySubmissionAnswered } from '@/server/modules/mail/notifications';
import { respondToSubmission } from '@/server/modules/submissions/management';
import { SubmissionError } from '@/server/modules/submissions/service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/painel/manifestacoes/[id]/resposta — responde ao visitante.
 *
 * A resposta é gravada primeiro; o e-mail sai depois, no `after()`. Uma caixa
 * fora do ar não pode fazer a equipe achar que a resposta se perdeu.
 */
export async function POST(request, { params }) {
  const { user, response } = await requireApiPermission(
    PERMISSIONS.SUBMISSIONS_MANAGE,
  );
  if (response) return response;

  const { body, response: bodyError } = await readJsonBody(request);
  if (bodyError) return bodyError;

  const { id } = await params;

  try {
    const result = await respondToSubmission({
      companyId: user.companyId,
      actorId: user.id,
      id,
      input: body,
    });

    if (result.submission.contactEmail) {
      after(() => notifySubmissionAnswered(result));
    }

    return NextResponse.json(
      { delivered: Boolean(result.submission.contactEmail) },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof SubmissionError) return submissionErrorResponse(error);

    console.error('[painel] falha ao responder manifestação', error);
    return NextResponse.json(
      {
        error: {
          code: 'internal_error',
          message: 'Não foi possível enviar a resposta agora. Tente novamente.',
        },
      },
      { status: 500 },
    );
  }
}
