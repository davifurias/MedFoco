import { NavLink } from 'react-router';
import { Icon, type IconName } from './Icon';

export interface SubTab {
  to: string;
  label: string;
  icon?: IconName;
}

/** Sub-abas no estilo dos botões ".quick" do app original (ex.: Eventos / Tarefas / Horários). */
export function SubTabs({ tabs, label }: { tabs: readonly SubTab[]; label: string }) {
  return (
    <nav className="quick" aria-label={label}>
      {tabs.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end>
          {tab.icon && <Icon name={tab.icon} />}
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
