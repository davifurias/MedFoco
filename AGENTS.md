# Protocolo de trabalho com IA — MedFoco

Este arquivo é a **fonte única** das regras para qualquer IA ou pessoa que desenvolva o MedFoco
(Claude Code, Codex, Cursor, Copilot, Gemini ou um programador). Outros arquivos (como o
`CLAUDE.md`) apenas complementam; não repetem nem contradizem estas regras.

## 1. Princípio de abertura

O dono do projeto **não é programador**. Ele descreve **o comportamento desejado** do aplicativo
("quero metas semanais", "o timer precisa de pausa"), não a implementação.

- O usuário descreve o resultado desejado. A IA deve identificar a implementação necessária, mas
  não deve inventar requisitos ou decisões de produto que não foram solicitados. Quando houver uma
  decisão de produto relevante não especificada, perguntar ao usuário ou apresentar opções antes
  de implementar.
- Nunca exigir que o usuário diga arquivo, componente, função, biblioteca ou técnica. Descubra
  analisando o projeto.
- Pedido claro → não faça perguntas técnicas. Mais de uma interpretação com consequência
  importante → faça **uma** pergunta curta antes de alterar o código.
- Detalhes de implementação que não mudam o comportamento esperado são decisão sua, seguindo a
  arquitetura do projeto. Se houver opções com consequências relevantes (arquitetura, custo,
  segurança, manutenção, experiência do usuário), explique as opções e peça a decisão.

## 2. Classificação do pedido

**🟡 Propor um plano curto e esperar o "ok"** quando o pedido envolver qualquer um destes itens:

- banco de dados (estrutura, migrações, políticas de acesso/RLS);
- login, autenticação, permissões ou segurança;
- exclusão ou alteração de dados de usuários;
- remoção ou mudança significativa de uma funcionalidade existente;
- deploy em produção ou rollback em produção;
- nova biblioteca/dependência;
- custo (IA, serviços ou planos pagos);
- infraestrutura, CI, proteções do repositório;
- mudança visual ampla ou pedido vago ("deixa essa tela melhor");
- mudança que afeta mais de uma área do aplicativo;
- ambiguidade com consequência importante.

O plano deve dizer: o que muda para o usuário, áreas afetadas, riscos (principalmente perda de
dados) e como desfazer.

**🟢 Executar direto** tudo o que não estiver na lista acima: mudanças claras, locais e
reversíveis. Mesmo assim, sempre em branch e com PR (seção 3).

## 3. Fluxo obrigatório

1. Entender o pedido (seção 1) e classificá-lo (seção 2).
2. Trabalhar **sempre em uma branch**, nunca na `main`:
   `feat/…` (funcionalidade), `fix/…` (correção), `chore/…` (manutenção/docs), `claude/…`
   (branches criadas automaticamente por sessões do Claude Code — equivalem às anteriores).
3. Implementar (seção 4).
4. Verificar: `pnpm check` (formato, lint, tipos, testes e build) + testes específicos da mudança.
5. Commit em Conventional Commits (seção 9) e push da branch.
6. Abrir ou atualizar o Pull Request usando o template, com título no padrão Conventional Commits
   — ele vira o commit na `main` (squash merge).
7. Responder ao usuário no formato da seção 11.

## 4. Implementação

- **Não ampliar o escopo de uma solicitação sem autorização.** Implemente primeiro o que foi
  solicitado. Melhorias, funcionalidades adicionais ou refatorações não necessárias para o pedido
  devem ser apresentadas como sugestões separadas, e não implementadas automaticamente.
- **Toda alteração deve preservar as funcionalidades existentes**, salvo quando o pedido
  explicitamente determinar sua remoção ou substituição. Antes de remover ou alterar
  significativamente uma funcionalidade existente, informar o impacto e, quando a mudança for
  relevante, aguardar confirmação.
- Seguir a arquitetura e os padrões já existentes; evitar duplicação.
- Não alterar comportamento não relacionado ao pedido.
- Decisão arquitetural importante → explicar antes de implementar.
- **Dependências:** antes de adicionar uma biblioteca, verificar se é necessária, se o projeto já
  tem solução equivalente e o impacto em tamanho, segurança e manutenção. Nunca por conveniência.
- Toda mudança de comportamento vem acompanhada de testes que a cobrem.
- Atualizar a documentação em `docs/` quando o comportamento ou o processo mudar.

## 5. Alterações visuais

- Preservar a identidade visual existente (cores, tema claro/escuro, tom em pt-BR), salvo pedido
  de mudança maior.
- Verificar celular e computador (responsividade).
- Não alterar funcionalidades apenas para mudar aparência.
- Sempre que possível, oferecer um jeito simples de ver o resultado (link de preview do PR,
  captura de tela).

## 6. Banco de dados

- Nenhuma alteração manual como solução permanente (nada de mudar estrutura pelo painel do
  Supabase em staging ou produção).
- Toda mudança estrutural (tabela, coluna, índice, política RLS) é uma **migração versionada** em
  `supabase/migrations/`, no mesmo PR da funcionalidade que a usa.
- Padrão **expandir → migrar → contrair**: primeiro só adicionar (compatível com a versão anterior
  do app); remover o que ficou obsoleto apenas numa release posterior.
- Mudança potencialmente destrutiva: explicar o impacto, verificar compatibilidade e **nunca
  apagar dados sem autorização explícita**.

## 7. Segurança e dados de usuários

- **Nunca** colocar no código ou no Git: chaves de API, tokens, senhas, credenciais, segredos ou
  dados pessoais reais. Valores reais ficam fora do repositório (ver
  `docs/variaveis-de-ambiente.md`); o repositório só tem `.env.example` sem valores.
- **Nunca** pedir que o usuário cole uma chave secreta no chat se houver alternativa segura
  (painel de Secrets do GitHub, da hospedagem ou do Supabase).
- **Nunca** desativar uma proteção de segurança ou um teste para "fazer passar" sem informar.
- Não usar dados reais em testes; não copiar dados de produção para desenvolvimento ou staging.
- Não expor dados pessoais em logs.
- O MedFoco pode guardar dados de saúde (ex.: TDAH), que são **dados sensíveis pela LGPD**:
  preservar as regras de privacidade e consentimento definidas no projeto.
- Se um segredo vazar: seguir `docs/runbooks/vazamento-de-segredo.md` (rotacionar a chave).

## 8. Independência de plataforma

- O aplicativo não pode depender de APIs internas de nenhuma plataforma (ex.: `window.claude`,
  usado no HTML original). O CI bloqueia isso (`scripts/check-platform-independence.mjs`).
- A IA do aplicativo é chamada pelo **backend do próprio MedFoco**, nunca direto do navegador.
- O Claude Code é ferramenta de desenvolvimento, não dependência do aplicativo.
- `legacy/` guarda o HTML original apenas como histórico: não editar.

## 9. Git

- **Nunca**: push na `main`, force push, apagar ou reescrever histórico, apagar tags.
- Commits no padrão **Conventional Commits**, em português:
  `feat: adiciona metas semanais` · `fix: corrige cálculo do progresso` ·
  `refactor: reorganiza módulo de questões` · `test: adiciona testes do timer` ·
  `docs: atualiza guia de desenvolvimento` · `chore: atualiza dependências` ·
  `feat!: …` (mudança incompatível).
- Proibido mensagem genérica: "update", "fix", "changes", "mudanças", "alterações", "final",
  "teste".

## 10. Erros e verificação

- Tarefa só está concluída quando `pnpm check` e os testes relevantes passam — ou quando uma
  limitação foi **informada explicitamente** (ex.: "este ambiente não tem Docker; os testes de
  banco rodarão no CI").
- Ao encontrar um erro: identificar a causa → explicar resumidamente → corrigir → testar de novo
  → informar o resultado.
- Nunca esconder erros. Nunca declarar sucesso com testes relevantes falhando.
- Se o CI falhar no PR: ler o erro, corrigir na mesma branch e enviar de novo.

## 11. Comunicação com o usuário

- Primeiro, **o que mudou em linguagem simples** (o que o usuário do app consegue fazer agora).
  Depois, se necessário, os detalhes técnicos — sem jargão não explicado.
- Não obrigar o usuário a interpretar erros técnicos sozinho.
- Ao concluir uma **mudança no projeto**, responder sempre com:

  ```
  ### O que foi feito
  ### O que foi testado
  ### Arquivos principais alterados
  ### Git            (branch, commit, link do PR)
  ### Próximo passo  (o que o usuário precisa fazer, incluindo link de preview se houver)
  ```

  Perguntas e explicações sem mudança no projeto dispensam esse formato.

## 12. Desfazer ("desfaz essa alteração")

Primeiro identificar **exatamente** qual alteração desfazer (e confirmar se houver dúvida).
Nunca apagar histórico: desfazer é sempre uma nova mudança.

| Onde a mudança está               | Como desfazer                                                                                                                | Confirmar antes?  |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| Só na branch (PR não incorporado) | `git revert` do commit na branch, ou fechar o PR                                                                             | Não               |
| Incorporada na `main`             | Nova branch + PR com `git revert` do commit do PR                                                                            | Não (mas informa) |
| Em produção                       | Reimplantar a tag anterior + PR de revert; se houver migração de banco, explicar o impacto (ver `docs/runbooks/rollback.md`) | **Sim**           |

## 13. Pedidos vagos e ideias

- **Pedido vago** ("deixa essa tela melhor"): não alterar partes importantes arbitrariamente.
  Apresentar uma proposta curta (o que mudaria e por quê) e esperar o "ok".
- **Ideia** ("uma ideia que eu tive foi…"): **não implementar**. Registrar em `docs/ideias.md`
  (em uma branch/PR, como qualquer mudança) e só implementar quando o usuário pedir.

## 14. Mapa do projeto

| Caminho                 | O que é                                                                       |
| ----------------------- | ----------------------------------------------------------------------------- |
| `legacy/MedFoco.html`   | App original exportado do Claude Artifact (histórico, não editar)             |
| `apps/web`              | Aplicativo web (React + TypeScript + Vite); funcionalidades em `src/features` |
| `apps/web/src/data`     | Acesso a dados: interface do repositório + implementação local provisória     |
| `packages/`             | Código compartilhado (a partir da Fase 1: `packages/core`, regras de negócio) |
| `supabase/`             | Migrações, seeds e funções do backend (a partir da Fase 2)                    |
| `scripts/`              | Scripts de verificação do repositório                                         |
| `docs/`                 | Documentação (comece por `docs/fluxo-de-trabalho.md`)                         |
| `.github/`              | CI, template de PR, Dependabot                                                |
| `.claude/settings.json` | Travas técnicas do Claude Code                                                |

Comandos (iguais em qualquer ambiente): `pnpm install` · `pnpm dev` · `pnpm check` · `pnpm lint` ·
`pnpm test` · `pnpm build` · `pnpm format`.

Mantenha este mapa atualizado quando a estrutura mudar.
