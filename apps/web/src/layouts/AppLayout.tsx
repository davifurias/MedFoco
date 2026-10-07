import { Link, NavLink, Outlet } from 'react-router';
import { MAIN_AREAS } from '../app/navigation';
import { RouteAnnouncer } from '../components/RouteAnnouncer';
import { ThemeToggle } from '../components/ThemeToggle';
import './AppLayout.css';

const MAIN_ID = 'conteudo-principal';

export function AppLayout() {
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
        <h1>
          <span aria-hidden="true">🧠</span> MedFoco
        </h1>
        <div className="app-header-actions">
          <ThemeToggle />
          <Link to="/busca" className="icon-button" aria-label="Buscar" title="Buscar">
            <span aria-hidden="true">🔍</span>
          </Link>
        </div>
        <nav className="topnav" aria-label="Navegação principal">
          {MAIN_AREAS.map((area) => (
            <NavLink key={area.path} to={area.path} end={area.path === '/'}>
              <span aria-hidden="true">{area.icon}</span> {area.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main id={MAIN_ID} className="app-main" tabIndex={-1}>
        <Outlet />
      </main>
      <nav className="tabbar" aria-label="Navegação principal (celular)">
        {MAIN_AREAS.map((area) => (
          <NavLink key={area.path} to={area.path} end={area.path === '/'}>
            <span className="ic" aria-hidden="true">
              {area.icon}
            </span>
            {area.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
