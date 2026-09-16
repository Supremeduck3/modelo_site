# 🤖 Guia de Uso dos Subagentes no Claude Code

Este guia explica resumidamente quando acionar cada um dos subagentes configurados no projeto (`.claude/agents/`) para otimizar o fluxo de trabalho e economizar tokens.

---

## 🛠️ Agentes de Desenvolvimento (Do Repositório Clone)

### 1. `backend-developer`
* **Quando usar:** Ao criar APIs REST/GraphQL, configurar regras de negócio no servidor, integrar bancos de dados, criar rotas ou lidar com autenticação de backend.
* **Modelo:** Sonnet
* **Exemplo de comando:**
  > *"Use o backend-developer para criar a rota POST /api/v1/auth/login com validação de JWT."*

---

### 2. `frontend-developer`
* **Quando usar:** Ao construir componentes web (React, Vue, Angular), integrar chamadas de API no cliente, manipular estado global ou implementar regras de interface.
* **Modelo:** Sonnet
* **Exemplo de comando:**
  > *"Peça ao frontend-developer para criar o formulário de login integrado com a nossa API."*

---

### 3. `fullstack-developer`
* **Quando usar:** Para desenvolver uma funcionalidade completa de ponta a ponta (banco de dados, API backend e telas no frontend) em uma única instrução.
* **Modelo:** Sonnet
* **Exemplo de comando:**
  > *"Use o fullstack-developer para implementar o recurso de comentários em posts, da tabela no banco até o componente na tela."*

---

### 4. `code-reviewer`
* **Quando usar:** Antes de fazer um *pull request* ou dar um `git commit`. Ele analisa a qualidade do código, padrões de projeto, bugs em potencial e legibilidade.
* **Modelo:** Sonnet
* **Exemplo de comando:**
  > *"Peça ao code-reviewer para revisar as alterações feitas no arquivo `userService.ts`."*

---

### 5. `ui-designer`
* **Quando usar:** Para criar ou refinar o design visual da interface: esquemas de cores, design tokens, layout responsivo, acessibilidade (WCAG) ou estilos CSS/Tailwind.
* **Modelo:** Sonnet
* **Exemplo de comando:**
  > *"Use o ui-designer para ajustar a paleta de cores do componente Dashboard e garantir que seja responsivo para telas móbiles."*

---

## ⚡ Agentes Otimizadores de Tokens (Criados Anteriormente)

### 6. `pesquisador`
* **Quando usar:** Para buscar arquivos, trechos de código, funções ou variáveis pelo projeto. Funciona apenas como **leitura**, gastando o mínimo possível de tokens.
* **Modelo:** Haiku (Baixo custo)
* **Exemplo de comando:**
  > *"Use o pesquisador para achar onde a variável `DATABASE_URL` está sendo chamada no código."*

---

### 7. `testador-logs`
* **Quando usar:** Para rodar a suíte de testes unitários ou de integração no terminal. Ele filtra a saída bruta e retorna apenas os erros essenciais, sem lotar a tela com textos de sucesso.
* **Modelo:** Haiku (Baixo custo)
* **Exemplo de comando:**
  > *"Peça ao testador-logs para rodar o `npm test` e me mostrar apenas o que quebrou."*

---

## 📌 Dica de Otimização de Tokens
Sempre prefira usar o **`pesquisador`** ou o **`testador-logs`** para tarefas que envolvem apenas vasculhar o código ou ler saídas longas de terminal, pois eles rodam no modelo **Haiku**, poupando a sua cota do modelo principal.