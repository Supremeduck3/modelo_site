/**
 * Caminhos do painel.
 *
 * Ficam neste módulo compartilhado porque tanto componentes de cliente quanto o
 * servidor precisam deles — importar do módulo de sessão arrastaria
 * `next/headers` e o Prisma para o bundle do navegador.
 */

/** Destino padrão de quem acabou de entrar no painel. */
export const PANEL_HOME = '/painel';

export const LOGIN_PATH = '/painel/login';

export const FORGOT_PASSWORD_PATH = '/painel/esqueci-senha';

export const RESET_PASSWORD_PATH = '/painel/redefinir-senha';

/**
 * Saneia o `?next=` do login.
 *
 * O parâmetro vem da URL, então é entrada do visitante: aceito sem conferência
 * viraria redirecionamento aberto (`/painel/login?next=https://golpe.example`),
 * usando a confiança no domínio da empresa para lançar a vítima em outro site.
 * Só passa caminho interno do próprio painel.
 */
export function safeNextPath(value) {
  if (typeof value !== 'string' || value === '') return PANEL_HOME;

  // `//host` e `/\host` são interpretados como URL absoluta pelo navegador.
  if (
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.startsWith('/\\')
  ) {
    return PANEL_HOME;
  }
  if (value !== PANEL_HOME && !value.startsWith(`${PANEL_HOME}/`)) {
    return PANEL_HOME;
  }
  // Voltar ao login depois de entrar seria um laço.
  if (value === LOGIN_PATH || value.startsWith(`${LOGIN_PATH}/`)) {
    return PANEL_HOME;
  }

  return value;
}
