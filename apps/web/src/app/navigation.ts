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
