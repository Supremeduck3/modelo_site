import { NextResponse } from 'next/server';
import { PERMISSIONS } from '@/lib/auth/permissions';
import {
  readJsonBody,
  requireApiPermission,
  submissionErrorResponse,
} from '@/server/lib/api-guard';
import { classifySubmission } from '@/server/modules/submissions/management';
import { SubmissionError } from '@/server/modules/submissions/service';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/painel/manifestacoes/[id] — classifica uma manifestação.
 *
 * O `companyId` vem da sessão, nunca do corpo: é isso que impede alguém
 * autenticado de mexer numa manifestação de outra implantação.
 */
export async function PATCH(request, { params }) {
  const { user, response } = await requireApiPermission(
    PERMISSIONS.SUBMISSIONS_MANAGE,
  );
  if (response) return response;

  const { body, response: bodyError } = await readJsonBody(request);
  if (bodyError) return bodyError;

  const { id } = await params;

  try {
    const result = await classifySubmission({
      companyId: user.companyId,
      actorId: user.id,
      id,
      input: body,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof SubmissionError) return submissionErrorResponse(error);

    console.error('[painel] falha ao classificar manifestação', error);
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
