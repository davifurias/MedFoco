import { defineConfig } from '@playwright/test';
import type { Opcoes } from './e2e/fixtures';

/**
 * Testes ponta a ponta: abrem o app já construído (com a política de segurança ligada) num
 * Chromium de verdade, em computador e celular, nos temas escuro e claro. Rodam com `pnpm e2e`.
 *
 * Em ambientes que já têm um Chromium instalado, aponte para ele com E2E_CHROMIUM_PATH.
 * No CI e na máquina de quem desenvolve, `pnpm e2e:instalar` baixa o navegador.
 */
const PORT = 4173;
const executablePath = process.env.E2E_CHROMIUM_PATH || undefined;

const computador = { width: 1100, height: 800 };
const celular = { width: 375, height: 812 };

export default defineConfig<Opcoes>({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    launchOptions: executablePath ? { executablePath } : {},
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'computador-escuro', use: { viewport: computador, tema: 'escuro' } },
    { name: 'computador-claro', use: { viewport: computador, tema: 'claro' } },
    {
      name: 'celular-escuro',
      use: { viewport: celular, isMobile: true, hasTouch: true, tema: 'escuro' },
    },
    {
      name: 'celular-claro',
      use: { viewport: celular, isMobile: true, hasTouch: true, tema: 'claro' },
    },
  ],
  webServer: {
    command: `pnpm --filter @medfoco/web build && pnpm --filter @medfoco/web exec vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
