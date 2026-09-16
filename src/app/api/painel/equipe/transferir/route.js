import { NextResponse } from 'next/server';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { readJsonBody, requireApiPermission } from '@/server/lib/api-guard';
import { TeamError, transferOwnership } from '@/server/modules/team/service';
import { teamErrorResponse } from '../errors';

export const dynamic = 'force-dynamic';

/**
 * POST /api/painel/equipe/transferir — passa o papel de responsável adiante.
 *
 * É o gesto de entrega de uma implantação: quem implantou sai do posto e a
 * empresa assume a conta. Só o responsável atual pode fazer — a permissão de
 * configurações não basta, e isso é conferido no serviço.
 */
export async function POST(request) {
  const { user, response } = await requireApiPermission(
    PERMISSIONS.SETTINGS_MANAGE,
  );
  if (response) return response;

  const { body, response: bodyError } = await readJsonBody(request);
  if (bodyError) return bodyError;

  try {
    const result = await transferOwnership({
      companyId: user.companyId,
      actorId: user.id,
      input: body,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof TeamError) return teamErrorResponse(error);

    console.error('[painel] falha ao transferir o papel de responsável', error);
    return NextResponse.json(
      {
        error: {
          code: 'internal_error',
          message: 'Não foi possível transferir agora. Tente novamente.',
        },
      },
      { status: 500 },
    );
  }
}
