import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../app/App';
import {
  STORAGE_KEYS,
  createLocalRepository,
  createMemoryStorage,
  type KeyValueStorage,
} from '../../data/localRepository';
import { RepositoryProvider } from '../../data/RepositoryContext';
import type { CalendarEvent, Task } from '../../data/types';
import { routes } from '../../routes/routes';
import { AiUnavailableError } from '../../shared/ai';
import { TarefasPage } from './TarefasPage';
import type { OrganizeWeek } from './services/organizarSemana';

function renderApp(path: string, storage: KeyValueStorage = createMemoryStorage()) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<App router={router} repository={createLocalRepository(storage)} />);
  return { router, storage, repository: createLocalRepository(storage) };
}

function renderTarefas(organize: OrganizeWeek, storage: KeyValueStorage = createMemoryStorage()) {
  const router = createMemoryRouter([{ path: '/', element: <TarefasPage organize={organize} /> }]);
  render(
    <RepositoryProvider repository={createLocalRepository(storage)}>
      <RouterProvider router={router} />
    </RepositoryProvider>,
  );
}

const store = (storage: KeyValueStorage, key: string, value: unknown) =>
  storage.setItem(key, JSON.stringify(value));

/** Armazenamento que falha ao gravar a chave indicada (ex.: armazenamento cheio). */
function failingOn(key: string, base: KeyValueStorage = createMemoryStorage()): KeyValueStorage {
  return {
    getItem: (k) => base.getItem(k),
    setItem: (k, v) => {
      if (k === key) throw new Error('falha ao gravar');
      base.setItem(k, v);
    },
  };
}

const ev = (id: string, date: string, extra: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id,
  title: `Evento ${id}`,
  date,
  category: 'outro',
  notes: '',
  createdAt: Number(id.replace(/\D/g, '')) || 1,
  ...extra,
});
const tk = (id: string, createdAt: number, extra: Partial<Task> = {}): Task => ({
  id,
  title: `Tarefa ${id}`,
  subject: '',
  deadline: '',
  priority: 'média',
  done: false,
  createdAt,
  ...extra,
});

const region = (name: string) => screen.getByRole('region', { name });
const itemTitles = (container: HTMLElement) =>
  within(container)
    .queryAllByRole('listitem')
    .map((li) => li.querySelector('.item-title, [id$="-titulo"]')?.textContent);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 25, 10, 0));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Agenda › Eventos', () => {
  const list = () => region('Todos os eventos');

  it('mostra estado vazio', async () => {
    renderApp('/agenda');
    expect(await within(list()).findByText('Nenhum evento ainda.')).toBeTruthy();
  });

  it('exige título e data', async () => {
    const { repository } = renderApp('/agenda');
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar ao calendário' }));
    expect(await screen.findByText('Preencha título e data.')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Título do evento'), { target: { value: 'Prova' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar ao calendário' }));
    expect(await screen.findByText('Preencha título e data.')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Título do evento'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Data do evento'), { target: { value: '2026-10-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar ao calendário' }));
    expect(await screen.findByText('Preencha título e data.')).toBeTruthy();
    expect(await repository.listEvents()).toEqual([]);
  });

  it('usa "Trabalho" como categoria padrão', () => {
    renderApp('/agenda');
    expect((screen.getByLabelText('Categoria') as HTMLSelectElement).value).toBe('trabalho');
  });

  it('cria evento com categoria e observação, limpa o formulário e volta o foco ao título', async () => {
    const { repository } = renderApp('/agenda');
    fireEvent.change(screen.getByLabelText('Título do evento'), { target: { value: ' Prova ' } });
    fireEvent.change(screen.getByLabelText('Data do evento'), { target: { value: '2026-10-01' } });
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: 'provas' } });
    fireEvent.change(screen.getByLabelText('Observação'), { target: { value: 'Sala 2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar ao calendário' }));

    const item = await within(list()).findByRole('listitem');
    expect(item.textContent).toContain('Provas');
    expect(item.textContent).toContain('Prova');
    expect(item.textContent).toContain('01 de out. de 2026 · Sala 2');
    expect((screen.getByLabelText('Título do evento') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Categoria') as HTMLSelectElement).value).toBe('trabalho');
    expect(document.activeElement).toBe(screen.getByLabelText('Título do evento'));
    expect(await repository.listEvents()).toEqual([
      expect.objectContaining({
        title: 'Prova',
        date: '2026-10-01',
        category: 'provas',
        notes: 'Sala 2',
      }),
    ]);
  });

  it('mostra todos os eventos, inclusive passados, em ordem crescente de data', async () => {
    const storage = createMemoryStorage();
    store(storage, STORAGE_KEYS.events, [
      ev('e3', '2026-12-01'),
      ev('e1', '2025-01-10'),
      ev('e2', '2026-09-25'),
    ]);
    renderApp('/agenda', storage);
    await within(list()).findAllByRole('listitem');
    expect(itemTitles(list())).toEqual(['Evento e1', 'Evento e2', 'Evento e3']);
  });

  it('mantém a data escolhida para um evento criado às 23h (sem UTC)', async () => {
    vi.setSystemTime(new Date(2026, 8, 25, 23, 30));
    const { repository } = renderApp('/agenda');
    fireEvent.change(screen.getByLabelText('Título do evento'), { target: { value: 'Plantão' } });
    fireEvent.change(screen.getByLabelText('Data do evento'), { target: { value: '2026-09-25' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar ao calendário' }));
    expect((await within(list()).findByRole('listitem')).textContent).toContain(
      '25 de set. de 2026',
    );
    expect((await repository.listEvents())[0]?.date).toBe('2026-09-25');
  });

  it('exibe texto do usuário como texto, sem interpretar HTML', async () => {
    const storage = createMemoryStorage();
    store(storage, STORAGE_KEYS.events, [
      ev('e1', '2026-10-01', { title: '<img src=x onerror=alert(1)>', notes: '<b>negrito</b>' }),
    ]);
    renderApp('/agenda', storage);
    const item = await within(list()).findByRole('listitem');
    expect(item.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(item.querySelector('img, b')).toBeNull();
  });

  describe('exclusão', () => {
    const setup = () => {
      const storage = createMemoryStorage();
      store(storage, STORAGE_KEYS.events, [ev('e1', '2026-10-01'), ev('e2', '2026-10-02')]);
      return renderApp('/agenda', storage);
    };

    it('cancelar (botão ou Esc) não exclui', async () => {
      const { repository } = setup();
      fireEvent.click(await screen.findByRole('button', { name: 'Excluir evento Evento e1' }));
      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
      fireEvent.click(screen.getByRole('button', { name: 'Excluir evento Evento e1' }));
      fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' });
      expect(screen.queryByRole('alertdialog')).toBeNull();
      expect(await repository.listEvents()).toHaveLength(2);
    });

    it('confirmar exclui e leva o foco ao título da lista', async () => {
      const { repository } = setup();
      fireEvent.click(await screen.findByRole('button', { name: 'Excluir evento Evento e1' }));
      expect(screen.getByRole('alertdialog', { name: 'Excluir evento?' })).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
      await waitFor(() => expect(itemTitles(list())).toEqual(['Evento e2']));
      await waitFor(() =>
        expect(document.activeElement).toBe(
          within(list()).getByRole('heading', { name: 'Todos os eventos' }),
        ),
      );
      expect((await repository.listEvents()).map((e) => e.id)).toEqual(['e2']);
    });

    it('mostra erro acessível se a exclusão falhar', async () => {
      const base = createMemoryStorage();
      store(base, STORAGE_KEYS.events, [ev('e1', '2026-10-01')]);
      renderApp('/agenda', failingOn(STORAGE_KEYS.events, base));
      fireEvent.click(await screen.findByRole('button', { name: 'Excluir evento Evento e1' }));
      fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
      await waitFor(() =>
        expect(
          screen.getByText('Não foi possível excluir o evento. Tente novamente.'),
        ).toBeTruthy(),
      );
      expect(itemTitles(list())).toEqual(['Evento e1']);
    });
  });

  it('mostra erro se não conseguir salvar', async () => {
    renderApp('/agenda', failingOn(STORAGE_KEYS.events));
    fireEvent.change(screen.getByLabelText('Título do evento'), { target: { value: 'Prova' } });
    fireEvent.change(screen.getByLabelText('Data do evento'), { target: { value: '2026-10-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar ao calendário' }));
    expect(await screen.findByText('Não foi possível salvar. Tente novamente.')).toBeTruthy();
  });
});

describe('Agenda › Tarefas', () => {
  const pendingCard = () => screen.getByRole('region', { name: /^Pendentes/ });
  const doneCard = () => screen.queryByRole('region', { name: 'Concluídas' });

  it('mostra estado vazio, sem card de concluídas e sem o botão de organizar', async () => {
    renderApp('/agenda/tarefas');
    expect(await within(pendingCard()).findByText('Nenhuma tarefa pendente.')).toBeTruthy();
    expect(doneCard()).toBeNull();
    expect(screen.queryByRole('button', { name: /Organizar minha semana/ })).toBeNull();
  });

  it('exige título', async () => {
    const { repository } = renderApp('/agenda/tarefas');
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar tarefa' }));
    expect(await screen.findByText('Escreva o que precisa fazer.')).toBeTruthy();
    expect(await repository.listTasks()).toEqual([]);
  });

  it('usa prioridade média como padrão', () => {
    renderApp('/agenda/tarefas');
    expect((screen.getByLabelText('Prioridade') as HTMLSelectElement).value).toBe('média');
  });

  it('cria tarefa com matéria, prazo e prioridade', async () => {
    const { repository } = renderApp('/agenda/tarefas');
    fireEvent.change(screen.getByLabelText('Título da tarefa'), {
      target: { value: 'Ler cap. 4' },
    });
    fireEvent.change(screen.getByLabelText('Matéria (opcional)'), { target: { value: 'Cardio' } });
    fireEvent.change(screen.getByLabelText('Prazo (opcional)'), {
      target: { value: '2026-10-01' },
    });
    fireEvent.change(screen.getByLabelText('Prioridade'), { target: { value: 'alta' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar tarefa' }));

    const item = await within(pendingCard()).findByRole('listitem');
    expect(item.textContent).toContain('Ler cap. 4');
    expect(item.textContent).toContain('Cardio');
    expect(item.textContent).toContain('Prazo: 01 de out. de 2026');
    expect(within(item).getByRole('img', { name: 'Prioridade alta' }).textContent).toBe('🔴');
    expect(within(pendingCard()).getByRole('heading').textContent).toBe('Pendentes (1)');
    expect(document.activeElement).toBe(screen.getByLabelText('Título da tarefa'));
    expect((screen.getByLabelText('Prioridade') as HTMLSelectElement).value).toBe('média');
    expect(await repository.listTasks()).toEqual([
      expect.objectContaining({
        title: 'Ler cap. 4',
        subject: 'Cardio',
        deadline: '2026-10-01',
        priority: 'alta',
        done: false,
      }),
    ]);
  });

  it('lista pendentes da mais recente para a mais antiga', async () => {
    const storage = createMemoryStorage();
    store(storage, STORAGE_KEYS.tasks, [tk('t1', 1), tk('t3', 3), tk('t2', 2)]);
    renderApp('/agenda/tarefas', storage);
    await within(pendingCard()).findAllByRole('listitem');
    expect(itemTitles(pendingCard())).toEqual(['Tarefa t3', 'Tarefa t2', 'Tarefa t1']);
  });

  it('concluir move para Concluídas mantendo o foco; desmarcar devolve', async () => {
    const storage = createMemoryStorage();
    store(storage, STORAGE_KEYS.tasks, [tk('t1', 1), tk('t2', 2)]);
    const { repository } = renderApp('/agenda/tarefas', storage);
    const checkbox = await screen.findByRole('checkbox', { name: 'Tarefa t1' });
    checkbox.focus();
    fireEvent.click(checkbox);

    await waitFor(() => expect(doneCard()).toBeTruthy());
    const moved = within(doneCard()!).getByRole('checkbox', {
      name: 'Tarefa t1',
    }) as HTMLInputElement;
    expect(moved.checked).toBe(true);
    await waitFor(() => expect(document.activeElement).toBe(moved));
    expect(within(doneCard()!).getByText('Tarefa t1').className).toContain('task-done');
    expect(within(pendingCard()).getByRole('heading').textContent).toBe('Pendentes (1)');
    expect((await repository.listTasks()).find((t) => t.id === 't1')?.done).toBe(true);

    fireEvent.click(moved);
    await waitFor(() => expect(doneCard()).toBeNull());
    const back = within(pendingCard()).getByRole('checkbox', { name: 'Tarefa t1' });
    await waitFor(() => expect(document.activeElement).toBe(back));
  });

  it('mostra erro e mantém a tarefa como estava se não conseguir concluir', async () => {
    const base = createMemoryStorage();
    store(base, STORAGE_KEYS.tasks, [tk('t1', 1)]);
    renderApp('/agenda/tarefas', failingOn(STORAGE_KEYS.tasks, base));
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Tarefa t1' }));
    expect(
      await screen.findByText('Não foi possível atualizar a tarefa. Tente novamente.'),
    ).toBeTruthy();
    expect((screen.getByRole('checkbox', { name: 'Tarefa t1' }) as HTMLInputElement).checked).toBe(
      false,
    );
  });

  describe('exclusão', () => {
    it('pede confirmação; cancelar não exclui', async () => {
      const storage = createMemoryStorage();
      store(storage, STORAGE_KEYS.tasks, [tk('t1', 1)]);
      const { repository } = renderApp('/agenda/tarefas', storage);
      fireEvent.click(await screen.findByRole('button', { name: 'Excluir tarefa Tarefa t1' }));
      const dialog = screen.getByRole('alertdialog', { name: 'Excluir tarefa?' });
      expect(dialog.textContent).toContain('Tem certeza que deseja excluir a tarefa "Tarefa t1"?');
      fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
      expect(await repository.listTasks()).toHaveLength(1);
    });

    it('confirmar exclui e leva o foco ao título de Pendentes', async () => {
      const storage = createMemoryStorage();
      store(storage, STORAGE_KEYS.tasks, [tk('t1', 1), tk('t2', 2)]);
      const { repository } = renderApp('/agenda/tarefas', storage);
      fireEvent.click(await screen.findByRole('button', { name: 'Excluir tarefa Tarefa t1' }));
      fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
      await waitFor(() => expect(itemTitles(pendingCard())).toEqual(['Tarefa t2']));
      await waitFor(() =>
        expect(document.activeElement).toBe(within(pendingCard()).getByRole('heading')),
      );
      expect((await repository.listTasks()).map((t) => t.id)).toEqual(['t2']);
    });

    it('excluir uma concluída mantém o foco em Concluídas quando ainda há outras', async () => {
      const storage = createMemoryStorage();
      store(storage, STORAGE_KEYS.tasks, [
        tk('t1', 1, { done: true }),
        tk('t2', 2, { done: true }),
      ]);
      renderApp('/agenda/tarefas', storage);
      fireEvent.click(await screen.findByRole('button', { name: 'Excluir tarefa Tarefa t1' }));
      fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
      await waitFor(() =>
        expect(document.activeElement).toBe(
          within(doneCard()!).getByRole('heading', { name: 'Concluídas' }),
        ),
      );
    });

    it('mostra erro acessível se a exclusão falhar', async () => {
      const base = createMemoryStorage();
      store(base, STORAGE_KEYS.tasks, [tk('t1', 1)]);
      renderApp('/agenda/tarefas', failingOn(STORAGE_KEYS.tasks, base));
      fireEvent.click(await screen.findByRole('button', { name: 'Excluir tarefa Tarefa t1' }));
      fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
      expect(
        await screen.findByText('Não foi possível excluir a tarefa. Tente novamente.'),
      ).toBeTruthy();
      expect(itemTitles(pendingCard())).toEqual(['Tarefa t1']);
    });
  });

  describe('Organizar minha semana com IA', () => {
    const withPending = () => {
      const storage = createMemoryStorage();
      store(storage, STORAGE_KEYS.tasks, [tk('t1', 1)]);
      return storage;
    };

    it('informa que a IA não está disponível, sem simular resultado', async () => {
      const storage = withPending();
      renderApp('/agenda/tarefas', storage);
      fireEvent.click(
        await screen.findByRole('button', { name: 'Organizar minha semana com IA 🧭' }),
      );
      expect(
        await screen.findByText(/ainda não está disponível nesta versão do MedFoco/),
      ).toBeTruthy();
      expect(storage.getItem(STORAGE_KEYS.tasks)).toBe(JSON.stringify([tk('t1', 1)]));
    });

    it('mostra "Organizando..." e desativa o botão enquanto processa', async () => {
      let finish: () => void = () => {};
      const organize = () =>
        new Promise<string>((_, reject) => {
          finish = () => reject(new AiUnavailableError());
        });
      renderTarefas(organize, withPending());
      const button = await screen.findByRole('button', {
        name: 'Organizar minha semana com IA 🧭',
      });
      fireEvent.click(button);
      expect(await screen.findByText('Organizando...')).toBeTruthy();
      expect((button as HTMLButtonElement).disabled).toBe(true);
      await act(async () => finish());
      expect((button as HTMLButtonElement).disabled).toBe(false);
    });

    it('mostra mensagem amigável em caso de erro', async () => {
      renderTarefas(() => Promise.reject(new Error('falha')), withPending());
      fireEvent.click(
        await screen.findByRole('button', { name: 'Organizar minha semana com IA 🧭' }),
      );
      expect(await screen.findByText(/Não consegui organizar a semana agora/)).toBeTruthy();
    });
  });
});

describe('Agenda › Horários', () => {
  it('salva, confirma com "Salvo!" e mantém após recarregar', async () => {
    const storage = createMemoryStorage();
    renderApp('/agenda/horarios', storage);
    const field = await screen.findByLabelText('Horários fixos da semana');
    expect((field as HTMLTextAreaElement).value).toBe('');
    fireEvent.change(field, { target: { value: '  Seg 8h-12h aula  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar horários' }));
    expect(await screen.findByText('Salvo!')).toBeTruthy();

    cleanup();
    renderApp('/agenda/horarios', storage);
    expect(
      ((await screen.findByLabelText('Horários fixos da semana')) as HTMLTextAreaElement).value,
    ).toBe('Seg 8h-12h aula');
  });

  it('mostra erro se não conseguir salvar', async () => {
    renderApp('/agenda/horarios', failingOn(STORAGE_KEYS.schedule));
    fireEvent.change(await screen.findByLabelText('Horários fixos da semana'), {
      target: { value: 'Ter livre' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar horários' }));
    expect(await screen.findByText('Não foi possível salvar. Tente novamente.')).toBeTruthy();
  });
});

describe('Agenda › datas nas viradas de mês e de ano', () => {
  it('ordena e exibe corretamente eventos na virada do ano', async () => {
    const storage = createMemoryStorage();
    store(storage, STORAGE_KEYS.events, [
      ev('e3', '2027-01-01'),
      ev('e1', '2026-11-30'),
      ev('e2', '2026-12-31'),
    ]);
    renderApp('/agenda', storage);
    const items = await within(region('Todos os eventos')).findAllByRole('listitem');
    expect(items.map((li) => li.textContent)).toEqual([
      expect.stringContaining('30 de nov. de 2026'),
      expect.stringContaining('31 de dez. de 2026'),
      expect.stringContaining('01 de jan. de 2027'),
    ]);
  });

  it('evento criado às 23h59 de 31/12 para o mesmo dia conta como próximo no Início', async () => {
    vi.setSystemTime(new Date(2026, 11, 31, 23, 59));
    const { repository } = renderApp('/agenda');
    fireEvent.change(screen.getByLabelText('Título do evento'), { target: { value: 'Réveillon' } });
    fireEvent.change(screen.getByLabelText('Data do evento'), { target: { value: '2026-12-31' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar ao calendário' }));
    expect((await within(region('Todos os eventos')).findByRole('listitem')).textContent).toContain(
      '31 de dez. de 2026',
    );
    expect((await repository.listEvents())[0]?.date).toBe('2026-12-31');

    fireEvent.click(
      within(screen.getByRole('navigation', { name: 'Navegação principal' })).getByRole('link', {
        name: 'Início',
      }),
    );
    await waitFor(() =>
      expect(within(region('Próximos eventos')).getByText('Réveillon')).toBeTruthy(),
    );
  });

  it('logo após a meia-noite, o evento de 31/12 sai do Início mas continua na Agenda', async () => {
    vi.setSystemTime(new Date(2027, 0, 1, 0, 1));
    const storage = createMemoryStorage();
    store(storage, STORAGE_KEYS.events, [ev('e1', '2026-12-31', { title: 'Réveillon' })]);
    renderApp('/', storage);
    expect(
      await within(region('Próximos eventos')).findByText(/Nenhum evento futuro/),
    ).toBeTruthy();

    cleanup();
    renderApp('/agenda', storage);
    expect(await within(region('Todos os eventos')).findByText('Réveillon')).toBeTruthy();
  });
});

describe('Agenda › acessibilidade', () => {
  /** Descrição acessível montada a partir de aria-describedby (texto ou aria-label). */
  const description = (el: HTMLElement) =>
    (el.getAttribute('aria-describedby') ?? '')
      .split(' ')
      .filter(Boolean)
      .map((id) => {
        const target = document.getElementById(id);
        return (target?.getAttribute('aria-label') ?? target?.textContent ?? '').trim();
      })
      .join(' | ');

  it('a caixa da tarefa anuncia matéria, prioridade e prazo', async () => {
    const storage = createMemoryStorage();
    store(storage, STORAGE_KEYS.tasks, [
      tk('t1', 1, { subject: 'Cardio', priority: 'alta', deadline: '2026-10-01' }),
      tk('t2', 2, { priority: 'baixa' }),
    ]);
    renderApp('/agenda/tarefas', storage);
    const full = await screen.findByRole('checkbox', { name: 'Tarefa t1' });
    expect(description(full)).toBe('Matéria: Cardio | Prioridade alta | Prazo: 01 de out. de 2026');
    const plain = screen.getByRole('checkbox', { name: 'Tarefa t2' });
    expect(plain.getAttribute('aria-describedby')).toBeNull();
  });

  it('não mostra "Pendentes (0)" enquanto as tarefas ainda estão carregando', () => {
    const repo = createLocalRepository(createMemoryStorage());
    const router = createMemoryRouter(routes, { initialEntries: ['/agenda/tarefas'] });
    render(
      <App router={router} repository={{ ...repo, listTasks: () => new Promise(() => {}) }} />,
    );
    expect(screen.getByRole('heading', { name: 'Pendentes' })).toBeTruthy();
    expect(screen.queryByText('Nenhuma tarefa pendente.')).toBeNull();
  });

  it('evento: leva o foco ao primeiro campo que falta e o marca como inválido', async () => {
    renderApp('/agenda');
    const title = screen.getByLabelText('Título do evento');
    const date = screen.getByLabelText('Data do evento');
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar ao calendário' }));
    await screen.findByText('Preencha título e data.');
    expect(document.activeElement).toBe(title);
    expect(title.getAttribute('aria-invalid')).toBe('true');
    expect(date.getAttribute('aria-invalid')).toBe('true');
    expect(description(title)).toBe('Preencha título e data.');

    fireEvent.change(title, { target: { value: 'Prova' } });
    expect(title.getAttribute('aria-invalid')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar ao calendário' }));
    await waitFor(() => expect(document.activeElement).toBe(date));
    expect(date.getAttribute('aria-invalid')).toBe('true');
  });

  it('tarefa: leva o foco ao título vazio e o marca como inválido', async () => {
    renderApp('/agenda/tarefas');
    const title = screen.getByLabelText('Título da tarefa');
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar tarefa' }));
    await screen.findByText('Escreva o que precisa fazer.');
    expect(document.activeElement).toBe(title);
    expect(title.getAttribute('aria-invalid')).toBe('true');
    fireEvent.change(title, { target: { value: 'Ler' } });
    expect(title.getAttribute('aria-invalid')).toBeNull();
  });
});

describe('Agenda › dados danificados', () => {
  const damaged = (storage: KeyValueStorage) => {
    store(storage, STORAGE_KEYS.events, [{ id: 'x' }, null, 42, ev('e1', '2026-10-01')]);
    store(storage, STORAGE_KEYS.tasks, [{ id: 'y' }, null, 'lixo', tk('t1', 1)]);
    return storage;
  };

  it('Eventos mostra os itens válidos mesmo com itens danificados salvos', async () => {
    renderApp('/agenda', damaged(createMemoryStorage()));
    await within(region('Todos os eventos')).findByText('Evento e1');
    expect(within(region('Todos os eventos')).getAllByRole('listitem')).toHaveLength(1);
    expect(screen.queryByText('Não foi possível carregar os eventos.')).toBeNull();
  });

  it('Tarefas mostra os itens válidos mesmo com itens danificados salvos', async () => {
    renderApp('/agenda/tarefas', damaged(createMemoryStorage()));
    expect(await screen.findByRole('checkbox', { name: 'Tarefa t1' })).toBeTruthy();
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
  });

  it('Início continua funcionando com itens danificados salvos', async () => {
    renderApp('/', damaged(createMemoryStorage()));
    await waitFor(() =>
      expect(
        within(screen.getByRole('region', { name: 'Resumo do dia' })).getByText('tarefas pendentes')
          .previousElementSibling?.textContent,
      ).toBe('1'),
    );
    expect(within(region('Próximos eventos')).getByText('Evento e1')).toBeTruthy();
  });
});

describe('Integração Agenda → Início', () => {
  const goToInicio = () =>
    fireEvent.click(
      within(screen.getByRole('navigation', { name: 'Navegação principal' })).getByRole('link', {
        name: 'Início',
      }),
    );
  const inicioCounter = (label: string) =>
    within(screen.getByRole('region', { name: 'Resumo do dia' })).getByText(label)
      .previousElementSibling?.textContent;

  it('evento criado na Agenda aparece no Início; excluído na Agenda some do Início', async () => {
    renderApp('/agenda');
    fireEvent.change(screen.getByLabelText('Título do evento'), { target: { value: 'Prova' } });
    fireEvent.change(screen.getByLabelText('Data do evento'), { target: { value: '2026-10-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar ao calendário' }));
    await within(region('Todos os eventos')).findByRole('listitem');

    goToInicio();
    await waitFor(() => expect(inicioCounter('próximos eventos')).toBe('1'));
    expect(within(region('Próximos eventos')).getByText('Prova')).toBeTruthy();

    fireEvent.click(
      within(screen.getByRole('navigation', { name: 'Navegação principal' })).getByRole('link', {
        name: 'Agenda',
      }),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Excluir evento Prova' }));
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    await waitFor(() => expect(within(region('Todos os eventos')).queryByText('Prova')).toBeNull());

    goToInicio();
    await waitFor(() => expect(inicioCounter('próximos eventos')).toBe('0'));
  });

  it('concluir tarefa na Agenda reduz as pendentes do Início', async () => {
    const storage = createMemoryStorage();
    store(storage, STORAGE_KEYS.tasks, [tk('t1', 1), tk('t2', 2)]);
    renderApp('/agenda/tarefas', storage);
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Tarefa t1' }));
    await waitFor(() => expect(screen.getByRole('region', { name: 'Concluídas' })).toBeTruthy());

    goToInicio();
    await waitFor(() => expect(inicioCounter('tarefas pendentes')).toBe('1'));
  });
});
