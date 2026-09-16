# Guia do site

Mapa rápido do que existe no ar e quem usa cada parte. Para arquitetura, ver o
[README](../README.md); para montar uma implantação nova,
[NOVA_IMPLANTACAO](NOVA_IMPLANTACAO.md).

## Os dois ambientes

| | Público | Painel |
| --- | --- | --- |
| Quem entra | qualquer visitante | equipe da empresa, com login |
| Onde | `/`, `/manifestacao`, `/privacidade`, `/termos` | `/painel` |
| Visual | variantes escolhidas na configuração | fixo (Ant Design) |
| Indexado no Google | sim | não (`noindex`) |

São cascas independentes: o site público não carrega nada do painel, e o painel
não carrega a navegação nem o rodapé do site.

## Rotas públicas

### `/` — home

Uma lista de seções renderizada **na ordem declarada** em
`pages.home.sections`. Cada seção tem um tipo (hero, sobre, serviços,
diferenciais, galeria, depoimentos, equipe, dúvidas, contato) e uma variante,
que muda só o arranjo — nunca a regra de negócio.

Quem decide a composição é o implementador, não o cliente final. Não há editor
drag-and-drop.

### `/manifestacao` — canal de manifestações

O visitante registra uma reclamação, elogio, sugestão, dúvida ou solicitação.
Preenche tipo, assunto, descrição, contato e o consentimento.

Ao enviar, recebe um **protocolo** no formato `AAAA-XXXX-XXXX` (ano + dois
blocos sorteados). É o identificador público: não é sequencial, então ninguém
descobre o protocolo de outra pessoa contando de um em um.

Exige ao menos um e-mail **ou** um telefone — sem contato a empresa não tem como
responder e o canal perde a função.

Quem deixou e-mail recebe a confirmação com o protocolo, e a equipe recebe o
aviso da manifestação nova. Se a implantação estiver sem SMTP configurado, o
registro funciona igual — só não sai e-mail.

### `/privacidade` e `/termos`

Textos jurídicos vindos da configuração (`legal`). O molde não inventa texto
legal: quem fornece e revisa é o responsável pela empresa.

## Painel (`/painel`)

Acesso restrito, com e-mail e senha cadastrados. Hoje mostra o panorama do
canal: total de manifestações recebidas, quantas estão em aberto e a contagem
por situação.

O que o painel **ainda não faz** (fases 5 e 6): abrir uma manifestação,
responder o visitante, trocar a situação, registrar nota interna, cadastrar
equipe e editar categorias.

### Entrar e sair

- `/painel` sem sessão manda para `/painel/login` e guarda o destino.
- A sessão dura 12h e vive em cookie `httpOnly` — fora do alcance de qualquer
  script da página.
- Sair é um botão no canto do cabeçalho, sob o nome do usuário.
- Errar a senha não bloqueia a conta, mas há limite de tentativas (5 por e-mail
  e 10 por origem, em janelas de 10 minutos); estourado, o painel pede alguns
  minutos de espera.

Não existe usuário padrão: o primeiro é criado pelo seed da implantação. Ver
[Primeiro acesso ao painel](NOVA_IMPLANTACAO.md#primeiro-acesso-ao-painel).

## Como os dados se organizam

```
Empresa
├── Usuários         equipe com acesso ao painel (responsável/admin/operador)
├── Categorias       assuntos das manifestações, ajustáveis pela empresa
└── Manifestações    o que o visitante enviou
    └── Histórico    trilha auditável de tudo que aconteceu
```

Duas separações que não se misturam:

- **Nota interna** (no histórico) nunca aparece para o visitante.
- **Resposta pública** (na manifestação) é o único texto que ele vê.

As categorias ficam no banco, não na configuração do site: são dado operacional
da empresa, que muda sem precisar de deploy.

## O que muda de cliente para cliente

Um arquivo: `src/config/site/site.config.js`. Nome, contatos, cores,
tipografia, logo, navegação, quais seções aparecem, em que ordem, com qual
variante, e quais funcionalidades estão ligadas.

O painel herda as mesmas cores e a mesma fonte — cliente com marca verde tem
painel verde sem ninguém editar o painel.

## Comandos do dia a dia

```bash
npm run dev        # sobe em http://localhost:3000
npm run lint       # biome
npm run test       # regras críticas
npm run test:e2e   # fluxos no navegador
npm run db:studio  # inspecionar o banco
```
