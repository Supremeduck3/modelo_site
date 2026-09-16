# Criando uma nova implantação

Cada cliente recebe uma implantação independente: repositório/instância, banco e
domínio próprios. O código do molde é reaproveitado.

## Passo a passo

1. **Instanciar o molde** — clonar o repositório para o novo cliente.
2. **Ambiente** — `cp .env.example .env.local` e preencher, inclusive
   `AUTH_SECRET` (`openssl rand -base64 48`). Nenhum segredo vai para o
   versionamento.
3. **Dados do negócio** — preencher `identity` e `contact` em
   `src/config/site/site.config.js`.
4. **Design** — decidir navegação, seções e variantes (seções abaixo). Essa
   decisão é do implementador.
5. **Marca e mídia** — colocar logo/imagens em `public/` (ou usar URLs) e
   referenciá-las em `identity` e no `content` das seções. O bloco `media`
   funciona como fallback por tipo de seção: `media.hero` vira o `image` do
   hero e `media.gallery` vira os `items` da galeria, sempre com precedência
   menor que o `content` da seção.
6. **Conteúdo** — preencher `content` com textos, serviços, diferenciais, FAQ.
7. **Funcionalidades** — ligar/desligar blocos em `features`.
8. **SEO e legais** — preencher `seo` e `legal` (textos jurídicos fornecidos e
   revisados pelo responsável — o molde não inventa texto legal).
9. **E-mail** — preencher `SMTP_*` e `MAIL_FROM`. Use um remetente do domínio da
   empresa, com SPF e DKIM configurados; remetente de domínio alheio cai em spam.
   Sem essas variáveis a implantação funciona, apenas sem enviar e-mail — mas
   veja a ressalva sobre recuperação de senha abaixo.
10. **Conferir** — `npm run lint` e `npm run dev`, revisando mobile e desktop.
11. **Deploy + domínio.**

## Navegação

```js
navigation: {
    variant: 'header',            // 'header' | 'header-compact' | 'sidebar'
    position: 'top',              // 'top' para header; 'left' | 'right' para sidebar
    behavior: 'shrink-on-scroll', // 'fixed' | 'static' | 'shrink-on-scroll'
    showCta: true,
    ctaLabel: 'Enviar manifestação',
    ctaHref: '/manifestacao',
    items: [{ label: 'Início', href: '#inicio' }],
}
```

Trocar `variant` para `sidebar` muda a estrutura do site inteiro sem tocar em
nenhuma página ou seção: quem reage é o `AppShell`. No mobile, a sidebar degrada
para barra superior + drawer automaticamente.

## Seções da home

A home é a lista `pages.home.sections`, renderizada **na ordem declarada**:

```js
pages: {
    home: {
        sections: [
            { type: 'hero', variant: 'split', id: 'inicio' },
            { type: 'services', variant: 'cards', id: 'servicos' },
            { type: 'contact', variant: 'map', id: 'contato' },
        ],
    },
}
```

- `id` vira a âncora usada pelos links do menu.
- `content` opcional dentro da seção sobrescreve o `content[type]` global.
- Uma seção cujo `features[type]` está `false` não é renderizada (e o console
  avisa em desenvolvimento, para você não perder uma seção sem perceber). O
  canal de manifestações é controlado por `features.submissions`.
- Seção baseada em lista sem `items` configurados renderiza só o cabeçalho —
  a guarda fica no dispatcher, não em cada variante.

Variantes disponíveis (fonte da verdade: `SECTION_VARIANTS` em
`src/config/site/schema.js`):

| Seção | Variantes |
| --- | --- |
| `hero` | `full-image`, `split`, `centered`, `cta-focus` |
| `about` | `simple`, `image-text`, `stats` |
| `services` | `cards`, `list`, `grid`, `image-text` |
| `differentials` | `icons`, `cards`, `side-blocks` |
| `gallery` | `grid`, `masonry`, `carousel` |
| `testimonials` | `cards`, `slider`, `single` |
| `team` | `cards`, `list`, `highlight` |
| `faq` | `accordion`, `blocks`, `two-columns` |
| `contact` | `cards`, `map`, `form-split` |
| `submission` | `cta`, `embedded` |

## Tema

Tudo em `theme` vira variável CSS (`--color-primary`, `--radius`, `--section-y`,
…) injetada no `<head>` antes da primeira pintura, e alimenta também o tema do
Ant Design. Componentes consomem apenas as variáveis — não existe cor literal de
cliente em CSS de componente.

```js
theme: {
    colors: { primary: '#1f6feb', secondary: '#0b3a7a', accent: '#f0a202' },
    typography: { fontFamily: "'Inter', system-ui, sans-serif" },
    shape: { radius: '4px' },      // um cliente mais "duro"
    spacing: { sectionY: '120px' } // outro mais arejado
}
```

## Adicionando uma variante nova

1. Criar o componente em `src/components/sections/<tipo>/`.
2. Registrá-lo no mapa de variantes do `<Tipo>Section.jsx`.
3. Acrescentar o nome em `SECTION_VARIANTS` no schema.

Nenhuma página muda. Se a variante precisar de regra de negócio, ela vai para um
componente compartilhado — não para dentro da variante.

## Banco de dados

A implantação usa PostgreSQL próprio. Nenhuma instância é compartilhada entre
clientes.

São duas variáveis porque o Prisma usa conexões diferentes para consultar e para
migrar: `DATABASE_URL` nas consultas e `DIRECT_URL` nas migrations. Em banco
próprio as duas são iguais.

```bash
createdb site_modelo                 # ou o banco provisionado no seu host
export DATABASE_URL="postgresql://usuario:senha@host:5432/site_modelo"
export DIRECT_URL="$DATABASE_URL"    # sem pooler, é a mesma conexão

npm run db:migrate   # desenvolvimento: cria/aplica migrations
npm run db:deploy    # produção: aplica as migrations já versionadas
npm run db:seed      # empresa, categorias e primeiro usuário do painel
```

### Hospedando no Supabase

O Supabase **é** PostgreSQL: não é outro banco nem outra forma de acessar, e
nada no código muda. O que muda são as strings de conexão, em
_Project Settings → Database_.

```bash
# Consultas: pooler, porta 6543, em transaction mode
DATABASE_URL="postgresql://postgres.<ref>:<senha>@<host>:6543/postgres?pgbouncer=true&connection_limit=1"

# Migrations: conexão direta, porta 5432
DIRECT_URL="postgresql://postgres.<ref>:<senha>@<host>:5432/postgres"
```

Por que separado: a porta 6543 é um PgBouncer em transaction mode, que não
mantém prepared statements nem aceita DDL. Apontar a migration para ela falha
com erro que não explica a causa. O `?pgbouncer=true` avisa o Prisma para não
usar prepared statements nas consultas, e `connection_limit=1` evita estourar o
pool do plano gratuito.

Não use o `supabase-js` junto do Prisma. Seriam dois clientes com duas formas de
expressar as mesmas regras, e o Supabase Auth duplicaria a sessão que o painel já
tem. O molde trata o Supabase como o Postgres que ele é.

O seed é idempotente: rodar de novo não duplica registros. Ele cria a empresa
(nome via `SEED_COMPANY_NAME`), quatro categorias iniciais — que a empresa pode
ajustar no painel a partir da fase 6 — e o primeiro usuário do painel.

## Primeiro acesso ao painel

O molde não tem usuário padrão: sem as variáveis abaixo o seed avisa e não cria
ninguém, e `/painel` fica inacessível.

```bash
export AUTH_SECRET="$(openssl rand -base64 48)"   # obrigatório
export SEED_ADMIN_NAME="Maria Souza"
export SEED_ADMIN_EMAIL="maria@empresa.com.br"
export SEED_ADMIN_PASSWORD="…"                    # mínimo 10 caracteres

npm run db:seed
```

O usuário criado recebe o papel `owner` (responsável). O seed **nunca**
sobrescreve um usuário existente: rodá-lo de novo em produção não desfaz a troca
de senha feita pela empresa. Para dar acesso a mais gente, o cadastro de equipe
entra no painel na fase 6 — até lá, novos usuários saem do mesmo seed, trocando
as variáveis.

Cuidados com `AUTH_SECRET`:

- Um valor por implantação, nunca versionado.
- Trocá-lo derruba todas as sessões abertas — é o jeito de invalidar acesso em
  massa.
- Em produção o cookie só viaja por HTTPS; em `localhost` o molde afrouxa isso
  sozinho, então não há nada a configurar para desenvolver.

## Categorias de manifestação

As categorias ficam no banco, não na configuração do site: elas são dado
operacional da empresa. O formulário público lista apenas as ativas e a API
recusa qualquer categoria que não pertença à empresa da implantação.

## Recuperação de senha e SMTP

A recuperação de senha entrega o link **só por e-mail**. Sem `SMTP_*`
configurado:

- em desenvolvimento o link aparece no log do servidor, para dar para testar o
  fluxo sem servidor de e-mail;
- em produção o link não é registrado em lugar nenhum, de propósito: quem
  tivesse acesso ao log entraria na conta. O pedido é aceito e nada é entregue.

Ou seja, numa implantação sem SMTP quem perde a senha não tem caminho de volta
sozinho. O seed não resolve: ele nunca sobrescreve a senha de um usuário que já
existe, justamente para não desfazer em silêncio uma troca feita pela empresa.
Nesse cenário a recuperação exige intervenção do implementador no banco —
gravar um novo `password_hash` ou remover o usuário e recriá-lo pelo seed.

Vale configurar SMTP antes de entregar o painel à empresa.

## Dados de demonstração

`npm run db:seed:demo` cria 35 manifestações fictícias (`SEED_DEMO_COUNT` muda a
quantidade) para conferir lista, filtros, paginação e histórico sem preencher o
formulário público dezenas de vezes.

São dados falsos: o script recusa `NODE_ENV=production` para não se misturarem
às manifestações reais da empresa. Antes de entregar a implantação, apague-os —
eles não têm marca que os distinga na tela, só o sufixo "(demo N)" no assunto.
