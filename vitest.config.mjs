import { defineConfig } from 'vitest/config';

// Testes rodam no fuso do Brasil (inclusive no CI, que usa UTC), para detectar erros de
// data que só aparecem fora do UTC — como "hoje" virar amanhã depois das 21h.
process.env.TZ = 'America/Sao_Paulo';

export default defineConfig({
  test: {
    projects: [
      'apps/*/vite.config.ts',
      {
        test: {
          name: 'scripts',
          include: ['scripts/**/*.test.mjs'],
          environment: 'node',
        },
      },
    ],
  },
});
