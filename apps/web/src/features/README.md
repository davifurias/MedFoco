# features/

Cada funcionalidade do MedFoco tem sua própria pasta, com páginas, componentes, lógica e testes
juntos. As áreas ainda não migradas mostram uma página provisória listando o que oferecem no app
original (`legacy/MedFoco.html`).

**Migradas:** Início (`inicio/`), Agenda (`agenda/`), Matérias (`materias/`), Mapa (`mapa/`), Questões (`questoes/`), Foco (`foco/`) e Assessora IA (`assessora/`),
cada uma com `components/`, `hooks/`, `services/` e `utils/` conforme a necessidade. O Mapa só lê
os materiais de Matérias; assuntos-chave são comparados sem acento nem maiúsculas.

**Foco:** o timer fica no `FocoProvider` (`foco/FocoContext.tsx`), acima das telas, e continua
contando ao navegar; ao fechar ou recarregar a página ele se perde. O tempo é calculado pelo horário
real de término da fase (`foco/utils/timer.ts`), não descontando 1 segundo por tick.

**Assessora IA:** só a interface; a IA real é da Fase 3. Os pontos de entrada ficam em
`assessora/services/assessora.ts` (hoje avisam que a IA não está disponível, sem simular resposta);
na Fase 3 basta trocar essas funções. A conversa fica só na tela (nada é guardado) e os anexos são
lidos apenas no aparelho.

**Tema:** o app abre no tema escuro; o botão ☀️/🌙 do cabeçalho alterna para o claro e a escolha
fica guardada neste navegador (`shared/theme.ts`, chave `medfoco:v1:theme`). As cores de cada tema
ficam em `styles/global.css`.

## Dados

Componentes nunca acessam o armazenamento diretamente: usam `useRepository()`
(`src/data/`). Hoje a implementação é local (`localStorage`, chaves `medfoco:v1:*`, só neste
navegador); na fase de backend, basta criar outra implementação da mesma interface
`MedFocoRepository`. Datas sempre no fuso local, via `src/shared/date.ts`. Links digitados pelo usuário passam por
`src/shared/url.ts` (só `http`/`https`; nunca `javascript:`).

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
