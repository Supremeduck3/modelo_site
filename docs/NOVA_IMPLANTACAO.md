# Criando uma nova implantação

Cada cliente recebe uma implantação independente: repositório/instância, banco e
domínio próprios. O código do molde é reaproveitado.

## Passo a passo

1. **Instanciar o molde** — clonar o repositório para o novo cliente.
2. **Ambiente** — `cp .env.example .env.local` e preencher, inclusive
   `AUTH_SECRET` (`openssl rand -base64 48`). O banco padrão é um projeto do
   Supabase por cliente; para entrega avulsa, veja "Banco de dados" abaixo.
   Nenhum segredo vai para o versionamento. Se a implantação for servida atrás
   de proxy reverso ou CDN que reescreve `X-Forwarded-For` (ex.: um
   balanceador na frente do processo Next), defina `TRUSTED_PROXY=1` — sem
   isso o rate limiting por cliente lê o cabeçalho como melhor esforço, não
   como fonte confiável, porque ele é escrito pelo próprio cliente. Ver
   "Segurança" no README.
3. **Dados do negócio** — preencher `identity` e `contact` em
   `src/config/site/site.config.js`.
4. **Design** — decidir navegação, seções e variantes (seções abaixo). Essa
   decisão é do implementador.
5. **Marca e mídia** — colocar logo/imagens em `public/` (ou usar URLs) e
   referenciá-las em `identity` e no `content` das seções. O bloco `media`
   funciona como fallback por tipo de seção: `media.hero` vira o `image` do
   hero e `media.gallery` vira os `items` da galeria, sempre com precedência
   menor que o `content` da seção. `public/favicon.svg` é um ícone neutro do
   molde, só para nenhuma implantação nascer com 404 no ícone — troque pelo
   símbolo da empresa e aponte `identity.favicon` para o arquivo novo.
6. **Conteúdo** — preencher `content` com textos, serviços, diferenciais, FAQ.
7. **Funcionalidades** — ligar/desligar blocos em `features`. Negócio com hora
   marcada (salão, barbearia, esmalteria, estética...) tem guia próprio: ver
   [`docs/SALAO.md`](SALAO.md). A migração que traz tabela de preços e
   agendamento (`add_catalog_and_appointments`) entra com `npm run db:deploy`,
   igual a qualquer migração nova do molde.
8. **SEO e legais** — preencher `seo` e `legal` (textos jurídicos fornecidos e
   revisados pelo responsável — o molde não inventa texto legal). `robots.txt` e
   o sitemap são gerados dessa configuração, sem nada para escrever à mão; ver
   "SEO por implantação" no README. Em homologação, ligue `seo.noindex` para o
   site de teste não ser indexado antes da hora — e não esqueça de desligar
   antes de publicar de verdade.
9. **E-mail** — preencher `SMTP_*` e `MAIL_FROM`. Use um remetente do domínio da
   empresa, com SPF e DKIM configurados; remetente de domínio alheio cai em spam.
   Sem essas variáveis a implantação funciona, apenas sem enviar e-mail — mas
   veja a ressalva sobre recuperação de senha abaixo.
10. **Conferir** — `npm run lint` e `npm run dev`, revisando mobile e desktop.
11. **Verificar prontidão** — `npm run implantacao:check` (seção própria abaixo).
    Corrija todo erro; para cada alerta, confirme que é intencional.
12. **Deploy + domínio.**

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
| `services` | `cards`, `list`, `grid`, `image-text`, `feature` |
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

Comece pelo `preset` (a direção de arte) e só depois ajuste tokens soltos:

```js
theme: {
    preset: 'editorial', // padrao | registro | editorial | expressivo | comercial
    colors: { primary: '#1f6feb', secondary: '#0b3a7a', accent: '#f0a202' },
    typography: { fontFamily: "'Inter', system-ui, sans-serif" },
    shape: { radius: '4px' },      // um cliente mais "duro"
    spacing: { sectionY: '120px' } // outro mais arejado
}
```

Precedência: **padrões do molde → preset → o que estiver escrito aqui**. Um
preset traz tipografia de display, escala, forma de botão, espaçamento,
tratamento de imagem e intensidade de animação de uma vez; ver
`src/config/theme/presets.js` e a tabela no guia do site.

Grupos além dos já citados: `buttons` (forma e caixa do botão), `images`
(`ratio`, `radius`, `filter`, `hoverFilter`) e `motion` (`duration`, `easing`,
`revealShift`). `typography.fontImport` é a URL da webfont da direção de arte —
sem ela, nenhuma requisição externa é feita.

### Escolhendo um preset novo

Um preset é um objeto de tema parcial exportado em `THEME_PRESETS`. Criar um é
copiar o mais próximo e ajustar; nenhum componente precisa saber que ele existe.

## Adicionando uma variante nova

1. Criar o componente em `src/components/sections/<tipo>/`.
2. Registrá-lo no mapa de variantes do `<Tipo>Section.jsx`.
3. Acrescentar o nome em `SECTION_VARIANTS` no schema.

Nenhuma página muda. Se a variante precisar de regra de negócio, ela vai para um
componente compartilhado — não para dentro da variante.

## Banco de dados

Cada implantação tem o seu banco. Nenhuma instância é compartilhada entre
clientes — é o que a especificação chama de implantação independente, e é o que
garante que um problema num cliente não alcance outro.

São duas variáveis de conexão porque o Prisma usa caminhos diferentes para
consultar e para migrar: `DATABASE_URL` nas consultas, `DIRECT_URL` nas
migrations.

Há dois cenários, e a escolha costuma acompanhar o modelo comercial.

### Padrão: Supabase (um projeto por cliente)

É o caminho recomendado quando você mantém vários sites ao mesmo tempo: o banco
é gerenciado, com backup e painel próprios, e você administra todos de um lugar
só sem manter servidor.

**Um projeto do Supabase por cliente.** Não divida clientes por schema dentro de
um projeto: credencial, backup, limite de uso e restauração passam a ser
compartilhados, e um engano numa restauração alcança todo mundo. Um nome de
projeto previsível (`sitemodelo-<cliente>`) poupa tempo quando forem muitos.

As duas strings saem de _Project Settings → Database_:

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

Confira no painel do Supabase qual host usar (as opções de conexão e os limites
mudam conforme o plano e a região) antes de fechar o `.env` da implantação.

Não use o `supabase-js` junto do Prisma. Seriam dois clientes com duas formas de
expressar as mesmas regras, e o Supabase Auth duplicaria a sessão que o painel já
tem. O molde trata o Supabase como o Postgres que ele é — **nenhuma linha do
código conhece o Supabase**, e é por isso que trocar de cenário é trocar duas
variáveis.

### Entrega avulsa: PostgreSQL na infraestrutura do cliente

Quando o cliente paga uma vez e segue sem acompanhamento, faz sentido que nada
fique em conta sua: o banco vai para a infraestrutura dele, e a implantação
deixa de depender de qualquer coisa que você mantenha.

```bash
createdb site_modelo
export DATABASE_URL="postgresql://usuario:senha@localhost:5432/site_modelo"
export DIRECT_URL="$DATABASE_URL"    # sem pooler, é a mesma conexão
```

**Onde esse banco mora importa.** Um site público precisa responder a qualquer
hora, de qualquer lugar: quem serve o site tem que alcançar o banco pela rede, e
a máquina precisa estar ligada. Em ordem de preferência:

| Onde | Serve para |
| --- | --- |
| VPS ou hospedagem do próprio cliente | Site público entregue de vez. É o caminho normal aqui. |
| Projeto do Supabase na conta do cliente | Mesma comodidade do padrão, mas quem paga e administra é ele. |
| Máquina na empresa (desktop/servidor local) | Uso interno, rede local, demonstração. **Não serve para site público**: quando a máquina desliga ou o IP muda, o site cai. |

A terceira linha é a que costuma decepcionar depois da entrega, então combine
isso antes de prometer. Se a intenção é sair de cena e o site é público, o
destino é a hospedagem do cliente — não o computador dele.

### Preparando o banco (vale nos dois cenários)

```bash
npm run db:setup     # aplica as migrations versionadas e roda o seed
```

Em desenvolvimento, use `npm run db:migrate` para criar migrations novas.
`npm run db:deploy` aplica sem semear, quando o banco já tem dados.

O seed é idempotente: rodar de novo não duplica registros. Ele cria a empresa
(nome via `SEED_COMPANY_NAME`), quatro categorias iniciais — que a empresa poderá
ajustar no painel quando a tela de categorias entrar — e o primeiro usuário do painel.

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

Em `/painel/configuracoes`, quem não tem permissão de administrar (perfil
operador) vê os dados da empresa em modo somente-leitura, com aviso de que a
alteração é de responsável ou administrador — a tela não esconde o dado, só
impede a edição por quem não pode alterá-lo.

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

## Categorias

O seed cria quatro categorias iniciais. A empresa ajusta o conjunto em
`/painel/categorias` — incluir, renomear, desativar. Categoria já usada em
manifestação não é excluída, só desativada, para não apagar a classificação do
que já foi atendido. A checagem de uso e a exclusão acontecem no mesmo `where`
do banco, não em dois passos separados, para uma manifestação nova não chegar
entre a checagem e a exclusão e ter sua categoria apagada em silêncio.

## Dados de demonstração

`npm run db:seed:demo` cria 35 manifestações fictícias (`SEED_DEMO_COUNT` muda a
quantidade) para conferir lista, filtros, paginação e histórico sem preencher o
formulário público dezenas de vezes.

São dados falsos: o script recusa `NODE_ENV=production` para não se misturarem
às manifestações reais da empresa. Antes de entregar a implantação, apague-os —
eles não têm marca que os distinga na tela, só o sufixo "(demo N)" no assunto.

`npm run db:seed:demo:limpar` é a contrapartida do seed — sem ele, a única
saída seria apagar via SQL direto no banco. Como é um comando que apaga,
trabalha como tal:

```bash
npm run db:seed:demo:limpar                    # lista o que seria removido
npm run db:seed:demo:limpar -- --confirmar     # remove
npm run db:seed:demo:limpar -- --empresa <id> --confirmar
```

Sem `--confirmar` ele só mostra os registros e não toca em nada, e recusa rodar
com `NODE_ENV=production`.

Para decidir o que é demonstração, exige as **duas** marcas que só o seed
produz: o sufixo "(demo N)" no assunto e o contato em `@exemplo.invalid`,
domínio reservado que nunca existe de verdade. Com apenas o sufixo, um cliente
que escrevesse "(demo " num assunto perderia um registro real. A definição vive
em `prisma/demo-marker.js` e é a mesma que o verificador de prontidão usa —
duas cópias acabariam divergindo, e a que apaga não pode divergir da que
audita.

O filtro também exige a empresa: num banco com mais de uma implantação, apagar
sem esse recorte alcançaria dados alheios.

## Verificação de prontidão

`npm run implantacao:check` confere, antes de publicar, se falta algo que só
seria descoberto pelo cliente. Não altera nada e não substitui os testes
automatizados: os testes garantem que o código funciona, o `check` garante que
*esta* implantação foi configurada — os dois cobrem coisas que o outro não
alcança.

Confere três frentes:

- **Ambiente** — `DATABASE_URL`, `AUTH_SECRET` (presente e com pelo menos 32
  caracteres) e `NEXT_PUBLIC_SITE_URL` (presente e sem `localhost`); alerta se
  faltar `DIRECT_URL` ou SMTP.
- **Configuração** — resquícios do molde em `identity`/`contact` (valores como
  "Demo Serviços" ou "exemplo.com" indicam etapa pulada), `seo.description` e
  `seo.siteUrl` vazios, `seo.noindex` ligado, e política de privacidade sem
  texto.
- **Banco** — nenhuma empresa cadastrada, nome de empresa ainda do molde,
  nenhum usuário ativo ou nenhum administrador ativo, e manifestações de
  demonstração ainda presentes.

Cada achado sai como **ERRO** ou **ALERTA**. Erro impede a publicação — o
comando sai com código 1, para travar um pipeline; é reservado para o que
sempre atrapalha o cliente, como AUTH_SECRET ausente ou nome do molde escapando
para o site no ar. Alerta não impede nada sozinho, mas exige que alguém tenha
decidido conscientemente — SMTP ausente numa entrega avulsa, por exemplo, é às
vezes aceitável e às vezes um problema; o comando não tem como saber qual.

O comando lê `.env` e `.env.local` por conta própria, com a mesma precedência
que o Next usa: o que já está no shell nunca é sobrescrito, e entre os dois
arquivos o `.env.local` vence o `.env` — a mesma ordem que esta documentação
pede para preencher.

## Entregando a implantação ao cliente

O papel de **responsável** (`owner`) é único por implantação e é o dono da
conta. Um caminho que funciona bem:

1. O seed cria o primeiro usuário em nome de quem implanta (`SEED_ADMIN_*`).
2. Você configura o site, as categorias e testa os fluxos com esse acesso.
3. Em `/painel/equipe`, convide a pessoa da empresa que vai responder pela
   conta e espere ela ativar o acesso pelo link.
4. Na entrega, use **Transferir o papel de responsável**: ela vira responsável e
   você vira administrador.
5. Se a implantação for de pagamento único, sem acompanhamento seu, o passo
   final é a empresa desativar o seu acesso — ou você mesmo pedir para o novo
   responsável fazer isso. O histórico das suas ações continua registrado.

Em implantações com acompanhamento contínuo, faz sentido manter o seu acesso
como administrador. Essa é a única diferença operacional entre os dois modelos
hoje: **nada no código consulta serviço externo para decidir se o site
funciona**, e isso é deliberado — uma implantação entregue precisa seguir
funcionando sozinha, para sempre.

## Manutenção depois da entrega

Como cada empresa roda a própria instância, conferir dependência não é tarefa
de implantação única — é recorrente, na mesma cadência de qualquer
manutenção. Rode `npm audit --omit=dev` de tempos em tempos e mantenha o Next
atualizado: a versão 16.3.5 fechou CVEs críticas (execução remota de código
não autenticada em servidor Windows e na API de otimização de imagem), do
tipo que não dá para esperar o próximo ciclo de trabalho para corrigir.
