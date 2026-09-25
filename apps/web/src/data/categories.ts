import type { EventCategory } from './types';

/** Categorias de evento do app original, na mesma ordem e com os mesmos nomes. */
export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  trabalho: 'Trabalho',
  provas: 'Provas',
  ferias: 'Férias',
  aulas: 'Aulas',
  outro: 'Outro',
};
