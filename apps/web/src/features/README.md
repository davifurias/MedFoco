# features/

Cada funcionalidade do MedFoco tem sua própria pasta, com páginas, componentes, lógica e testes
juntos. Por enquanto cada área mostra uma página provisória listando o que ela oferece no app
original (`legacy/MedFoco.html`); o conteúdo real será migrado área por área.

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
