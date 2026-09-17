import { NextResponse } from 'next/server';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { readJsonBody, requireApiPermission } from '@/server/lib/api-guard';
import {
  CompanyError,
  updateCompanySettings,
} from '@/server/modules/company/settings';
import { companyErrorResponse } from '../categorias/errors';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/painel/empresa — dados operacionais da empresa.
 *
 * Alimentam os e-mails e o painel. A identidade do site público vem da
 * configuração da implantação e não passa por aqui: o design e o conteúdo do
 * site são decisão do implementador, como manda a regra central do produto.
 */
export async function PUT(request) {
  const { user, response } = await requireApiPermission(
    PERMISSIONS.SETTINGS_MANAGE,
  );
  if (response) return response;

  const { body, response: bodyError } = await readJsonBody(request);
  if (bodyError) return bodyError;

  try {
    const company = await updateCompanySettings({
      companyId: user.companyId,
      input: body,
    });

    return NextResponse.json({ company }, { status: 200 });
  } catch (error) {
    if (error instanceof CompanyError) return companyErrorResponse(error);

    console.error('[painel] falha ao salvar dados da empresa', error);
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
