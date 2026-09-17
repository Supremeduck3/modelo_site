import {
  validateAcceptInvite,
  validateChangeRole,
  validateInviteMember,
  validateSetActive,
  validateTransferOwnership,
} from '@/lib/team/schema';
import { prisma } from '@/server/db/client';
import { hashPassword, PasswordPolicyError } from '@/server/lib/password';
import { generateResetToken, hashResetToken } from '@/server/lib/reset-token';
import { getCurrentCompany } from '@/server/modules/company/service';

/**
 * Equipe da empresa: convite, papel, desativação e transferência do
 * responsável.
 *
 * Três regras atravessam o módulo:
 *
 * 1. **`companyId` é parâmetro obrigatório**, como no atendimento: um usuário
 *    de outra implantação simplesmente não é encontrado.
 * 2. **Ninguém é excluído, só desativado.** `SubmissionEvent.actorId` aponta
 *    para o usuário com `onDelete: SetNull` — apagar de verdade transformaria
 *    todo o histórico dele em "sistema" e destruiria a auditoria que o
 *    atendimento constrói. Desativar corta o acesso na requisição seguinte,
 *    porque a sessão relê `isActive` do banco.
 * 3. **A empresa não pode se trancar fora.** Ninguém desativa a si mesmo, muda
 *    o próprio papel, nem mexe no responsável — que só sai do posto
 *    transferindo-o.
 */

/** Erro de domínio da equipe, com código estável para a rota traduzir. */
export class TeamError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'TeamError';
    this.code = code;
    this.details = details;
  }
}

/** Sete dias: quem convida depende de a pessoa abrir o e-mail. */
export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const MEMBER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  passwordHash: true,
  invitation: {
    select: { expiresAt: true, acceptedAt: true, createdAt: true },
  },
};

/**
 * Situação de acesso de cada pessoa, derivada e não armazenada.
 *
 * "Convite pendente" não é um campo: é a combinação de não ter senha com ter
 * convite não aceito. Guardar isso num campo criaria um segundo lugar para a
 * verdade, que sairia de sincronia na primeira exceção.
 */
function accessState(member) {
  if (member.passwordHash) {
    return member.isActive ? 'active' : 'disabled';
  }
  if (!member.invitation || member.invitation.acceptedAt) return 'disabled';
  return member.invitation.expiresAt > new Date()
    ? 'invited'
    : 'invite_expired';
}

function toMember(member) {
  const { passwordHash: _ignored, invitation, ...rest } = member;
  return {
    ...rest,
    access: accessState(member),
    invitedAt: invitation?.createdAt ?? null,
    inviteExpiresAt: invitation?.expiresAt ?? null,
  };
}

/**
 * Equipe inteira, ativos e inativos: a tela precisa dos dois.
 *
 * `detalhado` decide a projeção. Quem não administra o painel não precisa do
 * e-mail nem do último acesso de cada colega — é uma lista pronta para phishing
 * interno, e a tela dessa pessoa não tem nenhuma ação que dependa desses
 * campos. Quem pode administrar recebe tudo.
 */
export async function listTeam(companyId, { detalhado = true } = {}) {
  if (!companyId) throw new Error('Lista da equipe exige companyId.');

  const members = await prisma.companyUser.findMany({
    where: { companyId },
    select: MEMBER_SELECT,
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
  });

  return members.map((member) => {
    const publico = toMember(member);
    if (detalhado) return publico;

    const { email: _email, lastLoginAt: _lastLoginAt, ...reduzido } = publico;
    return reduzido;
  });
}

/** Carrega um integrante garantindo a empresa, ou lança 404 de domínio. */
async function requireMember(companyId, userId) {
  const member = await prisma.companyUser.findFirst({
    where: { id: userId, companyId },
    select: MEMBER_SELECT,
  });

  if (!member) {
    throw new TeamError('not_found', 'Usuário não encontrado.');
  }

  return member;
}

/**
 * Convida alguém para o painel.
 *
 * Cria a conta já inativa e sem senha, com um token de ativação. O token em
 * claro volta uma única vez para quem chamou: é ele que vai no e-mail e no link
 * copiável. Nunca definimos senha provisória — ela circularia por fora.
 */
export async function inviteMember({ companyId, actorId, input }) {
  const { success, data, errors } = validateInviteMember(input);
  if (!success) {
    throw new TeamError('validation_error', 'Dados inválidos.', errors);
  }

  const existing = await prisma.companyUser.findUnique({
    where: { email: data.email },
    select: { id: true, companyId: true },
  });

  if (existing) {
    // Mesmo se for de outra empresa: o e-mail é único na base e não temos como
    // criar a conta. Não dizemos de qual empresa — isso não é da conta de quem
    // convida.
    throw new TeamError('validation_error', 'Dados inválidos.', {
      email: 'Já existe um acesso com este e-mail.',
    });
  }

  const token = generateResetToken();

  const member = await prisma.companyUser.create({
    data: {
      companyId,
      name: data.name,
      email: data.email,
      role: data.role,
      isActive: false,
      passwordHash: null,
      invitation: {
        create: {
          tokenHash: hashResetToken(token),
          expiresAt: new Date(Date.now() + INVITE_TTL_MS),
          invitedById: actorId,
        },
      },
    },
    select: MEMBER_SELECT,
  });

  return { member: toMember(member), token };
}

/**
 * Gera um convite novo para quem ainda não ativou.
 *
 * O token anterior deixa de valer, porque a linha de convite é substituída —
 * um link antigo que tenha vazado para de servir.
 */
export async function resendInvite({ companyId, actorId, userId }) {
  const member = await requireMember(companyId, userId);

  if (member.passwordHash) {
    throw new TeamError(
      'already_active',
      'Esta pessoa já definiu a senha. Se ela perdeu o acesso, peça para usar "Esqueci minha senha".',
    );
  }

  const token = generateResetToken();

  await prisma.userInvitation.upsert({
    where: { companyUserId: userId },
    update: {
      tokenHash: hashResetToken(token),
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      acceptedAt: null,
      invitedById: actorId,
    },
    create: {
      companyUserId: userId,
      tokenHash: hashResetToken(token),
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      invitedById: actorId,
    },
  });

  return { member: toMember(member), token };
}

/**
 * Ativa ou desativa o acesso de alguém.
 *
 * Desativar é a "remoção" da especificação: o histórico continua atribuído à
 * pessoa e o acesso cai na requisição seguinte.
 */
export async function setMemberActive({ companyId, actorId, userId, input }) {
  const { success, data, errors } = validateSetActive(input);
  if (!success) {
    throw new TeamError('validation_error', 'Dados inválidos.', errors);
  }

  if (userId === actorId) {
    throw new TeamError(
      'forbidden',
      'Você não pode desativar o próprio acesso.',
    );
  }

  const member = await requireMember(companyId, userId);

  if (member.role === 'owner') {
    throw new TeamError(
      'forbidden',
      'O responsável não pode ser desativado. Transfira o papel antes.',
    );
  }

  // Convite pendente precisa ser cancelável. Sem isto, "desativar" alguém que
  // ainda não ativou não fazia nada (já estava inativo) e quem tivesse o link
  // — inclusive o dono de um e-mail digitado errado — ativava o acesso dentro
  // da validade de sete dias.
  const convitePendente =
    !member.passwordHash && !member.invitation?.acceptedAt;

  if (data.isActive === false && convitePendente) {
    await prisma.userInvitation.updateMany({
      where: { companyUserId: userId, acceptedAt: null },
      data: { acceptedAt: new Date() },
    });

    const cancelado = await requireMember(companyId, userId);
    return { changed: true, member: toMember(cancelado), inviteRevoked: true };
  }

  if (member.isActive === data.isActive) {
    return { changed: false, member: toMember(member) };
  }

  const updated = await prisma.companyUser.update({
    where: { id: userId },
    data: { isActive: data.isActive },
    select: MEMBER_SELECT,
  });

  return { changed: true, member: toMember(updated) };
}

/** Troca o perfil de alguém. O responsável só muda por transferência. */
export async function changeMemberRole({ companyId, actorId, userId, input }) {
  const { success, data, errors } = validateChangeRole(input);
  if (!success) {
    throw new TeamError('validation_error', 'Dados inválidos.', errors);
  }

  if (userId === actorId) {
    throw new TeamError('forbidden', 'Você não pode mudar o próprio perfil.');
  }

  const member = await requireMember(companyId, userId);

  if (member.role === 'owner') {
    throw new TeamError(
      'forbidden',
      'O perfil do responsável muda apenas pela transferência.',
    );
  }

  if (member.role === data.role) {
    return { changed: false, member: toMember(member) };
  }

  const updated = await prisma.companyUser.update({
    where: { id: userId },
    data: { role: data.role },
    select: MEMBER_SELECT,
  });

  return { changed: true, member: toMember(updated) };
}

/**
 * Transfere o papel de responsável.
 *
 * Só o responsável atual pode fazer isso, e a troca é atômica: as duas
 * atualizações na mesma transação, para não existir instante com dois
 * responsáveis nem com nenhum.
 *
 * Este é o gesto de entrega de uma implantação: quem implanta sai e a empresa
 * assume a conta.
 */
export async function transferOwnership({ companyId, actorId, input }) {
  const { success, data, errors } = validateTransferOwnership(input);
  if (!success) {
    throw new TeamError('validation_error', 'Dados inválidos.', errors);
  }

  const actor = await requireMember(companyId, actorId);
  if (actor.role !== 'owner') {
    throw new TeamError(
      'forbidden',
      'Apenas o responsável atual pode transferir o papel.',
    );
  }

  if (data.userId === actorId) {
    throw new TeamError('validation_error', 'Dados inválidos.', {
      userId: 'Escolha outra pessoa.',
    });
  }

  const target = await requireMember(companyId, data.userId);

  if (!target.isActive || !target.passwordHash) {
    throw new TeamError('validation_error', 'Dados inválidos.', {
      userId:
        'A pessoa precisa ter acesso ativo e já ter definido a senha para assumir.',
    });
  }

  await prisma.$transaction([
    prisma.companyUser.update({
      where: { id: data.userId },
      data: { role: 'owner' },
    }),
    // Quem transfere vira administrador: continua operando, sem o posto.
    prisma.companyUser.update({
      where: { id: actorId },
      data: { role: 'admin' },
    }),
  ]);

  return { newOwnerId: data.userId, previousOwnerId: actorId };
}

/** Mensagem única para convite inválido, expirado, já usado ou inexistente. */
const INVALID_INVITE =
  'Este convite não é mais válido. Peça um novo para quem administra o painel.';

/**
 * Lê um convite pelo token, só para a tela decidir o que mostrar.
 *
 * Devolve `null` em qualquer caso inválido — a tela não precisa saber o motivo,
 * e dizer "expirado" para um token inexistente confirmaria formatos válidos.
 */
export async function peekInvite(token) {
  const invitation = await prisma.userInvitation.findUnique({
    where: { tokenHash: hashResetToken(String(token ?? '')) },
    select: {
      expiresAt: true,
      acceptedAt: true,
      user: { select: { name: true, email: true, isActive: true } },
    },
  });

  const usable =
    invitation && !invitation.acceptedAt && invitation.expiresAt > new Date();

  if (!usable) return null;

  return { name: invitation.user.name, email: invitation.user.email };
}

/**
 * Aceita o convite: a pessoa define a própria senha e a conta passa a valer.
 *
 * Marcar o convite como aceito na mesma transação garante o uso único mesmo
 * com dois envios simultâneos do formulário.
 */
export async function acceptInvite(input) {
  const { success, data, errors } = validateAcceptInvite(input);
  if (!success) {
    throw new TeamError('validation_error', 'Dados inválidos.', errors);
  }

  const invitation = await prisma.userInvitation.findUnique({
    where: { tokenHash: hashResetToken(data.token) },
    select: {
      id: true,
      companyUserId: true,
      expiresAt: true,
      acceptedAt: true,
      user: { select: { companyId: true } },
    },
  });

  // A empresa é conferida aqui como no resto do módulo: um convite de uma base
  // restaurada de outra implantação não pode ativar acesso nesta.
  const company = await getCurrentCompany();

  const usable =
    invitation &&
    !invitation.acceptedAt &&
    invitation.expiresAt > new Date() &&
    invitation.user?.companyId === company.id;

  if (!usable) {
    throw new TeamError('invalid_token', INVALID_INVITE);
  }

  let passwordHash;
  try {
    passwordHash = await hashPassword(data.password);
  } catch (error) {
    if (error instanceof PasswordPolicyError) {
      throw new TeamError('validation_error', 'Dados inválidos.', {
        password: error.message,
      });
    }
    throw error;
  }

  const acceptedAt = new Date();

  const [, marked] = await prisma.$transaction([
    prisma.companyUser.update({
      where: { id: invitation.companyUserId },
      data: { passwordHash, isActive: true, passwordChangedAt: acceptedAt },
    }),
    prisma.userInvitation.updateMany({
      where: { id: invitation.id, acceptedAt: null },
      data: { acceptedAt },
    }),
  ]);

  if (marked.count === 0) {
    throw new TeamError('invalid_token', INVALID_INVITE);
  }

  return { userId: invitation.companyUserId };
}
