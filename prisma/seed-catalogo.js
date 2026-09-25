/**
 * Tabela de serviços de exemplo, para ver a seção de preços e o agendamento
 * funcionando antes de a empresa cadastrar os próprios itens.
 *
 *   npm run db:seed:catalogo            # serviços genéricos
 *   npm run db:seed:catalogo -- --salao # tabela de salão de beleza
 *
 * Só grava se a tabela da empresa estiver vazia: rodar de novo, ou depois de
 * a empresa ter cadastrado a dela, não mistura nada. Os itens são editáveis e
 * excluíveis pelo painel como qualquer outro.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const GENERICO = [
  {
    name: 'Visita técnica',
    category: 'Atendimento',
    priceCents: 8000,
    durationMinutes: 60,
  },
  {
    name: 'Instalação',
    category: 'Atendimento',
    priceCents: 15000,
    priceFrom: true,
    durationMinutes: 120,
  },
  {
    name: 'Manutenção preventiva',
    category: 'Planos',
    priceCents: 12000,
    durationMinutes: 90,
  },
  {
    name: 'Consultoria',
    category: 'Planos',
    priceCents: null,
    durationMinutes: 60,
    description: 'Diagnóstico e recomendação por escrito.',
  },
];

const SALAO = [
  {
    name: 'Corte feminino',
    category: 'Cabelo',
    priceCents: 8000,
    durationMinutes: 60,
  },
  {
    name: 'Corte masculino',
    category: 'Cabelo',
    priceCents: 4500,
    durationMinutes: 30,
  },
  {
    name: 'Escova',
    category: 'Cabelo',
    priceCents: 5000,
    priceFrom: true,
    durationMinutes: 45,
    description: 'Valor varia com o comprimento.',
  },
  {
    name: 'Coloração',
    category: 'Cabelo',
    priceCents: 15000,
    priceFrom: true,
    durationMinutes: 120,
  },
  {
    name: 'Hidratação',
    category: 'Cabelo',
    priceCents: 7000,
    durationMinutes: 45,
  },
  {
    name: 'Manicure',
    category: 'Unhas',
    priceCents: 3500,
    durationMinutes: 40,
  },
  {
    name: 'Pedicure',
    category: 'Unhas',
    priceCents: 4000,
    durationMinutes: 45,
  },
  {
    name: 'Design de sobrancelha',
    category: 'Rosto',
    priceCents: 4000,
    durationMinutes: 30,
  },
  {
    name: 'Barba',
    category: 'Barbearia',
    priceCents: 3500,
    durationMinutes: 30,
  },
  {
    name: 'Noivas',
    category: 'Especiais',
    priceCents: null,
    bookable: false,
    description: 'Pacote sob medida. Fale com a gente.',
  },
];

async function main() {
  const lista = process.argv.includes('--salao') ? SALAO : GENERICO;

  const company = await prisma.company.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true },
  });
  if (!company) {
    throw new Error('Nenhuma empresa no banco. Rode `npm run db:setup` antes.');
  }

  const existentes = await prisma.serviceOffering.count({
    where: { companyId: company.id },
  });
  if (existentes > 0) {
    console.log(
      `A tabela de ${company.name} já tem ${existentes} serviço(s); nada foi gravado.`,
    );
    return;
  }

  await prisma.serviceOffering.createMany({
    data: lista.map((item, ordem) => ({
      companyId: company.id,
      sortOrder: ordem,
      priceFrom: false,
      bookable: true,
      ...item,
    })),
  });

  console.log(
    `${lista.length} serviços de exemplo criados para ${company.name}.`,
  );
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
