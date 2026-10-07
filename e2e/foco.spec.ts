import { irParaArea } from './ajudas';
import { expect, test } from './fixtures';

test('Foco: iniciar, ir ao Início, terminar a fase com o relógio acelerado e ver os minutos', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-10-07T10:00:00-03:00') });
  await page.goto('/foco');
  await page.getByRole('button', { name: 'Configurar' }).click();
  await expect(page.getByRole('timer')).toHaveText('25:00');
  await page.getByRole('button', { name: 'Iniciar' }).click();
  await page.clock.fastForward('00:10');
  await expect(page.getByRole('timer')).toHaveText('24:50');

  // O timer continua ao sair da tela; ao terminar com o Início aberto, os minutos aparecem na hora.
  await irParaArea(page, 'Início');
  const resumo = page.getByRole('region', { name: 'Resumo do dia' });
  await expect(resumo).toContainText('0min estudados hoje');
  await page.clock.fastForward('25:00');
  await expect(resumo).toContainText('25min estudados hoje');

  // A pausa de 5 minutos não conta como tempo de foco.
  await page.clock.fastForward('05:00');
  await expect(resumo).toContainText('25min estudados hoje');

  await irParaArea(page, 'Foco');
  await expect(page.getByRole('heading', { name: '🍅 Foco' })).toBeVisible();
  await page.getByRole('button', { name: 'Encerrar' }).click();
  await expect(page.getByText('25 min de foco')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Histórico recente' })).toContainText(
    'Pausa 5 min',
  );
});

test('Foco: encerrar no meio registra só o tempo já focado', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-07T10:00:00-03:00') });
  await page.goto('/foco');
  await page.getByRole('button', { name: 'Configurar' }).click();
  await page.getByRole('button', { name: 'Iniciar' }).click();
  await page.clock.fastForward('10:30');
  await page.getByRole('button', { name: 'Pausar' }).click();
  await page.clock.fastForward('30:00'); // tempo parado não conta
  await page.getByRole('button', { name: 'Encerrar' }).click();
  await expect(page.getByText('Sessão encerrada. 10 min de foco registrados.')).toBeVisible();
  await expect(page.getByText('10 min de foco', { exact: true })).toBeVisible();
});
