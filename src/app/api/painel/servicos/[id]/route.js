import { NextResponse } from 'next/server';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { readJsonBody, requireApiPermission } from '@/server/lib/api-guard';
import { revalidatePublicCatalog } from '@/server/modules/catalog/revalidate';
import {
  CatalogError,
  deleteOffering,
  updateOffering,
} from '@/server/modules/catalog/service';
import { catalogErrorResponse, internalError } from '../errors';

export const dynamic = 'force-dynamic';

/** PATCH /api/painel/servicos/[id] — altera um item da tabela. */
export async function PATCH(request, { params }) {
  const { user, response } = await requireApiPermission(
    PERMISSIONS.CATALOG_MANAGE,
  );
  if (response) return response;

  const { body, response: bodyError } = await readJsonBody(request);
  if (bodyError) return bodyError;

  const { id } = await params;

  try {
    const offering = await updateOffering({
      companyId: user.companyId,
      id,
      input: body,
    });
    revalidatePublicCatalog();
    return NextResponse.json({ offering }, { status: 200 });
  } catch (error) {
    if (error instanceof CatalogError) return catalogErrorResponse(error);
    return internalError('falha ao atualizar serviço', error);
  }
}

/** DELETE /api/painel/servicos/[id] — exclui um item da tabela. */
export async function DELETE(_request, { params }) {
  const { user, response } = await requireApiPermission(
    PERMISSIONS.CATALOG_MANAGE,
  );
  if (response) return response;

  const { id } = await params;

  try {
    const result = await deleteOffering({ companyId: user.companyId, id });
    revalidatePublicCatalog();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof CatalogError) return catalogErrorResponse(error);
    return internalError('falha ao excluir serviço', error);
  }
}
