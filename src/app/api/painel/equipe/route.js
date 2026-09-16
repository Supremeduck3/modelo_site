import { after, NextResponse } from 'next/server';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { readJsonBody, requireApiPermission } from '@/server/lib/api-guard';
import { buildInviteLink } from '@/server/lib/invite-link';
import { notifyMemberInvited } from '@/server/modules/mail/notifications';
import { inviteMember, TeamError } from '@/server/modules/team/service';
import { teamErrorResponse } from './errors';

export const dynamic = 'force-dynamic';

/**
 * POST /api/painel/equipe — convida alguém para o painel.
 *
 * O link de ativação volta na resposta de propósito: sem SMTP configurado ele é
 * o único caminho, e mesmo com SMTP quem convida costuma querer repassá-lo por
 * outro canal. Ele aparece uma vez — não é gravado em log nem reexibido.
 */
export async function POST(request) {
  const { user, response } = await requireApiPermission(
    PERMISSIONS.SETTINGS_MANAGE,
  );
  if (response) return response;

  const { body, response: bodyError } = await readJsonBody(request);
  if (bodyError) return bodyError;

  try {
    const { member, token } = await inviteMember({
      companyId: user.companyId,
      actorId: user.id,
      input: body,
    });

    const link = buildInviteLink(token);

    after(() =>
      notifyMemberInvited({ member, link, invitedByName: user.name }),
    );

    return NextResponse.json({ member, link }, { status: 201 });
  } catch (error) {
    if (error instanceof TeamError) return teamErrorResponse(error);

    console.error('[painel] falha ao convidar integrante', error);
    return NextResponse.json(
      {
        error: {
          code: 'internal_error',
          message: 'Não foi possível convidar agora. Tente novamente.',
        },
      },
      { status: 500 },
    );
  }
}
