# features/

Cada funcionalidade do MedFoco tem sua própria pasta, com páginas, componentes, lógica e testes
juntos. As áreas ainda não migradas mostram uma página provisória listando o que oferecem no app
original (`legacy/MedFoco.html`).

**Migradas:** Início (`inicio/`) e Agenda (`agenda/`), cada uma com `components/`, `hooks/`,
`services/` e `utils/`.

## Dados

Componentes nunca acessam o armazenamento diretamente: usam `useRepository()`
(`src/data/`). Hoje a implementação é local (`localStorage`, chaves `medfoco:v1:*`, só neste
navegador); na fase de backend, basta criar outra implementação da mesma interface
`MedFocoRepository`. Datas sempre no fuso local, via `src/shared/date.ts`.

A leitura valida cada item salvo (`src/data/normalize.ts`): campos opcionais ausentes recebem o
valor padrão e itens inutilizáveis são ignorados na tela, **sem** serem apagados do armazenamento.
Antes de gravar por cima de um conteúdo ilegível, o repositório guarda uma cópia em
`<chave>:backup:<momento>`.

| Pasta        | Endereço                                         | Origem no app original                       |
| ------------ | ------------------------------------------------ | -------------------------------------------- |
| `inicio/`    | `/`                                              | Início                                       |
| `agenda/`    | `/agenda`, `/agenda/tarefas`, `/agenda/horarios` | Agenda (sub-abas Eventos, Tarefas, Horários) |
| `materias/`  | `/materias`                                      | Matérias                                     |
| `mapa/`      | `/mapa`                                          | Mapa visual                                  |
| `questoes/`  | `/questoes`                                      | Banco de questões                            |
| `foco/`      | `/foco`                                          | Foco (timer)                                 |
| `assessora/` | `/assessora`                                     | Assessora IA (IA real só a partir da Fase 3) |
| `ideias/`    | `/ideias`                                        | Ideias (sub-aba "Ideias do App")             |
| `caderno/`   | `/ideias/caderno`                                | Sub-aba "Caderno de Ideias" dentro de Ideias |
| `busca/`     | `/busca`                                         | Busca global (botão 🔍 do cabeçalho)         |
| `perfil/`    | `/perfil`                                        | Perfil acadêmico (botão na tela Início)      |

Estrutura do app: `routes/routes.tsx` (endereços), `layouts/AppLayout.tsx` (cabeçalho e barras de
navegação), `app/navigation.ts` (as 8 áreas da navegação), `components/` (peças reutilizáveis).
Lógica pura reaproveitável (datas, timer, desempenho) poderá ir para `packages/core`.
