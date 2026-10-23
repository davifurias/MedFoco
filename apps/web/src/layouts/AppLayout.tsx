import { useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { MAIN_AREAS, MOBILE_TABS, headerFor } from '../app/navigation';
import { Icon } from '../components/Icon';
import { RouteAnnouncer } from '../components/RouteAnnouncer';
import { ThemeToggle } from '../components/ThemeToggle';
import { MenuCelular } from './MenuCelular';
import './AppLayout.css';

const MAIN_ID = 'conteudo-principal';

/**
 * No computador, o cabeçalho é a barra lateral (marca, áreas e, no rodapé, Perfil, Buscar e Tema);
 * no celular, o topo mostra o título da tela com o botão ⋯ (menu com todas as áreas) e a barra de
 * baixo traz as 4 áreas principais. Perfil, Buscar e Tema existem uma só vez fora do menu: o CSS
 * muda de lugar, nunca duplica.
 */
export function AppLayout() {
  const { pathname } = useLocation();
  const { title, kicker } = headerFor(pathname);
  // O menu guarda a tela em que foi aberto: trocar de tela o fecha, sem efeito nem estado extra.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const menuOpen = openAt === pathname;
  const menuButton = useRef<HTMLButtonElement>(null);

  function closeMenu() {
    setOpenAt(null);
    menuButton.current?.focus();
  }

  return (
    <div className="app">
      <a
        href={`#${MAIN_ID}`}
        className="skip-link"
        onClick={(e) => {
          // Sem mudar o endereço: leva o foco ao conteúdo principal.
          e.preventDefault();
          document.getElementById(MAIN_ID)?.focus();
        }}
      >
        Pular para o conteúdo
      </a>
      <RouteAnnouncer />
      <header className="app-header">
        <h1 className="brand">
          <span className="brand-mark">
            <Icon name="marca" />
          </span>
          MedFoco
        </h1>
        <nav className="topnav" aria-label="Navegação principal">
          {MAIN_AREAS.map((area) => (
            <NavLink key={area.path} to={area.path} end={area.path === '/'}>
              <Icon name={area.icon} />
              {area.label}
            </NavLink>
          ))}
        </nav>
        <div className="app-header-actions">
          <Link to="/perfil" className="icon-button perfil-link">
            <Icon name="perfil" />
            <span className="rotulo">Perfil</span>
          </Link>
          <Link to="/busca" className="icon-button" aria-label="Buscar" title="Buscar">
            <Icon name="busca" />
            <span className="rotulo">Buscar</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <div
        className="page-head"
        role="region"
        aria-label="Menu da tela"
        aria-hidden={menuOpen ? true : undefined}
      >
        {/* O nome da tela já chega a leitores de tela pelo título da aba e pelo aviso ao trocar de tela. */}
        <div className="page-head-text" aria-hidden="true">
          <div className="page-kicker">{kicker}</div>
          <div className="page-title">{title}</div>
        </div>
        <button
          ref={menuButton}
          type="button"
          className="menu-botao"
          aria-label="Abrir menu"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          onClick={() => setOpenAt(pathname)}
        >
          <Icon name="mais" />
        </button>
      </div>
      {menuOpen && (
        <MenuCelular onClose={closeMenu} onNavigate={() => setOpenAt(null)} pathname={pathname} />
      )}
      <main id={MAIN_ID} className="app-main" tabIndex={-1}>
        <Outlet />
      </main>
      <nav className="tabbar" aria-label="Navegação principal (celular)">
        {MOBILE_TABS.map((area) => (
          <NavLink key={area.path} to={area.path} end={area.path === '/'}>
            <Icon name={area.icon} />
            {area.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
