import { dataEm, irParaArea } from './ajudas';
import { expect, test } from './fixtures';

test('Início → Agenda e Caderno: tarefa, evento e ideia rápidos aparecem nas outras telas', async ({
  page,
}) => {
  await page.goto('/');
  const resumo = page.getByRole('region', { name: 'Resumo do dia' });
  await expect(resumo).toContainText('0tarefas pendentes');

  await page.getByRole('button', { name: 'Tarefa', exact: true }).click();
  await page.getByLabel('Título da tarefa').fill('Ler capítulo 4');
  await page.getByRole('button', { name: 'Adicionar tarefa' }).click();
  await expect(resumo).toContainText('1tarefas pendentes');

  await page.getByRole('button', { name: 'Evento', exact: true }).click();
  await page.getByLabel('Título do evento').fill('Prova de Cardio');
  await page.getByLabel('Data do evento').fill(dataEm(20));
  await page.getByRole('button', { name: 'Adicionar evento' }).click();
  await expect(resumo).toContainText('1próximos eventos');
  await expect(page.getByRole('region', { name: 'Próximos eventos' })).toContainText(
    'Prova de Cardio',
  );

  await page.getByRole('button', { name: 'Ideia', exact: true }).click();
  await page.getByLabel('Ideia para o caderno').fill('Estudar ECG no domingo');
  await page.getByRole('button', { name: 'Guardar no caderno' }).click();

  await irParaArea(page, 'Agenda');
  await expect(page.getByText('Prova de Cardio')).toBeVisible();
  await page.getByRole('link', { name: /Tarefas/ }).click();
  await expect(page.getByText('Ler capítulo 4')).toBeVisible();

  await irParaArea(page, 'Ideias');
  await page.getByRole('link', { name: /Caderno de Ideias/ }).click();
  await expect(page.getByText('Estudar ECG no domingo')).toBeVisible();

  // Os dados continuam depois de recarregar.
  await page.reload();
  await expect(page.getByText('Estudar ECG no domingo')).toBeVisible();
});

test('Matérias → Mapa → Busca → excluir', async ({ page }) => {
  await page.goto('/materias');
  await page.getByLabel('Matéria', { exact: false }).first().fill('Cardiologia');
  await page.getByLabel('Título do material').fill('Aula de valvas');
  await page.getByLabel('Anotações').fill('resumo da aula');
  await page.getByLabel('Assuntos-chave').fill('Coração, valvas');
  await page.getByRole('button', { name: 'Salvar material' }).click();
  await expect(page.getByText('Material salvo!')).toBeVisible();

  await irParaArea(page, 'Mapa');
  await page.getByRole('button', { name: 'Aula de valvas, Cardiologia' }).click();
  await expect(page.getByText('Assuntos: coração, valvas')).toBeVisible();

  await page.goto('/busca');
  await page.getByLabel('Texto da busca').fill('CORACAO');
  await expect(page.getByRole('status').filter({ hasText: 'resultado' })).toContainText(
    '1 resultado',
  );
  await expect(page.getByRole('region', { name: /^Matérias \(1\)/ })).toContainText(
    'Aula de valvas',
  );

  await irParaArea(page, 'Matérias');
  await page.getByRole('button', { name: /Excluir material Aula de valvas/ }).click();
  await page.getByRole('button', { name: 'Excluir', exact: true }).click();
  await expect(page.getByText('Aula de valvas')).toHaveCount(0);
  await irParaArea(page, 'Mapa');
  await expect(page.getByText(/Adicione materiais/)).toBeVisible();
});

test('Questões: cadastrar, praticar e ver o desempenho', async ({ page }) => {
  await page.goto('/questoes');
  await page.getByLabel('Matéria', { exact: true }).fill('Neurologia');
  await page.getByLabel('Assunto', { exact: true }).fill('Medula');
  await page.getByLabel('Enunciado da questão').fill('Qual estrutura?');
  for (const letra of ['A', 'B', 'C', 'D']) {
    await page.getByLabel(`Alternativa ${letra}`, { exact: true }).fill(`Opção ${letra}`);
  }
  await page.getByLabel('Explicação da resposta correta').fill('Porque sim.');
  await page.getByRole('button', { name: 'Salvar questão' }).click();
  await expect(page.getByText('Questão salva!')).toBeVisible();

  await page.getByRole('button', { name: /Começar prática/ }).click();
  await expect(page.getByText(/Questão 1 de 1 · Neurologia · Medula/)).toBeVisible();
  // As alternativas vêm embaralhadas: a correta é a que tem o texto "Opção A".
  await page.getByRole('button', { name: /Opção A/ }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Correto' })).toContainText(
    '✅ Correto! Porque sim.',
  );
  await page.getByRole('button', { name: 'Ver resultado' }).click();
  await expect(page.getByText('1 / 1 corretas')).toBeVisible();
  await page.getByRole('button', { name: 'Voltar' }).click();
  await expect(page.getByRole('region', { name: 'Seu desempenho' })).toContainText('100%');
});

test('Perfil e Horários continuam depois de recarregar', async ({ page }) => {
  await page.goto('/perfil');
  await page.getByLabel('Período').fill('4º período');
  await page.getByRole('button', { name: 'Salvar perfil' }).click();
  await expect(page.getByText('Salvo!')).toBeVisible();
  await page.goto('/agenda/horarios');
  await page.getByRole('textbox', { name: 'Horários fixos da semana' }).fill('Seg 8h aula clínica');
  await page.getByRole('button', { name: 'Salvar horários' }).click();
  await expect(page.getByText('Salvo!')).toBeVisible();

  await page.goto('/perfil');
  await expect(page.getByLabel('Período')).toHaveValue('4º período');
  await page.goto('/agenda/horarios');
  await expect(page.getByRole('textbox', { name: 'Horários fixos da semana' })).toHaveValue(
    'Seg 8h aula clínica',
  );
});
