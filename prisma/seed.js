/**
 * Semeia a implantação com os dados mínimos para operar.
 *
 * Idempotente: pode rodar novamente sem duplicar registros. Os dados da empresa
 * vêm da configuração do site, para não existir um segundo lugar com o nome e
 * os contatos do cliente.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { name: 'Atendimento', description: 'Experiência no contato com a equipe.' },
  { name: 'Produto ou serviço', description: 'Execução, prazo e qualidade.' },
  { name: 'Financeiro', description: 'Cobrança, pagamento e reembolso.' },
  { name: 'Outros assuntos', description: 'Temas não cobertos pelas demais.' },
];

async function main() {
  const identity = { name: process.env.SEED_COMPANY_NAME ?? 'Demo Serviços' };

  const existing = await prisma.company.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  const company =
    existing ??
    (await prisma.company.create({
      data: {
        name: identity.name,
        status: 'active',
      },
    }));

  console.log(`Empresa: ${company.name} (${company.id})`);

  for (const category of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: {
        companyId_name: { companyId: company.id, name: category.name },
      },
      update: {},
      create: { ...category, companyId: company.id },
    });
  }

  const total = await prisma.category.count({
    where: { companyId: company.id },
  });
  console.log(`Categorias disponíveis: ${total}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
