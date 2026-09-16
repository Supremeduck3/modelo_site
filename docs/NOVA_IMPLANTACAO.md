# Criando uma nova implantação

Cada cliente recebe uma implantação independente: repositório/instância, banco e
domínio próprios. O código do molde é reaproveitado.

## Passo a passo

1. **Instanciar o molde** — clonar o repositório para o novo cliente.
2. **Ambiente** — `cp .env.example .env.local` e preencher. Nenhum segredo vai
   para o versionamento.
3. **Dados do negócio** — preencher `identity` e `contact` em
   `src/config/site/site.config.js`.
4. **Design** — decidir navegação, seções e variantes (seções abaixo). Essa
   decisão é do implementador.
5. **Marca e mídia** — colocar logo/imagens em `public/` (ou usar URLs) e
   referenciá-las em `identity`, `media` e no `content` das seções.
6. **Conteúdo** — preencher `content` com textos, serviços, diferenciais, FAQ.
7. **Funcionalidades** — ligar/desligar blocos em `features`.
8. **SEO e legais** — preencher `seo` e `legal` (textos jurídicos fornecidos e
   revisados pelo responsável — o molde não inventa texto legal).
9. **Conferir** — `npm run lint` e `npm run dev`, revisando mobile e desktop.
10. **Deploy + domínio.**

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
- Uma seção cujo `features[type]` está `false` não é renderizada.

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
