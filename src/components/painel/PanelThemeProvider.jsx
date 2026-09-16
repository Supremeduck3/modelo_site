'use client';

import { AntdRegistry } from '@ant-design/nextjs-registry';
import { App as AntdApp, ConfigProvider } from 'antd';
import ptBR from 'antd/locale/pt_BR';

/**
 * Tema e locale do Ant Design para o painel.
 *
 * O runtime do antd entra por aqui e só aqui: como este componente é usado
 * apenas no layout de `/painel`, nenhuma página pública paga por ele. O
 * `AntdRegistry` coleta o CSS-in-JS no servidor, evitando o flash de
 * componente sem estilo na primeira pintura.
 */
export default function PanelThemeProvider({ theme, children }) {
  return (
    <AntdRegistry>
      <ConfigProvider locale={ptBR} theme={theme}>
        {/* Habilita message/modal/notification por contexto, que respeitam o
            tema — as versões estáticas do antd não respeitam. */}
        <AntdApp>{children}</AntdApp>
      </ConfigProvider>
    </AntdRegistry>
  );
}
