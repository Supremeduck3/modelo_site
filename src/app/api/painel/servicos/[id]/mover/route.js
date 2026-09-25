import { NextResponse } from 'next/server';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { readJsonBody, requireApiPermission } from '@/server/lib/api-guard';
import { revalidatePublicCatalog } from '@/server/modules/catalog/revalidate';
import { CatalogError, moveOffering } from '@/server/modules/catalog/service';
import { catalogErrorResponse, internalError } from '../../errors';

export const dynamic = 'force-dynamic';

/** POST /api/painel/servicos/[id]/mover — { direction: 'up' | 'down' }. */
export async function POST(request, { params }) {
  const { user, response } = await requireApiPermission(
    PERMISSIONS.CATALOG_MANAGE,
  );
  if (response) return response;

  const { body, response: bodyError } = await readJsonBody(request);
  if (bodyError) return bodyError;

  const { id } = await params;

  try {
    const result = await moveOffering({
      companyId: user.companyId,
      id,
      direction: body?.direction,
    });
    if (result.moved) revalidatePublicCatalog();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof CatalogError) return catalogErrorResponse(error);
    return internalError('falha ao reordenar serviço', error);
  }
}
