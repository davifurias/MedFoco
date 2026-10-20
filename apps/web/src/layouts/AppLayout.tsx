import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { MAIN_AREAS, MOBILE_TABS, MORE_PATH, isInMore } from '../app/navigation';
import { Icon } from '../components/Icon';
import { RouteAnnouncer } from '../components/RouteAnnouncer';
import { ThemeToggle } from '../components/ThemeToggle';
import './AppLayout.css';

const MAIN_ID = 'conteudo-principal';

/**
 * No computador, o cabeçalho é a barra lateral (marca, áreas e, no rodapé, Perfil, Buscar e Tema);
 * no celular, é uma barra fina no topo e a barra de baixo traz 4 áreas + "Mais". Os controles existem uma
 * só vez: o CSS muda de lugar, nunca duplica.
 */
export function AppLayout() {
  const { pathname } = useLocation();
  const inMore = isInMore(pathname);
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
        {/* "Mais" fica ativo na própria página e nas telas listadas nela (Mapa, Questões…). */}
        <Link
          to={MORE_PATH}
          className={inMore ? 'active' : undefined}
          aria-current={pathname === MORE_PATH ? 'page' : inMore ? 'true' : undefined}
        >
          <Icon name="mais" />
          Mais
        </Link>
      </nav>
    </div>
  );
}
