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

/** No celular, a barra de baixo mostra só estas 4 áreas; as demais ficam na página "Mais". */
const MOBILE_TAB_PATHS: readonly string[] = ['/', '/agenda', '/materias', '/foco'];

export const MOBILE_TABS: readonly NavArea[] = MAIN_AREAS.filter((area) =>
  MOBILE_TAB_PATHS.includes(area.path),
);

/** Perfil acadêmico: aparece na barra lateral (computador) e na página "Mais" (celular). */
export const PROFILE_AREA: NavArea = { path: '/perfil', label: 'Perfil', icon: 'perfil' };

/** O que a página "Mais" lista: as áreas que não estão na barra de baixo, mais o Perfil. */
export const MORE_AREAS: readonly NavArea[] = [
  ...MAIN_AREAS.filter((area) => !MOBILE_TAB_PATHS.includes(area.path)),
  PROFILE_AREA,
];

/** Endereço da página "Mais". */
export const MORE_PATH = '/mais';

/** Verdadeiro se o endereço é a página "Mais" ou uma das telas listadas nela (o botão "Mais" fica ativo). */
export function isInMore(pathname: string): boolean {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return [MORE_PATH, ...MORE_AREAS.map((area) => area.path)].some(
    (path) => normalized === path || normalized.startsWith(`${path}/`),
  );
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
  '/mais': 'Mais',
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
