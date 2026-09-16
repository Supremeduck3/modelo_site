import { Alert, Card } from 'antd';
import InviteMemberForm from '@/components/painel/InviteMemberForm';
import TeamTable from '@/components/painel/TeamTable';
import TransferOwnershipForm from '@/components/painel/TransferOwnershipForm';
import { can, PERMISSIONS } from '@/lib/auth/permissions';
import { requireSessionUser } from '@/server/modules/auth/session';
import { listTeam } from '@/server/modules/team/service';

export const metadata = { robots: { index: false, follow: false } };

export const dynamic = 'force-dynamic';

/**
 * Equipe da empresa.
 *
 * A permissão é conferida aqui além do layout: quem não administra vê a lista,
 * mas não recebe os formulários — e, mesmo que recebesse, cada rota confere de
 * novo no servidor.
 */
export default async function EquipePage() {
  const user = await requireSessionUser('/painel/equipe');
  const members = await listTeam(user.companyId);

  const canManage = can(user, PERMISSIONS.SETTINGS_MANAGE);
  const isOwner = user.role === 'owner';

  if (!canManage) {
    return (
      <Card title="Equipe">
        <Alert
          type="info"
          showIcon
          message="Somente quem administra o painel pode convidar e alterar acessos."
        />
        <TeamTable members={members} currentUserId={user.id} isOwner={false} />
      </Card>
    );
  }

  return (
    <>
      <Card title="Convidar alguém">
        <InviteMemberForm />
      </Card>

      <Card title="Equipe" style={{ marginTop: 16 }}>
        <TeamTable
          members={members}
          currentUserId={user.id}
          isOwner={isOwner}
        />
      </Card>

      {isOwner && (
        <Card
          title="Transferir o papel de responsável"
          style={{ marginTop: 16 }}
        >
          <TransferOwnershipForm members={members} currentUserId={user.id} />
        </Card>
      )}
    </>
  );
}
