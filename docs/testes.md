# Testes

Rode tudo de uma vez com `pnpm check`. O CI do GitHub roda as mesmas verificações em todo PR;
se alguma falhar, o PR não pode ser incorporado.

| Verificação                  | Comando             | Onde roda     | Desde  |
| ---------------------------- | ------------------- | ------------- | ------ |
| Formato (Prettier)           | `pnpm format:check` | local + CI    | Fase 0 |
| Lint (ESLint)                | `pnpm lint`         | local + CI    | Fase 0 |
| Independência de plataforma  | `pnpm lint`         | local + CI    | Fase 0 |
| Tipos (TypeScript)           | `pnpm typecheck`    | local + CI    | Fase 1 |
| Testes unitários (Vitest)    | `pnpm test`         | local + CI    | Fase 0 |
| Build                        | `pnpm build`        | local + CI    | Fase 1 |
| Segredos (gitleaks)          | —                   | CI            | Fase 0 |
| Dependências vulneráveis     | `pnpm audit`        | local + CI    | Fase 0 |
| Segurança do código (CodeQL) | —                   | CI            | Fase 0 |
| Título do PR                 | —                   | CI            | Fase 0 |
| Banco + RLS (pgTAP)          | a definir           | CI (+ Docker) | Fase 3 |
| Ponta a ponta (Playwright)   | `pnpm e2e`          | local + CI    | Fase 2 |

## Testes ponta a ponta (`pnpm e2e`)

Abrem o app **já construído** (com a política de segurança ligada) num Chromium de verdade, em
**computador (1100px) e celular (375px), nos temas escuro e claro** (4 combinações). Ficam em
`e2e/`, com a configuração em `playwright.config.ts`.

- **Antes da primeira vez:** `pnpm e2e:instalar` (baixa o Chromium). Em ambientes que já têm um
  Chromium instalado, aponte para ele com `E2E_CHROMIUM_PATH=/caminho/do/chrome`.
- **O que cobrem:** navegação pelas áreas e títulos; fluxos entre telas (tarefa, evento e ideia
  rápidos; Matérias → Mapa → Busca; Questões → prática → desempenho; Foco com relógio acelerado
  → Início; Perfil e Horários); tema; rolagem lateral; segurança (política e link perigoso); e o
  verificador de acessibilidade **axe** em todas as telas nos dois temas e tamanhos (0 falhas).
- **Qualquer erro ou aviso do navegador** (inclusive violação da política de segurança) faz o
  teste falhar, e também qualquer arquivo que não carregue (exceto o ícone da aba).
- **Regras:** nunca esperar por tempo fixo (use esperas por condição e `page.clock`); datas
  sempre relativas a hoje (`dataEm`); cada teste começa com o navegador limpo.
- **No CI:** passo "Testes ponta a ponta (Playwright)". Ele só passa a ser obrigatório para o
  merge quando for adicionado às regras da `main` (ver `configuracao-github.md`).
- Não faz parte do `pnpm check` (que continua rápido e sem exigir navegador).

## Onde ficam os testes

- Ao lado do código testado, com o sufixo `.test` (ex.: `timer.test.ts`).
- Fase 0: `scripts/check-platform-independence.test.mjs`.
- Ponta a ponta: `e2e/*.spec.ts`.
- Integração entre as áreas: `apps/web/src/integracao.test.tsx` (cria numa tela, navega pelo
  roteador e confere em outra: tarefas, eventos, ideias, materiais, questões, foco, perfil).

## Regras

- Os testes rodam no fuso `America/Sao_Paulo` (definido em `vitest.config.mjs`), inclusive no
  CI, para detectar erros de data que só aparecem fora do UTC.

- Toda mudança de comportamento vem com teste.
- Para verificar outro fuso, rode a suíte com uma cópia do `vitest.config.mjs` alterando
  `process.env.TZ` (ex.: `UTC`, `Asia/Tokyo`). Só o teste que confere o fuso do Brasil deve falhar.
- Em testes automatizados de navegador (Playwright/Chromium), o campo `<input type="date">` segue
  o formato mês/dia/ano ao **digitar**, mesmo com idioma pt-BR. Preencha a data com
  `fill('AAAA-MM-DD')`. O app não é afetado: ele só lê o valor do campo, que é sempre `AAAA-MM-DD`.
- Testes nunca usam dados reais de usuários.
- Nunca desativar um teste para "fazer passar".
