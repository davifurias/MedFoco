import { expect, test } from './fixtures';

/** Telas com linhas de campos (`.row.campos`): o texto dos campos não pode ficar cortado. */
const TELAS_COM_CAMPOS = [
  '/agenda',
  '/agenda/tarefas',
  '/questoes',
  '/perfil',
  '/assessora',
  '/foco',
];

test('campos de uma linha vão para a linha de baixo no celular e ficam lado a lado no computador', async ({
  page,
}) => {
  const celular = (page.viewportSize()?.width ?? 0) < 500;
  let linhasLadoALado = 0;
  for (const rota of TELAS_COM_CAMPOS) {
    await page.goto(rota);
    // No Foco, os campos de minutos só aparecem na técnica "Personalizado".
    if (rota === '/foco')
      await page.getByLabel('Técnica', { exact: true }).selectOption({ label: 'Personalizado' });
    const linhas = await page.locator('.row.campos').all();
    expect(linhas.length, `linhas de campos em ${rota}`).toBeGreaterThan(0);
    for (const linha of linhas) {
      const caixas = await linha.locator(':scope > *').evaluateAll((els) =>
        els
          .map((el) => el.getBoundingClientRect())
          // Rótulos só para leitor de tela (sr-only) têm 1px e não contam como campo visível.
          .filter((r) => r.width > 20 && r.height > 0)
          .map((r) => ({ top: Math.round(r.top), width: Math.round(r.width) })),
      );
      if (caixas.length < 2) continue;
      const mesmaLinha = caixas.some((c) => caixas.some((o) => o !== c && o.top === c.top));
      if (celular) {
        // No celular (375px) dois campos de 200px não cabem na mesma linha.
        expect(mesmaLinha, `campos lado a lado no celular em ${rota}`).toBe(false);
        for (const c of caixas) expect(c.width, `largura em ${rota}`).toBeGreaterThanOrEqual(200);
      } else if (mesmaLinha) {
        linhasLadoALado += 1;
      }
    }
  }
  if (!celular) expect(linhasLadoALado).toBeGreaterThan(0);
});
