import { DEFAULT_SUBJECT } from '../../../data/normalize';
import type { Material } from '../../../data/types';

export { DEFAULT_SUBJECT };

/** Tamanho máximo das anotações exibidas na lista (como no app original). */
export const NOTES_PREVIEW_LIMIT = 200;

/** "coração, Valvas,, sopro" → ["coração", "valvas", "sopro"] (minúsculas, sem vazios nem repetidos). */
export function parseTags(text: string): string[] {
  const tags = text
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(tags)];
}

export function notesPreview(notes: string): string {
  return notes.length > NOTES_PREVIEW_LIMIT ? `${notes.slice(0, NOTES_PREVIEW_LIMIT)}…` : notes;
}

export interface SubjectGroup {
  subject: string;
  materials: Material[];
}

/** Agrupa por matéria (ordem alfabética em português); dentro do grupo, o mais recente primeiro. */
export function groupBySubject(materials: readonly Material[]): SubjectGroup[] {
  const bySubject = new Map<string, Material[]>();
  for (const material of materials) {
    bySubject.set(material.subject, [...(bySubject.get(material.subject) ?? []), material]);
  }
  return [...bySubject.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
    .map(([subject, list]) => ({
      subject,
      materials: [...list].sort((a, b) => b.createdAt - a.createdAt),
    }));
}
