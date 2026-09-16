'use client';

import { Layout, Menu } from 'antd';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { activeNavItem, PANEL_NAV } from './nav';
import PanelUserMenu from './PanelUserMenu';
import styles from './panel-shell.module.css';

const { Header, Sider, Content } = Layout;

/**
 * Casca do painel: menu lateral, cabeçalho e área de conteúdo.
 *
 * No mobile o `Sider` recolhe para largura zero e reaparece pelo gatilho do
 * próprio antd — o painel é ferramenta de trabalho, não precisa da mesma
 * liberdade de variantes do site público.
 */
export default function PanelShell({ user, companyName, children }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const current = activeNavItem(pathname);

  const items = PANEL_NAV.map((item) => ({
    key: item.key,
    label: <Link href={item.key}>{item.label}</Link>,
  }));

  return (
    // A altura vai inline porque `.ant-layout` também define `min-height` e é
    // injetado depois do CSS Module — uma classe local não venceria.
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={240}
      >
        <div className={styles.brand}>{companyName}</div>
        <Menu
          mode="inline"
          theme="dark"
          items={items}
          selectedKeys={current ? [current.key] : []}
        />
      </Sider>

      <Layout>
        <Header className={styles.header}>
          <h1 className={styles.pageTitle}>{current?.label ?? 'Painel'}</h1>
          <PanelUserMenu user={user} />
        </Header>
        <Content className={styles.content}>{children}</Content>
      </Layout>
    </Layout>
  );
}
