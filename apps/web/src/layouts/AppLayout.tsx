import { Link, NavLink, Outlet } from 'react-router';
import { MAIN_AREAS } from '../app/navigation';
import './AppLayout.css';

export function AppLayout() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <span aria-hidden="true">🧠</span> MedFoco
        </h1>
        <div className="app-header-actions">
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
      <main className="app-main">
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
