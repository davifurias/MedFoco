# Acessibilidade do MedFoco

Resultado da auditoria da etapa 2.14 da Fase 2 e regras para manter. Meta: WCAG 2.2 nível AA.

## O que está garantido

- **Contraste:** todo texto tem pelo menos 4,5:1 sobre o fundo, nos temas claro e escuro. Os
  pares de cores declarados em `apps/web/src/styles/global.css` são conferidos por teste
  (`styles/contraste.test.ts`); se alguém trocar uma cor e piorar a leitura, o teste falha.
  - Texto colorido usa os tokens `--accent-text`, `--danger-text`, `--warn-text` e
    `--primary-text` (que mudam de valor em cada tema), e não `--accent`, `--danger` etc.
  - Pílulas com fundo claro (Trabalho, Férias) usam texto escuro (`--text-on-light`).
  - Pílulas de matéria do Mapa escolhem sozinhas branco ou escuro (`readableTextColor`).
- **Teclado:** todo elemento interativo recebe foco com indicador visível (anel roxo, 3,4:1 a
  4,9:1 sobre os fundos). O primeiro item de cada tela é "Pular para o conteúdo".
- **Trocas de tela:** o título da aba muda ("Agenda · Eventos · MedFoco") e um aviso invisível
  anuncia a nova tela a leitores de tela, sem mover o foco (`components/RouteAnnouncer.tsx`).
- **Formulários:** todo campo tem nome acessível; erros movem o foco ao primeiro campo inválido
  e usam `aria-invalid`; resultados e avisos usam regiões `aria-live`.
- **Diálogos:** o de confirmação abre com foco em "Cancelar", fecha com Esc e prende o foco.
- **Cor nunca é a única pista:** alternativas certas/erradas mostram ✔/✖; categorias mostram o
  nome; o Mapa tem legenda e lista de conexões em texto.
- **Celular:** sem rolagem lateral a partir de 320px.

## Ao mexer em cores, telas ou componentes

- Cor nova de texto ou de fundo com texto: some no `contraste.test.ts` o par novo.
- Tela nova: acrescente o nome em `PAGE_NAMES` (`app/navigation.ts`).
- Campo novo: `<label>` (pode ser `sr-only`) ligado ao campo por `htmlFor`/`id`.
- Mudança visual de estado (certo/errado, ativo, pausado): inclua texto ou ícone, não só cor.

## Como medir (sem dependência no projeto)

A auditoria foi feita com o verificador **axe** (axe-core) injetado no Chromium, em 13 telas, nos
dois temas e em 1100px e 375px de largura, mais um percurso de Tab em todas as telas. Resultado
final: **0 falhas**. A etapa 2.15 (testes ponta a ponta) decide se esse verificador entra como
ferramenta fixa do projeto (nova dependência: segue a seção 13 do plano da Fase 2).

## Fora do escopo desta etapa (ideias)

- Rótulos sempre visíveis nos campos (hoje o texto de exemplo faz esse papel, como no app
  original; todos têm nome acessível). É uma mudança visual maior.
