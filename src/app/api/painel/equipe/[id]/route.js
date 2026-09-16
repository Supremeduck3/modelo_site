import { NextResponse } from 'next/server';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { readJsonBody, requireApiPermission } from '@/server/lib/api-guard';
import {
  changeMemberRole,
  setMemberActive,
  TeamError,
} from '@/server/modules/team/service';
import { teamErrorResponse } from '../errors';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/painel/equipe/[id] — troca o perfil ou liga/desliga o acesso.
 *
 * As duas travas que impedem a empresa de se trancar fora (ninguém age sobre si
 * mesmo, ninguém mexe no responsável) ficam no serviço, não aqui: a API do
 * painel não é o único caminho possível para essas funções.
 */
export async function PATCH(request, { params }) {
  const { user, response } = await requireApiPermission(
    PERMISSIONS.SETTINGS_MANAGE,
  );
  if (response) return response;

  const { body, response: bodyError } = await readJsonBody(request);
  if (bodyError) return bodyError;

  const { id } = await params;

  try {
    const result =
      body && 'role' in body
        ? await changeMemberRole({
            companyId: user.companyId,
            actorId: user.id,
            userId: id,
            input: body,
          })
        : await setMemberActive({
            companyId: user.companyId,
            actorId: user.id,
            userId: id,
            input: body,
          });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof TeamError) return teamErrorResponse(error);

    console.error('[painel] falha ao atualizar integrante', error);
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
