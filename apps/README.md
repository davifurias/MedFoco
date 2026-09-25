# apps/

Aplicativos do MedFoco. Cada app é um pacote do workspace pnpm com seus próprios scripts `build`,
`typecheck` e testes.

- `web/` — aplicativo web (React + TypeScript + Vite). Rode com `pnpm dev` na raiz do projeto.
  As funcionalidades do app original serão migradas aos poucos para `web/src/features/`.
