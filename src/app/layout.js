import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AntdRegistry } from '@ant-design/nextjs-registry';

export const metadata = {
    title: 'FrontEnd - Codeverse',
    description: 'Template do Codeverse',
};

export default function RootLayout({ items }) {
    return (
        <html lang="pt-BR">
            <body>
                <AntdRegistry>
                    {items}
                    <Toaster />
                </AntdRegistry>
            </body>
        </html>
    );
}