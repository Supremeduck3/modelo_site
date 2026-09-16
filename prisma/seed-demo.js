/**
 * Dados de demonstração para exercitar o painel.
 *
 * Só manifestações: a empresa e as categorias vêm do seed normal. Serve para
 * conferir lista, filtros, paginação e histórico sem precisar preencher o
 * formulário público dezenas de vezes.
 *
 * NÃO rode em produção: os registros são fictícios e se misturariam às
 * manifestações reais da empresa. O script recusa `NODE_ENV=production`.
 */
import { randomInt } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ALPHABET = 'ACDEFGHJKLMNPQRTUVWXY2346789';
const TYPES = ['complaint', 'compliment', 'suggestion', 'question', 'request'];
const STATUSES = [
  'new',
  'in_review',
  'in_progress',
  'waiting_customer',
  'resolved',
];
const PRIORITIES = ['low', 'normal', 'normal', 'high', 'urgent'];

const ASSUNTOS = [
  'Atendimento demorado na unidade central',
  'Elogio à equipe de instalação',
  'Sugestão de horário estendido no sábado',
  'Dúvida sobre a garantia do serviço',
  'Solicitação de segunda via do comprovante',
  'Cobrança divergente do orçamento',
  'Reagendamento da visita técnica',
  'Material entregue incompleto',
];

function protocol(date) {
  const bloco = () =>
    Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join(
      '',
    );
  return `${date.getFullYear()}-${bloco()}-${bloco()}`;
}

function pick(list) {
  return list[randomInt(list.length)];
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'seed-demo não roda em produção: os dados são fictícios e se misturariam aos reais.',
    );
  }

  const total = Number.parseInt(process.env.SEED_DEMO_COUNT ?? '35', 10);

  const company = await prisma.company.findFirst({
    orderBy: { createdAt: 'asc' },
  });
  if (!company) {
    throw new Error('Rode `npm run db:seed` antes: não há empresa cadastrada.');
  }

  const categories = await prisma.category.findMany({
    where: { companyId: company.id },
    select: { id: true },
  });

  for (let index = 0; index < total; index += 1) {
    // Espalha no tempo para a ordenação por data ter o que ordenar.
    const createdAt = new Date(Date.now() - index * 7 * 3600 * 1000);
    const status = pick(STATUSES);

    await prisma.submission.create({
      data: {
        companyId: company.id,
        protocol: protocol(createdAt),
        type: pick(TYPES),
        categoryId: categories.length > 0 ? pick(categories).id : null,
        title: `${pick(ASSUNTOS)} (demo ${index + 1})`,
        description:
          'Registro de demonstração criado por prisma/seed-demo.js. ' +
          'Serve para conferir a lista, os filtros e o histórico do painel.',
        contactName: 'Visitante de Demonstração',
        contactEmail: `demo${index + 1}@exemplo.invalid`,
        status,
        priority: pick(PRIORITIES),
        resolvedAt: status === 'resolved' ? createdAt : null,
        createdAt,
        events: {
          create: { eventType: 'created', toValue: 'new', createdAt },
        },
      },
    });
  }

  console.log(`Manifestações de demonstração criadas: ${total}`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
