import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { StrictMode } from 'react';
import { createMemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLocalRepository, createMemoryStorage } from '../data/localRepository';
import { routes } from '../routes/routes';
import { App } from './App';
import { MAIN_AREAS, MOBILE_TABS } from './navigation';

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
  'Adicionar material': 'Matérias',
  'Seus horários fixos da semana': 'Horários',
  Praticar: 'Banco de questões',
  'Escolha uma técnica': 'Foco',
  'Aula guiada': 'Assessora IA',
  'Espaço de ideias para o MedFoco': 'Ideias do App',
  'Caderno de ideias soltas': 'Caderno de ideias',
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
  it('mostra as 8 áreas do app original, na mesma ordem, na barra do computador; no celular, 4 áreas + Mais', () => {
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
    const desktopLinks = within(desktopNav()).getAllByRole('link');
    expect(
      expected.map((label) => within(desktopNav()).getByRole('link', { name: label })),
    ).toEqual(desktopLinks);
    const mobileLabels = within(mobileNav())
      .getAllByRole('link')
      .map((link) => link.textContent);
    expect(mobileLabels).toEqual(['Início', 'Agenda', 'Matérias', 'Foco', 'Mais']);
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
    'navega para %s pela barra do computador e pelo celular (direto ou pela página Mais)',
    (label, path) => {
      const router = renderApp(path === '/' ? '/foco' : '/');
      fireEvent.click(within(desktopNav()).getByRole('link', { name: label }));
      expect(router.state.location.pathname).toBe(path);
      expect(pageTitle()).toBe(expectedTitles[path]);
      expect(
        within(desktopNav()).getByRole('link', { name: label }).getAttribute('aria-current'),
      ).toBe('page');
      // Celular: volta ao começo e chega à mesma tela pela barra de baixo.
      cleanup();
      const mobileRouter = renderApp(path === '/' ? '/foco' : '/');
      const onTabBar = MOBILE_TABS.some((tab) => tab.path === path);
      if (!onTabBar) {
        fireEvent.click(within(mobileNav()).getByRole('link', { name: 'Mais' }));
        expect(mobileRouter.state.location.pathname).toBe('/mais');
        fireEvent.click(within(screen.getByRole('main')).getByRole('link', { name: label }));
      } else {
        fireEvent.click(within(mobileNav()).getByRole('link', { name: label }));
      }
      expect(mobileRouter.state.location.pathname).toBe(path);
      expect(pageTitle()).toBe(expectedTitles[path]);
    },
  );

  describe('página Mais (celular)', () => {
    it('lista Mapa, Questões, Assessora IA, Ideias e Perfil, cada um com o seu endereço', () => {
      renderApp('/mais');
      const links = within(screen.getByRole('main')).getAllByRole('link');
      expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
        ['Mapa', '/mapa'],
        ['Questões', '/questoes'],
        ['Assessora IA', '/assessora'],
        ['Ideias', '/ideias'],
        ['Perfil', '/perfil'],
      ]);
      expect(document.title).toBe('Mais · MedFoco');
    });

    it('o botão Mais fica ativo na própria página e nas telas listadas nela, e só nelas', () => {
      const mais = () => within(mobileNav()).getByRole('link', { name: 'Mais' });
      renderApp('/mais');
      expect(mais().getAttribute('aria-current')).toBe('page');
      cleanup();
      for (const path of ['/mapa', '/questoes', '/assessora', '/ideias/caderno', '/perfil']) {
        renderApp(path);
        expect(mais().getAttribute('aria-current'), path).toBe('true');
        expect(mais().classList.contains('active'), path).toBe(true);
        cleanup();
      }
      for (const path of ['/', '/agenda/tarefas', '/materias', '/foco', '/busca']) {
        renderApp(path);
        expect(mais().getAttribute('aria-current'), path).toBeNull();
        expect(mais().classList.contains('active'), path).toBe(false);
        cleanup();
      }
    });
  });

  it('Perfil, Buscar e Tema existem uma só vez, fora das duas listas de áreas', () => {
    renderApp();
    const perfil = screen.getAllByRole('link', { name: 'Perfil' });
    expect(perfil).toHaveLength(1);
    expect(perfil[0]?.getAttribute('href')).toBe('/perfil');
    expect(screen.getAllByRole('link', { name: 'Buscar' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /^Mudar para o tema/ })).toHaveLength(1);
    for (const nav of [desktopNav(), mobileNav()]) {
      expect(within(nav).queryByRole('link', { name: 'Perfil' })).toBeNull();
      expect(within(nav).queryByRole('link', { name: 'Buscar' })).toBeNull();
    }
  });

  it('o rótulo visível do tema está contido no nome acessível do botão', () => {
    renderApp();
    const button = screen.getByRole('button', { name: /^Mudar para o tema/ });
    const visible = button.querySelector('.rotulo')?.textContent ?? '';
    expect(visible).toMatch(/^Tema (claro|escuro)$/);
    expect(button.getAttribute('aria-label')?.toLowerCase()).toContain(visible.toLowerCase());
  });

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

describe('Navegação por teclado e leitor de tela', () => {
  const announcer = () => document.querySelector('.app > [aria-live]') as HTMLElement;

  it('o título da aba muda a cada tela, sem anunciar a tela da primeira abertura', () => {
    const router = renderApp();
    expect(document.title).toBe('Início · MedFoco');
    expect(announcer().textContent).toBe('');
    fireEvent.click(within(desktopNav()).getByRole('link', { name: 'Agenda' }));
    expect(router.state.location.pathname).toBe('/agenda');
    expect(document.title).toBe('Agenda · Eventos · MedFoco');
    expect(announcer().textContent).toBe('Agenda · Eventos');
    fireEvent.click(within(mobileNav()).getByRole('link', { name: 'Matérias' }));
    expect(document.title).toBe('Matérias · MedFoco');
    expect(announcer().textContent).toBe('Matérias');
  });

  it('as sub-abas e as telas fora da barra também têm nome', () => {
    renderApp('/agenda');
    const tabs = screen.getByRole('navigation', { name: 'Seções da Agenda' });
    fireEvent.click(within(tabs).getByRole('link', { name: /Tarefas/ }));
    expect(document.title).toBe('Agenda · Tarefas · MedFoco');
    expect(announcer().textContent).toBe('Agenda · Tarefas');
    fireEvent.click(screen.getByRole('link', { name: 'Buscar' }));
    expect(document.title).toBe('Busca · MedFoco');
  });

  it('o aviso não rouba o foco do teclado', () => {
    renderApp();
    const link = within(desktopNav()).getByRole('link', { name: 'Foco' });
    link.focus();
    fireEvent.click(link);
    expect(document.activeElement).toBe(link);
  });

  it('"Pular para o conteúdo" é o primeiro item e leva o foco ao conteúdo, sem mudar o endereço', () => {
    const router = renderApp('/agenda');
    const skip = document.querySelector('.app')?.firstElementChild as HTMLAnchorElement;
    expect(skip.textContent).toBe('Pular para o conteúdo');
    fireEvent.click(skip);
    expect(document.activeElement).toBe(screen.getByRole('main'));
    expect(router.state.location.pathname).toBe('/agenda');
    expect(router.state.location.hash).toBe('');
  });
});
