/**
 * Integração entre as áreas: cada teste usa o app como o usuário (cria numa tela, vai para outra
 * pelo roteador e confere), com o mesmo repositório e o timer do Foco acima das telas.
 */
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './app/App';
import { createLocalRepository, createMemoryStorage } from './data/localRepository';
import { routes } from './routes/routes';

vi.mock('./shared/beep', () => ({ beep: () => {} }));

function setup(path = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<App router={router} repository={createLocalRepository(createMemoryStorage())} />);
  return router;
}
type Router = ReturnType<typeof setup>;

const go = (router: Router, path: string) =>
  act(async () => {
    await router.navigate(path);
  });
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const label = (name: string | RegExp) => screen.findByLabelText(name);
const fill = async (name: string | RegExp, value: string) =>
  fireEvent.change(await label(name), { target: { value } });
const resumo = async () =>
  (await screen.findByRole('region', { name: 'Resumo do dia' })).textContent;
const flush = () => act(async () => {});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
  vi.setSystemTime(new Date(2026, 9, 7, 10, 0));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Integração entre as áreas', () => {
  it('Foco → Início: minutos de foco de hoje, sem pausas, mesmo ao terminar com o Início aberto', async () => {
    const router = setup('/foco');
    click('Configurar');
    click('Iniciar');
    await go(router, '/');
    expect(await resumo()).toContain('0min estudados hoje');
    await act(async () => {
      vi.advanceTimersByTime(25 * 60_000);
    });
    expect(await resumo()).toContain('25min estudados hoje');
    await act(async () => {
      vi.advanceTimersByTime(5 * 60_000); // a pausa de 5 min não conta
    });
    expect(await resumo()).toContain('25min estudados hoje');
  });

  it('Foco encerrado antes de abrir o Início também aparece', async () => {
    const router = setup('/foco');
    click('Configurar');
    click('Iniciar');
    await act(async () => {
      vi.advanceTimersByTime(10 * 60_000 + 20_000);
    });
    click('Encerrar');
    await flush();
    await go(router, '/');
    expect(await resumo()).toContain('10min estudados hoje');
  });

  it('Tarefas → Início: tarefa criada na Agenda entra na contagem e, concluída, sai', async () => {
    const router = setup('/agenda/tarefas');
    await fill('Título da tarefa', 'Ler cap 4');
    click('Adicionar tarefa');
    await screen.findByText('Ler cap 4');
    await go(router, '/');
    expect(await resumo()).toContain('1tarefas pendentes');
    await go(router, '/agenda/tarefas');
    fireEvent.click(await screen.findByRole('checkbox', { name: /Ler cap 4/ }));
    await flush();
    await go(router, '/');
    expect(await resumo()).toContain('0tarefas pendentes');
  });

  it('Tarefa criada pelo Início aparece na Agenda', async () => {
    const router = setup('/');
    fireEvent.click(await screen.findByRole('button', { name: /Tarefa/ }));
    await fill('Título da tarefa', 'Tarefa rápida');
    click('Adicionar tarefa');
    await flush();
    await go(router, '/agenda/tarefas');
    expect(await screen.findByText('Tarefa rápida')).toBeTruthy();
  });

  it('Agenda ↔ Início: evento criado na Agenda entra no contador; excluído no Início some da Agenda', async () => {
    const router = setup('/agenda');
    await fill('Título do evento', 'Prova');
    await fill('Data do evento', '2026-12-01');
    click('Adicionar ao calendário');
    await screen.findAllByText('Prova');
    await go(router, '/');
    expect(await resumo()).toContain('1próximos eventos');
    click(/Excluir evento/);
    click('Excluir');
    await waitFor(() => expect(screen.queryAllByText('Prova')).toHaveLength(0));
    await go(router, '/agenda');
    await label('Título do evento');
    expect(screen.queryAllByText('Prova')).toHaveLength(0);
  });

  it('Ideia rápida do Início → Caderno (e não o mural "Ideias do App")', async () => {
    const router = setup('/');
    fireEvent.click(await screen.findByRole('button', { name: /Ideia/ }));
    await fill('Ideia para o caderno', 'Ideia rápida');
    click('Guardar no caderno');
    await flush();
    await go(router, '/ideias/caderno');
    expect(await screen.findByText('Ideia rápida')).toBeTruthy();
    await go(router, '/ideias');
    expect(await screen.findByText('Nenhuma ideia salva ainda.')).toBeTruthy();
  });

  it('Matérias → Mapa, Busca e Assessora; excluir some de todos', async () => {
    const router = setup('/materias');
    await fill(/Matéria/, 'Cardio');
    await fill('Título do material', 'Aula 1');
    await fill('Anotações', 'resumo da aula');
    await fill('Assuntos-chave', 'coração');
    click('Salvar material');
    await screen.findByText('Material salvo!');

    await go(router, '/mapa');
    expect(await screen.findByRole('button', { name: 'Aula 1, Cardio' })).toBeTruthy();

    await go(router, '/busca?q=coracao');
    const matérias = await screen.findByRole('region', { name: /^Matérias \(/ });
    expect(within(matérias).getByText('Aula 1')).toBeTruthy();

    await go(router, '/assessora');
    expect(await screen.findByRole('option', { name: 'Cardio — Aula 1' })).toBeTruthy();

    await go(router, '/materias');
    click(/Excluir material Aula 1/);
    click('Excluir');
    await waitFor(() => expect(screen.queryByText('Aula 1')).toBeNull());
    await go(router, '/mapa');
    expect(await screen.findByText(/Adicione materiais/)).toBeTruthy();
    await go(router, '/busca?q=coracao');
    expect(await screen.findByText('Nada encontrado.')).toBeTruthy();
    await go(router, '/assessora');
    await label('Mensagem para a assessora');
    expect(screen.queryByRole('option', { name: 'Cardio — Aula 1' })).toBeNull();
  });

  it('Questões → Busca, e a prática alimenta o desempenho', async () => {
    const router = setup('/questoes');
    await fill('Matéria', 'Neuro');
    await fill('Enunciado da questão', 'Qual nervo?');
    for (const letter of ['A', 'B', 'C', 'D'])
      await fill(`Alternativa ${letter}`, `Opção ${letter}`);
    click('Salvar questão');
    await screen.findByText('Questão salva!');

    await go(router, '/busca?q=nervo');
    expect(await screen.findByRole('region', { name: /^Questões \(/ })).toBeTruthy();

    await go(router, '/questoes');
    click(/Começar prática/);
    click(/Opção A/);
    await flush();
    click('Ver resultado');
    click('Voltar');
    expect((await screen.findByRole('region', { name: 'Seu desempenho' })).textContent).toContain(
      '100%',
    );
  });

  it('Ideias do App → Busca; Caderno → Busca, cada um na sua área', async () => {
    const router = setup('/ideias');
    await fill('Ideia para o MedFoco', 'Mural: avisar por e-mail');
    click('Salvar ideia');
    await screen.findByText('Ideia salva!');
    await go(router, '/ideias/caderno');
    await fill('Ideia solta', 'Caderno: estudar ECG');
    click('Adicionar');
    await screen.findByText('Ideia salva!');
    await go(router, '/busca?q=avisar');
    expect(await screen.findByRole('region', { name: /^Ideias do app \(1\)/ })).toBeTruthy();
    await go(router, '/busca?q=ecg');
    expect(await screen.findByRole('region', { name: /^Caderno de ideias \(1\)/ })).toBeTruthy();
  });

  it('O horário e o perfil salvos continuam ao navegar entre as áreas', async () => {
    const router = setup('/perfil');
    await fill('Período', '4º período');
    click('Salvar perfil');
    await screen.findByText('Salvo!');
    await go(router, '/agenda/horarios');
    await fill('Horários fixos da semana', 'Seg 8h aula');
    click('Salvar horários');
    await screen.findByText('Salvo!');
    await go(router, '/');
    await go(router, '/perfil');
    expect(((await label('Período')) as HTMLInputElement).value).toBe('4º período');
    await go(router, '/agenda/horarios');
    expect(((await label('Horários fixos da semana')) as HTMLTextAreaElement).value).toBe(
      'Seg 8h aula',
    );
  });
});
