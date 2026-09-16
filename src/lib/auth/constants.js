/**
 * Papéis dos usuários do painel.
 *
 * Ficam aqui, e não no banco, porque são domínio do molde: a empresa cria
 * usuários e escolhe o papel de cada um, mas não inventa papéis novos.
 */
export const ROLES = [
  { value: 'owner', label: 'Responsável' },
  { value: 'admin', label: 'Administrador' },
  { value: 'operator', label: 'Operador' },
];

export const ROLE_VALUES = ROLES.map((role) => role.value);

/** Papel de menor privilégio: o padrão de quem é criado sem escolha explícita. */
export const DEFAULT_ROLE = 'operator';

/** Rótulo legível de um papel, com fallback para o próprio valor. */
export function roleLabel(value) {
  return ROLES.find((role) => role.value === value)?.label ?? value;
}
