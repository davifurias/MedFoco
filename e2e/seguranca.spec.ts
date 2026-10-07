import { expect, test } from './fixtures';

test('o app construído traz a política de segurança e bloqueia conexão externa e script embutido', async ({
  page,
  problemas,
}) => {
  await page.goto('/');
  const politica = await page
    .locator('meta[http-equiv="Content-Security-Policy"]')
    .getAttribute('content');
  expect(politica).toContain("script-src 'self'");
  expect(politica).toContain("connect-src 'self'");
  expect(politica).not.toMatch(/unsafe-inline|unsafe-eval/);

  const resultado = await page.evaluate(async () => {
    let fetchExterno = 'permitido';
    try {
      await fetch('https://example.com/');
    } catch {
      fetchExterno = 'bloqueado';
    }
    const script = document.createElement('script');
    script.textContent = 'window.__executou = true';
    document.head.appendChild(script);
    return {
      fetchExterno,
      scriptEmbutido: (window as unknown as { __executou?: boolean }).__executou
        ? 'permitido'
        : 'bloqueado',
    };
  });
  expect(resultado).toEqual({ fetchExterno: 'bloqueado', scriptEmbutido: 'bloqueado' });

  // Esses dois bloqueios geram avisos do navegador de propósito: confere e limpa.
  expect(problemas.some((p) => p.includes('Content Security Policy'))).toBe(true);
  problemas.length = 0;
});

test('um link de vídeo perigoso não vira link clicável', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'medfoco:v1:materials',
      JSON.stringify([
        {
          id: 'm1',
          subject: 'S',
          title: 'Aula maliciosa',
          notes: '',
          tags: [],
          type: 'video',
          videoLink: 'javascript:alert(1)',
          createdAt: 1,
        },
        {
          id: 'm2',
          subject: 'S',
          title: 'Aula boa',
          notes: '',
          tags: [],
          type: 'video',
          videoLink: 'youtube.com/watch?v=1',
          createdAt: 2,
        },
      ]),
    );
  });
  await page.goto('/materias');
  await expect(page.getByText('Aula maliciosa')).toBeVisible();
  await expect(page.getByRole('link', { name: /Aula maliciosa/ })).toHaveCount(0);
  const boa = page.getByRole('link', { name: /Aula boa/ });
  await expect(boa).toHaveAttribute('href', 'https://youtube.com/watch?v=1');
  await expect(boa).toHaveAttribute('rel', 'noopener noreferrer');
});
