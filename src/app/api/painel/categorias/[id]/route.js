import { NextResponse } from 'next/server';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { readJsonBody, requireApiPermission } from '@/server/lib/api-guard';
import {
  CompanyError,
  deleteCategory,
  updateCategory,
} from '@/server/modules/company/settings';
import { companyErrorResponse } from '../errors';

export const dynamic = 'force-dynamic';

/** PATCH /api/painel/categorias/[id] — renomeia ou liga/desliga. */
export async function PATCH(request, { params }) {
  const { user, response } = await requireApiPermission(
    PERMISSIONS.SETTINGS_MANAGE,
  );
  if (response) return response;

  const { body, response: bodyError } = await readJsonBody(request);
  if (bodyError) return bodyError;

  const { id } = await params;

  try {
    const category = await updateCategory({
      companyId: user.companyId,
      id,
      input: body,
    });

    return NextResponse.json({ category }, { status: 200 });
  } catch (error) {
    if (error instanceof CompanyError) return companyErrorResponse(error);

    console.error('[painel] falha ao atualizar categoria', error);
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

/**
 * DELETE /api/painel/categorias/[id] — exclui uma categoria nunca usada.
 *
 * Categoria em uso devolve 400: excluí-la apagaria em silêncio a classificação
 * de manifestações já atendidas, porque a referência é `onDelete: SetNull`.
 */
export async function DELETE(_request, { params }) {
  const { user, response } = await requireApiPermission(
    PERMISSIONS.SETTINGS_MANAGE,
  );
  if (response) return response;

  const { id } = await params;

  try {
    const result = await deleteCategory({ companyId: user.companyId, id });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof CompanyError) return companyErrorResponse(error);

    console.error('[painel] falha ao excluir categoria', error);
    return NextResponse.json(
      {
        error: {
          code: 'internal_error',
          message: 'Não foi possível excluir agora. Tente novamente.',
        },
      },
      { status: 500 },
    );
  }
}
