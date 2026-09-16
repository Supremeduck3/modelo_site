/**
 * Semeia a implantação com os dados mínimos para operar.
 *
 * Idempotente: pode rodar novamente sem duplicar registros. Os dados da empresa
 * vêm da configuração do site, para não existir um segundo lugar com o nome e
 * os contatos do cliente.
 */
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/server/lib/password.js';

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

  await seedFirstUser(company);
}

/**
 * Primeiro usuário do painel.
 *
 * Nunca sobrescreve um usuário existente: se a senha fosse regravada a cada
 * seed, rodar o comando de novo em produção desfaria silenciosamente a troca de
 * senha feita pela empresa. Sem as variáveis definidas o seed só avisa — não
 * existe usuário padrão com senha conhecida.
 */
async function seedFirstUser(company) {
  const email = (process.env.SEED_ADMIN_EMAIL ?? '').trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? '';
  const name = (process.env.SEED_ADMIN_NAME ?? '').trim() || 'Responsável';

  if (!email || !password) {
    console.log(
      'Nenhum usuário do painel criado: defina SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD e rode o seed novamente.',
    );
    return;
  }

  const existing = await prisma.companyUser.findUnique({ where: { email } });
  if (existing) {
    console.log(`Usuário do painel já existe: ${email} (senha preservada)`);
    return;
  }

  await prisma.companyUser.create({
    data: {
      companyId: company.id,
      name,
      email,
      passwordHash: await hashPassword(password),
      role: 'owner',
    },
  });

  console.log(`Usuário do painel criado: ${email} (responsável)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
