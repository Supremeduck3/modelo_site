import { NextResponse } from 'next/server';
import { PERMISSIONS } from '@/lib/auth/permissions';
import {
  readJsonBody,
  requireApiPermission,
  submissionErrorResponse,
} from '@/server/lib/api-guard';
import { addInternalNote } from '@/server/modules/submissions/management';
import { SubmissionError } from '@/server/modules/submissions/service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/painel/manifestacoes/[id]/notas — registra uma nota interna.
 *
 * A nota fica no histórico e não toca em nenhum campo que o visitante veja.
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
    const event = await addInternalNote({
      companyId: user.companyId,
      actorId: user.id,
      id,
      input: body,
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    if (error instanceof SubmissionError) return submissionErrorResponse(error);

    console.error('[painel] falha ao registrar nota interna', error);
    return NextResponse.json(
      {
        error: {
          code: 'internal_error',
          message: 'Não foi possível salvar a nota agora. Tente novamente.',
        },
      },
      { status: 500 },
    );
  }
}
