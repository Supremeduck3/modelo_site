import { SUBMISSION_EVENTS } from '@/lib/submissions/constants';
import {
  validateClassification,
  validateInternalNote,
  validatePublicResponse,
  validateSubmissionFilters,
} from '@/lib/submissions/management-schema';
import { prisma } from '@/server/db/client';
import { SubmissionError } from './service';

/**
 * Atendimento das manifestações no painel.
 *
 * Três regras valem em todas as funções deste módulo:
 *
 * 1. **`companyId` é parâmetro obrigatório, vindo da sessão.** Nenhuma consulta
 *    aqui resolve a empresa sozinha: o filtro entra na assinatura para não
 *    depender de alguém lembrar de aplicá-lo. Um id de manifestação de outra
 *    empresa simplesmente não é encontrado.
 * 2. **Nota interna nunca vira resposta pública.** São campos diferentes, com
 *    funções diferentes, e a projeção pública jamais inclui eventos.
 * 3. **Toda alteração relevante grava evento**, na mesma transação da alteração:
 *    não existe mudança de situação sem trilha de auditoria.
 */

/** Campos que a lista precisa. Descrição fica de fora: a tabela não a mostra. */
const LIST_SELECT = {
  id: true,
  protocol: true,
  type: true,
  title: true,
  status: true,
  priority: true,
  createdAt: true,
  resolvedAt: true,
  archivedAt: true,
  category: { select: { id: true, name: true } },
  assignee: { select: { id: true, name: true } },
};

/** Monta o `where` do Prisma a partir dos filtros já validados. */
function buildWhere(companyId, filters) {
  const where = {
    companyId,
    // Arquivadas ficam fora por padrão: a lista é a fila de trabalho.
    archivedAt: filters.archived ? { not: null } : null,
  };

  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;
  if (filters.priority) where.priority = filters.priority;
  if (filters.categoryId) where.categoryId = filters.categoryId;

  if (filters.assignedTo === 'nobody') {
    where.assignedTo = null;
  } else if (filters.assignedTo) {
    where.assignedTo = filters.assignedTo;
  }

  if (filters.search) {
    // Protocolo e assunto: é por um dos dois que a equipe procura quando o
    // visitante liga. A descrição fica fora de propósito — varrer texto longo
    // sem índice degrada a lista inteira conforme a base cresce.
    where.OR = [
      { protocol: { contains: filters.search, mode: 'insensitive' } },
      { title: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return where;
}

/**
 * Página da lista de manifestações.
 *
 * Devolve `{ items, total, page, pageSize, pageCount, filters }` — os filtros
 * já saneados voltam junto para a tela refletir o que de fato foi aplicado, e
 * não o que veio na URL.
 */
export async function listSubmissions(companyId, rawFilters = {}) {
  if (!companyId) throw new Error('Lista exige companyId.');

  // A validação dos filtros nunca recusa (valor estranho é descartado), mas o
  // fallback existe para a fila de trabalho jamais depender disso.
  const parsed = validateSubmissionFilters(rawFilters);
  const filters = parsed.data ?? validateSubmissionFilters({}).data;
  const where = buildWhere(companyId, filters);

  const [total, items] = await Promise.all([
    prisma.submission.count({ where }),
    prisma.submission.findMany({
      where,
      select: LIST_SELECT,
      // Mais recentes primeiro; o id desempata para a paginação não repetir
      // nem pular registro quando duas chegam no mesmo instante.
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    pageCount: Math.max(1, Math.ceil(total / filters.pageSize)),
    filters,
  };
}

/**
 * Detalhe de uma manifestação, com histórico.
 *
 * Devolve `null` quando o id não existe ou é de outra empresa — quem chama
 * responde 404 nos dois casos, para não confirmar a existência de um registro
 * alheio.
 */
export async function getSubmissionDetail(companyId, id) {
  if (!companyId) throw new Error('Detalhe exige companyId.');

  return prisma.submission.findFirst({
    where: { id, companyId },
    select: {
      ...LIST_SELECT,
      description: true,
      contactName: true,
      contactEmail: true,
      contactPhone: true,
      consentAt: true,
      publicResponse: true,
      updatedAt: true,
      events: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          eventType: true,
          fromValue: true,
          toValue: true,
          note: true,
          createdAt: true,
          actor: { select: { id: true, name: true } },
        },
      },
    },
  });
}

/** Carrega a manifestação garantindo a empresa, ou lança 404 de domínio. */
async function requireSubmission(companyId, id, select) {
  const submission = await prisma.submission.findFirst({
    where: { id, companyId },
    select: { id: true, ...select },
  });

  if (!submission) {
    throw new SubmissionError('not_found', 'Manifestação não encontrada.');
  }

  return submission;
}

/** Situações que encerram o atendimento e carimbam `resolvedAt`. */
const CLOSING_STATUSES = new Set(['resolved', 'closed']);

/**
 * Classifica uma manifestação: situação, prioridade, categoria e responsável.
 *
 * Cada campo que muda de fato vira um evento. Campos ausentes ficam como estão,
 * e `null` remove — por isso a comparação é contra `undefined`, não contra
 * valor falso.
 */
export async function classifySubmission({ companyId, actorId, id, input }) {
  const { success, data, errors } = validateClassification(input);
  if (!success) {
    throw new SubmissionError('validation_error', 'Dados inválidos.', errors);
  }

  const current = await requireSubmission(companyId, id, {
    status: true,
    priority: true,
    categoryId: true,
    assignedTo: true,
    resolvedAt: true,
  });

  // Categoria e responsável precisam pertencer a esta empresa: sem conferir,
  // um id colado de fora ligaria a manifestação a um registro alheio.
  if (data.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, companyId },
      select: { id: true },
    });
    if (!category) {
      throw new SubmissionError('validation_error', 'Dados inválidos.', {
        categoryId: 'Categoria indisponível.',
      });
    }
  }

  if (data.assignedTo) {
    const assignee = await prisma.companyUser.findFirst({
      where: { id: data.assignedTo, companyId, isActive: true },
      select: { id: true },
    });
    if (!assignee) {
      throw new SubmissionError('validation_error', 'Dados inválidos.', {
        assignedTo: 'Responsável indisponível.',
      });
    }
  }

  const changes = {};
  const events = [];

  const track = (field, eventType) => {
    if (data[field] === undefined) return;
    if (data[field] === current[field]) return;

    changes[field] = data[field];
    events.push({
      eventType,
      fromValue: current[field] ?? null,
      toValue: data[field] ?? null,
    });
  };

  track('status', SUBMISSION_EVENTS.STATUS_CHANGED);
  track('priority', SUBMISSION_EVENTS.PRIORITY_CHANGED);
  track('categoryId', SUBMISSION_EVENTS.CATEGORY_CHANGED);
  track('assignedTo', SUBMISSION_EVENTS.ASSIGNED);

  // Nada mudou de verdade: não gravamos evento vazio, que só poluiria o
  // histórico de quem for auditar depois.
  if (events.length === 0) {
    return { changed: false };
  }

  if (changes.status !== undefined) {
    if (CLOSING_STATUSES.has(changes.status)) {
      // Não sobrescrevemos: a primeira resolução é a que conta para prazo.
      changes.resolvedAt = current.resolvedAt ?? new Date();
    } else {
      // Reabriu: o carimbo sai, senão a manifestação contaria como resolvida.
      changes.resolvedAt = null;
    }
  }

  await prisma.$transaction([
    prisma.submission.update({ where: { id }, data: changes }),
    prisma.submissionEvent.createMany({
      data: events.map((event) => ({ ...event, submissionId: id, actorId })),
    }),
  ]);

  return { changed: true, events: events.length };
}

/**
 * Registra uma nota interna.
 *
 * A nota vive apenas no histórico, nunca no corpo da manifestação: é o que
 * garante que ela não acompanhe nenhuma projeção pública.
 */
export async function addInternalNote({ companyId, actorId, id, input }) {
  const { success, data, errors } = validateInternalNote(input);
  if (!success) {
    throw new SubmissionError('validation_error', 'Dados inválidos.', errors);
  }

  await requireSubmission(companyId, id, {});

  const event = await prisma.submissionEvent.create({
    data: {
      submissionId: id,
      actorId,
      eventType: SUBMISSION_EVENTS.INTERNAL_NOTE,
      note: data.note,
    },
    select: { id: true, createdAt: true },
  });

  return event;
}

/**
 * Responde publicamente ao visitante.
 *
 * A resposta substitui a anterior no campo público, mas cada versão fica no
 * histórico: o que foi dito ao visitante em cada momento é auditável.
 * Devolve o que a camada de e-mail precisa para avisar quem registrou.
 */
export async function respondToSubmission({ companyId, actorId, id, input }) {
  const { success, data, errors } = validatePublicResponse(input);
  if (!success) {
    throw new SubmissionError('validation_error', 'Dados inválidos.', errors);
  }

  const current = await requireSubmission(companyId, id, {
    status: true,
    resolvedAt: true,
    protocol: true,
    title: true,
    type: true,
    contactName: true,
    contactEmail: true,
  });

  const changes = { publicResponse: data.response };
  const events = [
    {
      eventType: SUBMISSION_EVENTS.PUBLIC_RESPONSE,
      note: data.response,
      submissionId: id,
      actorId,
    },
  ];

  if (data.status && data.status !== current.status) {
    changes.status = data.status;
    changes.resolvedAt = CLOSING_STATUSES.has(data.status)
      ? (current.resolvedAt ?? new Date())
      : null;

    events.push({
      eventType: SUBMISSION_EVENTS.STATUS_CHANGED,
      fromValue: current.status,
      toValue: data.status,
      submissionId: id,
      actorId,
    });
  }

  await prisma.$transaction([
    prisma.submission.update({ where: { id }, data: changes }),
    prisma.submissionEvent.createMany({ data: events }),
  ]);

  return {
    submission: {
      protocol: current.protocol,
      title: current.title,
      type: current.type,
      contactName: current.contactName,
      contactEmail: current.contactEmail,
      status: changes.status ?? current.status,
    },
    response: data.response,
  };
}

/**
 * Arquiva ou desarquiva.
 *
 * A especificação pede arquivamento em vez de exclusão física: o registro sai
 * da fila de trabalho mas continua auditável.
 */
export async function setSubmissionArchived({
  companyId,
  actorId,
  id,
  archived,
}) {
  const current = await requireSubmission(companyId, id, { archivedAt: true });
  const isArchived = current.archivedAt !== null;

  if (isArchived === archived) return { changed: false };

  const archivedAt = archived ? new Date() : null;

  await prisma.$transaction([
    prisma.submission.update({ where: { id }, data: { archivedAt } }),
    prisma.submissionEvent.create({
      data: {
        submissionId: id,
        actorId,
        eventType: SUBMISSION_EVENTS.STATUS_CHANGED,
        fromValue: isArchived ? 'archived' : 'active',
        toValue: archived ? 'archived' : 'active',
      },
    }),
  ]);

  return { changed: true };
}

/** Equipe ativa, para o seletor de responsável. */
export async function listAssignableUsers(companyId) {
  if (!companyId) throw new Error('Lista de responsáveis exige companyId.');

  return prisma.companyUser.findMany({
    where: { companyId, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}

/** Categorias da empresa, incluindo inativas, para filtrar o histórico. */
export async function listAllCategories(companyId) {
  if (!companyId) throw new Error('Lista de categorias exige companyId.');

  return prisma.category.findMany({
    where: { companyId },
    select: { id: true, name: true, isActive: true },
    orderBy: { name: 'asc' },
  });
}
