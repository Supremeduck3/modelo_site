/**
 * Verificação de prontidão de uma implantação.
 *
 * Roda antes de colocar um site no ar e responde a uma pergunta só: falta
 * alguma coisa que só seria descoberta pelo cliente? Cada achado tem gravidade
 * e diz o que fazer.
 *
 * Não altera nada e não substitui os testes: confere configuração, ambiente e
 * estado do banco — as três fontes que variam de implantação para implantação e
 * que nenhum teste automatizado pode adivinhar.
 *
 *   npm run implantacao:check
 *
 * Sai com código 1 se houver erro, para travar um pipeline de publicação.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

/** Raiz do projeto, para o comando funcionar chamado de qualquer pasta. */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');

import { manifestacoesDeDemonstracao } from '../prisma/demo-marker.js';

// O cliente do Prisma é importado sob demanda, dentro da verificação do banco.
// Importá-lo no topo carregaria o `.env` antes do nosso carregador rodar, e aí
// tudo que veio do arquivo pareceria ter vindo do shell — o `.env.local`
// perderia a disputa que deveria vencer.

/**
 * Carrega os arquivos de ambiente antes de qualquer verificação.
 *
 * O Next lê `.env.local` sozinho, mas um script Node puro não — e a nossa
 * documentação manda preencher justamente o `.env.local`. Sem isto, uma
 * implantação bem configurada seria reprovada por variáveis "ausentes" que
 * estão logo ali. A precedência imita a do Next: o específico ganha do geral, e
 * o que já veio do shell ganha de tudo.
 */
/**
 * Interpreta o lado direito de uma linha do .env.
 *
 * Aspas precisam estar emparelhadas para serem removidas: `A="mismatch'` é
 * valor literal, não string citada. E só valor sem aspas aceita comentário no
 * fim da linha — dentro de aspas, `#` é conteúdo.
 */
function interpretarValor(bruto) {
  const primeiro = bruto[0];

  if (
    (primeiro === '"' || primeiro === "'") &&
    bruto.length > 1 &&
    bruto.endsWith(primeiro)
  ) {
    return bruto.slice(1, -1);
  }

  const comentario = bruto.search(/\s#/);
  return comentario === -1 ? bruto : bruto.slice(0, comentario).trim();
}

function carregarAmbiente() {
  const lidos = [];
  // Só o que veio do shell é intocável. Entre arquivos, o último lido vence —
  // senão `.env.local` nunca conseguiria sobrepor o `.env`, que é justamente o
  // que a documentação pede que ele faça.
  const doShell = new Set(Object.keys(process.env));

  for (const arquivo of ['.env', '.env.local']) {
    const caminho = resolve(RAIZ, arquivo);
    if (!existsSync(caminho)) continue;
    lidos.push(arquivo);

    // O BOM que alguns editores gravam grudaria na primeira chave, e a
    // variável ficaria invisível com o arquivo visivelmente preenchido.
    const conteudo = readFileSync(caminho, 'utf8').replace(/^\uFEFF/, '');

    for (const linha of conteudo.split('\n')) {
      const limpa = linha.trim();
      if (limpa === '' || limpa.startsWith('#')) continue;

      const separador = limpa.indexOf('=');
      if (separador === -1) continue;

      // `export FOO=bar` aparece em arquivo copiado de um shell; sem tirar o
      // prefixo, a chave viraria "export FOO" e a variável ficaria invisível.
      const chave = limpa
        .slice(0, separador)
        .trim()
        .replace(/^export\s+/, '');
      if (doShell.has(chave)) continue;

      process.env[chave] = interpretarValor(limpa.slice(separador + 1).trim());
    }
  }

  return lidos;
}

const achados = [];

/** Impede a publicação. */
function erro(area, mensagem, saida) {
  achados.push({ nivel: 'erro', area, mensagem, saida });
}

/** Não impede, mas alguém precisa ter decidido conscientemente. */
function alerta(area, mensagem, saida) {
  achados.push({ nivel: 'alerta', area, mensagem, saida });
}

/**
 * Valores que acompanham o molde.
 *
 * Encontrá-los numa implantação real significa que alguém pulou uma etapa —
 * é o erro mais comum e o mais constrangedor diante do cliente.
 */
const RESQUICIOS_DO_MOLDE = [
  /\bdemo servi[çc]os\b/i,
  /\bempresa demonstrativa\b/i,
  /\bsua empresa\b/i,
  /exemplo\.(com|com\.br|invalid)\b/i,
  // "Demo" sozinho, como palavra inteira: sem a fronteira, uma "Demolidora
  // Silva" seria acusada de ser resquício do molde.
  /(^|\s)demo(\s|$)/i,
];

function pareceDoMolde(valor) {
  if (typeof valor !== 'string' || valor.trim() === '') return false;
  return RESQUICIOS_DO_MOLDE.some((padrao) => padrao.test(valor));
}

function verificarAmbiente() {
  const area = 'ambiente';

  if (!process.env.DATABASE_URL) {
    erro(
      area,
      'DATABASE_URL não definida.',
      'Preencha no .env da implantação.',
    );
  }
  if (!process.env.DIRECT_URL) {
    alerta(
      area,
      'DIRECT_URL não definida.',
      'Em banco próprio ela é igual à DATABASE_URL; com pooler (Supabase) precisa ser a conexão direta, senão as migrations falham.',
    );
  }

  const segredo = process.env.AUTH_SECRET ?? '';
  if (!segredo) {
    erro(
      area,
      'AUTH_SECRET não definida: o painel não sobe sem ela.',
      'Gere com: openssl rand -base64 48',
    );
  } else if (segredo.length < 32) {
    erro(
      area,
      `AUTH_SECRET tem ${segredo.length} caracteres; o mínimo é 32.`,
      'Gere outra com: openssl rand -base64 48',
    );
  }

  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!url) {
    erro(
      area,
      'NEXT_PUBLIC_SITE_URL não definida.',
      'Sem ela os links de convite e de recuperação de senha saem quebrados, e o sitemap fica vazio.',
    );
  } else if (url.includes('localhost')) {
    erro(
      area,
      `NEXT_PUBLIC_SITE_URL ainda aponta para localhost (${url}).`,
      'Use o domínio real: é este endereço que vai nos e-mails.',
    );
  }

  if (!process.env.SMTP_HOST || !process.env.MAIL_FROM) {
    alerta(
      area,
      'SMTP não configurado: nenhum e-mail será enviado.',
      'Sem e-mail, convite e recuperação de senha dependem de repassar o link à mão. Ver docs/NOVA_IMPLANTACAO.md.',
    );
  }
}

function verificarConfiguracao(siteConfig) {
  const area = 'configuração';
  const { identity, contact, seo, legal, deployment } = siteConfig;

  if (pareceDoMolde(identity.name)) {
    erro(
      area,
      `identity.name ainda é "${identity.name}".`,
      'Troque pelo nome real da empresa em src/config/site/site.config.js.',
    );
  }
  if (pareceDoMolde(identity.shortName)) {
    alerta(
      area,
      `identity.shortName ainda é "${identity.shortName}".`,
      'Ajuste ou deixe vazio.',
    );
  }
  if (pareceDoMolde(identity.description)) {
    // Alerta, e não erro: descrição é texto livre, e uma frase legítima como
    // "fazemos demo grátis" bloquearia a publicação sem motivo.
    alerta(
      area,
      'identity.description parece ser o texto de demonstração do molde.',
      'Confira se é mesmo o texto da empresa.',
    );
  }
  if (pareceDoMolde(contact.email)) {
    erro(
      area,
      `contact.email ainda é "${contact.email}".`,
      'Use o e-mail real; ele aparece no rodapé do site.',
    );
  }
  if (!contact.email && !contact.phone) {
    alerta(
      area,
      'A empresa não tem e-mail nem telefone no site.',
      'O visitante fica sem caminho de contato direto.',
    );
  }

  if (!seo.title) {
    alerta(
      area,
      'seo.title vazio: o título cai no nome + slogan.',
      'Defina um título pensado para busca.',
    );
  }
  if (!seo.description) {
    erro(
      area,
      'seo.description vazio.',
      'É o texto que aparece no resultado de busca.',
    );
  }
  if (!seo.siteUrl) {
    erro(
      area,
      'seo.siteUrl vazio.',
      'Sem ele não há sitemap nem URL absoluta em Open Graph.',
    );
  }
  const urlAmbiente = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(
    /\/+$/,
    '',
  );
  const urlConfig = seo.siteUrl?.trim().replace(/\/+$/, '');
  if (urlAmbiente && urlConfig && urlAmbiente !== urlConfig) {
    alerta(
      area,
      `NEXT_PUBLIC_SITE_URL (${urlAmbiente}) e seo.siteUrl (${urlConfig}) apontam para endereços diferentes.`,
      'Os e-mails usam a primeira e o sitemap/Open Graph a segunda: o visitante veria dois domínios.',
    );
  }

  if (seo.noindex) {
    alerta(
      area,
      'seo.noindex está ligado: o site inteiro está fora dos buscadores.',
      'Correto em homologação; desligue antes de publicar.',
    );
  }

  if (!legal.privacyPolicy) {
    erro(
      area,
      'Política de privacidade sem texto.',
      'A página existe e diz que o texto não foi preenchido. O conteúdo precisa vir do responsável pelo projeto.',
    );
  }
  if (!legal.terms) {
    alerta(
      area,
      'Termos de uso sem texto.',
      'A página existe e fica visivelmente incompleta.',
    );
  }

  if (deployment?.mode === 'avulso' && !process.env.SMTP_HOST) {
    alerta(
      area,
      'Implantação avulsa sem SMTP.',
      'Depois da entrega ninguém do seu lado poderá reenviar convite ou link de recuperação: sem e-mail, a empresa fica dependente de acesso ao banco.',
    );
  }
}

async function verificarBanco(siteConfig) {
  const area = 'banco';
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const empresa = await prisma.company.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, email: true },
    });

    if (!empresa) {
      erro(area, 'Nenhuma empresa cadastrada.', 'Rode: npm run db:setup');
      return;
    }

    if (pareceDoMolde(empresa.name)) {
      erro(
        area,
        `A empresa no banco ainda se chama "${empresa.name}".`,
        'É este nome que assina os e-mails. Ajuste em /painel/configuracoes.',
      );
    }
    if (empresa.name !== siteConfig.identity.name) {
      alerta(
        area,
        `O site exibe "${siteConfig.identity.name}" e os e-mails assinam "${empresa.name}".`,
        'Não é erro, mas o visitante vê os dois. Confirme se é proposital.',
      );
    }

    const [usuarios, admins, categorias, demos] = await Promise.all([
      prisma.companyUser.count({
        where: { companyId: empresa.id, isActive: true },
      }),
      prisma.companyUser.count({
        where: {
          companyId: empresa.id,
          isActive: true,
          role: { in: ['owner', 'admin'] },
        },
      }),
      prisma.category.count({
        where: { companyId: empresa.id, isActive: true },
      }),
      prisma.submission.count({
        where: manifestacoesDeDemonstracao(empresa.id),
      }),
    ]);

    if (usuarios === 0) {
      erro(
        area,
        'Nenhum usuário ativo no painel.',
        'Ninguém consegue atender as manifestações. Rode o seed com SEED_ADMIN_*.',
      );
    }
    if (admins === 0) {
      erro(
        area,
        'Nenhum administrador ativo.',
        'A empresa não conseguiria convidar ninguém nem mexer nas configurações.',
      );
    }
    if (categorias === 0) {
      alerta(
        area,
        'Nenhuma categoria ativa.',
        'O formulário público fica sem o campo de categoria.',
      );
    }
    if (demos > 0) {
      erro(
        area,
        `${demos} manifestação(ões) de demonstração no banco.`,
        'Vieram de npm run db:seed:demo e apareceriam no painel do cliente como se fossem reais.',
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

function relatar() {
  const erros = achados.filter((a) => a.nivel === 'erro');
  const alertas = achados.filter((a) => a.nivel === 'alerta');

  // Erros primeiro: num relatório longo, um bloqueante no meio de alertas passa
  // despercebido.
  const ordenados = [...erros, ...alertas];

  for (const achado of ordenados) {
    const marca = achado.nivel === 'erro' ? 'ERRO  ' : 'ALERTA';
    console.log(`${marca} [${achado.area}] ${achado.mensagem}`);
    if (achado.saida) console.log(`       ↳ ${achado.saida}`);
  }

  if (achados.length > 0) console.log('');

  if (erros.length === 0 && alertas.length === 0) {
    console.log('Implantação pronta: nada pendente.');
    return 0;
  }

  console.log(`${erros.length} erro(s) e ${alertas.length} alerta(s).`);

  if (erros.length > 0) {
    console.log(
      'Erros impedem a publicação. Alertas exigem uma decisão consciente.',
    );
    return 1;
  }

  console.log(
    'Nenhum erro. Confirme se cada alerta é intencional antes de publicar.',
  );
  return 0;
}

async function main() {
  const arquivos = carregarAmbiente();
  console.log(
    arquivos.length > 0
      ? `Ambiente lido de: ${arquivos.join(', ')}\n`
      : 'Nenhum arquivo .env encontrado; usando apenas o ambiente do shell.\n',
  );

  verificarAmbiente();

  // Importado só agora, depois do ambiente carregado: se um dia a configuração
  // passar a ler `process.env`, um import no topo veria variáveis que ainda não
  // existiam e o verificador reprovaria uma implantação correta.
  const { siteConfig } = await import('../src/config/site/index.js');

  verificarConfiguracao(siteConfig);

  try {
    await verificarBanco(siteConfig);
  } catch (error) {
    erro(
      'banco',
      `Não foi possível consultar o banco: ${error.message}`,
      'Confira DATABASE_URL e se o banco está no ar.',
    );
  }

  process.exitCode = relatar();
}

// Só roda quando chamado direto. Importar este arquivo — como faz o teste que
// verifica os filtros — não pode disparar a checagem inteira nem mexer no
// código de saída do processo que importou.
const executadoDireto =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (executadoDireto) {
  main().catch((error) => {
    // Falha fora das verificações (permissão para ler .env, configuração que
    // nem carrega) precisa sair como falha explícita, não como stack solto.
    console.error(`Verificação interrompida: ${error.message}`);
    process.exitCode = 1;
  });
}
