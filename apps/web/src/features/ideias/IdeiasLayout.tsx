import { Outlet } from 'react-router';
import { SubTabs } from '../../components/SubTabs';

// No app original, o Caderno de Ideias é uma sub-aba da área Ideias.
const TABS = [
  { to: '/ideias', label: '💡 Ideias do App' },
  { to: '/ideias/caderno', label: '📓 Caderno de Ideias' },
];

export function IdeiasLayout() {
  return (
    <>
      <SubTabs tabs={TABS} label="Seções de Ideias" />
      <Outlet />
    </>
  );
}
