import { dataEm, irParaArea, TELAS, TODAS_AS_ROTAS } from './ajudas';
import { expect, test } from './fixtures';

test('navega pelas 8 áreas, com título da aba e tela certos', async ({ page }) => {
  await page.goto('/');
  for (const tela of TELAS) {
    await irParaArea(page, tela.nome);
    await expect(page).toHaveURL(new RegExp(`${tela.rota === '/' ? '/$' : `${tela.rota}$`}`));
    await expect(page).toHaveTitle(tela.titulo);
  }
});

test('abre a Busca e o Perfil, e volta ao Início', async ({ page }) => {
  await page.goto('/');
  if ((page.viewportSize()?.width ?? 0) >= 900) {
    await page.getByRole('link', { name: 'Buscar' }).click();
  } else {
    await irParaArea(page, 'Buscar');
  }
  await expect(page).toHaveTitle('Busca · MedFoco');
  await expect(page.getByLabel('Texto da busca')).toBeFocused();
  await page.goto('/');
  await page.getByRole('link', { name: /Editar perfil acadêmico/ }).click();
  await expect(page).toHaveTitle('Perfil acadêmico · MedFoco');
  await page.getByRole('link', { name: /Voltar ao início/ }).click();
  await expect(page).toHaveTitle('Início · MedFoco');
});

test('endereço que não existe volta ao Início; recarregar uma tela mantém a tela', async ({
  page,
}) => {
  await page.goto('/nao-existe');
  await expect(page).toHaveTitle('Início · MedFoco');
  await page.goto('/agenda/tarefas');
  await page.reload();
  await expect(page).toHaveTitle('Agenda · Tarefas · MedFoco');
});

test('o primeiro Tab é "Pular para o conteúdo" e leva o foco ao conteúdo', async ({ page }) => {
  await page.goto('/agenda');
  const pular = page.getByRole('link', { name: 'Pular para o conteúdo' });
  // Escondido fora da tela enquanto não recebe o foco; aparece ao navegar com o teclado.
  const antes = await pular.boundingBox();
  expect((antes?.y ?? 0) + (antes?.height ?? 0)).toBeLessThanOrEqual(0);
  await page.keyboard.press('Tab');
  await expect(pular).toBeFocused();
  expect((await pular.boundingBox())?.y ?? -1).toBeGreaterThanOrEqual(0);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await expect(page).toHaveURL(/\/agenda$/);
});

test('nenhuma tela tem rolagem lateral', async ({ page }) => {
  await page.goto('/');
  for (const rota of TODAS_AS_ROTAS) {
    await page.goto(rota);
    await page.waitForLoadState('networkidle');
    const sobra = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(sobra, `rolagem lateral em ${rota}`).toBeLessThanOrEqual(0);
  }
  // data só para garantir que o helper é usado em todos os projetos
  expect(dataEm(0)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});

test('no computador a barra lateral traz Perfil, Buscar e Tema; no celular, o menu ⋯ os traz', async ({
  page,
}) => {
  await page.goto('/');
  const larguraComputador = (page.viewportSize()?.width ?? 0) >= 900;
  if (larguraComputador) {
    await expect(page.getByRole('link', { name: 'Buscar' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Mudar para o tema/ })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Abrir menu' })).toBeHidden();
    await page.getByRole('link', { name: 'Perfil', exact: true }).click();
    await expect(page).toHaveTitle('Perfil acadêmico · MedFoco');
  } else {
    await expect(page.getByRole('link', { name: 'Buscar' })).toBeHidden();
    await expect(
      page.getByRole('navigation', { name: 'Navegação principal (celular)' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    const menu = page.getByRole('dialog', { name: 'Menu' });
    await expect(menu.getByRole('link', { name: 'Buscar' })).toBeVisible();
    await expect(menu.getByRole('switch', { name: 'Tema escuro' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Perfil acadêmico' })).toBeVisible();
  }
});

test('celular: a barra de baixo tem 4 áreas e o menu ⋯ leva às demais áreas e ao Perfil', async ({
  page,
}) => {
  test.skip((page.viewportSize()?.width ?? 0) >= 900, 'o menu ⋯ é do celular');
  await page.goto('/');
  const barra = page.getByRole('navigation', { name: 'Navegação principal (celular)' });
  await expect(barra.getByRole('link')).toHaveText(['Início', 'Agenda', 'Matérias', 'Foco']);
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  const menu = page.getByRole('dialog', { name: 'Menu' });
  await menu.getByRole('link', { name: 'Mapa', exact: true }).click();
  await expect(page).toHaveTitle('Mapa · MedFoco');
  await expect(menu).toBeHidden();
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await menu.getByRole('link', { name: 'Perfil acadêmico' }).click();
  await expect(page).toHaveTitle('Perfil acadêmico · MedFoco');
});
