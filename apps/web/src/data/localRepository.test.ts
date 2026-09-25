import { describe, expect, it } from 'vitest';
import { STORAGE_KEYS, createLocalRepository, createMemoryStorage } from './localRepository';

const task = {
  title: 'Ler capítulo 4',
  subject: '',
  deadline: '' as const,
  priority: 'média' as const,
  done: false,
};
const event = { title: 'Prova', date: '2026-10-01', category: 'provas' as const, notes: '' };

describe('createLocalRepository', () => {
  it('começa vazio, sem criar dados de exemplo', async () => {
    const storage = createMemoryStorage();
    const repo = createLocalRepository(storage);
    expect(await repo.listTasks()).toEqual([]);
    expect(await repo.listEvents()).toEqual([]);
    expect(await repo.listNotebookEntries()).toEqual([]);
    expect(await repo.listFocusSessions()).toEqual([]);
    expect(await repo.getDailySuggestion()).toBeNull();
    expect(storage.getItem(STORAGE_KEYS.tasks)).toBeNull();
  });

  it('cria itens com id e data de criação', async () => {
    const repo = createLocalRepository(createMemoryStorage(), () => 1000);
    const created = await repo.addTask(task);
    expect(created).toMatchObject({ ...task, createdAt: 1000 });
    expect(created.id).toBeTruthy();
    expect(await repo.listTasks()).toEqual([created]);
  });

  it('mantém os dados após recarregar (nova instância sobre o mesmo armazenamento)', async () => {
    const storage = createMemoryStorage();
    const before = createLocalRepository(storage);
    const t = await before.addTask(task);
    const e = await before.addEvent(event);
    const n = await before.addNotebookEntry({ text: 'ideia solta' });

    const after = createLocalRepository(storage);
    expect(await after.listTasks()).toEqual([t]);
    expect(await after.listEvents()).toEqual([e]);
    expect(await after.listNotebookEntries()).toEqual([n]);
  });

  it('exclui apenas o evento indicado', async () => {
    const repo = createLocalRepository(createMemoryStorage());
    const a = await repo.addEvent(event);
    const b = await repo.addEvent({ ...event, title: 'Aula' });
    await repo.deleteEvent(a.id);
    expect(await repo.listEvents()).toEqual([b]);
  });

  it('ignora dados corrompidos sem quebrar o app', async () => {
    const storage = createMemoryStorage();
    storage.setItem(STORAGE_KEYS.events, '{isso não é json');
    storage.setItem(STORAGE_KEYS.tasks, '{"não":"é lista"}');
    storage.setItem(STORAGE_KEYS.dailySuggestion, '{"date":1}');
    const repo = createLocalRepository(storage);
    expect(await repo.listEvents()).toEqual([]);
    expect(await repo.listTasks()).toEqual([]);
    expect(await repo.getDailySuggestion()).toBeNull();
  });

  it('lê a sugestão diária salva', async () => {
    const storage = createMemoryStorage();
    storage.setItem(
      STORAGE_KEYS.dailySuggestion,
      JSON.stringify({ date: '2026-09-25', text: 'x' }),
    );
    expect(await createLocalRepository(storage).getDailySuggestion()).toEqual({
      date: '2026-09-25',
      text: 'x',
    });
  });
});
