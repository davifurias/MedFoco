import { afterEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEYS, createLocalRepository, createMemoryStorage, newId } from './localRepository';

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

describe('tarefas: concluir e excluir', () => {
  it('marca e desmarca como concluída apenas a tarefa indicada', async () => {
    const repo = createLocalRepository(createMemoryStorage());
    const a = await repo.addTask(task);
    const b = await repo.addTask({ ...task, title: 'Outra' });
    await repo.setTaskDone(a.id, true);
    expect(await repo.listTasks()).toEqual([{ ...a, done: true }, b]);
    await repo.setTaskDone(a.id, false);
    expect(await repo.listTasks()).toEqual([a, b]);
  });

  it('exclui apenas a tarefa indicada', async () => {
    const repo = createLocalRepository(createMemoryStorage());
    const a = await repo.addTask(task);
    const b = await repo.addTask({ ...task, title: 'Outra' });
    await repo.deleteTask(a.id);
    expect(await repo.listTasks()).toEqual([b]);
  });
});

describe('horários da semana', () => {
  it('começa vazio', async () => {
    expect(await createLocalRepository(createMemoryStorage()).getSchedule()).toBe('');
  });

  it('salva e mantém após recarregar, inclusive texto vazio', async () => {
    const storage = createMemoryStorage();
    await createLocalRepository(storage).saveSchedule('Seg 8h-12h aula');
    expect(await createLocalRepository(storage).getSchedule()).toBe('Seg 8h-12h aula');
    await createLocalRepository(storage).saveSchedule('');
    expect(await createLocalRepository(storage).getSchedule()).toBe('');
  });

  it('ignora dados corrompidos', async () => {
    const storage = createMemoryStorage();
    storage.setItem(STORAGE_KEYS.schedule, '{ruim');
    expect(await createLocalRepository(storage).getSchedule()).toBe('');
    storage.setItem(STORAGE_KEYS.schedule, '{"text":42}');
    expect(await createLocalRepository(storage).getSchedule()).toBe('');
  });
});

describe('itens danificados', () => {
  it('ignora na leitura itens danificados sem esconder os válidos', async () => {
    const storage = createMemoryStorage();
    storage.setItem(
      STORAGE_KEYS.events,
      JSON.stringify([{ id: 'x' }, null, 42, { ...event, id: 'ok', createdAt: 1 }]),
    );
    const events = await createLocalRepository(storage).listEvents();
    expect(events.map((e) => e.id)).toEqual(['ok']);
  });

  it('não apaga itens danificados ao gravar outras mudanças', async () => {
    const storage = createMemoryStorage();
    const damaged = { id: 'x', algo: 'desconhecido' };
    storage.setItem(STORAGE_KEYS.tasks, JSON.stringify([damaged]));
    const repo = createLocalRepository(storage);
    const created = await repo.addTask(task);
    await repo.setTaskDone(created.id, true);
    const saved = JSON.parse(storage.getItem(STORAGE_KEYS.tasks) ?? '[]') as unknown[];
    expect(saved[0]).toEqual(damaged);
    expect(saved).toHaveLength(2);
    await repo.deleteTask(created.id);
    expect(JSON.parse(storage.getItem(STORAGE_KEYS.tasks) ?? '[]')).toEqual([damaged]);
  });

  it('guarda cópia de segurança antes de gravar por cima de conteúdo ilegível', async () => {
    const storage = createMemoryStorage();
    storage.setItem(STORAGE_KEYS.events, '{conteúdo ilegível');
    storage.setItem(STORAGE_KEYS.schedule, '{"texto":"formato antigo"}');
    const repo = createLocalRepository(storage, () => 777);
    await repo.addEvent(event);
    await repo.saveSchedule('novo');
    expect(storage.getItem(`${STORAGE_KEYS.events}:backup:777`)).toBe('{conteúdo ilegível');
    expect(storage.getItem(`${STORAGE_KEYS.schedule}:backup:777`)).toBe(
      '{"texto":"formato antigo"}',
    );
    expect(await repo.listEvents()).toHaveLength(1);
    expect(await repo.getSchedule()).toBe('novo');
  });

  it('não cria cópia de segurança quando o conteúdo é válido', async () => {
    const storage = createMemoryStorage();
    const repo = createLocalRepository(storage, () => 777);
    await repo.addEvent(event);
    await repo.addEvent(event);
    await repo.saveSchedule('a');
    await repo.saveSchedule('b');
    expect(storage.getItem(`${STORAGE_KEYS.events}:backup:777`)).toBeNull();
    expect(storage.getItem(`${STORAGE_KEYS.schedule}:backup:777`)).toBeNull();
  });
});

describe('materiais', () => {
  const material = {
    subject: 'Cardiologia',
    title: 'Aula 1',
    notes: 'resumo',
    tags: ['coração'],
    type: 'video' as const,
    videoLink: 'https://youtube.com/watch?v=x',
  };

  it('cria, lista, mantém após recarregar e exclui apenas o indicado', async () => {
    const storage = createMemoryStorage();
    const repo = createLocalRepository(storage);
    expect(await repo.listMaterials()).toEqual([]);
    const a = await repo.addMaterial(material);
    const b = await repo.addMaterial({ ...material, title: 'Aula 2' });
    expect(await createLocalRepository(storage).listMaterials()).toEqual([a, b]);
    await repo.deleteMaterial(a.id);
    expect(await repo.listMaterials()).toEqual([b]);
  });

  it('descarta links perigosos adulterados nos dados salvos, mantendo o material', async () => {
    const storage = createMemoryStorage();
    storage.setItem(
      STORAGE_KEYS.materials,
      JSON.stringify([
        { id: 'm1', title: 'Mau', type: 'video', videoLink: 'javascript:alert(1)' },
        { id: 'm2', title: 'Bom', type: 'video', videoLink: 'youtube.com/x' },
        { id: 'm3', title: 'Nota com link', type: 'nota', videoLink: 'https://exemplo.com' },
      ]),
    );
    const list = await createLocalRepository(storage).listMaterials();
    expect(list.map((m) => [m.id, m.videoLink])).toEqual([
      ['m1', ''],
      ['m2', 'https://youtube.com/x'],
      ['m3', ''],
    ]);
  });

  it('completa campos ausentes: matéria vazia vira "Geral", tipo antigo "arquivo" vira nota', async () => {
    const storage = createMemoryStorage();
    storage.setItem(
      STORAGE_KEYS.materials,
      JSON.stringify([
        { id: 'm1', title: 'Texto', type: 'arquivo', subject: '  ', tags: ['a', 1, ''] },
        { id: 'x' },
        null,
      ]),
    );
    expect(await createLocalRepository(storage).listMaterials()).toEqual([
      {
        id: 'm1',
        title: 'Texto',
        type: 'nota',
        subject: 'Geral',
        notes: '',
        tags: ['a'],
        videoLink: '',
        createdAt: 0,
      },
    ]);
  });
});

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** Simula um navegador em contexto não seguro (http://<IP-da-rede>): sem crypto.randomUUID. */
const realCrypto = globalThis.crypto;
const insecureCrypto: Pick<Crypto, 'getRandomValues'> = {
  getRandomValues: (array) => realCrypto.getRandomValues(array),
};

describe('questões e respostas', () => {
  const question = {
    subject: 'Cardiologia',
    topic: 'IC',
    difficulty: 'médio' as const,
    question: 'Qual exame?',
    options: ['A', 'B', 'C', 'D'] as [string, string, string, string],
    correctIndex: 2,
    explanation: 'Porque sim.',
  };

  it('começa vazio, sem criar questões de exemplo', async () => {
    const repo = createLocalRepository(createMemoryStorage());
    expect(await repo.listQuestions()).toEqual([]);
    expect(await repo.listAttempts()).toEqual([]);
  });

  it('cria, mantém após recarregar e exclui apenas a questão indicada', async () => {
    const storage = createMemoryStorage();
    const repo = createLocalRepository(storage);
    const first = await repo.addQuestion(question);
    const second = await repo.addQuestion({ ...question, question: 'Outra?' });
    expect((await createLocalRepository(storage).listQuestions()).map((q) => q.id)).toEqual([
      first.id,
      second.id,
    ]);
    await repo.deleteQuestion(first.id);
    expect((await repo.listQuestions()).map((q) => q.id)).toEqual([second.id]);
  });

  it('guarda as respostas com a data local e mantém após recarregar', async () => {
    const storage = createMemoryStorage();
    const repo = createLocalRepository(storage);
    const attempt = await repo.addAttempt({
      subject: 'Cardiologia',
      topic: 'IC',
      correct: true,
      date: '2026-10-07',
    });
    expect(await createLocalRepository(storage).listAttempts()).toEqual([attempt]);
  });

  it('ignora questões e respostas danificadas, sem esconder as válidas nem apagá-las', async () => {
    const storage = createMemoryStorage();
    const valid = { ...question, id: 'q1', createdAt: 1 };
    storage.setItem(
      STORAGE_KEYS.questions,
      JSON.stringify([
        valid,
        null,
        'x',
        { id: 'q2', question: 'Sem alternativas' },
        { ...valid, id: 'q3', options: ['a', 'b', 'c'] },
      ]),
    );
    storage.setItem(
      STORAGE_KEYS.attempts,
      JSON.stringify([
        { id: 'a1', subject: 'X', correct: true, date: '2026-10-07' },
        { id: 'a2', correct: 'sim' },
        7,
      ]),
    );
    const repo = createLocalRepository(storage);
    expect((await repo.listQuestions()).map((q) => q.id)).toEqual(['q1']);
    expect((await repo.listAttempts()).map((a) => a.id)).toEqual(['a1']);
    await repo.addQuestion(question);
    expect(JSON.parse(storage.getItem(STORAGE_KEYS.questions) ?? '[]')).toHaveLength(6);
  });

  it('completa campos ausentes: matéria vazia vira "Geral", dificuldade inválida vira médio, gabarito inválido vira A', async () => {
    const storage = createMemoryStorage();
    storage.setItem(
      STORAGE_KEYS.questions,
      JSON.stringify([
        {
          id: 'q1',
          question: 'E?',
          options: ['a', 'b', 'c', 'd'],
          difficulty: 'impossível',
          correctIndex: 9,
        },
      ]),
    );
    storage.setItem(
      STORAGE_KEYS.attempts,
      JSON.stringify([
        { id: 'a1', correct: false, createdAt: new Date(2026, 9, 7, 23, 30).getTime() },
      ]),
    );
    const repo = createLocalRepository(storage);
    expect(await repo.listQuestions()).toMatchObject([
      { subject: 'Geral', topic: '', difficulty: 'médio', correctIndex: 0, explanation: '' },
    ]);
    expect(await repo.listAttempts()).toMatchObject([{ subject: 'Geral', date: '2026-10-07' }]);
  });
});

describe('sessões de foco', () => {
  it('grava, mantém após recarregar e ignora itens danificados', async () => {
    const storage = createMemoryStorage();
    const repo = createLocalRepository(storage);
    expect(await repo.listFocusSessions()).toEqual([]);
    const saved = await repo.addFocusSession({
      type: 'work',
      minutes: 25,
      subject: null,
      date: '2026-10-07',
    });
    expect(await createLocalRepository(storage).listFocusSessions()).toEqual([saved]);
    storage.setItem(STORAGE_KEYS.focusSessions, JSON.stringify([saved, null, { id: 'x' }]));
    expect(await repo.listFocusSessions()).toEqual([saved]);
  });
});

describe('ideias: mural e caderno', () => {
  it('o mural começa vazio, grava, mantém após recarregar e exclui só a indicada', async () => {
    const storage = createMemoryStorage();
    const repo = createLocalRepository(storage);
    expect(await repo.listAppIdeas()).toEqual([]);
    const first = await repo.addAppIdea({ text: 'Primeira' });
    const second = await repo.addAppIdea({ text: 'Segunda' });
    expect(await createLocalRepository(storage).listAppIdeas()).toEqual([first, second]);
    await repo.deleteAppIdea(first.id);
    expect(await repo.listAppIdeas()).toEqual([second]);
  });

  it('o mural e o caderno são listas separadas', async () => {
    const repo = createLocalRepository(createMemoryStorage());
    await repo.addAppIdea({ text: 'mural' });
    await repo.addNotebookEntry({ text: 'caderno' });
    expect((await repo.listAppIdeas()).map((i) => i.text)).toEqual(['mural']);
    expect((await repo.listNotebookEntries()).map((i) => i.text)).toEqual(['caderno']);
  });

  it('exclui só a ideia indicada do caderno e ignora itens danificados', async () => {
    const storage = createMemoryStorage();
    const repo = createLocalRepository(storage);
    const a = await repo.addNotebookEntry({ text: 'a' });
    const b = await repo.addNotebookEntry({ text: 'b' });
    await repo.deleteNotebookEntry(a.id);
    expect(await repo.listNotebookEntries()).toEqual([b]);
    storage.setItem(
      STORAGE_KEYS.appIdeas,
      JSON.stringify([{ id: 'x', text: '   ' }, null, { text: 'sem id' }]),
    );
    expect(await repo.listAppIdeas()).toEqual([]);
  });
});

describe('newId', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('usa crypto.randomUUID quando disponível', () => {
    expect(newId({ ...insecureCrypto, randomUUID: () => 'id-fixo' })).toBe('id-fixo');
  });

  it('gera UUID v4 válido e único sem crypto.randomUUID', () => {
    const ids = Array.from({ length: 100 }, () => newId(insecureCrypto));
    for (const id of ids) expect(id).toMatch(UUID_V4);
    expect(new Set(ids).size).toBe(100);
  });

  it('permite salvar dados quando o navegador não oferece crypto.randomUUID', async () => {
    vi.stubGlobal('crypto', insecureCrypto);
    expect(globalThis.crypto.randomUUID).toBeUndefined();
    const repo = createLocalRepository(createMemoryStorage());
    const created = await repo.addTask(task);
    expect(created.id).toMatch(UUID_V4);
    expect(await repo.listTasks()).toEqual([created]);
  });
});
