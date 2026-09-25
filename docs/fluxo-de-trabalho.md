# Fluxo de trabalho — como desenvolver o MedFoco conversando com a IA

Este guia é para o dono do projeto. Não é preciso saber programar.

## 1. Como pedir

Descreva **o que você quer que o usuário do app consiga fazer**, do seu jeito:

- "Quero adicionar metas semanais."
- "Quero que as matérias mostrem meu progresso."
- "Quero que o timer tenha uma pausa."
- "Quero mudar o visual da tela inicial."

Você não precisa dizer arquivo, tecnologia ou como fazer. A IA descobre.

## 2. O que acontece depois

A IA classifica o pedido:

- 🟢 **Simples e seguro** (ex.: trocar um texto, adicionar um botão): ela faz direto.
- 🟡 **Importante** (banco de dados, login, apagar dados, remover algo que já existe, custo,
  mudança visual grande, pedido vago): ela apresenta um **plano curto** e só começa depois do seu
  "ok".

Se o pedido tiver duas interpretações com resultados bem diferentes, ela faz **uma** pergunta
curta. Ela não deve inventar funcionalidades que você não pediu: sugestões extras aparecem
separadas, para você decidir.

## 3. Como a mudança chega ao aplicativo

```
Você pede
   ↓
A IA trabalha numa cópia separada (branch) — a versão estável não é tocada
   ↓
A IA testa e abre um Pull Request (PR) no GitHub
   ↓
O GitHub testa tudo de novo sozinho (CI):  ✅ pode entrar   ❌ bloqueado
   ↓
Você confere e clica em "Squash and merge"
   ↓
Quando quiser publicar uma versão, você aprova o PR de release → vira uma tag (ex.: v0.2.0)
```

No final de cada tarefa a IA responde sempre com: **O que foi feito · O que foi testado ·
Arquivos principais · Git · Próximo passo**.

## 4. Como aprovar um PR (passo a passo)

1. Abra o link do PR que a IA enviou.
2. Leia a descrição (está em linguagem simples).
3. Role até o fim: espere todas as verificações ficarem com ✅.
   - Se aparecer ❌, diga à IA: **"o CI falhou, corrija"**.
4. A partir da Fase 1, cada PR terá um **link de preview** para testar no celular.
5. Gostou? Clique em **"Squash and merge"** → **"Confirm"**.
   Não gostou? Diga à IA o que ajustar, ou clique em **"Close pull request"** — nada muda na
   versão estável.

## 5. Como desfazer

Frases que funcionam:

- "Desfaz essa alteração."
- "Volta a tela inicial como estava antes."
- "A versão de ontem estava melhor, volta pra ela."

A IA identifica exatamente o que desfazer e cria uma **nova** mudança que reverte a anterior
(o histórico nunca é apagado). Se a mudança já estiver publicada em produção, ela explica o plano
antes e espera o seu "ok". Detalhes técnicos: [runbooks/rollback.md](runbooks/rollback.md).

## 6. Ideias para depois

Diga "**uma ideia que eu tive foi…**". A IA registra em [ideias.md](ideias.md) e **não**
implementa. Quando quiser, diga "vamos fazer a ideia X".

## 7. Se o Claude não estiver disponível

Tudo está no GitHub. Qualquer outra IA (Codex, Cursor, Copilot, Gemini…) ou um programador pode
continuar: as regras estão no [AGENTS.md](../AGENTS.md), que essas ferramentas leem sozinhas, e
o ambiente está descrito em [setup.md](setup.md).

## 8. Glossário

| Termo        | Significado                                                                                |
| ------------ | ------------------------------------------------------------------------------------------ |
| **Branch**   | Uma cópia paralela do projeto onde a mudança é feita sem afetar a versão estável.          |
| **main**     | A branch oficial. Protegida: só recebe mudanças aprovadas via PR com testes verdes.        |
| **PR**       | Pull Request: o pedido para incorporar uma branch na `main`. Mostra o que mudou.           |
| **Merge**    | Incorporar o PR na `main`. Usamos "Squash and merge" (vira um único registro).             |
| **CI**       | Testes automáticos que o GitHub roda em todo PR.                                           |
| **Commit**   | Um registro salvo de uma mudança, com mensagem descritiva.                                 |
| **Tag**      | Uma etiqueta permanente numa versão (ex.: `v0.2.0`). Nunca muda.                           |
| **Release**  | A publicação de uma tag no GitHub, com a lista de novidades.                               |
| **Deploy**   | Colocar uma versão no ar.                                                                  |
| **Staging**  | Ambiente de testes, igual à produção, mas com dados fictícios.                             |
| **Produção** | O aplicativo que os usuários reais usam.                                                   |
| **Rollback** | Voltar para uma versão anterior.                                                           |
| **Migração** | Um arquivo que descreve uma mudança na estrutura do banco de dados, de forma reproduzível. |
| **Preview**  | Link temporário para testar um PR antes de aprová-lo.                                      |
