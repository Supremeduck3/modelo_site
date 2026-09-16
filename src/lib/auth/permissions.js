import { ROLE_VALUES } from './constants.js';

/**
 * O que cada papel pode fazer.
 *
 * Declarado aqui e conferido no servidor. O painel usa o mesmo mapa para
 * esconder um botão, mas esconder nunca é autorizar: toda rota privada repete a
 * verificação.
 */

export const PERMISSIONS = {
  /** Ver a lista e o detalhe das manifestações. */
  SUBMISSIONS_VIEW: 'submissions:view',
  /** Classificar, atribuir, anotar e responder. */
  SUBMISSIONS_MANAGE: 'submissions:manage',
  /** Arquivar uma manifestação. */
  SUBMISSIONS_ARCHIVE: 'submissions:archive',
  /** Categorias, equipe e configurações da empresa (fase 6). */
  SETTINGS_MANAGE: 'settings:manage',
};

/**
 * Operador opera o canal; administração sensível fica com quem responde pela
 * empresa. Arquivar é destrutivo do ponto de vista da operação, então também
 * não é do operador.
 */
const BY_ROLE = {
  owner: Object.values(PERMISSIONS),
  admin: Object.values(PERMISSIONS),
  operator: [PERMISSIONS.SUBMISSIONS_VIEW, PERMISSIONS.SUBMISSIONS_MANAGE],
};

/** Papel desconhecido não recebe permissão nenhuma. */
export function permissionsOf(role) {
  return BY_ROLE[role] ?? [];
}

/** Diz se o usuário da sessão pode fazer algo. */
export function can(user, permission) {
  if (!user?.role) return false;
  return permissionsOf(user.role).includes(permission);
}

// Um papel novo em constants.js sem permissão declarada aqui seria um usuário
// que entra no painel e não consegue fazer nada — melhor quebrar o build.
for (const role of ROLE_VALUES) {
  if (!BY_ROLE[role]) {
    throw new Error(`Papel "${role}" não tem permissões declaradas.`);
  }
}
