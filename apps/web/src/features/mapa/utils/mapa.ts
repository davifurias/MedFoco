import type { Material } from '../../../data/types';
import { notesPreview } from '../../materias/utils/materias';

export { notesPreview };

/** Cores das matérias, na ordem em que aparecem (como no app original; repetem a partir da 9ª). */
export const SUBJECT_COLORS = [
  '#6c5ce7',
  '#00b894',
  '#e17055',
  '#0984e3',
  '#e84393',
  '#fdcb6e',
  '#00cec9',
  '#636e72',
] as const;

export const MAP_WIDTH = 800;
export const MAP_HEIGHT = 560;
/** Títulos maiores que isso são cortados no desenho (o texto completo fica nos detalhes). */
export const LABEL_LIMIT = 14;

/** Chave de comparação de um assunto: sem acentos, sem maiúsculas, sem espaços nas pontas. */
export function tagKey(tag: string): string {
  return tag.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim().replace(/\s+/g, ' ');
}

export function shortLabel(title: string): string {
  const chars = [...title];
  return chars.length > LABEL_LIMIT ? `${chars.slice(0, LABEL_LIMIT - 1).join('')}…` : title;
}

export interface MapNode {
  material: Material;
  x: number;
  y: number;
  color: string;
}

export interface MapEdge {
  a: number;
  b: number;
  /** Assuntos em comum, como escritos no primeiro material. */
  shared: string[];
}

export interface MapLayout {
  subjects: { name: string; color: string }[];
  nodes: MapNode[];
  edges: MapEdge[];
}

/** Dois materiais se ligam quando têm ao menos um assunto-chave em comum. */
export function sharedTags(a: Material, b: Material): string[] {
  const keysB = new Set(b.tags.map(tagKey));
  const seen = new Set<string>();
  const shared: string[] = [];
  for (const tag of a.tags) {
    const key = tagKey(tag);
    if (key && keysB.has(key) && !seen.has(key)) {
      seen.add(key);
      shared.push(tag);
    }
  }
  return shared;
}

/**
 * Posiciona as matérias num círculo e os materiais de cada matéria em volta do centro do seu
 * grupo, como no app original. A ordem das matérias é a da primeira aparição.
 */
export function buildMapLayout(materials: readonly Material[]): MapLayout {
  const names = [...new Set(materials.map((m) => m.subject))];
  const subjects = names.map((name, i) => ({
    name,
    color: SUBJECT_COLORS[i % SUBJECT_COLORS.length] ?? SUBJECT_COLORS[0],
  }));
  const cx = MAP_WIDTH / 2;
  const cy = MAP_HEIGHT / 2;
  const clusterRadius = Math.min(MAP_WIDTH, MAP_HEIGHT) / 2 - 90;
  const centers = new Map<string, { x: number; y: number }>();
  names.forEach((name, i) => {
    const angle = (2 * Math.PI * i) / names.length - Math.PI / 2;
    centers.set(name, {
      x: cx + clusterRadius * Math.cos(angle),
      y: cy + clusterRadius * Math.sin(angle),
    });
  });

  const members = new Map<string, number[]>();
  materials.forEach((m, index) =>
    members.set(m.subject, [...(members.get(m.subject) ?? []), index]),
  );

  const nodes: MapNode[] = [];
  members.forEach((indexes, subject) => {
    const center = centers.get(subject) ?? { x: cx, y: cy };
    const color = subjects.find((s) => s.name === subject)?.color ?? SUBJECT_COLORS[0];
    const miniRadius = Math.max(38, indexes.length * 10);
    indexes.forEach((materialIndex, k) => {
      const angle = (2 * Math.PI * k) / indexes.length - Math.PI / 2;
      nodes[materialIndex] = {
        material: materials[materialIndex] as Material,
        x: center.x + miniRadius * Math.cos(angle),
        y: center.y + miniRadius * Math.sin(angle),
        color,
      };
    });
  });

  const edges: MapEdge[] = [];
  for (let a = 0; a < materials.length; a++) {
    for (let b = a + 1; b < materials.length; b++) {
      const shared = sharedTags(materials[a] as Material, materials[b] as Material);
      if (shared.length) edges.push({ a, b, shared });
    }
  }
  return { subjects, nodes, edges };
}

/** Espessura da linha: 1 mais o número de assuntos em comum, no máximo 5 (como no original). */
export const edgeWidth = (shared: number) => 1 + Math.min(shared, 4);
