import { NextResponse } from 'next/server';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { readJsonBody, requireApiPermission } from '@/server/lib/api-guard';
import { revalidatePublicCatalog } from '@/server/modules/catalog/revalidate';
import { CatalogError, createOffering } from '@/server/modules/catalog/service';
import { catalogErrorResponse, internalError } from './errors';

export const dynamic = 'force-dynamic';

/** POST /api/painel/servicos — novo item da tabela de serviços. */
export async function POST(request) {
  const { user, response } = await requireApiPermission(
    PERMISSIONS.CATALOG_MANAGE,
  );
  if (response) return response;

  const { body, response: bodyError } = await readJsonBody(request);
  if (bodyError) return bodyError;

  try {
    const offering = await createOffering({
      companyId: user.companyId,
      input: body,
    });
    revalidatePublicCatalog();
    return NextResponse.json({ offering }, { status: 201 });
  } catch (error) {
    if (error instanceof CatalogError) return catalogErrorResponse(error);
    return internalError('falha ao criar serviço', error);
  }
}
