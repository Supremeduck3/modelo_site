# Como montar o site de um salão (ou barbearia, esmalteria, estética...)

Este guia serve para qualquer negócio que atende **com hora marcada** e combina
o horário pelo WhatsApp: salão de beleza, barbearia, esmalteria, estética,
pet shop com banho e tosa. O molde tem um exemplo pronto para esse perfil —
este documento explica o que ele liga e por quê.

## 1. Partir do exemplo, não do zero

```bash
cp src/config/site/exemplos/salao.config.js src/config/site/site.config.js
```

`salao.config.js` já liga as três funcionalidades pensadas para esse tipo de
negócio (`features.pricing`, `features.booking`, o botão de WhatsApp) e traz
seções, textos e cores coerentes entre si. Editar em cima dele é mais seguro
do que escrever do zero: falta esquecer uma flag de `features` e a seção
correspondente na home nem aparece.

## 2. Trocar identidade, WhatsApp e cores

- **Identidade e contato** — `identity` e `contact` com os dados reais do
  negócio.
- **WhatsApp** — `contact.whatsapp` é o número que recebe as conversas;
  `contact.whatsappButton.enabled` e `.message` controlam o botão fixo (seção
  4 explica por que ele existe). Sem número utilizável, o botão simplesmente
  não desenha nada (`src/lib/whatsapp.js` normaliza o número e devolve `null`
  para o que não dá para reconhecer).
- **Cores** — o exemplo já vem com contraste medido (texto ≥ 4,5:1 sobre fundo
  e superfície). Se trocar as cores, rode `npm test`: `tests/contraste.test.js`
  confere os presets e `tests/booking-config.test.js` confere o arquivo
  `salao.config.js` em si.
- **Fontes** — `salao.config.js` usa o preset `editorial` (Inter + Fraunces).
  Em `src/config/theme/fonts.js`, o preload é por família, não pelo preset
  ativo automaticamente: ao trocar de preset, ajuste `preload: true` nas
  famílias do preset novo e `false` nas outras. O título da dobra é o maior
  elemento da página — é o que o LCP mede — e ele espera a fonte dele; fazer
  preload da fonte errada não ajuda em nada.

## 3. Configurar o bloco `booking`

```js
booking: {
  timezone: 'America/Sao_Paulo',
  daysAhead: 30,           // até quantos dias à frente dá para pedir horário
  closedWeekdays: [0, 1],  // 0 = domingo, 1 = segunda, ... 6 = sábado
  periods: ['manha', 'tarde', 'noite'],
  professionals: ['Carla', 'Juliana', 'Rafa'], // vazio esconde a pergunta "Com quem?"
}
```

- `timezone` decide o que é "hoje" para o formulário de agendamento.
- `daysAhead` precisa ser um inteiro entre 1 e 90; fora disso a configuração
  cai no padrão do molde, com aviso no console.
- `closedWeekdays` não pode fechar os 7 dias — ninguém conseguiria pedir
  horário, e o molde recusa esse valor e usa o padrão.
- `periods` só aceita os valores declarados em `BOOKING_PERIODS`
  (`src/lib/booking/constants.js`): hoje `manha`, `tarde`, `noite`.
- `professionals` é só uma lista de nomes livres — não são contas de usuário
  nem têm agenda própria no banco; é a pergunta "com quem você prefere?" que o
  cliente vê no formulário.

## 4. Rodar a migração e cadastrar os serviços

```bash
npm run db:deploy   # aplica a migração add_catalog_and_appointments (ver docs/NOVA_IMPLANTACAO.md)
```

Depois disso, os serviços com preço se cadastram no painel, em **Painel →
Serviços** (`/painel/servicos`, `src/components/painel/CatalogManager.jsx`):
nome, categoria, preço (ou "a partir de"), duração e se o serviço aceita
pedido de agendamento (`bookable`). Só quem tem a permissão `CATALOG_MANAGE`
edita preço — ver seção de permissões abaixo.

Para testar com dados de exemplo sem digitar cada serviço à mão:

```bash
npm run db:seed:catalogo -- --salao   # tabela de salão de beleza
npm run db:seed:catalogo              # serviços genéricos, para outros ramos
```

## 5. O dia a dia depois de publicado

1. O cliente pede um horário em **`/agendar`**: escolhe o serviço, um dia
   dentro da janela permitida (`daysAhead`, sem os dias de `closedWeekdays`),
   o período do dia e, se a lista `professionals` não estiver vazia, com quem
   prefere.
2. O pedido cai em **Painel → Agenda**, visível para quem tem
   `APPOINTMENTS_VIEW`.
3. A empresa decide: **confirma** o horário pedido, **propõe outro horário**,
   ou **recusa** o pedido — ação de quem tem `APPOINTMENTS_MANAGE`
   (`src/components/painel/AppointmentActions.jsx`).
4. Qualquer uma dessas decisões libera o botão **"Avisar no WhatsApp"**, que
   abre a conversa já com a mensagem pronta (mesmo texto que vai por e-mail,
   ver `src/lib/booking/messages.js`). **O sistema não manda a mensagem
   sozinho** — é a empresa quem aperta enviar. Isso é deliberado, pelas mesmas
   razões do restante do WhatsApp no molde (`src/lib/whatsapp.js`): não exige
   API paga nem conta comercial, não corre risco de bloqueio por automação, e
   funciona com o número de WhatsApp que o salão já usa no dia a dia — sem
   trocar de ferramenta nem pagar por integração.
5. Se o cliente informou e-mail no pedido **e** o SMTP da implantação está
   configurado, ele também recebe um aviso automático por e-mail com a mesma
   decisão (`notifyAppointmentUpdated` em
   `src/server/modules/mail/notifications.js`). Sem SMTP configurado, ou sem
   e-mail informado, esse aviso simplesmente não sai — o WhatsApp continua
   sendo o canal garantido.
6. O cliente acompanha o pedido em **`/agendar/pedido/CÓDIGO`**, o mesmo
   código que recebeu ao registrar o pedido.

## 6. O que o agendamento NÃO faz

- **Não é reserva automática de horário livre.** O cliente sugere um dia e um
  período, não um horário exato de uma grade; quem decide o horário final é a
  empresa.
- **Não bloqueia conflito de agenda.** O sistema não sabe se duas pessoas
  pediram o mesmo horário nem impede isso — quem enxerga o conflito e resolve
  é quem confirma no painel.
- Ele não substitui uma agenda com grade de horários e bloqueio automático de
  conflito. Se o negócio precisa disso, este não é o encaixe certo hoje.

## Por que esse modelo (pedido + confirmação) em vez de reserva automática

Uma grade de horários com reserva automática exige saber, por profissional e
por intervalo de tempo, o que já está ocupado — e trava se dois pedidos
chegarem ao mesmo tempo, se um profissional falta, ou se um atendimento atrasa
e empurra o seguinte. É complexidade real, e a maioria dos pequenos negócios já
resolve isso na cabeça ou numa agenda de papel, ajustando ao vivo.

O molde pede menos do banco (dia + período, não um slot de calendário) e
devolve a decisão para quem já toma essa decisão hoje: a pessoa que atende o
telefone ou o WhatsApp do salão. O cliente ganha um jeito de pedir sem
esperar resposta na hora; a empresa ganha uma fila organizada em vez de
mensagens soltas — mas continua no comando do horário final, exatamente como
antes de ter o site.
