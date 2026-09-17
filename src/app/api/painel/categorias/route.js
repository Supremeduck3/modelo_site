import { NextResponse } from 'next/server';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { readJsonBody, requireApiPermission } from '@/server/lib/api-guard';
import {
  CompanyError,
  createCategory,
} from '@/server/modules/company/settings';
import { companyErrorResponse } from './errors';

export const dynamic = 'force-dynamic';

/** POST /api/painel/categorias — cria uma categoria de manifestação. */
export async function POST(request) {
  const { user, response } = await requireApiPermission(
    PERMISSIONS.SETTINGS_MANAGE,
  );
  if (response) return response;

  const { body, response: bodyError } = await readJsonBody(request);
  if (bodyError) return bodyError;

  try {
    const category = await createCategory({
      companyId: user.companyId,
      input: body,
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    if (error instanceof CompanyError) return companyErrorResponse(error);

    console.error('[painel] falha ao criar categoria', error);
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
