# Identidade visual e renovação do visual

Decisão do dono: **renovação visual (opção B)** com a paleta **"Índigo refinado"**, fonte Inter,
ícones desenhados no lugar dos emojis da navegação e navegação nova. Cada etapa é um PR separado e
só começa com autorização. Nenhuma etapa muda funções, dados ou endereços das telas.

## Etapas

| #   | Etapa                                                                                      | Status                                 |
| --- | ------------------------------------------------------------------------------------------ | -------------------------------------- |
| 1   | **Fundação**: cores, fonte, escalas, sombras, movimento                                    | concluída (PR #33)                     |
| 2A  | Componentes base (botões, abas, pílulas, itens, diálogos) e componente `Icon`              | concluída (PR #35)                     |
| 2B  | Troca dos emojis-ícones por ícones desenhados, tela por tela                               | concluída (PR #36)                     |
| 3A  | Barra lateral no computador (marca, áreas, Perfil, Buscar e Tema) e ícones da navegação    | concluída (PR #37)                     |
| 3B  | Celular: barra de baixo com 4 áreas + "Mais" (página /mais)                                | em revisão                             |
| 4   | Telas, em PRs separados: Início → Agenda e Matérias → Mapa, Questões e Foco → demais telas | só depois de ver a fundação e o Início |

"Mais" (celular) guarda Mapa, Questões, Assessora IA, Ideias e Perfil: **todas as áreas continuam
acessíveis**. Dependência prevista na etapa 2: `lucide-react` (ícones SVG, só os usados entram no
app).

## Regras de cada etapa

- `pnpm check` e `pnpm e2e` passam, sem enfraquecer teste algum (ajuste só de seletor visual).
- Contraste mínimo de 4,5:1 nos dois temas (`styles/contraste.test.ts`) e zero violações no axe.
- Sem violações da política de segurança (CSP): fontes e estilos só do próprio app, nada de
  `style=""` embutido, nada de CDN.
- Teclado, foco visível, leitor de tela, zoom de 200% e "reduzir movimento".
- Tamanho: o JavaScript comprimido era 122 kB; limite de +20 kB somando ícones.
- Capturas antes e depois (computador e celular, escuro e claro) em cada PR.

## Fundação (etapa 1)

- **Cores** (`styles/global.css`, dois blocos de tokens): nomes dos tokens mantidos, valores novos.
  O tema escuro continua o padrão. Os verdes e âmbares do tema claro ficaram nos tons já testados
  (os da prévia não passavam em 4,5:1). `--card-2` é a superfície um degrau acima do cartão.
- **Fonte:** Inter variável, **embutida no app** (`@fontsource-variable/inter`, licença OFL), sem
  Google Fonts: a política de segurança só aceita fontes do próprio app. Só o conjunto latino é
  baixado pelo navegador (cerca de 48 kB); os demais conjuntos ficam no pacote publicado, mas não
  são carregados.
- **Escalas:** tamanhos de texto (`--fs-*`), espaçamentos (`--sp-*`), raios (`--radius`,
  `--radius-sm`), sombras (`--shadow-*`) e transição (`--ease`).
- **Movimento:** transições curtas, desligadas para quem pede menos movimento no aparelho.
- **Cores que não mudaram:** as das categorias (`--c-*`) e as das matérias no Mapa.

## Componentes base e ícones (etapa 2)

- **`components/Icon.tsx`:** único ponto de uso de `lucide-react` (ISC). Ícones sempre decorativos
  (`aria-hidden`); o nome acessível fica no botão ou no texto ao lado. Para usar outro ícone,
  registre-o em `ICONS`. Tamanho pela classe `.icon` (segue o texto); sem `style=""`, por causa da
  política de segurança (há teste).
- **Botões:** `.btn` alinha ícone e texto; estados de passar o mouse também no secundário e no
  perigo; foco visível com `--primary-text` (mais legível nos dois temas).
- **Abas e filtros (`.quick`)**, **remover (`.del`)** e **diálogos:** áreas de toque maiores,
  transições curtas, sombra e desfoque no fundo do diálogo.
- **Decisões do dono:** os emojis 👋 e 😵 ficam (dão calor ao app); prioridade (🔴/🟡) e
  acerto/erro (✔/✖) ganham texto e ícone, sem depender só da cor (2B); ícones da navegação e do
  cabeçalho ficam para a etapa 3.
- **Testes de segurança de texto digitado:** agora aceitam só os `svg` dos botões de remover e
  proíbem qualquer outro `svg` ou atributo `onload` (provado com uma falha proposital).

## Ícones no lugar dos emojis (etapa 2B)

- Todos os emojis que eram ícones (abas, ações rápidas, botões com IA, tipos de material, foco e
  pausa, anexos, resultados da busca) usam `Icon`. Ficam como emoji, por decisão do dono: 👋 (saudação)
  e 😵 ("Estou perdido"). A navegação e o cabeçalho (🏠📅… ☀️🌙 🔍 🧠) são da etapa 3.
- **Prioridade da tarefa:** selo com texto e bandeira (**Alta** em vermelho, **Média** em âmbar), nunca
  só cor; baixa continua sem selo. Leitores de tela leem "Prioridade Alta".
- **Prática de questões:** o acerto e o erro ganham ícone; o texto "Correto!" / "Não foi dessa vez."
  e o aviso "(correta)" / "(sua resposta, incorreta)" para leitores de tela continuam.
- **Mensagens de texto** (aviso de fim de foco e pausa, "Questões adicionadas…") ficaram sem emoji.
- **Testes de texto digitado:** todo `svg` na tela precisa ser um ícone genuíno do app (classes
  `lucide` e `icon`, `aria-hidden`, sem atributo `on…`). Provado com falhas propositais (título de
  tarefa e de material aceitando HTML).

## Navegação (etapa 3)

- **3A, computador (≥ 900 px):** o cabeçalho vira a **barra lateral** (marca, as 8 áreas e, no
  rodapé, Perfil, Buscar e Tema). Abaixo de 900 px (celular e tablet em pé), o cabeçalho é uma barra
  fina com marca, Buscar e Tema, e as áreas ficam na barra de baixo (que só muda na 3B).
- **Uma só cópia dos controles:** Perfil, Buscar e Tema existem uma vez no código; o CSS muda de
  lugar, nunca duplica (há teste). O rótulo visível do tema ("Tema claro") está contido no nome
  acessível do botão ("Mudar para o tema claro").
- **Perfil na navegação:** novo ponto de acesso, só no computador por enquanto (no celular entra em
  "Mais", na 3B). O botão "Editar perfil acadêmico" do Início continua.
- **Logo:** ícone de cérebro num quadrado colorido (no lugar do 🧠). Os ícones da navegação e do
  tema também são desenhados.
- **Decisões do dono:** "Mais" será uma página própria (`/mais`); no celular ficam Início, Agenda,
  Matérias e Foco; ponto de troca em 900 px.

### Celular (etapa 3B)

- **Barra de baixo:** Início, Agenda, Matérias, Foco e **Mais** (5 itens, no lugar dos 8 apertados).
- **Página `/mais`** (`features/mais/`): lista Mapa, Questões, Assessora IA, Ideias e **Perfil**, em
  linhas grandes de toque, com ícone e seta. Todas as áreas continuam acessíveis. A página existe
  também no computador (pelo endereço), mas não aparece na barra lateral.
- **Botão Mais ativo** na própria página e nas telas listadas nela (`isInMore` em
  `app/navigation.ts`): `aria-current="page"` em `/mais` e `aria-current="true"` nas telas dentro
  do grupo. A divisão (4 áreas na barra, o resto em Mais) tem teste: cada área está em um lugar só.
- **Testes ponta a ponta:** o auxiliar `irParaArea` usa a barra de baixo ou passa por "Mais"; há um
  teste do fluxo no celular (e a página `/mais` entra nas varreduras de acessibilidade e de
  rolagem lateral).
