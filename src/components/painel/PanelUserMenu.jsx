'use client';

import { App, Button, Dropdown } from 'antd';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { roleLabel } from '@/lib/auth/constants';
import { LOGIN_PATH } from '@/lib/auth/next-path';
import styles from './panel-user-menu.module.css';

/**
 * Identificação do usuário logado e saída do painel.
 *
 * A saída é um POST: é ele que apaga o cookie no servidor. Um link de logout
 * seria acionável por qualquer imagem em página de terceiro.
 */
export default function PanelUserMenu({ user }) {
  const router = useRouter();
  const { message } = App.useApp();
  const [leaving, setLeaving] = useState(false);

  async function handleLogout() {
    if (leaving) return;
    setLeaving(true);

    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error('logout falhou');

      router.replace(LOGIN_PATH);
      router.refresh();
    } catch {
      message.error('Não foi possível sair agora. Tente novamente.');
      setLeaving(false);
    }
  }

  const items = [
    {
      key: 'identity',
      type: 'group',
      label: (
        <span className={styles.identity}>
          {user.email}
          <span className={styles.role}>{roleLabel(user.role)}</span>
        </span>
      ),
    },
    { type: 'divider' },
    {
      key: 'logout',
      label: 'Sair',
      danger: true,
      disabled: leaving,
      onClick: handleLogout,
    },
  ];

  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <Button type="text" loading={leaving}>
        {user.name}
      </Button>
    </Dropdown>
  );
}
