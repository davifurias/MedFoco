import { test as base, expect } from '@playwright/test';

export { expect };

export const TEMA_KEY = 'medfoco:v1:theme';

export interface Opcoes {
  tema: 'escuro' | 'claro';
}

interface Fixtures {
  /** Erros e avisos do navegador (inclui violações da política de segurança). */
  problemas: string[];
  semProblemas: void;
}

/**
 * Cada teste começa com o navegador limpo, no tema do projeto (a escolha só é gravada se ainda
 * não existir, para um recarregamento não desfazer o botão de tema). Qualquer erro ou aviso do
 * navegador durante o teste, inclusive violação da política de segurança, faz o teste falhar.
 */
export const test = base.extend<Opcoes & Fixtures>({
  tema: ['escuro', { option: true }],
  page: async ({ page, tema }, use) => {
    await page.addInitScript(
      ([key, value]) => {
        try {
          if (!localStorage.getItem(key as string))
            localStorage.setItem(key as string, value as string);
        } catch {
          // sem armazenamento: o app usa o padrão
        }
      },
      [TEMA_KEY, tema],
    );
    await use(page);
  },
  problemas: async ({ page }, use) => {
    const lista: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() !== 'error' && msg.type() !== 'warning') return;
      // O aviso genérico de recurso não carregado não diz qual foi: quem cuida disso é o
      // 'response' abaixo, que acusa qualquer arquivo ausente (menos o ícone da aba).
      if (msg.text().startsWith('Failed to load resource')) return;
      lista.push(`console.${msg.type()}: ${msg.text()}`);
    });
    page.on('response', (resposta) => {
      if (resposta.status() >= 400 && !resposta.url().endsWith('/favicon.ico')) {
        lista.push(`HTTP ${resposta.status()}: ${resposta.url()}`);
      }
    });
    page.on('pageerror', (error) => lista.push(`erro na página: ${error.message}`));
    await use(lista);
  },
  semProblemas: [
    async ({ problemas }, use) => {
      await use();
      expect(problemas, 'erros ou avisos do navegador durante o teste').toEqual([]);
    },
    { auto: true },
  ],
});
