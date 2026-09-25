# features/

Cada funcionalidade do MedFoco terá sua própria pasta aqui, migrada aos poucos de
`legacy/MedFoco.html`. Nenhuma foi migrada ainda.

| Pasta futura | Origem no app original                                      |
| ------------ | ----------------------------------------------------------- |
| `inicio/`    | Início (resumo do dia, ações rápidas, "Estou perdido")      |
| `perfil/`    | Perfil acadêmico                                            |
| `busca/`     | Busca global                                                |
| `agenda/`    | Agenda: eventos, tarefas e horários                         |
| `materias/`  | Matérias (materiais, arquivos, vídeos)                      |
| `mapa/`      | Mapa visual de conexões                                     |
| `questoes/`  | Banco de questões, quiz e desempenho                        |
| `foco/`      | Timer de foco (Pomodoro)                                    |
| `assessora/` | Assessora IA (chat, aula guiada) — IA só a partir da Fase 3 |
| `ideias/`    | Ideias do app e caderno de ideias                           |

Regra: uma pasta por funcionalidade, com seus componentes, lógica e testes juntos. Lógica pura
reaproveitável (datas, timer, cálculo de desempenho) poderá ir para `packages/core`.
