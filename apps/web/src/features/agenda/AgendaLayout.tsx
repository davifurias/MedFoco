import { Outlet } from 'react-router';
import { SubTabs } from '../../components/SubTabs';

const TABS = [
  { to: '/agenda', label: 'Eventos', icon: 'evento' as const },
  { to: '/agenda/tarefas', label: 'Tarefas', icon: 'tarefa' as const },
  { to: '/agenda/horarios', label: 'Horários', icon: 'horario' as const },
];

export function AgendaLayout() {
  return (
    <>
      <SubTabs tabs={TABS} label="Seções da Agenda" />
      <Outlet />
    </>
  );
}
