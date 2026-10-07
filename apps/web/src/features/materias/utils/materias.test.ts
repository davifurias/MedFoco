import { describe, expect, it } from 'vitest';
import type { Material } from '../../../data/types';
import { NOTES_PREVIEW_LIMIT, groupBySubject, notesPreview, parseTags } from './materias';

const material = (id: string, subject: string, createdAt: number): Material => ({
  id,
  subject,
  title: id,
  notes: '',
  tags: [],
  type: 'nota',
  videoLink: '',
  createdAt,
});

describe('parseTags', () => {
  it('separa por vírgula, remove espaços e vazios e usa minúsculas', () => {
    expect(parseTags('Coração, VALVAS,, sopro ,  ')).toEqual(['coração', 'valvas', 'sopro']);
  });
  it('remove repetidos e aceita texto vazio', () => {
    expect(parseTags('a, A, b, a')).toEqual(['a', 'b']);
    expect(parseTags('')).toEqual([]);
    expect(parseTags(' , , ')).toEqual([]);
  });
});

describe('notesPreview', () => {
  it('mantém textos curtos e corta os longos com reticências', () => {
    expect(notesPreview('curto')).toBe('curto');
    expect(notesPreview('a'.repeat(NOTES_PREVIEW_LIMIT))).toHaveLength(NOTES_PREVIEW_LIMIT);
    const long = notesPreview('a'.repeat(NOTES_PREVIEW_LIMIT + 50));
    expect(long).toHaveLength(NOTES_PREVIEW_LIMIT + 1);
    expect(long.endsWith('…')).toBe(true);
  });
});

describe('groupBySubject', () => {
  it('agrupa por matéria em ordem alfabética em português', () => {
    const groups = groupBySubject([
      material('1', 'Fisiologia', 1),
      material('2', 'Anatomia', 2),
      material('3', 'Écologia', 3),
      material('4', 'Fisiologia', 4),
    ]);
    expect(groups.map((g) => g.subject)).toEqual(['Anatomia', 'Écologia', 'Fisiologia']);
    expect(groups[2]?.materials.map((m) => m.id)).toEqual(['4', '1']);
  });
  it('é vazio sem materiais e não altera a lista original', () => {
    expect(groupBySubject([])).toEqual([]);
    const original = [material('1', 'B', 1), material('2', 'A', 2)];
    groupBySubject(original);
    expect(original.map((m) => m.id)).toEqual(['1', '2']);
  });
});
