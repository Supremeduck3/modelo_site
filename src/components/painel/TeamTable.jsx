'use client';

import {
  App,
  Button,
  Input,
  Modal,
  Popconfirm,
  Select,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { roleLabel } from '@/lib/auth/constants';
import { ASSIGNABLE_ROLES } from '@/lib/team/schema';

const { Paragraph } = Typography;

const GENERIC_ERROR = 'Não foi possível concluir agora. Tente novamente.';

const ACCESS_LABEL = {
  active: 'Ativo',
  invited: 'Convite pendente',
  invite_expired: 'Convite expirado',
  disabled: 'Desativado',
};

const ACCESS_COLOR = {
  active: 'green',
  invited: 'blue',
  invite_expired: 'orange',
  disabled: 'red',
};

const ROLE_OPTIONS = ASSIGNABLE_ROLES.map((value) => ({
  value,
  label: roleLabel(value),
}));

function formatDate(value) {
  if (!value) return 'nunca';
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Tabela da equipe. Ninguém age sobre a própria linha nem sobre o responsável
 * (`owner`): o responsável só muda pela transferência, uma ação à parte.
 */
export default function TeamTable({ members, currentUserId, isOwner }) {
  const router = useRouter();
  const { message } = App.useApp();
  const [busyId, setBusyId] = useState(null);
  const [linkModal, setLinkModal] = useState(null);

  async function request(id, body) {
    setBusyId(id);
    try {
      const response = await fetch(`/api/painel/equipe/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        router.refresh();
        return true;
      }

      const responseBody = await response.json().catch(() => null);
      message.error(responseBody?.error?.message ?? GENERIC_ERROR);
      return false;
    } catch {
      message.error(GENERIC_ERROR);
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function handleRoleChange(id, role) {
    const ok = await request(id, { role });
    if (ok) message.success('Perfil atualizado.');
  }

  async function handleActiveChange(id, isActive) {
    const ok = await request(id, { isActive });
    if (ok) {
      message.success(isActive ? 'Acesso reativado.' : 'Acesso desativado.');
    }
  }

  async function handleResendInvite(id) {
    setBusyId(id);
    try {
      const response = await fetch(`/api/painel/equipe/${id}/convite`, {
        method: 'POST',
      });

      const body = await response.json().catch(() => null);

      if (response.ok) {
        setLinkModal(body?.link ?? null);
        router.refresh();
        return;
      }

      message.error(body?.error?.message ?? GENERIC_ERROR);
    } catch {
      message.error(GENERIC_ERROR);
    } finally {
      setBusyId(null);
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(linkModal);
      message.success('Link copiado.');
    } catch {
      message.error('Não foi possível copiar. Selecione e copie manualmente.');
    }
  }

  const actionColumn = {
    title: 'Ações',
    key: 'actions',
    render: (_, record) => {
      const isSelf = record.id === currentUserId;
      const isTargetOwner = record.role === 'owner';

      if (isSelf || isTargetOwner) return null;

      const canResendInvite =
        record.access === 'invited' || record.access === 'invite_expired';

      return (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Select
            size="small"
            value={record.role}
            options={ROLE_OPTIONS}
            disabled={busyId === record.id}
            onChange={(role) => handleRoleChange(record.id, role)}
            style={{ minWidth: 130 }}
            aria-label={`Trocar perfil de ${record.name}`}
          />

          {record.isActive ? (
            <Popconfirm
              title="Desativar acesso"
              description="A pessoa perde o acesso ao painel, mas o histórico dela continua registrado. Nada é apagado."
              okText="Desativar"
              cancelText="Cancelar"
              onConfirm={() => handleActiveChange(record.id, false)}
            >
              <Button size="small" danger loading={busyId === record.id}>
                Desativar
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="Reativar acesso"
              description="A pessoa volta a poder entrar no painel."
              okText="Reativar"
              cancelText="Cancelar"
              onConfirm={() => handleActiveChange(record.id, true)}
            >
              <Button size="small" loading={busyId === record.id}>
                Reativar
              </Button>
            </Popconfirm>
          )}

          {canResendInvite && (
            <Button
              size="small"
              loading={busyId === record.id}
              onClick={() => handleResendInvite(record.id)}
            >
              Reenviar convite
            </Button>
          )}
        </div>
      );
    },
  };

  const columns = [
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <>
          {name}
          {record.id === currentUserId ? ' (você)' : ''}
        </>
      ),
    },
    {
      title: 'E-mail',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Perfil',
      dataIndex: 'role',
      key: 'role',
      render: (role) => roleLabel(role),
    },
    {
      title: 'Situação de acesso',
      dataIndex: 'access',
      key: 'access',
      render: (access) => (
        <Tag color={ACCESS_COLOR[access] ?? 'default'}>
          {ACCESS_LABEL[access] ?? access}
        </Tag>
      ),
    },
    {
      title: 'Último acesso',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (value) => formatDate(value),
    },
    actionColumn,
  ];

  return (
    <>
      {!isOwner && (
        <Paragraph type="secondary" style={{ marginBottom: 12 }}>
          O papel de responsável só muda pela transferência, feita pelo próprio
          responsável.
        </Paragraph>
      )}

      <Table
        rowKey="id"
        columns={columns}
        dataSource={members}
        scroll={{ x: true }}
        pagination={false}
      />

      <Modal
        open={Boolean(linkModal)}
        title="Link de convite"
        onCancel={() => setLinkModal(null)}
        footer={[
          <Button key="close" onClick={() => setLinkModal(null)}>
            Fechar
          </Button>,
        ]}
      >
        <Paragraph>
          Este link vale uma única vez e expira depois de um tempo. Se há e-mail
          configurado, ele também foi enviado automaticamente para a pessoa.
        </Paragraph>
        <Input.Group compact style={{ display: 'flex' }}>
          <Input
            readOnly
            value={linkModal ?? ''}
            aria-label="Link de convite"
          />
          <Button onClick={handleCopyLink}>Copiar</Button>
        </Input.Group>
      </Modal>
    </>
  );
}
