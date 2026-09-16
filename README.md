# Site Modelo

Molde reutilizável para sites de pequenos negócios. O mesmo código-base produz
sites visualmente diferentes para clientes diferentes: o site é resultado de
**configuração + conteúdo + componentes reutilizáveis**.

O produto tem três blocos:

| Bloco | Situação |
| --- | --- |
| 1 — Site institucional | Implementado (fases 0–2) |
| 2 — Canal de manifestações | Implementado (fase 3): formulário público, API, protocolo e histórico |
| 3 — Painel da empresa | Fases 4–6 |
| E-mail transacional | Fase 6 (a API já tem o ponto de disparo marcado) |

## Stack

- Next.js 16 (App Router) + React 19, em JavaScript
- CSS Modules sobre tokens em variáveis CSS
- Ant Design fica reservado para o painel (fases 4+); o site público não carrega
  o runtime do antd
- PostgreSQL + Prisma (migrations versionadas)
- Zod para validação, com schema compartilhado entre formulário e API
- Biome para lint e formatação; `node --test` e Playwright para testes

## Começando

```bash
npm install
cp .env.example .env.local   # preencha DATABASE_URL

npm run db:migrate           # aplica as migrations
npm run db:seed              # cria a empresa e as categorias iniciais

npm run dev                  # http://localhost:3000
npm run lint                 # biome check
npm run test                 # regras críticas (node --test)
npm run test:e2e             # fluxos críticos no navegador (Playwright)
npm run build                # prisma generate + next build
```

## Regra central de design

**O design é escolhido pelo implementador, não pelo cliente final.** A empresa
fornece logo, textos, fotos, serviços e contatos; a composição visual (navegação,
seções, variantes, cores, tipografia) é decidida por quem constrói a implantação,
editando a configuração. Não existe editor drag-and-drop no V1.

## Arquitetura

```
src/
  app/                  rotas (home, páginas legais, canal)
  components/
    layout/             AppShell, navegação (header/compacto/sidebar), rodapé
    sections/           seções da home, uma pasta por tipo, com variantes
    ui/                 primitivos: Container, Section, Button, Media, LegalPage
  config/
    site/               schema + configuração desta implantação
    theme/              tokens -> variáveis CSS e tema do Ant Design
```

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

## Configurando uma implantação

Ver [`docs/NOVA_IMPLANTACAO.md`](docs/NOVA_IMPLANTACAO.md).

O único arquivo a editar para dar cara a um cliente é
`src/config/site/site.config.js`. Ele é validado em runtime por
`src/config/site/schema.js`: campos ausentes caem em padrões seguros, variantes
inválidas viram aviso no console e fallback, e erros estruturais (sem nome, sem
itens de menu, sem seções) derrubam o boot com mensagem explícita.
