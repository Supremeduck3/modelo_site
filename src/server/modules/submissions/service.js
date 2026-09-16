import { SUBMISSION_EVENTS } from '@/lib/submissions/constants';
import { generateProtocol } from '@/lib/submissions/protocol';
import { validateSubmissionInput } from '@/lib/submissions/schema';
import { prisma } from '@/server/db/client';
import { getCurrentCompany } from '@/server/modules/company/service';

/** Erro de negócio com código estável, para a rota traduzir em HTTP. */
export class SubmissionError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'SubmissionError';
    this.code = code;
    this.details = details;
  }
}

const MAX_PROTOCOL_ATTEMPTS = 5;

/**
 * Remove caracteres de controle do texto livre.
 * Não tentamos "limpar HTML": o conteúdo é armazenado como texto e renderizado
 * como texto — o escape é responsabilidade da camada de apresentação.
 */
function sanitizeText(value) {
  if (typeof value !== 'string') return value;
  // biome-ignore lint/suspicious/noControlCharactersInRegex: a intenção é justamente remover caracteres de controle.
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

function sanitizeInput(data) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, sanitizeText(value)]),
  );
}

/**
 * Cria uma manifestação a partir da entrada pública.
 *
 * Revalida tudo no servidor, confere a categoria contra a empresa da
 * implantação e grava manifestação + primeiro evento de histórico na mesma
 * transação, para nunca existir manifestação sem trilha de auditoria.
 */
export async function createSubmission(rawInput) {
  const { success, data, errors } = validateSubmissionInput(rawInput);

  if (!success) {
    throw new SubmissionError('validation_error', 'Dados inválidos.', errors);
  }

  const input = sanitizeInput(data);
  const company = await getCurrentCompany();

  let categoryId = null;
  if (input.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: input.categoryId, companyId: company.id, isActive: true },
      select: { id: true },
    });

    if (!category) {
      throw new SubmissionError('validation_error', 'Dados inválidos.', {
        categoryId: 'Categoria indisponível.',
      });
    }
    categoryId = category.id;
  }

  for (let attempt = 1; attempt <= MAX_PROTOCOL_ATTEMPTS; attempt += 1) {
    const protocol = generateProtocol();

    try {
      return await prisma.$transaction(async (tx) => {
        const submission = await tx.submission.create({
          data: {
            companyId: company.id,
            protocol,
            type: input.type,
            categoryId,
            title: input.title,
            description: input.description,
            contactName: input.contactName,
            contactEmail: input.contactEmail,
            contactPhone: input.contactPhone,
            consentAt: input.consent ? new Date() : null,
          },
          // O id interno não sai daqui: o identificador público é o protocolo.
          select: {
            id: true,
            protocol: true,
            type: true,
            title: true,
            status: true,
            createdAt: true,
          },
        });

        await tx.submissionEvent.create({
          data: {
            submissionId: submission.id,
            eventType: SUBMISSION_EVENTS.CREATED,
            toValue: submission.status,
          },
        });

        // Devolvemos apenas o que o visitante precisa ver.
        const { id: _id, ...publicView } = submission;
        return publicView;
      });
    } catch (error) {
      // P2002 = violação de unicidade: só pode ser o protocolo, então
      // sorteamos outro. Qualquer outro erro sobe.
      const isProtocolCollision =
        error?.code === 'P2002' &&
        String(error?.meta?.target ?? '').includes('protocol');

      if (!isProtocolCollision || attempt === MAX_PROTOCOL_ATTEMPTS) {
        throw error;
      }
    }
  }

  throw new SubmissionError(
    'protocol_exhausted',
    'Não foi possível gerar um protocolo único.',
  );
}

/** Status que ainda pedem ação da equipe. */
const OPEN_STATUSES = ['new', 'in_review', 'in_progress', 'waiting_customer'];

/**
 * Resumo das manifestações para o painel.
 *
 * Recebe o `companyId` da sessão em vez de resolver a empresa aqui: assim a
 * consulta só existe a partir de um usuário autenticado, e o filtro por empresa
 * é obrigatório na assinatura da função, não uma lembrança de quem chama.
 */
export async function getSubmissionSummary(companyId) {
  if (!companyId) throw new Error('Resumo exige companyId.');

  const where = { companyId, archivedAt: null };

  const [byStatus, total] = await Promise.all([
    prisma.submission.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
    }),
    prisma.submission.count({ where }),
  ]);

  const counts = Object.fromEntries(
    byStatus.map((row) => [row.status, row._count._all]),
  );

  return {
    total,
    open: OPEN_STATUSES.reduce((sum, status) => sum + (counts[status] ?? 0), 0),
    byStatus: counts,
  };
}
