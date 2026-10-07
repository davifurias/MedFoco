import { describe, expect, it } from 'vitest';
import {
  SECTION_LIMIT,
  isSearchable,
  queryLength,
  searchAll,
  totalResults,
  type SearchData,
} from './busca';

const empty: SearchData = {
  eventos: [],
  materias: [],
  tarefas: [],
  questoes: [],
  ideiasApp: [],
  caderno: [],
};

const material = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  subject: 'Cardiologia',
  title: `Material ${id}`,
  notes: '',
  tags: [],
  type: 'nota' as const,
  videoLink: '',
  createdAt: 1,
  ...extra,
});

describe('mínimo de letras', () => {
  it('exige 2 letras, sem contar espaços nas pontas', () => {
    expect(['', 'a', ' a ', '  '].map(isSearchable)).toEqual([false, false, false, false]);
    expect(['ab', ' ab ', 'é!'].map(isSearchable)).toEqual([true, true, true]);
    expect(queryLength(' ab ')).toBe(2);
  });
  it('não devolve nada abaixo do mínimo', () => {
    expect(searchAll({ ...empty, materias: [material('1')] }, 'm')).toEqual([]);
  });
});

describe('searchAll', () => {
  it('ignora acentos, maiúsculas e espaços repetidos', () => {
    const data = { ...empty, materias: [material('1', { title: 'Insuficiência  Cardíaca' })] };
    for (const query of ['insuficiencia cardiaca', 'INSUFICIÊNCIA', ' cardíaca ', 'ca']) {
      expect(totalResults(searchAll(data, query))).toBe(1);
    }
    expect(totalResults(searchAll(data, 'valva'))).toBe(0);
  });

  it('procura nos mesmos campos do app original', () => {
    const data: SearchData = {
      eventos: [
        {
          id: 'e1',
          title: 'Prova',
          date: '2026-12-01',
          category: 'provas',
          notes: 'trazer xyz',
          createdAt: 1,
        },
      ],
      materias: [
        material('m1', { tags: ['xyz'] }),
        material('m2', { notes: 'xyz' }),
        material('m3', { subject: 'xyz' }),
      ],
      tarefas: [
        {
          id: 't1',
          title: 'Ler',
          subject: 'xyz',
          deadline: '',
          priority: 'média',
          done: true,
          createdAt: 1,
        },
      ],
      questoes: [
        {
          id: 'q1',
          subject: 'S',
          topic: 'xyz',
          difficulty: 'fácil',
          question: 'Q?',
          options: ['a', 'b', 'c', 'd'],
          correctIndex: 0,
          explanation: '',
          createdAt: 1,
        },
        {
          id: 'q2',
          subject: 'S',
          topic: '',
          difficulty: 'fácil',
          question: 'Q2?',
          options: ['xyz', 'b', 'c', 'd'],
          correctIndex: 0,
          explanation: 'xyz',
          createdAt: 1,
        },
      ],
      ideiasApp: [{ id: 'i1', text: 'ideia xyz', createdAt: 1 }],
      caderno: [{ id: 'n1', text: 'xyz solto', createdAt: 1 }],
    };
    const sections = searchAll(data, 'xyz');
    expect(sections.map((s) => [s.key, s.total])).toEqual([
      ['eventos', 1],
      ['materias', 3],
      ['tarefas', 1],
      ['questoes', 1], // alternativas e explicação não entram, como no original
      ['ideiasApp', 1],
      ['caderno', 1],
    ]);
    expect(sections.map((s) => s.to)).toEqual([
      '/agenda',
      '/materias',
      '/agenda/tarefas',
      '/questoes',
      '/ideias',
      '/ideias/caderno',
    ]);
    expect(sections[0]?.items[0]).toEqual({ id: 'e1', title: 'Prova', meta: '01 de dez. de 2026' });
  });

  it('limita cada área mas guarda o total, e corta textos longos em 80 caracteres', () => {
    const many = Array.from({ length: 12 }, (_, i) => material(String(i)));
    const sections = searchAll({ ...empty, materias: many }, 'material');
    expect(sections[0]).toMatchObject({ key: 'materias', total: 12 });
    expect(sections[0]?.items).toHaveLength(SECTION_LIMIT);
    const long = { id: 'i', text: 'a'.repeat(100), createdAt: 1 };
    const ideas = searchAll({ ...empty, ideiasApp: [long] }, 'aa');
    expect(ideas[0]?.items[0]?.title).toBe(`${'a'.repeat(80)}…`);
  });
});
