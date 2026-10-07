# Preparação para a Fase 3

O que a Fase 2 deixa pronto para a Fase 3 (backend, login, sincronização, arquivos, IA real).
Escrito na auditoria final da Fase 2 (etapa 2.16). A Fase 2 prepara **interfaces**, sem antecipar
as implementações (seção 15 do [plano da Fase 2](plano-fase-2.md)).

## 1. Onde a Fase 3 encaixa

```
Telas e hooks  →  MedFocoRepository (interface)  →  hoje: armazenamento local do navegador
                                                  →  Fase 3: backend (Supabase)
Telas          →  serviços de IA (1 ponto de entrada cada)  →  hoje: "não disponível"
                                                            →  Fase 3: chamada ao backend
```

- **Nenhuma tela acessa o armazenamento diretamente.** Tudo passa pelo `MedFocoRepository`
  (`apps/web/src/data/repository.ts`), inclusive o tema. Para trocar o armazenamento, basta uma
  nova implementação da interface e passá-la ao `<App>` (`apps/web/src/main.tsx`).
- **Hoje todos os métodos são assíncronos** (já devolvem `Promise`), como o backend exigirá.

## 2. Dados: de cada lista local à tabela futura

Chaves versionadas do armazenamento local (`medfoco:v1:*`) e a sugestão de tabela. Todos os
registros têm `id` (UUID) e `createdAt` (ms); o `userId` entra na Fase 3.

| Lista local (chave) | Tipo (`data/types.ts`)  | Tabela sugerida     | Observações                                                                    |
| ------------------- | ----------------------- | ------------------- | ------------------------------------------------------------------------------ |
| `tasks`             | `Task`                  | `tasks`             | `deadline` é data `AAAA-MM-DD` ou vazio                                        |
| `events`            | `CalendarEvent`         | `events`            | `date` é data de calendário local                                              |
| `materials`         | `Material`              | `materials`         | `tags` (lista), `videoLink` já validado (só http/https)                        |
| `questions`         | `Question`              | `questions`         | `options` sempre 4, `correctIndex` de 0 a 3                                    |
| `attempts`          | `Attempt`               | `attempts`          | alimenta o desempenho por matéria e assunto                                    |
| `focusSessions`     | `FocusSession`          | `focus_sessions`    | `type` work/break; o tempo focado **nunca** inclui pausas                      |
| `notebook`          | `NotebookEntry`         | `notebook_entries`  | ideias pessoais                                                                |
| `appIdeas`          | `AppIdea`               | `app_ideas`         | mural "Ideias do App": hoje local, no original era compartilhado (ver seção 5) |
| `schedule`          | texto                   | `profiles` (campo)  | horários fixos em texto livre                                                  |
| `profile`           | `Profile`               | `profiles`          | curso, período, matérias, metas, preferências                                  |
| `dailySuggestion`   | `DailySuggestion`       | `daily_suggestions` | só existirá com IA real                                                        |
| `theme`             | `Theme` (texto simples) | `profiles` (campo)  | preferência de interface                                                       |

**Regras a manter no banco:** RLS por usuário em todas as tabelas; datas de calendário como `date`
(sem fuso), e momentos como `timestamptz`; nenhum dado pessoal em logs; dados de saúde são
sensíveis pela LGPD (ver `AGENTS.md`).

**Leitura tolerante:** `data/normalize.ts` já trata dado ausente, de tipo errado ou danificado
(ignora o item, sem apagá-lo). Ao migrar, reaproveite essas regras e **não apague** o que não
conseguir converter: avise o usuário.

## 3. IA: pontos de entrada

Cada recurso de IA tem **um único ponto de entrada**, que hoje lança `AiUnavailableError`
(`shared/ai.ts`) e a tela mostra "ainda não está disponível", sem simular nada. Na Fase 3, a
troca é nesses arquivos, **chamando o backend** (nunca a IA direto do navegador):

| Recurso                            | Arquivo (em `apps/web/src/features/`)  | Função                                                       |
| ---------------------------------- | -------------------------------------- | ------------------------------------------------------------ |
| Sugestão da IA para hoje (Início)  | `inicio/services/sugestaoDoDia.ts`     | `generateDailySuggestion`                                    |
| Organizar a semana (Agenda)        | `agenda/services/organizarSemana.ts`   | `organizeWeek`                                               |
| Resumir aula em vídeo (Matérias)   | `materias/services/resumirMaterial.ts` | `summarizeMaterial`                                          |
| Aula guiada, chat e criar questões | `assessora/services/assessora.ts`      | `generateLesson`, `sendChatMessage`, `createLessonQuestions` |
| Organizar o Caderno                | `caderno/services/organizarCaderno.ts` | `organizeNotebook`                                           |

- As telas **já estão prontas** para receber o resultado (aula em passos, conversa, grupos por
  tema, questões criadas) e já tratam dado malformado vindo da IA (`normalizeSteps`,
  `normalizeGroups`).
- O **contexto** enviado à IA (provas, tarefas, desempenho, materiais) **ainda não existe**: monte
  no backend, com consentimento (LGPD), **sem** afirmar condição de saúde do estudante (o app
  original fazia isso; não reproduzir).
- Chat e anexos: hoje só na tela, nada é guardado; persistir conversas é uma decisão da Fase 3
  (podem conter dados sensíveis).

## 4. Segurança e hospedagem

- **CSP** (`apps/web/csp.ts`): acrescentar o endereço do backend a `connect-src` **no mesmo PR**
  que o conectar. `frame-ancestors` exige cabeçalho HTTP da hospedagem.
- **Endereço próprio em produção.** Os dados locais são guardados por endereço de site, e
  `davifurias.github.io` é compartilhado por todos os projetos da conta (ver `docs/seguranca.md`).
- **Segredos:** nunca no repositório; a chave da IA só no servidor (`.env.example`).
- Os documentos antigos sobre banco, deploy e rollback já indicam a Fase 3.

## 5. Decisões em aberto para a Fase 3

1. **Mural "Ideias do App" compartilhado.** No original era compartilhado entre quem usava o
   mesmo link; hoje é só local. Decidir se volta a ser compartilhado, com quem, e se as ideias
   escritas localmente entram (elas **não** sobem sozinhas).
2. **Migrar os dados locais para a conta.** Oferecer a importação na primeira entrada (e um
   "Exportar meus dados" também para quem usava o app original: está em `docs/ideias.md`).
3. **Cópias de segurança locais** (`:backup:`): definir a limpeza depois da migração.
4. **Consentimento e privacidade (LGPD)** para perfil, metas e uso de IA.
5. **Conflitos entre aparelhos:** o armazenamento local não avisa mudanças feitas em outra aba
   ou aparelho; a sincronização precisa de uma regra (último a gravar vence, ou mesclar).
6. **Matérias com grafias diferentes** ("Cardio" e "cardio") e **anotações longas cortadas em
   Matérias:** pendências de produto registradas em `docs/ideias.md`.
7. **Outros navegadores nos testes ponta a ponta** (Firefox, Safari) antes do app de celular.
