import type { IconName } from '../components/Icon';

/**
 * Áreas principais do MedFoco, na mesma ordem e com os mesmos nomes da navegação do app original
 * (VIEWS em legacy/MedFoco.html), com ícones desenhados. Usadas pela barra lateral (computador) e
 * pela barra inferior (celular).
 */
export interface NavArea {
  path: string;
  label: string;
  icon: IconName;
}

export const MAIN_AREAS: readonly NavArea[] = [
  { path: '/', label: 'Início', icon: 'inicio' },
  { path: '/agenda', label: 'Agenda', icon: 'agenda' },
  { path: '/materias', label: 'Matérias', icon: 'materias' },
  { path: '/mapa', label: 'Mapa', icon: 'mapa' },
  { path: '/questoes', label: 'Questões', icon: 'questoes' },
  { path: '/foco', label: 'Foco', icon: 'foco' },
  { path: '/assessora', label: 'Assessora IA', icon: 'assessora' },
  { path: '/ideias', label: 'Ideias', icon: 'ideia' },
];

/** No celular, a barra de baixo mostra só estas 4 áreas; as demais ficam no menu ⋯. */
const MOBILE_TAB_PATHS: readonly string[] = ['/', '/agenda', '/materias', '/foco'];

export const MOBILE_TABS: readonly NavArea[] = MAIN_AREAS.filter((area) =>
  MOBILE_TAB_PATHS.includes(area.path),
);

/** Perfil acadêmico: aparece na barra lateral (computador) e no menu ⋯ (celular). */
export const PROFILE_AREA: NavArea = { path: '/perfil', label: 'Perfil acadêmico', icon: 'perfil' };

/** Busca: no computador fica na barra lateral; no celular, no menu ⋯. */
export const SEARCH_AREA: NavArea = { path: '/busca', label: 'Buscar', icon: 'busca' };

export interface MenuGroup {
  title: string;
  areas: readonly NavArea[];
}

const byPath = (...paths: string[]): NavArea[] =>
  paths.map((path) => MAIN_AREAS.find((area) => area.path === path) as NavArea);

/** O que o menu ⋯ do celular lista: todas as áreas, agrupadas (nenhuma fica de fora). */
export const MENU_GROUPS: readonly MenuGroup[] = [
  { title: 'Principais', areas: byPath('/', '/agenda', '/materias', '/foco') },
  { title: 'Estudar', areas: byPath('/mapa', '/questoes', '/assessora') },
  { title: 'Mais', areas: [...byPath('/ideias'), SEARCH_AREA, PROFILE_AREA] },
];

/** Título grande e legenda do cabeçalho do celular, por tela (prefixo do endereço). */
const PAGE_HEADERS: readonly { path: string; title: string; kicker: string }[] = [
  { path: '/agenda', title: 'Agenda', kicker: 'Eventos, tarefas e horários' },
  { path: '/materias', title: 'Matérias', kicker: 'Seus materiais por matéria' },
  { path: '/mapa', title: 'Mapa', kicker: 'Mapa visual de conexões' },
  { path: '/questoes', title: 'Questões', kicker: 'Pratique e acompanhe' },
  { path: '/foco', title: 'Foco', kicker: 'Um passo de cada vez' },
  { path: '/assessora', title: 'Assessora IA', kicker: 'Sua assessora de estudos' },
  { path: '/ideias', title: 'Ideias', kicker: 'Para o app e para você' },
  { path: '/busca', title: 'Busca', kicker: 'Tudo em um só lugar' },
  { path: '/perfil', title: 'Perfil acadêmico', kicker: 'Só neste aparelho' },
];

export function headerFor(pathname: string): { title: string; kicker: string } {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const found = PAGE_HEADERS.find(
    (header) => normalized === header.path || normalized.startsWith(`${header.path}/`),
  );
  return found ?? { title: 'Início', kicker: 'Seu dia em um só lugar' };
}

/** Nome de cada tela (para o título da aba e o aviso a leitores de tela ao trocar de tela). */
const PAGE_NAMES: Record<string, string> = {
  '/': 'Início',
  '/agenda': 'Agenda · Eventos',
  '/agenda/tarefas': 'Agenda · Tarefas',
  '/agenda/horarios': 'Agenda · Horários',
  '/materias': 'Matérias',
  '/mapa': 'Mapa',
  '/questoes': 'Questões',
  '/foco': 'Foco',
  '/assessora': 'Assessora IA',
  '/ideias': 'Ideias · Ideias do App',
  '/ideias/caderno': 'Ideias · Caderno de Ideias',
  '/busca': 'Busca',
  '/perfil': 'Perfil acadêmico',
};

export const APP_NAME = 'MedFoco';

/** Nome da tela do endereço dado, ou null se não for uma tela conhecida. */
export function pageNameFor(pathname: string): string | null {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return PAGE_NAMES[normalized] ?? null;
}

/** Título da aba do navegador: "Agenda · Eventos · MedFoco". */
export function documentTitleFor(pathname: string): string {
  const name = pageNameFor(pathname);
  return name ? `${name} · ${APP_NAME}` : APP_NAME;
}
