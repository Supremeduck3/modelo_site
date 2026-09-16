# Site Modelo

Molde reutilizável para sites de pequenos negócios. O mesmo código-base produz
sites visualmente diferentes para clientes diferentes: o site é resultado de
**configuração + conteúdo + componentes reutilizáveis**.

O produto tem três blocos:

| Bloco | Situação |
| --- | --- |
| 1 — Site institucional | Implementado (fases 0–2) |
| 2 — Canal de manifestações | Implementado (fase 3): formulário público, API, protocolo e histórico |
| 3 — Painel da empresa | Em andamento: autenticação e casca prontas (fase 4); atendimento das manifestações na fase 5; equipe e categorias na fase 6 |
| E-mail transacional | Fase 6 (a API já tem o ponto de disparo marcado) |

## Stack

- Next.js 16 (App Router) + React 19, em JavaScript
- CSS Modules sobre tokens em variáveis CSS
- Ant Design só no painel: o runtime entra por `PanelThemeProvider`, usado apenas
  no layout de `/painel`, e o site público não carrega nada dele
- Sessão e hash de senha com `node:crypto` (scrypt + HMAC), sem dependência de
  autenticação
- PostgreSQL + Prisma (migrations versionadas)
- Zod para validação, com schema compartilhado entre formulário e API
- Biome para lint e formatação; `node --test` e Playwright para testes

## Começando

```bash
npm install
cp .env.example .env.local   # preencha DATABASE_URL e AUTH_SECRET

npm run db:migrate           # aplica as migrations
npm run db:seed              # empresa, categorias e o primeiro usuário do painel

npm run dev                  # http://localhost:3000
npm run lint                 # biome check
npm run test                 # regras críticas (node --test)
npm run test:e2e             # fluxos críticos no navegador (Playwright)
npm run build                # prisma generate + next build
```

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
- **Nenhum usuário padrão**: o primeiro usuário só existe se o seed rodar com
  `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD`, e o seed nunca sobrescreve a senha
  de um usuário já existente.

`src/proxy.js` só olha se o cookie existe, para redirecionar ao login com
`?next=`. É conveniência de navegação, não controle de acesso — um cookie
forjado passa por ele e é recusado no servidor.

Limite conhecido: a sessão é stateless, então `logout` apaga o cookie do
navegador mas não revoga um token que já tenha sido copiado; ele vale até
expirar. Trocar `AUTH_SECRET` invalida todas de uma vez.
`src/server/lib/session-token.js` é o ponto de troca por sessão persistida se
alguma implantação precisar de revogação imediata.

## Configurando uma implantação

Ver [`docs/NOVA_IMPLANTACAO.md`](docs/NOVA_IMPLANTACAO.md). Para um mapa das
rotas e do que cada parte faz, [`docs/GUIA_DO_SITE.md`](docs/GUIA_DO_SITE.md).

O único arquivo a editar para dar cara a um cliente é
`src/config/site/site.config.js`. Ele é validado em runtime por
`src/config/site/schema.js`: campos ausentes caem em padrões seguros, variantes
inválidas viram aviso no console e fallback, e erros estruturais (sem nome, sem
itens de menu, sem seções) derrubam o boot com mensagem explícita.
