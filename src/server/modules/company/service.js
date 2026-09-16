import { prisma } from '@/server/db/client';

/**
 * Empresa desta implantação.
 *
 * Uma implantação atende uma única empresa (não é multiempresa), então o
 * registro é resolvido sem parâmetro. Se não existir, a implantação não foi
 * semeada — é erro de configuração, não de requisição.
 */
export async function getCurrentCompany() {
  const company = await prisma.company.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  if (!company) {
    throw new Error(
      'Nenhuma empresa cadastrada nesta implantação. Rode `npm run db:seed`.',
    );
  }

  return company;
}

/** Categorias ativas, na ordem em que devem aparecer ao visitante. */
export async function listActiveCategories() {
  const company = await getCurrentCompany();
  return prisma.category.findMany({
    where: { companyId: company.id, isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, description: true },
  });
}
