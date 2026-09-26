import { describe, expect, it } from 'vitest';
import type { CalendarEvent, Task } from '../../../data/types';
import { priorityMarker, sortEventsByDate, splitTasks } from './agenda';

const event = (id: string, date: string, createdAt: number): CalendarEvent => ({
  id,
  title: id,
  date,
  category: 'trabalho',
  notes: '',
  createdAt,
});
const task = (id: string, done: boolean, createdAt: number): Task => ({
  id,
  title: id,
  subject: '',
  deadline: '',
  priority: 'média',
  done,
  createdAt,
});

describe('sortEventsByDate', () => {
  it('mantém eventos passados e ordena por data crescente', () => {
    const sorted = sortEventsByDate([
      event('futuro', '2026-12-01', 1),
      event('passado', '2025-01-10', 2),
      event('hoje', '2026-09-25', 3),
    ]);
    expect(sorted.map((e) => e.id)).toEqual(['passado', 'hoje', 'futuro']);
  });

  it('desempata eventos da mesma data pela ordem de criação', () => {
    const sorted = sortEventsByDate([event('b', '2026-10-01', 2), event('a', '2026-10-01', 1)]);
    expect(sorted.map((e) => e.id)).toEqual(['a', 'b']);
  });

  it('não altera a lista original', () => {
    const original = [event('b', '2026-10-02', 1), event('a', '2026-10-01', 2)];
    sortEventsByDate(original);
    expect(original.map((e) => e.id)).toEqual(['b', 'a']);
  });
});

describe('splitTasks', () => {
  it('separa pendentes e concluídas, da mais recente para a mais antiga', () => {
    const { pending, done } = splitTasks([
      task('p1', false, 1),
      task('c1', true, 2),
      task('p2', false, 3),
      task('c2', true, 4),
    ]);
    expect(pending.map((t) => t.id)).toEqual(['p2', 'p1']);
    expect(done.map((t) => t.id)).toEqual(['c2', 'c1']);
  });

  it('funciona sem tarefas', () => {
    expect(splitTasks([])).toEqual({ pending: [], done: [] });
  });
});

describe('priorityMarker', () => {
  it('usa 🔴 para alta, 🟡 para média e nada para baixa', () => {
    expect(priorityMarker('alta')).toBe('🔴');
    expect(priorityMarker('média')).toBe('🟡');
    expect(priorityMarker('baixa')).toBe('');
  });
});
