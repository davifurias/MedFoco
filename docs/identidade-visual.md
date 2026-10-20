# Identidade visual e renovação do visual

Decisão do dono: **renovação visual (opção B)** com a paleta **"Índigo refinado"**, fonte Inter,
ícones desenhados no lugar dos emojis da navegação e navegação nova. Cada etapa é um PR separado e
só começa com autorização. Nenhuma etapa muda funções, dados ou endereços das telas.

## Etapas

| #   | Etapa                                                                                      | Status                                 |
| --- | ------------------------------------------------------------------------------------------ | -------------------------------------- |
| 1   | **Fundação**: cores, fonte, escalas, sombras, movimento                                    | em revisão                             |
| 2   | Componentes base (botões, campos, cartões, pílulas, abas, diálogos) e ícones desenhados    | não iniciada                           |
| 3   | Navegação: barra lateral (computador) e barra inferior com 4 áreas + "Mais" (celular)      | não iniciada                           |
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
