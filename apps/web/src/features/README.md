# features/

Cada funcionalidade do MedFoco tem sua própria pasta, com páginas, componentes, lógica e testes
juntos. Todas as áreas do app original (`legacy/MedFoco.html`) já foram reconstruídas.

**Áreas:** Início (`inicio/`), Agenda (`agenda/`), Matérias (`materias/`), Mapa (`mapa/`),
Questões (`questoes/`), Foco (`foco/`), Assessora IA (`assessora/`), Ideias (`ideias/`, `caderno/`),
Busca (`busca/`) e Perfil (`perfil/`), cada uma com `components/`, `hooks/`, `services/` e
`utils/` conforme a necessidade. O Mapa só lê os materiais de Matérias; assuntos-chave são
comparados sem acento nem maiúsculas.

**Foco:** o timer fica no `FocoProvider` (`foco/FocoContext.tsx`), acima das telas, e continua
contando ao navegar; ao fechar ou recarregar a página ele se perde. O tempo é calculado pelo horário
real de término da fase (`foco/utils/timer.ts`), não descontando 1 segundo por tick.

**Assessora IA:** só a interface; a IA real é da Fase 3. Os pontos de entrada ficam em
`assessora/services/assessora.ts` (hoje avisam que a IA não está disponível, sem simular resposta);
na Fase 3 basta trocar essas funções. A conversa fica só na tela (nada é guardado) e os anexos são
lidos apenas no aparelho.

**Ideias:** o mural "Ideias do App" (`medfoco:v1:appIdeas`) e o Caderno pessoal
(`medfoco:v1:notebook`) são listas separadas. No app original o mural era compartilhado entre
usuários; sem backend ele fica só neste aparelho, e compartilhar é da Fase 3. "Organizar com IA"
segue o padrão da Assessora (serviço que avisa que a IA não está disponível).

**Busca:** procura em eventos, matérias, tarefas, questões, ideias do app e caderno (mínimo de 2
letras, sem diferença de acento nem de maiúsculas, `shared/text.ts`). O texto fica no endereço
(`/busca?q=…`) e a caixa usa estado próprio: o endereço atualiza com atraso e comeria letras
digitadas rápido.

**Perfil:** curso, período, matérias, metas e preferências, salvos só neste aparelho
(`medfoco:v1:profile`) até existir login. Sem nada salvo, o curso vem como "Medicina"; um curso
apagado e salvo fica em branco. Nada do perfil é enviado a lugar nenhum (a IA é da Fase 3).

**Tema:** o app abre no tema escuro; o botão ☀️/🌙 do cabeçalho alterna para o claro e a escolha
fica guardada neste navegador (pelo repositório: `getTheme`/`saveTheme`, chave `medfoco:v1:theme`; `shared/theme.ts` só aplica o tema na página). As cores de cada tema
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
