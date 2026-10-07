import { describe, expect, it } from 'vitest';
import type { Material } from '../../../data/types';
import {
  LABEL_LIMIT,
  SUBJECT_COLORS,
  buildMapLayout,
  edgeWidth,
  shortLabel,
  sharedTags,
  tagKey,
} from './mapa';

const mat = (id: string, subject: string, tags: string[]): Material => ({
  id,
  subject,
  title: `Material ${id}`,
  notes: '',
  tags,
  type: 'nota',
  videoLink: '',
  createdAt: 1,
});

describe('tagKey', () => {
  it('ignora maiúsculas, acentos e espaços extras', () => {
    expect(tagKey('  Coração ')).toBe('coracao');
    expect(tagKey('Sopro   Cardíaco')).toBe('sopro cardiaco');
  });
});

describe('sharedTags', () => {
  it('liga assuntos iguais mesmo com acento ou maiúscula diferentes', () => {
    expect(sharedTags(mat('1', 'A', ['Coração', 'valva']), mat('2', 'A', ['coracao']))).toEqual([
      'Coração',
    ]);
  });
  it('não liga quando não há assunto em comum nem com tags vazias', () => {
    expect(sharedTags(mat('1', 'A', ['x']), mat('2', 'A', ['y']))).toEqual([]);
    expect(sharedTags(mat('1', 'A', ['']), mat('2', 'A', ['']))).toEqual([]);
  });
  it('não repete o mesmo assunto', () => {
    expect(sharedTags(mat('1', 'A', ['x', 'X']), mat('2', 'A', ['x']))).toEqual(['x']);
  });
});

describe('buildMapLayout', () => {
  it('numera matérias na ordem da primeira aparição e repete as cores depois da 8ª', () => {
    const materials = Array.from({ length: 9 }, (_, i) => mat(String(i), `M${i}`, []));
    const { subjects } = buildMapLayout(materials);
    expect(subjects.map((s) => s.name)).toEqual(materials.map((m) => m.subject));
    expect(subjects[0]?.color).toBe(SUBJECT_COLORS[0]);
    expect(subjects[8]?.color).toBe(SUBJECT_COLORS[0]);
  });
  it('cria uma linha por par de materiais com assunto em comum', () => {
    const { edges } = buildMapLayout([
      mat('1', 'A', ['x']),
      mat('2', 'B', ['x', 'y']),
      mat('3', 'B', ['z']),
    ]);
    expect(edges).toEqual([{ a: 0, b: 1, shared: ['x'] }]);
  });
  it('dá uma posição finita a cada material, inclusive com uma só matéria', () => {
    const { nodes } = buildMapLayout([mat('1', 'A', []), mat('2', 'A', [])]);
    expect(nodes).toHaveLength(2);
    for (const node of nodes) {
      expect(Number.isFinite(node.x) && Number.isFinite(node.y)).toBe(true);
    }
  });
});

describe('shortLabel e edgeWidth', () => {
  it('corta títulos longos e mantém os curtos', () => {
    expect(shortLabel('a'.repeat(LABEL_LIMIT))).toBe('a'.repeat(LABEL_LIMIT));
    expect(shortLabel('a'.repeat(LABEL_LIMIT + 1))).toBe(`${'a'.repeat(LABEL_LIMIT - 1)}…`);
  });
  it('limita a espessura da linha', () => {
    expect(edgeWidth(1)).toBe(2);
    expect(edgeWidth(10)).toBe(5);
  });
});
