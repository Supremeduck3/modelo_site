import { validateOffering } from '@/lib/catalog/schema';
import { prisma } from '@/server/db/client';
import { getCurrentCompany } from '@/server/modules/company/service';

/** Erro de negócio com código estável, para a rota traduzir em HTTP. */
export class CatalogError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'CatalogError';
    this.code = code;
    this.details = details;
  }
}

const OFFERING_SELECT = {
  id: true,
  name: true,
  description: true,
  category: true,
  priceCents: true,
  priceFrom: true,
  durationMinutes: true,
  bookable: true,
  isActive: true,
  sortOrder: true,
};

function toData(input) {
  return {
    name: input.name,
    description: input.description,
    category: input.category,
    priceCents: input.price,
    priceFrom: input.priceFrom,
    durationMinutes: input.durationMinutes,
    bookable: input.bookable,
    isActive: input.isActive,
  };
}

/** Nome repetido é o erro de unicidade mais provável; vira mensagem de campo. */
function isDuplicateName(error) {
  return (
    error?.code === 'P2002' &&
    String(error?.meta?.target ?? '').includes('name')
  );
}

const duplicateError = () =>
  new CatalogError('validation_error', 'Dados inválidos.', {
    name: 'Já existe um serviço com esse nome.',
  });

/**
 * Todos os itens, ativos ou não, na ordem da tabela — para o painel.
 *
 * `companyId` vem da sessão e é obrigatório na assinatura: a consulta só existe
 * a partir de um usuário autenticado.
 */
export async function listOfferingsForPanel(companyId) {
  if (!companyId) throw new Error('Listagem exige companyId.');

  return prisma.serviceOffering.findMany({
    where: { companyId },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: OFFERING_SELECT,
  });
}

export async function createOffering({ companyId, input }) {
  const { success, data, errors } = validateOffering(input);
  if (!success) {
    throw new CatalogError('validation_error', 'Dados inválidos.', errors);
  }

  // Item novo entra no fim da tabela, que é onde quem acabou de criar procura.
  const ultimo = await prisma.serviceOffering.aggregate({
    where: { companyId },
    _max: { sortOrder: true },
  });

  try {
    return await prisma.serviceOffering.create({
      data: {
        companyId,
        ...toData(data),
        sortOrder: (ultimo._max.sortOrder ?? -1) + 1,
      },
      select: OFFERING_SELECT,
    });
  } catch (error) {
    if (isDuplicateName(error)) throw duplicateError();
    throw error;
  }
}

export async function updateOffering({ companyId, id, input }) {
  const { success, data, errors } = validateOffering(input);
  if (!success) {
    throw new CatalogError('validation_error', 'Dados inválidos.', errors);
  }

  try {
    // `updateMany` com companyId no filtro: id de outra empresa não acha nada,
    // em vez de alterar um registro que não é desta implantação.
    const { count } = await prisma.serviceOffering.updateMany({
      where: { id: String(id), companyId },
      data: toData(data),
    });
    if (count === 0) {
      throw new CatalogError('not_found', 'Serviço não encontrado.');
    }
  } catch (error) {
    if (isDuplicateName(error)) throw duplicateError();
    throw error;
  }

  return prisma.serviceOffering.findUnique({
    where: { id: String(id) },
    select: OFFERING_SELECT,
  });
}

/**
 * Exclui um item.
 *
 * Pode excluir mesmo com pedido de agendamento apontando para ele: o pedido
 * guarda o nome do serviço no momento em que foi feito, e a referência é
 * `onDelete: SetNull`. O histórico não perde o que o cliente pediu.
 */
export async function deleteOffering({ companyId, id }) {
  const { count } = await prisma.serviceOffering.deleteMany({
    where: { id: String(id), companyId },
  });
  if (count === 0) {
    throw new CatalogError('not_found', 'Serviço não encontrado.');
  }
  return { deleted: true };
}

/**
 * Sobe ou desce um item uma posição.
 *
 * Troca a ordem com o vizinho numa transação. Antes, renumera a tabela
 * inteira: `sortOrder` pode ter empates (itens criados antes da ordem existir,
 * importação), e trocar dois números iguais não muda nada na tela.
 */
export async function moveOffering({ companyId, id, direction }) {
  if (direction !== 'up' && direction !== 'down') {
    throw new CatalogError('validation_error', 'Direção inválida.');
  }

  return prisma.$transaction(async (tx) => {
    const itens = await tx.serviceOffering.findMany({
      where: { companyId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true },
    });

    const indice = itens.findIndex((item) => item.id === String(id));
    if (indice === -1) {
      throw new CatalogError('not_found', 'Serviço não encontrado.');
    }

    const alvo = direction === 'up' ? indice - 1 : indice + 1;
    if (alvo < 0 || alvo >= itens.length) return { moved: false };

    [itens[indice], itens[alvo]] = [itens[alvo], itens[indice]];

    await Promise.all(
      itens.map((item, ordem) =>
        tx.serviceOffering.update({
          where: { id: item.id },
          data: { sortOrder: ordem },
        }),
      ),
    );

    return { moved: true };
  });
}

/**
 * Tabela pública: só itens ativos, agrupados por categoria na ordem da tabela.
 *
 * A categoria de um grupo é a do primeiro item em que ela aparece — assim a
 * empresa ordena os grupos só mexendo na ordem dos itens.
 */
export async function getPublicCatalog() {
  const company = await getCurrentCompany();
  const itens = await prisma.serviceOffering.findMany({
    where: { companyId: company.id, isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      priceCents: true,
      priceFrom: true,
      durationMinutes: true,
    },
  });

  const grupos = new Map();
  for (const item of itens) {
    const chave = item.category ?? '';
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(item);
  }

  return [...grupos].map(([category, items]) => ({
    category: category || null,
    items,
  }));
}

/** Itens que o cliente pode escolher no pedido de agendamento. */
export async function listBookableOfferings() {
  const company = await getCurrentCompany();
  return prisma.serviceOffering.findMany({
    where: { companyId: company.id, isActive: true, bookable: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      category: true,
      priceCents: true,
      priceFrom: true,
      durationMinutes: true,
    },
  });
}
