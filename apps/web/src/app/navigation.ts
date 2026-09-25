/**
 * Áreas principais do MedFoco, na mesma ordem, com os mesmos nomes e ícones da navegação do app
 * original (VIEWS em legacy/MedFoco.html). Usadas pela barra superior (computador) e pela barra
 * inferior (celular).
 */
export interface NavArea {
  path: string;
  label: string;
  icon: string;
}

export const MAIN_AREAS: readonly NavArea[] = [
  { path: '/', label: 'Início', icon: '🏠' },
  { path: '/agenda', label: 'Agenda', icon: '📅' },
  { path: '/materias', label: 'Matérias', icon: '📚' },
  { path: '/mapa', label: 'Mapa', icon: '🕸️' },
  { path: '/questoes', label: 'Questões', icon: '📝' },
  { path: '/foco', label: 'Foco', icon: '🍅' },
  { path: '/assessora', label: 'Assessora IA', icon: '💬' },
  { path: '/ideias', label: 'Ideias', icon: '💡' },
];
