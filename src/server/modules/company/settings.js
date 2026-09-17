import {
  validateCategory,
  validateCategoryActive,
  validateCompanySettings,
} from '@/lib/company/schema';
import { prisma } from '@/server/db/client';

/**
 * Categorias e dados operacionais da empresa.
 *
 * Como nos demais módulos do painel, `companyId` é parâmetro obrigatório vindo
 * da sessão: nenhuma consulta aqui resolve a empresa sozinha, e um id de outra
 * implantação simplesmente não é encontrado.
 */

/**
 * Normaliza `businessHours` vindo do banco.
 *
 * A coluna é `Json?`: pode conter o que qualquer versão anterior, seed ou
 * edição manual tiver gravado — objeto, string, lista com item nulo. A tela
 * espera uma lista de `{ days, hours }`, e é aqui, na fronteira, que isso é
 * garantido, em vez de cada componente se defender por conta própria.
 */
function normalizeBusinessHours(value) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((row) => row && typeof row === 'object' && !Array.isArray(row))
    .map((row) => ({
      days: String(row.days ?? ''),
      hours: String(row.hours ?? ''),
    }));
}

/** Erro de domínio, com código estável para a rota traduzir. */
export class CompanyError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'CompanyError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Categorias com a contagem de manifestações.
 *
 * A contagem não é enfeite: é ela que decide se a categoria pode ser excluída
 * ou apenas desativada.
 */
export async function listCategoriesForPanel(companyId) {
  if (!companyId) throw new Error('Lista de categorias exige companyId.');

  const categories = await prisma.category.findMany({
    where: { companyId },
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
      _count: { select: { submissions: true } },
    },
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
  });

  return categories.map(({ _count, ...category }) => ({
    ...category,
    submissionCount: _count.submissions,
  }));
}

/**
 * Traduz erros do Prisma em erros de domínio.
 *
 * Sem isto, uma linha que some entre a leitura e a escrita (outra aba, outra
 * pessoa) viraria 500 com stack no log, em vez do 404 que a tela sabe tratar.
 */
function asDomainError(error) {
  if (error?.code === 'P2002') {
    return new CompanyError(
      'duplicate',
      'Já existe uma categoria com esse nome.',
    );
  }
  if (error?.code === 'P2025') {
    return new CompanyError('not_found', 'Registro não encontrado.');
  }
  return error;
}

export async function createCategory({ companyId, input }) {
  const { success, data, errors } = validateCategory(input);
  if (!success) {
    throw new CompanyError('validation_error', 'Dados inválidos.', errors);
  }

  try {
    return await prisma.category.create({
      data: { companyId, name: data.name, description: data.description },
      select: { id: true, name: true, description: true, isActive: true },
    });
  } catch (error) {
    throw asDomainError(error);
  }
}

/** Carrega a categoria garantindo a empresa, ou lança 404 de domínio. */
async function requireCategory(companyId, id) {
  const category = await prisma.category.findFirst({
    where: { id, companyId },
    select: {
      id: true,
      name: true,
      isActive: true,
      _count: { select: { submissions: true } },
    },
  });

  if (!category) {
    throw new CompanyError('not_found', 'Categoria não encontrada.');
  }

  return category;
}

export async function updateCategory({ companyId, id, input }) {
  await requireCategory(companyId, id);

  // O corpo traz `isActive` (ligar/desligar) ou nome e descrição (edição). São
  // ações diferentes na tela, e separá-las aqui evita que uma edição de texto
  // reative sem querer uma categoria desligada.
  if (input && 'isActive' in input) {
    if ('name' in input || 'description' in input) {
      // Misturar as duas ações silenciaria uma delas: responderíamos 200 tendo
      // aplicado só metade do que o corpo pedia.
      throw new CompanyError('validation_error', 'Dados inválidos.', {
        form: 'Ligue/desligue a categoria ou edite o texto, uma ação por vez.',
      });
    }

    const { success, data, errors } = validateCategoryActive(input);
    if (!success) {
      throw new CompanyError('validation_error', 'Dados inválidos.', errors);
    }

    // `updateMany` com companyId no filtro: o isolamento não depende só da
    // leitura anterior.
    await prisma.category.updateMany({
      where: { id, companyId },
      data: { isActive: data.isActive },
    });

    return prisma.category.findFirst({
      where: { id, companyId },
      select: { id: true, name: true, description: true, isActive: true },
    });
  }

  const { success, data, errors } = validateCategory(input);
  if (!success) {
    throw new CompanyError('validation_error', 'Dados inválidos.', errors);
  }

  try {
    await prisma.category.updateMany({
      where: { id, companyId },
      data: { name: data.name, description: data.description },
    });

    return await prisma.category.findFirst({
      where: { id, companyId },
      select: { id: true, name: true, description: true, isActive: true },
    });
  } catch (error) {
    throw asDomainError(error);
  }
}

/**
 * Exclui uma categoria — apenas se nenhuma manifestação a usa.
 *
 * `Submission.categoryId` tem `onDelete: SetNull`: excluir uma categoria em uso
 * apagaria em silêncio a classificação de manifestações já atendidas. Quando há
 * uso, o caminho é desativar, que tira do formulário público e preserva o
 * histórico.
 */
export async function deleteCategory({ companyId, id }) {
  // Empresa e ausência de uso vão no mesmo `where`, e não numa checagem
  // anterior: entre contar e excluir, uma manifestação pública pode chegar e
  // referenciar a categoria — e o `onDelete: SetNull` apagaria a classificação
  // dela em silêncio. O banco decide, de uma vez só.
  const { count } = await prisma.category.deleteMany({
    where: { id, companyId, submissions: { none: {} } },
  });

  if (count > 0) return { deleted: true };

  // Não excluiu: descobrir se é inexistente/de outra empresa ou se está em uso.
  const category = await requireCategory(companyId, id);

  throw new CompanyError(
    'category_in_use',
    'Esta categoria já foi usada em manifestações. Desative-a em vez de excluir, para não apagar a classificação do que já foi atendido.',
    { submissionCount: category._count.submissions },
  );
}

const COMPANY_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  website: true,
  description: true,
  segment: true,
  city: true,
  state: true,
  businessHours: true,
};

/** Dados operacionais da empresa desta implantação. */
export async function getCompanySettings(companyId) {
  if (!companyId) throw new Error('Configurações exigem companyId.');

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: COMPANY_SELECT,
  });

  if (!company) {
    throw new CompanyError('not_found', 'Empresa não encontrada.');
  }

  return {
    ...company,
    businessHours: normalizeBusinessHours(company.businessHours),
  };
}

/**
 * Salva os dados operacionais.
 *
 * Estes campos alimentam os e-mails e o painel. A identidade do site público
 * continua vindo da configuração da implantação — é decisão do implementador, e
 * não muda por aqui.
 */
export async function updateCompanySettings({ companyId, input }) {
  const { success, data, errors } = validateCompanySettings(input);
  if (!success) {
    throw new CompanyError('validation_error', 'Dados inválidos.', errors);
  }

  let company;
  try {
    company = await prisma.company.update({
      where: { id: companyId },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        website: data.website,
        description: data.description,
        segment: data.segment,
        city: data.city,
        state: data.state,
        businessHours: data.businessHours,
      },
      select: COMPANY_SELECT,
    });
  } catch (error) {
    throw asDomainError(error);
  }

  return {
    ...company,
    businessHours: normalizeBusinessHours(company.businessHours),
  };
}
