import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../app/App';
import {
  STORAGE_KEYS,
  createLocalRepository,
  createMemoryStorage,
  type KeyValueStorage,
} from '../../data/localRepository';
import { routes } from '../../routes/routes';

const beepMock = vi.hoisted(() => vi.fn());
vi.mock('../../shared/beep', () => ({ beep: beepMock }));

const MIN = 60_000;

function renderApp(storage: KeyValueStorage = createMemoryStorage()) {
  const router = createMemoryRouter(routes, { initialEntries: ['/foco'] });
  render(<App router={router} repository={createLocalRepository(storage)} />);
  return { storage, router };
}

const stored = (storage: KeyValueStorage) =>
  JSON.parse(storage.getItem(STORAGE_KEYS.focusSessions) ?? '[]') as Record<string, unknown>[];
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const clock = () => screen.getByRole('timer').textContent;
const title = () => screen.getByRole('heading', { level: 2 }).textContent;

/** Avança o relógio (e os temporizadores) e deixa as gravações assíncronas terminarem. */
async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
  vi.setSystemTime(new Date(2026, 9, 7, 10, 0, 0));
  beepMock.mockClear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Foco — tela inicial', () => {
  it('começa sem sessões e sem criar dados', async () => {
    const { storage } = renderApp();
    expect(screen.getByRole('heading', { name: 'Escolha uma técnica' })).toBeTruthy();
    expect(screen.getByText('0 min de foco')).toBeTruthy();
    expect(screen.getByText('Nenhuma sessão registrada ainda.')).toBeTruthy();
    expect(storage.getItem(STORAGE_KEYS.focusSessions)).toBeNull();
    const options = [...(screen.getByLabelText('Técnica') as HTMLSelectElement).options].map(
      (o) => o.text,
    );
    expect(options).toEqual([
      'Pomodoro (25/5)',
      'Pomodoro longo (50/10)',
      '52/17',
      'Foco curto (15/3)',
      'Personalizado',
    ]);
  });

  it('mostra o histórico salvo (foco e pausa) e soma só o foco de hoje', async () => {
    const storage = createMemoryStorage();
    storage.setItem(
      STORAGE_KEYS.focusSessions,
      JSON.stringify([
        { id: '1', type: 'work', minutes: 25, subject: 'Cardio', date: '2026-10-07', createdAt: 1 },
        { id: '2', type: 'break', minutes: 5, subject: null, date: '2026-10-07', createdAt: 2 },
        { id: '3', type: 'work', minutes: 50, subject: null, date: '2026-10-06', createdAt: 3 },
        null,
      ]),
    );
    renderApp(storage);
    await advance(0);
    expect(screen.getByText('25 min de foco')).toBeTruthy();
    const items = within(screen.getByRole('region', { name: 'Histórico recente' }))
      .getAllByRole('listitem')
      .map((li) => li.textContent);
    expect(items).toEqual([
      '🍅Foco 50 min06 de out. de 2026',
      '☕Pausa 5 min07 de out. de 2026',
      '🍅Foco 25 min · Cardio07 de out. de 2026',
    ]);
  });
});

describe('Foco — timer', () => {
  it('configura, inicia, pausa e continua; o tempo parado não corre', async () => {
    renderApp();
    fireEvent.change(screen.getByLabelText('Matéria (opcional)'), {
      target: { value: '  Cardio ' },
    });
    click('Configurar');
    expect(title()).toBe('🍅 Foco · Cardio');
    expect(clock()).toBe('25:00');
    await advance(5_000);
    expect(clock()).toBe('25:00'); // ainda não iniciou
    click('Iniciar');
    await advance(10_000);
    expect(clock()).toBe('24:50');
    click('Pausar');
    await advance(5 * MIN);
    expect(clock()).toBe('24:50');
    click('Continuar');
    await advance(3_000);
    expect(clock()).toBe('24:47');
  });

  it('ao terminar o foco: bipe, aviso, registro, e passa sozinho para a pausa e depois ao foco', async () => {
    const { storage } = renderApp();
    click('Configurar');
    click('Iniciar');
    await advance(25 * MIN);
    expect(beepMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status').textContent).toContain('Foco concluído! Hora da pausa.');
    expect(title()).toBe('☕ Pausa');
    expect(clock()).toBe('05:00');
    expect(screen.getByText('Ciclos completos hoje: 1')).toBeTruthy();
    expect(stored(storage)).toMatchObject([
      { type: 'work', minutes: 25, subject: null, date: '2026-10-07' },
    ]);

    await advance(5 * MIN);
    expect(screen.getByRole('status').textContent).toContain('Pausa concluída');
    expect(title()).toBe('🍅 Foco');
    expect(clock()).toBe('25:00');
    expect(stored(storage)).toMatchObject([
      { type: 'work', minutes: 25 },
      { type: 'break', minutes: 5 },
    ]);
  });

  it('Encerrar no meio do foco registra os minutos já focados (sem pausas) e volta à tela inicial', async () => {
    const { storage } = renderApp();
    fireEvent.change(screen.getByLabelText('Matéria (opcional)'), { target: { value: 'Neuro' } });
    click('Configurar');
    click('Iniciar');
    await advance(10 * MIN + 30_000);
    click('Pausar');
    await advance(40 * MIN); // pausa do usuário: não conta
    click('Encerrar');
    await advance(0);
    expect(screen.getByRole('status').textContent).toBe(
      'Sessão encerrada. 10 min de foco registrados.',
    );
    expect(stored(storage)).toMatchObject([{ type: 'work', minutes: 10, subject: 'Neuro' }]);
    expect(document.activeElement?.textContent).toBe('Escolha uma técnica');
    expect(screen.getByText('10 min de foco')).toBeTruthy();
  });

  it('Encerrar com menos de 1 minuto, antes de iniciar ou durante a pausa não registra nada', async () => {
    const { storage } = renderApp();
    click('Configurar');
    click('Encerrar');
    expect(screen.getByRole('status').textContent).toBe('Sessão encerrada.');

    click('Configurar');
    click('Iniciar');
    await advance(59_000);
    click('Encerrar');
    expect(storage.getItem(STORAGE_KEYS.focusSessions)).toBeNull();

    click('Configurar');
    click('Iniciar');
    await advance(25 * MIN + 3 * 60_000); // terminou o foco; 3 min de pausa
    expect(title()).toBe('☕ Pausa');
    click('Encerrar');
    expect(stored(storage)).toHaveLength(1); // só o foco completo
    expect(screen.getByText('25 min de foco')).toBeTruthy();
  });

  it('recupera o tempo certo ao voltar de segundo plano (relógio pelo horário real)', async () => {
    const { storage } = renderApp();
    click('Configurar');
    click('Iniciar');
    vi.setSystemTime(new Date(2026, 9, 7, 10, 28, 0)); // 28 min depois, sem nenhum tick no meio
    await advance(500);
    expect(title()).toBe('☕ Pausa');
    expect(clock()).toBe('02:00');
    expect(stored(storage)).toMatchObject([{ type: 'work', minutes: 25 }]);
  });

  it('o timer continua contando ao navegar para outra área e voltar', async () => {
    const { router } = renderApp();
    click('Configurar');
    click('Iniciar');
    await advance(5_000);
    fireEvent.click(screen.getAllByRole('link', { name: 'Início' })[0] as HTMLElement);
    expect(router.state.location.pathname).toBe('/');
    await advance(20_000);
    fireEvent.click(screen.getAllByRole('link', { name: 'Foco' })[0] as HTMLElement);
    expect(clock()).toBe('24:35');
  });

  it('usa o dia local em que a fase terminou, mesmo virando a meia-noite', async () => {
    vi.setSystemTime(new Date(2026, 9, 7, 23, 58, 0));
    const { storage } = renderApp();
    fireEvent.change(screen.getByLabelText('Técnica'), { target: { value: 'custom' } });
    fireEvent.change(screen.getByLabelText('Minutos de foco'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Minutos de pausa'), { target: { value: '5' } });
    click('Configurar');
    click('Iniciar');
    await advance(5 * MIN);
    expect(stored(storage)).toMatchObject([{ type: 'work', minutes: 5, date: '2026-10-08' }]);
  });

  it('avisa, sem perder o timer, quando não consegue registrar a sessão', async () => {
    const base = createMemoryStorage();
    renderApp({
      getItem: (k) => base.getItem(k),
      setItem: (k, v) => {
        if (k === STORAGE_KEYS.focusSessions) throw new Error('cheio');
        base.setItem(k, v);
      },
    });
    click('Configurar');
    click('Iniciar');
    await advance(25 * MIN);
    expect(screen.getByRole('alert').textContent).toBe(
      'Não foi possível registrar a sessão no histórico.',
    );
    expect(title()).toBe('☕ Pausa');
  });
});

describe('Foco — detalhes', () => {
  it('ao recuperar fases de segundo plano, cada sessão leva o dia em que terminou', async () => {
    vi.setSystemTime(new Date(2026, 9, 7, 23, 50, 0));
    const { storage } = renderApp();
    fireEvent.change(screen.getByLabelText('Técnica'), { target: { value: 'custom' } });
    fireEvent.change(screen.getByLabelText('Minutos de foco'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Minutos de pausa'), { target: { value: '5' } });
    click('Configurar');
    click('Iniciar');
    vi.setSystemTime(new Date(2026, 9, 8, 0, 3, 0));
    await advance(500);
    expect(stored(storage)).toMatchObject([
      { type: 'work', date: '2026-10-07' },
      { type: 'break', date: '2026-10-08' },
    ]);
  });

  it('o aviso da sessão anterior some ao configurar um novo timer', async () => {
    renderApp();
    click('Configurar');
    click('Encerrar');
    expect(screen.getByRole('status').textContent).toBe('Sessão encerrada.');
    click('Configurar');
    expect(screen.getByRole('status').textContent).toBe('');
  });
});

describe('Foco — técnica personalizada', () => {
  const custom = (work: string, brk: string) => {
    fireEvent.change(screen.getByLabelText('Técnica'), { target: { value: 'custom' } });
    fireEvent.change(screen.getByLabelText('Minutos de foco'), { target: { value: work } });
    fireEvent.change(screen.getByLabelText('Minutos de pausa'), { target: { value: brk } });
    click('Configurar');
  };

  it('usa os minutos informados', () => {
    renderApp();
    custom('30', '10');
    expect(clock()).toBe('30:00');
  });

  it.each([
    ['0', '5', 'Minutos de foco'],
    ['181', '5', 'Minutos de foco'],
    ['', '5', 'Minutos de foco'],
    ['25', '0', 'Minutos de pausa'],
    ['25', '61', 'Minutos de pausa'],
  ])(
    'com foco "%s" e pausa "%s": avisa e leva o foco ao campo, sem iniciar',
    (work, brk, label) => {
      renderApp();
      custom(work, brk);
      expect(screen.getByRole('alert').textContent).toContain(label);
      expect(document.activeElement).toBe(screen.getByLabelText(label));
      expect(screen.getByLabelText(label).getAttribute('aria-invalid')).toBe('true');
      expect(screen.queryByRole('timer')).toBeNull();
    },
  );

  it('usa cada técnica pronta com seus minutos', () => {
    renderApp();
    for (const [key, work] of [
      ['pomodoro_longo', '50:00'],
      ['cinquenta_dezessete', '52:00'],
      ['curto', '15:00'],
    ]) {
      fireEvent.change(screen.getByLabelText('Técnica'), { target: { value: key } });
      click('Configurar');
      expect(clock()).toBe(work);
      click('Encerrar');
    }
  });
});
