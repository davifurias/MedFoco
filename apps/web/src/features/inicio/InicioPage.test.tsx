import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  STORAGE_KEYS,
  createLocalRepository,
  createMemoryStorage,
  type KeyValueStorage,
} from '../../data/localRepository';
import { RepositoryProvider } from '../../data/RepositoryContext';
import type { CalendarEvent, FocusSession, Task } from '../../data/types';
import { InicioPage } from './InicioPage';
import { AiUnavailableError, type GenerateDailySuggestion } from './services/sugestaoDoDia';

const TODAY = '2026-09-25';

function renderInicio({
  storage = createMemoryStorage(),
  generate,
}: { storage?: KeyValueStorage; generate?: GenerateDailySuggestion } = {}) {
  const router = createMemoryRouter(
    [
      { path: '/', element: <InicioPage generateSuggestion={generate} /> },
      { path: '*', element: <p>outra área</p> },
    ],
    { initialEntries: ['/'] },
  );
  render(
    <RepositoryProvider repository={createLocalRepository(storage)}>
      <RouterProvider router={router} />
    </RepositoryProvider>,
  );
  return { router, storage, repository: createLocalRepository(storage) };
}

const store = (storage: KeyValueStorage, key: string, value: unknown) =>
  storage.setItem(key, JSON.stringify(value));

const task = (done: boolean, i: number): Task => ({
  id: `t${i}`,
  title: `Tarefa ${i}`,
  subject: '',
  deadline: '',
  priority: 'média',
  done,
  createdAt: i,
});
const event = (date: string, i: number, extra: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id: `e${i}`,
  title: `Evento ${i}`,
  date,
  category: 'outro',
  notes: '',
  createdAt: i,
  ...extra,
});
const session = (
  type: 'work' | 'break',
  minutes: number,
  date: string,
  i: number,
): FocusSession => ({
  id: `s${i}`,
  type,
  minutes,
  subject: null,
  date,
  createdAt: i,
});

const counter = (label: string) =>
  within(screen.getByRole('region', { name: 'Resumo do dia' })).getByText(label)
    .previousElementSibling?.textContent;
const quickToggle = (name: string) => screen.getByRole('button', { name });
const eventsCard = () => screen.getByRole('region', { name: 'Próximos eventos' });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 25, 10, 0));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Resumo do dia', () => {
  it('mostra a data local por extenso e a saudação sem nome', () => {
    renderInicio();
    const resumo = screen.getByRole('region', { name: 'Resumo do dia' });
    expect(resumo.textContent).toContain('sexta-feira, 25 de setembro');
    expect(resumo.textContent).toContain('Bom dia');
  });

  it('usa a data local à noite (23h de 25/09 continua sendo 25/09)', async () => {
    vi.setSystemTime(new Date(2026, 8, 25, 23, 0));
    const storage = createMemoryStorage();
    store(storage, STORAGE_KEYS.events, [event(TODAY, 1)]);
    store(storage, STORAGE_KEYS.focusSessions, [session('work', 30, TODAY, 1)]);
    renderInicio({ storage });
    expect(screen.getByRole('region', { name: 'Resumo do dia' }).textContent).toContain(
      'Boa noite',
    );
    await waitFor(() => expect(counter('próximos eventos')).toBe('1'));
    expect(counter('min estudados hoje')).toBe('30');
  });

  it('começa em zero e sem eventos quando não há dados', async () => {
    renderInicio();
    expect(await within(eventsCard()).findByText(/Nenhum evento futuro/)).toBeTruthy();
    expect(counter('tarefas pendentes')).toBe('0');
    expect(counter('próximos eventos')).toBe('0');
    expect(counter('min estudados hoje')).toBe('0');
  });

  it('conta tarefas pendentes, total de eventos futuros e só minutos de foco de hoje', async () => {
    const storage = createMemoryStorage();
    store(storage, STORAGE_KEYS.tasks, [task(false, 1), task(true, 2), task(false, 3)]);
    store(storage, STORAGE_KEYS.events, [
      event('2026-09-24', 0),
      ...Array.from({ length: 7 }, (_, i) => event(`2026-10-0${i + 1}`, i + 1)),
    ]);
    store(storage, STORAGE_KEYS.focusSessions, [
      session('work', 25, TODAY, 1),
      session('break', 5, TODAY, 2),
      session('work', 50, TODAY, 3),
      session('work', 25, '2026-09-24', 4),
    ]);
    renderInicio({ storage });
    await waitFor(() => expect(counter('tarefas pendentes')).toBe('2'));
    expect(counter('próximos eventos')).toBe('7');
    expect(counter('min estudados hoje')).toBe('75');
  });
});

describe('Próximos eventos', () => {
  it('mostra no máximo 5, em ordem de data, com categoria, data e observação', async () => {
    const storage = createMemoryStorage();
    store(storage, STORAGE_KEYS.events, [
      event('2026-10-03', 3),
      event('2026-10-01', 1, { category: 'provas', notes: 'Sala 2' }),
      event('2026-10-02', 2),
      event('2026-10-06', 6),
      event('2026-10-05', 5),
      event('2026-10-04', 4),
    ]);
    renderInicio({ storage });
    const items = await within(eventsCard()).findAllByRole('listitem');
    expect(items).toHaveLength(5);
    expect(items.map((li) => li.querySelector('.item-title')?.textContent)).toEqual([
      'Evento 1',
      'Evento 2',
      'Evento 3',
      'Evento 4',
      'Evento 5',
    ]);
    expect(items[0]?.textContent).toContain('Provas');
    expect(items[0]?.textContent).toContain('01 de out. de 2026 · Sala 2');
    expect(counter('próximos eventos')).toBe('6');
  });

  it('pede confirmação e não exclui ao cancelar', async () => {
    const storage = createMemoryStorage();
    store(storage, STORAGE_KEYS.events, [event('2026-10-01', 1)]);
    const { repository } = renderInicio({ storage });
    fireEvent.click(await screen.findByRole('button', { name: 'Excluir evento Evento 1' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Excluir evento?' });
    expect(dialog.textContent).toContain('Tem certeza que deseja excluir o evento "Evento 1"?');
    expect(document.activeElement).toBe(within(dialog).getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(within(eventsCard()).getAllByRole('listitem')).toHaveLength(1);
    expect(await repository.listEvents()).toHaveLength(1);
  });

  it('cancela com a tecla Esc', async () => {
    const storage = createMemoryStorage();
    store(storage, STORAGE_KEYS.events, [event('2026-10-01', 1)]);
    renderInicio({ storage });
    fireEvent.click(await screen.findByRole('button', { name: 'Excluir evento Evento 1' }));
    fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' });
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(within(eventsCard()).getAllByRole('listitem')).toHaveLength(1);
  });

  it('exclui ao confirmar e atualiza lista e contador', async () => {
    const storage = createMemoryStorage();
    store(storage, STORAGE_KEYS.events, [event('2026-10-01', 1), event('2026-10-02', 2)]);
    const { repository } = renderInicio({ storage });
    fireEvent.click(await screen.findByRole('button', { name: 'Excluir evento Evento 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    await waitFor(() => expect(counter('próximos eventos')).toBe('1'));
    expect(within(eventsCard()).queryByText('Evento 1')).toBeNull();
    expect((await repository.listEvents()).map((e) => e.id)).toEqual(['e2']);
  });
});

describe('Ações rápidas', () => {
  it('abre um formulário por vez e fecha ao clicar de novo', () => {
    renderInicio();
    fireEvent.click(quickToggle('Tarefa'));
    expect(quickToggle('Tarefa').getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByLabelText('Título da tarefa')).toBeTruthy();

    fireEvent.click(quickToggle('Evento'));
    expect(quickToggle('Tarefa').getAttribute('aria-expanded')).toBe('false');
    expect(quickToggle('Evento').getAttribute('aria-expanded')).toBe('true');
    expect(screen.queryByLabelText('Título da tarefa')).toBeNull();
    expect(screen.getByLabelText('Título do evento')).toBeTruthy();

    fireEvent.click(quickToggle('Ideia'));
    expect(screen.getByLabelText('Ideia para o caderno')).toBeTruthy();
    expect(screen.queryByLabelText('Título do evento')).toBeNull();

    fireEvent.click(quickToggle('Ideia'));
    expect(quickToggle('Ideia').getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByLabelText('Ideia para o caderno')).toBeNull();
  });

  it('coloca o foco no campo ao abrir o formulário', () => {
    renderInicio();
    fireEvent.click(quickToggle('Tarefa'));
    expect(document.activeElement).toBe(screen.getByLabelText('Título da tarefa'));
  });

  it('tarefa: exige título', async () => {
    const { repository } = renderInicio();
    fireEvent.click(quickToggle('Tarefa'));
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar tarefa' }));
    expect(await screen.findByText('Escreva o que precisa fazer.')).toBeTruthy();
    expect(await repository.listTasks()).toEqual([]);
  });

  it('tarefa: cria, fecha o formulário, atualiza o contador e salva', async () => {
    const { repository } = renderInicio();
    fireEvent.click(quickToggle('Tarefa'));
    fireEvent.change(screen.getByLabelText('Título da tarefa'), {
      target: { value: '  Ler capítulo 4  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar tarefa' }));
    await waitFor(() => expect(counter('tarefas pendentes')).toBe('1'));
    expect(screen.queryByLabelText('Título da tarefa')).toBeNull();
    expect(document.activeElement).toBe(quickToggle('Tarefa'));
    expect(await repository.listTasks()).toEqual([
      expect.objectContaining({
        title: 'Ler capítulo 4',
        subject: '',
        deadline: '',
        priority: 'média',
        done: false,
        createdAt: expect.any(Number),
      }),
    ]);
  });

  it('evento: exige título', async () => {
    renderInicio();
    fireEvent.click(quickToggle('Evento'));
    fireEvent.change(screen.getByLabelText('Data do evento'), { target: { value: '2026-10-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar evento' }));
    expect(await screen.findByText('Preencha título e data.')).toBeTruthy();
  });

  it('evento: exige data', async () => {
    const { repository } = renderInicio();
    fireEvent.click(quickToggle('Evento'));
    fireEvent.change(screen.getByLabelText('Título do evento'), { target: { value: 'Prova' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar evento' }));
    expect(await screen.findByText('Preencha título e data.')).toBeTruthy();
    expect(await repository.listEvents()).toEqual([]);
  });

  it('evento: cria, aparece na lista, atualiza o contador e salva', async () => {
    const { repository } = renderInicio();
    fireEvent.click(quickToggle('Evento'));
    fireEvent.change(screen.getByLabelText('Título do evento'), { target: { value: 'Prova' } });
    fireEvent.change(screen.getByLabelText('Data do evento'), { target: { value: '2026-10-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar evento' }));
    expect(await within(eventsCard()).findByText('Prova')).toBeTruthy();
    expect(counter('próximos eventos')).toBe('1');
    expect(screen.queryByLabelText('Título do evento')).toBeNull();
    expect(await repository.listEvents()).toEqual([
      expect.objectContaining({ title: 'Prova', date: '2026-10-01', category: 'outro', notes: '' }),
    ]);
  });

  it('ideia: não salva texto vazio', async () => {
    const { repository } = renderInicio();
    fireEvent.click(quickToggle('Ideia'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar no caderno' }));
    expect(screen.getByLabelText('Ideia para o caderno')).toBeTruthy();
    expect(await repository.listNotebookEntries()).toEqual([]);
  });

  it('ideia: salva no Caderno de Ideias pessoal e fecha o formulário', async () => {
    const { repository, storage } = renderInicio();
    fireEvent.click(quickToggle('Ideia'));
    fireEvent.change(screen.getByLabelText('Ideia para o caderno'), {
      target: { value: 'Estudar com mapas mentais' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar no caderno' }));
    await waitFor(() => expect(screen.queryByLabelText('Ideia para o caderno')).toBeNull());
    expect(await repository.listNotebookEntries()).toEqual([
      expect.objectContaining({ text: 'Estudar com mapas mentais' }),
    ]);
    expect(storage.getItem(STORAGE_KEYS.notebook)).toContain('Estudar com mapas mentais');
  });

  it('mantém os dados depois de recarregar a página', async () => {
    const storage = createMemoryStorage();
    renderInicio({ storage });
    fireEvent.click(quickToggle('Tarefa'));
    fireEvent.change(screen.getByLabelText('Título da tarefa'), { target: { value: 'Revisar' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar tarefa' }));
    await waitFor(() => expect(counter('tarefas pendentes')).toBe('1'));

    cleanup();
    renderInicio({ storage });
    await waitFor(() => expect(counter('tarefas pendentes')).toBe('1'));
  });
});

describe('Navegação', () => {
  it.each([
    ['Estou perdido, o que faço agora?', '/assessora'],
    ['Material', '/materias'],
    ['Perguntar', '/assessora'],
    ['⚙️ Editar perfil acadêmico', '/perfil'],
  ])('"%s" leva para %s', async (name, path) => {
    const { router } = renderInicio();
    fireEvent.click(screen.getByRole('link', { name }));
    await waitFor(() => expect(router.state.location.pathname).toBe(path));
  });

  it('"Estou perdido" apenas navega, sem criar conversa', async () => {
    const { router, storage } = renderInicio();
    fireEvent.click(screen.getByRole('link', { name: 'Estou perdido, o que faço agora?' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/assessora'));
    for (const key of Object.values(STORAGE_KEYS)) expect(storage.getItem(key)).toBeNull();
  });
});

describe('Sugestão da IA para hoje', () => {
  it('informa que a IA ainda não está disponível, sem simular resposta', async () => {
    const { storage } = renderInicio();
    fireEvent.click(screen.getByRole('button', { name: 'Gerar sugestão do dia ✨' }));
    expect(
      await screen.findByText(/ainda não está disponível nesta versão do MedFoco/),
    ).toBeTruthy();
    expect(storage.getItem(STORAGE_KEYS.dailySuggestion)).toBeNull();
    expect(screen.getByRole('button', { name: 'Gerar sugestão do dia ✨' })).toBeTruthy();
  });

  it('mostra "Pensando..." e desativa o botão enquanto gera', async () => {
    let finish: () => void = () => {};
    const generate = () =>
      new Promise<string>((_, reject) => {
        finish = () => reject(new AiUnavailableError());
      });
    renderInicio({ generate });
    const button = screen.getByRole('button', { name: 'Gerar sugestão do dia ✨' });
    fireEvent.click(button);
    expect(await screen.findByText('Pensando...')).toBeTruthy();
    expect((button as HTMLButtonElement).disabled).toBe(true);
    await act(async () => finish());
    expect((button as HTMLButtonElement).disabled).toBe(false);
  });

  it('mostra mensagem amigável em caso de erro', async () => {
    renderInicio({ generate: () => Promise.reject(new Error('falha')) });
    fireEvent.click(screen.getByRole('button', { name: 'Gerar sugestão do dia ✨' }));
    expect(await screen.findByText(/Não consegui gerar a sugestão agora/)).toBeTruthy();
  });

  it('exibe a sugestão salva de hoje, mas não a de outro dia', async () => {
    const storage = createMemoryStorage();
    store(storage, STORAGE_KEYS.dailySuggestion, { date: TODAY, text: 'Revise Cardiologia.' });
    renderInicio({ storage });
    expect(await screen.findByText('Revise Cardiologia.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Gerar de novo 🔄' })).toBeTruthy();

    cleanup();
    store(storage, STORAGE_KEYS.dailySuggestion, { date: '2026-09-24', text: 'Antiga.' });
    renderInicio({ storage });
    expect(await screen.findByRole('button', { name: 'Gerar sugestão do dia ✨' })).toBeTruthy();
    expect(screen.queryByText('Antiga.')).toBeNull();
  });
});
