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
| Banco + RLS (pgTAP)          | a definir           | CI (+ Docker) | Fase 2 |
| Ponta a ponta (Playwright)   | a definir           | CI            | Fase 1 |

## Onde ficam os testes

- Ao lado do código testado, com o sufixo `.test` (ex.: `timer.test.ts`).
- Fase 0: `scripts/check-platform-independence.test.mjs`.

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
