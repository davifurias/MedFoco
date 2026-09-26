import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { StrictMode } from 'react';
import { createMemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLocalRepository, createMemoryStorage } from '../data/localRepository';
import { routes } from '../routes/routes';
import { App } from './App';
import { MAIN_AREAS } from './navigation';

function renderApp(path = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<App router={router} repository={createLocalRepository(createMemoryStorage())} />);
  return router;
}

const desktopNav = () => screen.getByRole('navigation', { name: 'Navegação principal' });
const mobileNav = () => screen.getByRole('navigation', { name: 'Navegação principal (celular)' });
/** Páginas já reconstruídas, reconhecidas por um cartão característico (têm vários títulos). */
const PAGE_BY_REGION: Record<string, string> = {
  'Resumo do dia': 'Início',
  'Novo evento': 'Eventos',
  'Nova tarefa': 'Tarefas',
  'Seus horários fixos da semana': 'Horários',
};

/** Título da página atual. */
const pageTitle = () => {
  for (const [region, page] of Object.entries(PAGE_BY_REGION)) {
    if (screen.queryByRole('region', { name: region })) return page;
  }
  return screen.getByRole('heading', { level: 2 }).textContent;
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('App', () => {
  it('inicializa no Início exibindo o nome do aplicativo', () => {
    renderApp();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('MedFoco');
    expect(screen.getByRole('main')).toBeTruthy();
    expect(pageTitle()).toBe('Início');
  });

  it('inicializa em StrictMode sem erros no console', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <StrictMode>
        <App
          router={createMemoryRouter(routes)}
          repository={createLocalRepository(createMemoryStorage())}
        />
      </StrictMode>,
    );
    expect(consoleError).not.toHaveBeenCalled();
  });
});

describe('Navegação principal', () => {
  it('mostra as 8 áreas do app original, na mesma ordem, no computador e no celular', () => {
    renderApp();
    const expected = MAIN_AREAS.map((area) => area.label);
    expect(expected).toEqual([
      'Início',
      'Agenda',
      'Matérias',
      'Mapa',
      'Questões',
      'Foco',
      'Assessora IA',
      'Ideias',
    ]);
    for (const nav of [desktopNav(), mobileNav()]) {
      const links = within(nav).getAllByRole('link');
      const inOrder = expected.map((label) => within(nav).getByRole('link', { name: label }));
      expect(inOrder).toEqual(links);
    }
  });

  const expectedTitles: Record<string, string> = {
    '/': 'Início',
    '/agenda': 'Eventos',
    '/materias': 'Matérias',
    '/mapa': 'Mapa visual de conexões',
    '/questoes': 'Banco de questões',
    '/foco': 'Foco',
    '/assessora': 'Assessora IA',
    '/ideias': 'Ideias do App',
  };

  it.each(MAIN_AREAS.map((area) => [area.label, area.path]))(
    'navega para %s pela barra do computador e pela do celular',
    (label, path) => {
      const router = renderApp(path === '/' ? '/foco' : '/');
      for (const nav of [desktopNav, mobileNav]) {
        fireEvent.click(within(nav()).getByRole('link', { name: label }));
        expect(router.state.location.pathname).toBe(path);
        expect(pageTitle()).toBe(expectedTitles[path]);
        expect(within(nav()).getByRole('link', { name: label }).getAttribute('aria-current')).toBe(
          'page',
        );
      }
    },
  );

  it('abre a Busca pelo botão do cabeçalho', () => {
    const router = renderApp();
    fireEvent.click(screen.getByRole('link', { name: 'Buscar' }));
    expect(router.state.location.pathname).toBe('/busca');
    expect(pageTitle()).toBe('Busca global');
  });

  it('vai do Início para o Perfil acadêmico e volta', () => {
    const router = renderApp();
    fireEvent.click(screen.getByRole('link', { name: /Editar perfil acadêmico/ }));
    expect(router.state.location.pathname).toBe('/perfil');
    expect(pageTitle()).toBe('Perfil acadêmico');
    fireEvent.click(screen.getByRole('link', { name: /Voltar ao início/ }));
    expect(router.state.location.pathname).toBe('/');
  });

  it('volta para o Início quando o endereço não existe', () => {
    const router = renderApp('/pagina-que-nao-existe');
    expect(router.state.location.pathname).toBe('/');
    expect(pageTitle()).toBe('Início');
  });
});

describe('Sub-abas', () => {
  it('Agenda alterna entre Eventos, Tarefas e Horários', () => {
    const router = renderApp('/agenda');
    const tabs = () => screen.getByRole('navigation', { name: 'Seções da Agenda' });
    expect(pageTitle()).toBe('Eventos');
    fireEvent.click(within(tabs()).getByRole('link', { name: /Tarefas/ }));
    expect(router.state.location.pathname).toBe('/agenda/tarefas');
    expect(pageTitle()).toBe('Tarefas');
    fireEvent.click(within(tabs()).getByRole('link', { name: /Horários/ }));
    expect(pageTitle()).toBe('Horários');
    // A área Agenda continua marcada como ativa na navegação principal.
    expect(
      within(desktopNav()).getByRole('link', { name: 'Agenda' }).getAttribute('aria-current'),
    ).toBe('page');
  });

  it('Ideias alterna entre Ideias do App e Caderno de Ideias', () => {
    const router = renderApp('/ideias');
    const tabs = () => screen.getByRole('navigation', { name: 'Seções de Ideias' });
    fireEvent.click(within(tabs()).getByRole('link', { name: /Caderno de Ideias/ }));
    expect(router.state.location.pathname).toBe('/ideias/caderno');
    expect(pageTitle()).toBe('Caderno de ideias');
    fireEvent.click(within(tabs()).getByRole('link', { name: /Ideias do App/ }));
    expect(pageTitle()).toBe('Ideias do App');
  });

  it('abre diretamente pelo endereço de uma sub-aba', () => {
    renderApp('/agenda/horarios');
    expect(pageTitle()).toBe('Horários');
  });
});
