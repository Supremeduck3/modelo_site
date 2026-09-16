import { after, NextResponse } from 'next/server';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { requireApiPermission } from '@/server/lib/api-guard';
import { buildInviteLink } from '@/server/lib/invite-link';
import { notifyMemberInvited } from '@/server/modules/mail/notifications';
import { resendInvite, TeamError } from '@/server/modules/team/service';
import { teamErrorResponse } from '../../errors';

export const dynamic = 'force-dynamic';

/**
 * POST /api/painel/equipe/[id]/convite — gera um convite novo.
 *
 * O token anterior deixa de valer: um link antigo que tenha vazado para de
 * servir no instante em que este é criado.
 */
export async function POST(_request, { params }) {
  const { user, response } = await requireApiPermission(
    PERMISSIONS.SETTINGS_MANAGE,
  );
  if (response) return response;

  const { id } = await params;

  try {
    const { member, token } = await resendInvite({
      companyId: user.companyId,
      actorId: user.id,
      userId: id,
    });

    const link = buildInviteLink(token);

    after(() =>
      notifyMemberInvited({ member, link, invitedByName: user.name }),
    );

    return NextResponse.json({ member, link }, { status: 200 });
  } catch (error) {
    if (error instanceof TeamError) return teamErrorResponse(error);

    console.error('[painel] falha ao reenviar convite', error);
    return NextResponse.json(
      {
        error: {
          code: 'internal_error',
          message: 'Não foi possível gerar o convite agora. Tente novamente.',
        },
      },
      { status: 500 },
    );
  }
}
