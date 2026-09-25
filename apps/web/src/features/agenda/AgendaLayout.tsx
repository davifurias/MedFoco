import { Outlet } from 'react-router';
import { SubTabs } from '../../components/SubTabs';

const TABS = [
  { to: '/agenda', label: '📅 Eventos' },
  { to: '/agenda/tarefas', label: '✅ Tarefas' },
  { to: '/agenda/horarios', label: '🕒 Horários' },
];

export function AgendaLayout() {
  return (
    <>
      <SubTabs tabs={TABS} label="Seções da Agenda" />
      <Outlet />
    </>
  );
}
