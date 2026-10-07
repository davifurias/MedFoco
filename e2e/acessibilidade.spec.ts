import AxeBuilder from '@axe-core/playwright';
import { semearDados, TODAS_AS_ROTAS } from './ajudas';
import { expect, test } from './fixtures';

const REGRAS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

async function verificar(page: import('@playwright/test').Page, onde: string) {
  const { violations } = await new AxeBuilder({ page }).withTags(REGRAS).analyze();
  const resumo = violations.map(
    (v) => `${v.id}: ${v.help} (${v.nodes.length}) ${v.nodes[0]?.target.join(' ')}`,
  );
  expect(resumo, `falhas de acessibilidade em ${onde}`).toEqual([]);
}

for (const rota of TODAS_AS_ROTAS) {
  test(`acessibilidade (axe): ${rota}`, async ({ page }) => {
    await semearDados(page);
    await page.goto(rota);
    await page.waitForLoadState('networkidle');
    await verificar(page, rota);
  });
}

test('acessibilidade (axe): diálogo de exclusão aberto e questão respondida', async ({ page }) => {
  await semearDados(page);
  await page.goto('/');
  await page
    .getByRole('button', { name: /Excluir evento/ })
    .first()
    .click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await verificar(page, 'diálogo de exclusão');
  await page.getByRole('button', { name: 'Cancelar' }).click();

  await page.goto('/questoes');
  await page.getByRole('button', { name: /Começar prática/ }).click();
  await page
    .getByRole('button', { name: /^[A-D]\)/ })
    .first()
    .click();
  await verificar(page, 'questão respondida');
});
