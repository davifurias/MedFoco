import { TEMA_KEY } from './fixtures';
import { expect, test } from './fixtures';

const fundo = (page: import('@playwright/test').Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor);

test('o botão alterna o tema, aplica na hora e continua depois de recarregar', async ({
  page,
  tema,
}) => {
  await page.goto('/');
  const outro = tema === 'escuro' ? 'claro' : 'escuro';
  const antes = await fundo(page);
  await page.getByRole('button', { name: `Mudar para o tema ${outro}` }).click();
  await expect(page.locator('html')).toHaveAttribute(
    'data-theme',
    outro === 'claro' ? 'light' : 'dark',
  );
  expect(await fundo(page)).not.toBe(antes);
  expect(await page.evaluate((k) => localStorage.getItem(k), TEMA_KEY)).toBe(outro);

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute(
    'data-theme',
    outro === 'claro' ? 'light' : 'dark',
  );
  await expect(page.getByRole('button', { name: `Mudar para o tema ${tema}` })).toBeVisible();
});
