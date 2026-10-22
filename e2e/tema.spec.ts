import { TEMA_KEY } from './fixtures';
import { expect, test } from './fixtures';

/** Troca o tema pelo botão do cabeçalho (computador) ou pelo interruptor do menu ⋯ (celular). */
async function alternarTema(page: import('@playwright/test').Page, outro: string) {
  if ((page.viewportSize()?.width ?? 0) >= 900) {
    await page.getByRole('button', { name: `Mudar para o tema ${outro}` }).click();
    return;
  }
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page.getByRole('switch', { name: 'Tema escuro' }).click();
  await page.keyboard.press('Escape');
}

const fundo = (page: import('@playwright/test').Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor);

test('o botão alterna o tema, aplica na hora e continua depois de recarregar', async ({
  page,
  tema,
}) => {
  await page.goto('/');
  const outro = tema === 'escuro' ? 'claro' : 'escuro';
  const antes = await fundo(page);
  await alternarTema(page, outro);
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
  if ((page.viewportSize()?.width ?? 0) >= 900) {
    await expect(page.getByRole('button', { name: `Mudar para o tema ${tema}` })).toBeVisible();
  } else {
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    await expect(page.getByRole('switch', { name: 'Tema escuro' })).toHaveAttribute(
      'aria-checked',
      String(outro === 'escuro'),
    );
  }
});
