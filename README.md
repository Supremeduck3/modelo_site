# Site Modelo

Molde reutilizável para sites de pequenos negócios. O mesmo código-base produz
sites visualmente diferentes para clientes diferentes: o site é resultado de
**configuração + conteúdo + componentes reutilizáveis**.

O produto tem três blocos:

| Bloco | Situação |
| --- | --- |
| 1 — Site institucional | Implementado (fases 0–2) |
| 2 — Canal de manifestações | Implementado (fase 3): formulário público, API, protocolo e histórico |
| 3 — Painel da empresa | Em andamento: autenticação (fase 4), atendimento das manifestações (fase 5) e equipe (fase 6) prontos; categorias e configurações a seguir |
| E-mail transacional | Confirmação ao visitante, aviso à equipe, resposta pública e link de recuperação de senha prontos |

## Stack

- Next.js 16 (App Router) + React 19, em JavaScript
- CSS Modules sobre tokens em variáveis CSS
- Ant Design só no painel: o runtime entra por `PanelThemeProvider`, usado apenas
  no layout de `/painel`, e o site público não carrega nada dele
- Sessão e hash de senha com `node:crypto` (scrypt + HMAC), sem dependência de
  autenticação
- PostgreSQL + Prisma (migrations versionadas). O padrão é um projeto do
  Supabase por cliente; a entrega avulsa usa Postgres na infraestrutura do
  próprio cliente. Nenhuma linha do código conhece o Supabase — trocar de
  cenário é trocar duas variáveis de ambiente.
- Zod para validação, com schema compartilhado entre formulário e API
- Biome para lint e formatação; `node --test` e Playwright para testes

## Começando

```bash
npm install
cp .env.example .env.local   # preencha DATABASE_URL e AUTH_SECRET

npm run db:migrate           # aplica as migrations
npm run db:seed              # empresa, categorias e o primeiro usuário do painel
npm run db:seed:demo         # manifestações fictícias para exercitar o painel (nunca em produção)

npm run dev                  # http://localhost:3000
npm run lint                 # biome check
npm run test                 # regras críticas (node --test)
npm run test:e2e             # fluxos críticos no navegador (Playwright)
npm run build                # prisma generate + next build
```

Os testes autenticados reaproveitam uma sessão criada uma única vez pelo
projeto de setup do Playwright. Isso não é otimização: o login limita tentativas
por e-mail, e um login por arquivo de teste estourava essa cota e derrubava a
suíte com 429. Os testes do próprio fluxo de login continuam entrando de
verdade.

Os e2e do painel precisam de credenciais no ambiente
(`E2E_PANEL_EMAIL`/`E2E_PANEL_PASSWORD`, ou os `SEED_ADMIN_*` já usados no
seed). Sem elas, os casos que dependem de login são pulados com aviso, em vez de
o molde trazer um usuário de teste embutido.

## Regra central de design

**O design é escolhido pelo implementador, não pelo cliente final.** A empresa
fornece logo, textos, fotos, serviços e contatos; a composição visual (navegação,
seções, variantes, cores, tipografia) é decidida por quem constrói a implantação,
editando a configuração. Não existe editor drag-and-drop no V1.

## Arquitetura

```
src/
  app/
    (site)/             rotas públicas (home, páginas legais, canal)
    painel/             ambiente privado; (interno)/ exige sessão
    api/                submissions, auth
  components/
    layout/             AppShell, navegação (header/compacto/sidebar), rodapé
    painel/             casca, tema e formulários do painel
    sections/           seções da home, uma pasta por tipo, com variantes
    ui/                 primitivos: Container, Section, Button, Media, LegalPage
  config/
    site/               schema + configuração desta implantação
    theme/              tokens -> variáveis CSS e tema do Ant Design
  proxy.js              atalho de navegação do painel (não é o controle de acesso)
```

Os dois ambientes têm cascas separadas: o layout raiz só monta o documento e os
tokens, `(site)/layout.jsx` envolve as páginas públicas no `AppShell` e
`painel/layout.jsx` monta o painel. Um grupo não carrega o código do outro.

Camadas separadas de propósito:

| Camada | Onde fica | Quem define |
| --- | --- | --- |
| Estrutura (navegação, ordem das seções) | `config/site/site.config.js` | Implementador |
| Layout (variante de cada seção) | `config/site/site.config.js` | Implementador |
| Visual (cores, fonte, raio, espaçamento) | `config/site/site.config.js` → `config/theme` | Implementador |
| Conteúdo (textos, fotos, serviços) | `config/site/site.config.js` | Empresa + implementador |
| Funcionalidade (blocos ativos) | `features` na config | Implementador |

Regra que não se quebra: **variante visual não duplica regra de negócio.**
Formulários, chamadas de API e validações ficam compartilhados; a variante só
muda o arranjo.

## Canal de manifestações

O visitante registra em `/manifestacao`. O fluxo:

1. O formulário valida no cliente com o schema compartilhado
   (`src/lib/submissions/schema.js`) apenas para dar retorno rápido.
2. `POST /api/submissions` revalida tudo no servidor, aplica rate limiting por
   cliente, confere a categoria contra a empresa da implantação e grava a
   manifestação junto do primeiro evento de histórico, na mesma transação.
3. O visitante recebe um protocolo público no formato `AAAA-XXXX-XXXX`, sorteado
   de um alfabeto sem caracteres ambíguos e sem sequência previsível.

Notas internas (`SubmissionEvent.note`) são separadas da resposta pública
(`Submission.publicResponse`) no modelo de dados: nada interno transita pelo
ambiente público.

Limite conhecido: o rate limiting é em memória, adequado a uma implantação de
processo único. `src/server/lib/rate-limit.js` é o ponto de troca por Redis se
alguma implantação passar a rodar em vários processos.

## Painel da empresa

A equipe entra em `/painel`. O que está pronto na fase 4:

- **Senha** com scrypt (`node:crypto`), salt por senha e parâmetros de custo
  gravados dentro do hash — aumentar o custo depois não invalida as senhas
  existentes.
- **Sessão** em cookie `httpOnly` assinado com HMAC-SHA256, válido por 12h. O
  segredo vem de `AUTH_SECRET`; sem ele o painel derruba com mensagem explícita,
  em vez de assinar com um padrão previsível.
- **Autorização** sempre no servidor: `requireSessionUser()` confere a
  assinatura do token *e* relê o usuário no banco, então desativar alguém tem
  efeito imediato, sem esperar a sessão expirar.
- **Login sem pista**: e-mail inexistente, senha errada e conta inativa dão a
  mesma resposta, e o caminho do e-mail inexistente gasta o mesmo tempo de
  scrypt, para o tempo de resposta não revelar quais contas existem.
- **Rate limiting** em duas cotas, por cliente e por e-mail.
- **Recuperação de senha** em `/painel/esqueci-senha`: o pedido responde sempre
  a mesma coisa, exista ou não a conta; o link vale uma hora, serve uma vez só e
  um pedido novo invalida os anteriores. O banco guarda apenas o hash do token.
- **Nenhum usuário padrão**: o primeiro usuário só existe se o seed rodar com
  `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD`, e o seed nunca sobrescreve a senha
  de um usuário já existente.

`src/proxy.js` só olha se o cookie existe, para redirecionar ao login com
`?next=`. É conveniência de navegação, não controle de acesso — um cookie
forjado passa por ele e é recusado no servidor.

Redefinir a senha derruba as sessões abertas: `CompanyUser.passwordChangedAt`
guarda o momento da troca e a guarda descarta todo token emitido antes disso. A
comparação é em segundos, que é a resolução do carimbo dentro do token — o
efeito colateral é uma janela de até um segundo em que um token antigo ainda
passa, preço de não trancar do lado de fora quem entra no mesmo segundo em que
redefiniu a senha.

Limite conhecido: fora a troca de senha, a sessão é stateless — `logout` apaga o
cookie do navegador mas não revoga um token que já tenha sido copiado; ele vale
até expirar. Trocar `AUTH_SECRET` invalida todas de uma vez.
`src/server/lib/session-token.js` é o ponto de troca por sessão persistida se
alguma implantação precisar de revogação imediata em todos os casos.

## Atendimento das manifestações

A equipe trabalha em `/painel/manifestacoes`: fila com filtros (busca por
protocolo ou assunto, situação, tipo, prioridade, categoria, responsável e "sem
responsável"), paginação e detalhe com histórico.

No detalhe estão as quatro ações: classificar (situação, prioridade, categoria,
responsável), registrar nota interna, responder ao visitante e arquivar.

Regras que o código garante, não a disciplina de quem usa:

- **`companyId` é parâmetro obrigatório de toda consulta do módulo.** Nenhuma
  função resolve a empresa sozinha: o filtro entra na assinatura, então um id de
  outra implantação simplesmente não é encontrado — e responde 404 igual a um id
  inexistente, sem confirmar que o registro existe em algum lugar. Categoria e
  responsável também são conferidos contra a empresa antes de serem vinculados.
- **Nota interna e resposta pública são campos diferentes.** A nota vive só no
  histórico e nunca entra em nenhuma projeção que saia da empresa; o e-mail ao
  visitante recebe apenas o texto da resposta, o protocolo e o assunto.
- **Toda alteração relevante vira evento na mesma transação da alteração.** Não
  existe mudança de situação sem trilha de auditoria, e classificar sem mudar
  nada não gera evento vazio.
- **Arquivar em vez de excluir**, como pede a especificação: o registro sai da
  fila e continua auditável. Não há rota de exclusão.
- **Filtro inválido na URL é descartado, não recusado.** Um link antigo ou um
  valor renomeado mostram a lista sem aquele filtro, em vez de derrubar a fila
  de trabalho.

Permissões (`src/lib/auth/permissions.js`): operador vê e opera manifestações;
arquivar e as configurações ficam com responsável e administrador. Cada rota
confere no servidor — esconder o botão é conveniência, não autorização.

Uma armadilha registrada no código: num Server Component, `Typography.Paragraph`
e outros subcomponentes do antd expostos como objeto chegam `undefined` pela
referência de cliente e quebram a página em execução, não no build.
Subcomponentes que são função simples, como `Descriptions.Item`, funcionam.

## Equipe

`/painel/equipe` é onde quem administra convida gente, troca perfis, corta
acessos e transfere o posto de responsável.

**Convite, nunca senha provisória.** Convidar cria a conta inativa e sem senha,
com um token de ativação — só o hash vai para o banco. O link volta na resposta
e aparece **uma única vez** na tela, além de ir por e-mail quando há SMTP: é o
que permite usar a tela numa implantação sem e-mail configurado. A pessoa abre o
link e escolhe a própria senha; senha nenhuma trafega por e-mail nem passa pelas
mãos de quem convidou. Gerar um convite novo invalida o anterior.

**Desativar, não excluir.** `SubmissionEvent.actorId` referencia o usuário com
`onDelete: SetNull`: apagar alguém de verdade transformaria todo o histórico
dele em "sistema" e destruiria a auditoria que o atendimento constrói.
Desativar preserva o histórico e corta o acesso na requisição seguinte, porque a
sessão relê `isActive` do banco.

**Travas para a empresa não se trancar fora**: ninguém desativa a si mesmo nem
muda o próprio perfil, e o responsável não pode ser desativado nem rebaixado —
o papel sai do lugar apenas por transferência.

**Transferência do responsável.** O papel é único por implantação e só o
responsável atual transfere. As duas atualizações acontecem na mesma transação,
para nunca existir instante com dois responsáveis ou nenhum; quem transfere vira
administrador. É o gesto de entrega de uma implantação: quem implantou sai do
posto e a empresa assume a conta.

A situação de acesso mostrada na tela (`active`, `invited`, `invite_expired`,
`disabled`) é derivada de senha + convite, não um campo guardado — um campo
criaria um segundo lugar para a verdade, que sairia de sincronia na primeira
exceção.

## E-mail transacional

Ao registrar uma manifestação, o visitante recebe a confirmação com o protocolo
e a equipe ativa recebe o aviso, com a descrição e um link para o painel. Quem
pede recuperação de senha recebe o link de redefinição.

Três decisões que valem no resto do molde:

- **Nada de e-mail derruba o fluxo.** O envio acontece no `after()` do Next, já
  depois da resposta: o visitante recebe o protocolo sem esperar o SMTP, e uma
  caixa fora do ar não transforma um registro bem-sucedido em erro. `sendMail`
  nunca lança; falha vira log.
- **Sem SMTP configurado o site funciona igual**, só não envia. Em
  desenvolvimento a mensagem vai para o log, para conferir o conteúdo sem
  servidor de e-mail.
- **O conteúdo do visitante é escapado no HTML.** O corpo do e-mail é HTML como
  qualquer página; sem escape, uma manifestação com `<script>` viraria injeção na
  caixa de entrada de quem abre o aviso.

O que o visitante recebe não repete o que é interno: a confirmação leva
protocolo, tipo, assunto e data, e nada de situação, prioridade, responsável ou
nota.

Camadas, de baixo para cima: `server/lib/mailer.js` fala SMTP,
`server/modules/mail/messages.js` monta o conteúdo (funções puras, sem import
nenhum) e `server/modules/mail/notifications.js` decide quem recebe o quê.

## Configurando uma implantação

Ver [`docs/NOVA_IMPLANTACAO.md`](docs/NOVA_IMPLANTACAO.md). Para um mapa das
rotas e do que cada parte faz, [`docs/GUIA_DO_SITE.md`](docs/GUIA_DO_SITE.md).

O único arquivo a editar para dar cara a um cliente é
`src/config/site/site.config.js`. Ele é validado em runtime por
`src/config/site/schema.js`: campos ausentes caem em padrões seguros, variantes
inválidas viram aviso no console e fallback, e erros estruturais (sem nome, sem
itens de menu, sem seções) derrubam o boot com mensagem explícita.
