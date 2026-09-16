# Site Modelo

Molde reutilizável para sites de pequenos negócios. O mesmo código-base produz
sites visualmente diferentes para clientes diferentes: o site é resultado de
**configuração + conteúdo + componentes reutilizáveis**.

O produto tem três blocos:

| Bloco | Situação |
| --- | --- |
| 1 — Site institucional | Implementado (fases 0–2) |
| 2 — Canal de manifestações | Página de apresentação pronta; formulário, API e protocolo na fase 3 |
| 3 — Painel da empresa | Fases 4–6 |

## Stack

- Next.js 16 (App Router) + React 19, em JavaScript
- CSS Modules sobre tokens em variáveis CSS
- Ant Design fica reservado para o painel (fases 4+); o site público não carrega
  o runtime do antd
- Biome para lint e formatação

## Começando

```bash
npm install
cp .env.example .env.local
npm run dev     # http://localhost:3000
npm run lint    # biome check
npm run format  # biome format --write
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

## Configurando uma implantação

Ver [`docs/NOVA_IMPLANTACAO.md`](docs/NOVA_IMPLANTACAO.md).

O único arquivo a editar para dar cara a um cliente é
`src/config/site/site.config.js`. Ele é validado em runtime por
`src/config/site/schema.js`: campos ausentes caem em padrões seguros, variantes
inválidas viram aviso no console e fallback, e erros estruturais (sem nome, sem
itens de menu, sem seções) derrubam o boot com mensagem explícita.
