import { NextResponse } from 'next/server';
import { PERMISSIONS } from '@/lib/auth/permissions';
import {
  readJsonBody,
  requireApiPermission,
  submissionErrorResponse,
} from '@/server/lib/api-guard';
import { setSubmissionArchived } from '@/server/modules/submissions/management';
import { SubmissionError } from '@/server/modules/submissions/service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/painel/manifestacoes/[id]/arquivo — arquiva ou desarquiva.
 *
 * A especificação pede arquivamento em vez de exclusão física: o registro sai
 * da fila de trabalho e continua auditável. Por isso não existe DELETE aqui.
 */
export async function POST(request, { params }) {
  const { user, response } = await requireApiPermission(
    PERMISSIONS.SUBMISSIONS_ARCHIVE,
  );
  if (response) return response;

  const { body, response: bodyError } = await readJsonBody(request);
  if (bodyError) return bodyError;

  const { id } = await params;

  try {
    const result = await setSubmissionArchived({
      companyId: user.companyId,
      actorId: user.id,
      id,
      archived: body?.archived !== false,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof SubmissionError) return submissionErrorResponse(error);

    console.error('[painel] falha ao arquivar manifestação', error);
    return NextResponse.json(
      {
        error: {
          code: 'internal_error',
          message: 'Não foi possível arquivar agora. Tente novamente.',
        },
      },
      { status: 500 },
    );
  }
}
