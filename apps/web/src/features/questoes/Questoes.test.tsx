import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../app/App';
import {
  STORAGE_KEYS,
  createLocalRepository,
  createMemoryStorage,
  type KeyValueStorage,
} from '../../data/localRepository';
import type { MedFocoRepository } from '../../data/repository';
import type { Question } from '../../data/types';
import { routes } from '../../routes/routes';

function renderApp(storage: KeyValueStorage = createMemoryStorage(), repo?: MedFocoRepository) {
  const router = createMemoryRouter(routes, { initialEntries: ['/questoes'] });
  render(<App router={router} repository={repo ?? createLocalRepository(storage)} />);
  return { storage, repository: createLocalRepository(storage) };
}

const store = (storage: KeyValueStorage, key: string, value: unknown) =>
  storage.setItem(key, JSON.stringify(value));

const q = (id: string, extra: Partial<Question> = {}): Question => ({
  id,
  subject: 'Cardiologia',
  topic: 'IC',
  difficulty: 'fácil',
  question: `Enunciado ${id}`,
  options: [`Certa ${id}`, `B ${id}`, `C ${id}`, `D ${id}`],
  correctIndex: 0,
  explanation: `Explicação ${id}`,
  createdAt: Number(id.replace(/\D/g, '')) || 1,
  ...extra,
});

function failingOn(key: string, base: KeyValueStorage = createMemoryStorage()): KeyValueStorage {
  return {
    getItem: (k) => base.getItem(k),
    setItem: (k, v) => {
      if (k === key) throw new Error('falha ao gravar');
      base.setItem(k, v);
    },
  };
}

const field = (name: string) => screen.getByLabelText(name);
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const start = () => click(/Começar prática/);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 7, 23, 30));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Questões — tela inicial', () => {
  it('abre vazia, sem criar questões de exemplo', async () => {
    const { storage } = renderApp();
    expect(await screen.findByText('Nenhuma questão ainda.')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Todas as questões (0)' })).toBeTruthy();
    expect(storage.getItem(STORAGE_KEYS.questions)).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Seu desempenho' })).toBeNull();
  });

  it('avisa quando não há questão para o filtro', async () => {
    renderApp();
    await screen.findByText('Nenhuma questão ainda.');
    start();
    expect(screen.getByRole('status').textContent).toBe('Nenhuma questão com esse filtro.');
  });

  it('mostra erro de carga em vez de uma lista vazia enganosa', async () => {
    const base = createLocalRepository(createMemoryStorage());
    renderApp(undefined, {
      ...base,
      listQuestions: () => Promise.reject(new Error('x')),
    });
    expect(
      (await screen.findByText('Não foi possível carregar as questões.')).getAttribute('role'),
    ).toBe('alert');
  });

  it('não deixa uma carga atrasada apagar a questão recém-salva', async () => {
    const storage = createMemoryStorage();
    const real = createLocalRepository(storage);
    let release: (list: Question[]) => void = () => {};
    renderApp(storage, {
      ...real,
      listQuestions: vi
        .fn()
        .mockImplementationOnce(() => new Promise<Question[]>((resolve) => (release = resolve)))
        .mockImplementation(() => real.listQuestions()),
    });
    fireEvent.change(field('Matéria'), { target: { value: 'Neuro' } });
    fireEvent.change(field('Enunciado da questão'), { target: { value: 'Pergunta?' } });
    for (const letter of ['A', 'B', 'C', 'D']) {
      fireEvent.change(field(`Alternativa ${letter}`), { target: { value: letter } });
    }
    click('Salvar questão');
    await screen.findByText('Questão salva!');
    await act(async () => release([]));
    expect(screen.getByRole('heading', { name: 'Todas as questões (1)' })).toBeTruthy();
  });
});

describe('Questões — cadastro', () => {
  const fillAll = () => {
    fireEvent.change(field('Matéria'), { target: { value: '  Neuro  ' } });
    fireEvent.change(field('Assunto'), { target: { value: 'Medula' } });
    fireEvent.change(field('Dificuldade'), { target: { value: 'difícil' } });
    fireEvent.change(field('Enunciado da questão'), { target: { value: ' Qual estrutura? ' } });
    ['A', 'B', 'C', 'D'].forEach((letter, i) =>
      fireEvent.change(field(`Alternativa ${letter}`), { target: { value: ` Opção ${i} ` } }),
    );
    fireEvent.change(field('Explicação da resposta correta'), { target: { value: ' Porque. ' } });
  };

  it('salva com a alternativa correta escolhida, limpa o formulário e lista a questão', async () => {
    const { storage } = renderApp();
    await screen.findByText('Nenhuma questão ainda.');
    fillAll();
    fireEvent.change(field('Alternativa correta'), { target: { value: '2' } });
    click('Salvar questão');
    expect(await screen.findByText('Questão salva!')).toBeTruthy();
    const saved = JSON.parse(storage.getItem(STORAGE_KEYS.questions) ?? '[]');
    expect(saved).toMatchObject([
      {
        subject: 'Neuro',
        topic: 'Medula',
        difficulty: 'difícil',
        question: 'Qual estrutura?',
        options: ['Opção 0', 'Opção 1', 'Opção 2', 'Opção 3'],
        correctIndex: 2,
        explanation: 'Porque.',
      },
    ]);
    expect((field('Matéria') as HTMLInputElement).value).toBe('');
    expect((field('Alternativa correta') as HTMLSelectElement).value).toBe('0');
    expect(screen.getByRole('heading', { name: 'Todas as questões (1)' })).toBeTruthy();
    expect(document.activeElement).toBe(field('Matéria'));
  });

  it.each([
    ['matéria', () => {}, 'Matéria'],
    [
      'enunciado',
      () => fireEvent.change(field('Matéria'), { target: { value: 'X' } }),
      'Enunciado da questão',
    ],
    [
      'alternativa C',
      () => {
        fireEvent.change(field('Matéria'), { target: { value: 'X' } });
        fireEvent.change(field('Enunciado da questão'), { target: { value: 'E' } });
        fireEvent.change(field('Alternativa A'), { target: { value: 'a' } });
        fireEvent.change(field('Alternativa B'), { target: { value: 'b' } });
        fireEvent.change(field('Alternativa D'), { target: { value: 'd' } });
      },
      'Alternativa C',
    ],
  ])('não salva sem %s: avisa e leva o foco ao campo', async (_name, prepare, label) => {
    const { storage } = renderApp();
    await screen.findByText('Nenhuma questão ainda.');
    prepare();
    click('Salvar questão');
    expect(screen.getByText('Preencha matéria, enunciado e as 4 alternativas.')).toBeTruthy();
    expect(document.activeElement).toBe(field(label));
    expect(field(label).getAttribute('aria-invalid')).toBe('true');
    expect(storage.getItem(STORAGE_KEYS.questions)).toBeNull();
  });

  it('trata espaços como vazio', async () => {
    renderApp();
    await screen.findByText('Nenhuma questão ainda.');
    fireEvent.change(field('Matéria'), { target: { value: '   ' } });
    click('Salvar questão');
    expect(document.activeElement).toBe(field('Matéria'));
  });

  it('mostra erro e mantém o que foi digitado quando não consegue gravar', async () => {
    renderApp(failingOn(STORAGE_KEYS.questions));
    await screen.findByText('Nenhuma questão ainda.');
    fillAll();
    click('Salvar questão');
    expect(await screen.findByText('Não foi possível salvar. Tente novamente.')).toBeTruthy();
    expect((field('Matéria') as HTMLInputElement).value).toBe('  Neuro  ');
  });
});

describe('Questões — lista e exclusão', () => {
  it('lista as questões e só exclui depois de confirmar', async () => {
    const storage = createMemoryStorage();
    store(storage, STORAGE_KEYS.questions, [q('1'), q('2', { subject: 'Neuro' })]);
    renderApp(storage);
    await screen.findByText('Enunciado 1');
    click('Excluir questão: Enunciado 1');
    click('Cancelar');
    expect(screen.getByText('Enunciado 1')).toBeTruthy();
    click('Excluir questão: Enunciado 1');
    click('Excluir');
    await waitFor(() => expect(screen.queryByText('Enunciado 1')).toBeNull());
    expect(screen.getByText('Enunciado 2')).toBeTruthy();
    expect(JSON.parse(storage.getItem(STORAGE_KEYS.questions) ?? '[]')).toHaveLength(1);
    await waitFor(() => expect(document.activeElement?.textContent).toBe('Todas as questões (1)'));
  });

  it('mostra erro quando a exclusão falha e mantém a questão', async () => {
    const base = createMemoryStorage();
    store(base, STORAGE_KEYS.questions, [q('1')]);
    renderApp(failingOn(STORAGE_KEYS.questions, base));
    await screen.findByText('Enunciado 1');
    click('Excluir questão: Enunciado 1');
    click('Excluir');
    expect(
      await screen.findByText('Não foi possível excluir a questão. Tente novamente.'),
    ).toBeTruthy();
    expect(screen.getByText('Enunciado 1')).toBeTruthy();
  });
});

describe('Questões — prática', () => {
  const setup = () => {
    const storage = createMemoryStorage();
    store(storage, STORAGE_KEYS.questions, [
      q('1'),
      q('2', { subject: 'Neuro', topic: '', difficulty: 'difícil' }),
    ]);
    renderApp(storage);
    return storage;
  };

  it('oferece só as matérias que existem e filtra a prática', async () => {
    setup();
    await screen.findByText('Enunciado 1');
    const select = field('Filtrar por matéria') as HTMLSelectElement;
    expect([...select.options].map((o) => o.text)).toEqual([
      'Todas as matérias',
      'Cardiologia',
      'Neuro',
    ]);
    fireEvent.change(select, { target: { value: 'Neuro' } });
    fireEvent.change(field('Filtrar por dificuldade'), { target: { value: 'fácil' } });
    start();
    expect(screen.getByRole('status').textContent).toBe('Nenhuma questão com esse filtro.');
    fireEvent.change(field('Filtrar por dificuldade'), { target: { value: 'difícil' } });
    start();
    expect(screen.getByText(/Questão 1 de 1 · Neuro · difícil/)).toBeTruthy();
  });

  it('responde certo e errado, mostra a explicação, registra tentativas e o resultado', async () => {
    const storage = setup();
    await screen.findByText('Enunciado 1');
    start();
    expect(screen.getByText(/Questão 1 de 2 · Cardiologia · IC · fácil/)).toBeTruthy();
    await waitFor(() => expect(document.activeElement?.textContent).toBe('Enunciado 1'));
    expect(screen.queryByRole('button', { name: 'Próxima' })).toBeNull();

    click(/Certa 1/);
    expect(screen.getByRole('status').textContent).toBe('✅ Correto! Explicação 1');
    expect(screen.getByRole('button', { name: /Certa 1/ }).textContent).toContain('(correta)');
    for (const option of screen.getAllByRole('button', { name: /^[A-D]\)/ })) {
      expect((option as HTMLButtonElement).disabled).toBe(true);
    }
    click('Próxima');
    await waitFor(() => expect(document.activeElement?.textContent).toBe('Enunciado 2'));
    expect(screen.queryByRole('button', { name: 'Próxima' })).toBeNull();

    click(/B 2/);
    expect(screen.getByRole('status').textContent).toBe('❌ Não foi dessa vez. Explicação 2');
    expect(screen.getByRole('button', { name: /B 2/ }).textContent).toContain(
      'sua resposta, incorreta',
    );
    expect(screen.getByRole('button', { name: /Certa 2/ }).textContent).toContain('(correta)');
    click('Ver resultado');
    expect(screen.getByText('1 / 2 corretas')).toBeTruthy();

    await waitFor(() =>
      expect(JSON.parse(storage.getItem(STORAGE_KEYS.attempts) ?? '[]')).toMatchObject([
        { subject: 'Cardiologia', topic: 'IC', correct: true, date: '2026-10-07' },
        { subject: 'Neuro', topic: '', correct: false, date: '2026-10-07' },
      ]),
    );
    click('Voltar');
    const desempenho = screen.getByRole('region', { name: 'Seu desempenho' });
    const rows = within(desempenho)
      .getAllByRole('listitem')
      .map((li) => li.textContent);
    expect(rows).toEqual(['Neuro0/1 questões0%', 'Cardiologia — IC1/1 questões100%']);
  });

  it('embaralha as alternativas, mas a correta continua sendo a escolhida no cadastro', async () => {
    const storage = createMemoryStorage();
    store(storage, STORAGE_KEYS.questions, [q('1', { correctIndex: 3 })]);
    vi.spyOn(Math, 'random').mockReturnValue(0);
    renderApp(storage);
    await screen.findByText('Enunciado 1');
    start();
    click(/D 1/);
    expect(screen.getByRole('status').textContent).toContain('✅ Correto!');
  });

  it('permite sair da prática a qualquer momento', async () => {
    setup();
    await screen.findByText('Enunciado 1');
    start();
    click('Sair da prática');
    expect(screen.getByRole('heading', { name: 'Praticar' })).toBeTruthy();
  });

  it('avisa quando não consegue registrar a resposta, sem perder o resultado', async () => {
    const base = createMemoryStorage();
    store(base, STORAGE_KEYS.questions, [q('1')]);
    renderApp(failingOn(STORAGE_KEYS.attempts, base));
    await screen.findByText('Enunciado 1');
    start();
    click(/Certa 1/);
    expect(await screen.findByText('Não foi possível registrar esta resposta.')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('✅ Correto!');
  });

  it('usa o dia local ao registrar, mesmo perto da meia-noite', async () => {
    const storage = setup();
    vi.setSystemTime(new Date(2026, 11, 31, 23, 59));
    await screen.findByText('Enunciado 1');
    start();
    click(/Certa 1/);
    await waitFor(() =>
      expect(JSON.parse(storage.getItem(STORAGE_KEYS.attempts) ?? '[]')[0].date).toBe('2026-12-31'),
    );
  });
});

describe('Questões — desempenho', () => {
  it('mostra só os 3 assuntos de menor acerto, com a cor do nível', async () => {
    const storage = createMemoryStorage();
    const attempts = [
      ['A', true, true], // 100
      ['B', true, false], // 50
      ['C', true, true, false], // 67
      ['D', false], // 0
    ].flatMap(([subject, ...results], i) =>
      (results as boolean[]).map((correct, j) => ({
        id: `a${i}${j}`,
        subject,
        topic: '',
        correct,
        date: '2026-10-07',
        createdAt: 1,
      })),
    );
    store(storage, STORAGE_KEYS.attempts, attempts);
    renderApp(storage);
    const region = await screen.findByRole('region', { name: 'Seu desempenho' });
    const items = within(region).getAllByRole('listitem');
    expect(items.map((li) => li.textContent)).toEqual([
      'D0/1 questões0%',
      'B1/2 questões50%',
      'C2/3 questões67%',
    ]);
    expect(items[0]?.querySelector('.pct-baixo')).not.toBeNull();
    expect(items[2]?.querySelector('.pct-medio')).not.toBeNull();
  });
});
