/**
 * Remove as manifestações de demonstração de uma empresa.
 *
 * Contrapartida de `seed-demo.js`: o verificador de implantação acusa esses
 * registros como bloqueio para publicar, e sem este comando a única saída seria
 * SQL na mão.
 *
 * É um comando que apaga, então trabalha como tal: mostra o que encontrou,
 * exige confirmação explícita e recusa rodar em produção. O filtro do que é
 * "demonstração" vem de `demo-marker.js`, o mesmo que o verificador usa.
 *
 *   npm run db:seed:demo:limpar              # mostra o que seria removido
 *   npm run db:seed:demo:limpar -- --confirmar
 *   npm run db:seed:demo:limpar -- --empresa <id> --confirmar
 */
import process from 'node:process';
import { PrismaClient } from '@prisma/client';
import { manifestacoesDeDemonstracao } from './demo-marker.js';

const prisma = new PrismaClient();

function argumento(nome) {
  const indice = process.argv.indexOf(`--${nome}`);
  return indice === -1 ? null : (process.argv[indice + 1] ?? true);
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Recusado em produção: este comando apaga registros. Se o banco de produção tem dados de demonstração, remova-os com acompanhamento.',
    );
  }

  const empresaId = argumento('empresa');
  const empresa = empresaId
    ? await prisma.company.findUnique({ where: { id: String(empresaId) } })
    : await prisma.company.findFirst({ orderBy: { createdAt: 'asc' } });

  if (!empresa) {
    throw new Error(
      empresaId
        ? `Empresa ${empresaId} não encontrada.`
        : 'Nenhuma empresa cadastrada neste banco.',
    );
  }

  const alvo = manifestacoesDeDemonstracao(empresa.id);

  const encontradas = await prisma.submission.findMany({
    where: alvo,
    select: { protocol: true, title: true },
    orderBy: { createdAt: 'asc' },
  });

  if (encontradas.length === 0) {
    console.log(`Nenhuma manifestação de demonstração em "${empresa.name}".`);
    return;
  }

  console.log(`Empresa: ${empresa.name} (${empresa.id})`);
  console.log(
    `Manifestações de demonstração encontradas: ${encontradas.length}`,
  );
  for (const item of encontradas.slice(0, 10)) {
    console.log(`  ${item.protocol}  ${item.title}`);
  }
  if (encontradas.length > 10) {
    console.log(`  … e mais ${encontradas.length - 10}.`);
  }

  if (!argumento('confirmar')) {
    console.log('');
    console.log(
      'Nada foi removido. Repita com --confirmar para apagar estes registros.',
    );
    return;
  }

  // Os eventos do histórico saem junto, pelo onDelete Cascade.
  const { count } = await prisma.submission.deleteMany({ where: alvo });
  console.log('');
  console.log(`Manifestações de demonstração removidas: ${count}`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
