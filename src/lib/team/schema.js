import { z } from 'zod';
import { ROLE_VALUES } from '../auth/constants.js';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '../auth/password-rules.js';

/**
 * Entradas da tela de equipe, compartilhadas com os formulários do painel.
 *
 * O papel "owner" não entra no convite nem na troca de papel: ele é único por
 * implantação e muda só pela transferência, que é uma ação à parte.
 */

const trimmed = (value) => (typeof value === 'string' ? value.trim() : value);

/** Papéis que podem ser atribuídos livremente na equipe. */
export const ASSIGNABLE_ROLES = ROLE_VALUES.filter((role) => role !== 'owner');

const emailField = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
  z
    .string()
    .min(1, 'Informe o e-mail.')
    .max(200, 'E-mail longo demais.')
    .email('Informe um e-mail válido.'),
);

export const inviteMemberSchema = z.object({
  name: z.preprocess(
    trimmed,
    z
      .string()
      .min(2, 'Informe o nome da pessoa.')
      .max(120, 'O nome deve ter no máximo 120 caracteres.'),
  ),
  email: emailField,
  role: z.enum(ASSIGNABLE_ROLES, { message: 'Escolha um perfil válido.' }),
});

export const changeRoleSchema = z.object({
  role: z.enum(ASSIGNABLE_ROLES, { message: 'Escolha um perfil válido.' }),
});

export const setActiveSchema = z.object({
  isActive: z.boolean({ message: 'Informe a situação do acesso.' }),
});

/**
 * Ativação da conta pelo link do convite.
 *
 * É a primeira senha da pessoa, então a política vale aqui — diferente do
 * login, onde exigir a política recusaria a senha de um usuário antigo.
 */
export const acceptInviteSchema = z
  .object({
    token: z.preprocess(
      trimmed,
      z.string().min(1, 'Link de convite inválido.'),
    ),
    password: z
      .string({ message: 'Informe a senha.' })
      .min(
        PASSWORD_MIN_LENGTH,
        `A senha precisa de ao menos ${PASSWORD_MIN_LENGTH} caracteres.`,
      )
      .max(
        PASSWORD_MAX_LENGTH,
        `A senha deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`,
      ),
    passwordConfirmation: z.string({ message: 'Repita a senha.' }),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.passwordConfirmation) {
      ctx.addIssue({
        code: 'custom',
        path: ['passwordConfirmation'],
        message: 'As senhas não coincidem.',
      });
    }
  });

/** Confirmação explícita da transferência, para não acontecer por engano. */
export const transferOwnershipSchema = z.object({
  userId: z.preprocess(
    trimmed,
    z.string().min(1, 'Escolha para quem transferir.'),
  ),
  confirmation: z.literal(true, {
    message: 'Confirme que entende que perderá o papel de responsável.',
  }),
});

function flatten(result) {
  if (result.success) {
    return { success: true, data: result.data, errors: {} };
  }

  const errors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] ?? 'form';
    if (!errors[field]) errors[field] = issue.message;
  }

  return { success: false, data: null, errors };
}

export function validateInviteMember(input) {
  return flatten(inviteMemberSchema.safeParse(input));
}

export function validateChangeRole(input) {
  return flatten(changeRoleSchema.safeParse(input));
}

export function validateSetActive(input) {
  return flatten(setActiveSchema.safeParse(input));
}

export function validateAcceptInvite(input) {
  return flatten(acceptInviteSchema.safeParse(input));
}

export function validateTransferOwnership(input) {
  return flatten(transferOwnershipSchema.safeParse(input));
}
