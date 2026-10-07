import type {
  AppIdea,
  CalendarEvent,
  Material,
  NotebookEntry,
  Question,
  Task,
} from '../../../data/types';
import { formatShortDate } from '../../../shared/date';
import { foldText } from '../../../shared/text';

/** A busca só começa com este número de letras (como no app original). */
export const MIN_QUERY_LENGTH = 2;
/** Itens mostrados por área; o resto fica na aba da área. */
export const SECTION_LIMIT = 8;
const PREVIEW_LENGTH = 80;

export type SectionKey = 'eventos' | 'materias' | 'tarefas' | 'questoes' | 'ideiasApp' | 'caderno';

export interface SearchData {
  eventos: readonly CalendarEvent[];
  materias: readonly Material[];
  tarefas: readonly Task[];
  questoes: readonly Question[];
  ideiasApp: readonly AppIdea[];
  caderno: readonly NotebookEntry[];
}

export interface SearchItem {
  id: string;
  title: string;
  /** Detalhe pequeno embaixo do título (data, matéria…). */
  meta: string;
}

export interface SearchSection {
  key: SectionKey;
  label: string;
  icon: string;
  /** Aba onde estão todos os itens da área. */
  to: string;
  total: number;
  items: SearchItem[];
}

/** Ordem das áreas na tela, como no app original. */
export const SECTIONS: readonly { key: SectionKey; label: string; icon: string; to: string }[] = [
  { key: 'eventos', label: 'Eventos', icon: '📅', to: '/agenda' },
  { key: 'materias', label: 'Matérias', icon: '📚', to: '/materias' },
  { key: 'tarefas', label: 'Tarefas', icon: '✅', to: '/agenda/tarefas' },
  { key: 'questoes', label: 'Questões', icon: '📝', to: '/questoes' },
  { key: 'ideiasApp', label: 'Ideias do app', icon: '💡', to: '/ideias' },
  { key: 'caderno', label: 'Caderno de ideias', icon: '📓', to: '/ideias/caderno' },
];

/** Quantidade de letras que valem para o mínimo (espaços nas pontas não contam). */
export const queryLength = (query: string) => [...query.trim()].length;

export const isSearchable = (query: string) => queryLength(query) >= MIN_QUERY_LENGTH;

const preview = (text: string) =>
  [...text].length > PREVIEW_LENGTH ? `${[...text].slice(0, PREVIEW_LENGTH).join('')}…` : text;

/** Procura em todas as áreas. Sem acento e sem diferença entre maiúsculas e minúsculas. */
export function searchAll(data: SearchData, query: string): SearchSection[] {
  if (!isSearchable(query)) return [];
  const needle = foldText(query);
  const has = (...fields: string[]) => fields.some((field) => foldText(field).includes(needle));

  const found: Record<SectionKey, SearchItem[]> = {
    eventos: data.eventos
      .filter((e) => has(e.title, e.notes))
      .map((e) => ({ id: e.id, title: e.title, meta: formatShortDate(e.date) })),
    materias: data.materias
      .filter((m) => has(m.title, m.subject, m.notes, m.tags.join(' ')))
      .map((m) => ({ id: m.id, title: m.title, meta: m.subject })),
    tarefas: data.tarefas
      .filter((t) => has(t.title, t.subject))
      .map((t) => ({ id: t.id, title: t.title, meta: t.subject })),
    questoes: data.questoes
      .filter((q) => has(q.question, q.subject, q.topic))
      .map((q) => ({ id: q.id, title: preview(q.question), meta: q.subject })),
    ideiasApp: data.ideiasApp
      .filter((i) => has(i.text))
      .map((i) => ({ id: i.id, title: preview(i.text), meta: '' })),
    caderno: data.caderno
      .filter((n) => has(n.text))
      .map((n) => ({ id: n.id, title: preview(n.text), meta: '' })),
  };

  return SECTIONS.map((section) => ({
    ...section,
    total: found[section.key].length,
    items: found[section.key].slice(0, SECTION_LIMIT),
  })).filter((section) => section.total > 0);
}

export const totalResults = (sections: readonly SearchSection[]) =>
  sections.reduce((sum, section) => sum + section.total, 0);
