import { describe, expect, it } from 'vitest';
import type { CalendarEvent, FocusSession, Task } from '../../../data/types';
import {
  UPCOMING_EVENTS_LIMIT,
  countPendingTasks,
  focusedMinutesToday,
  greeting,
  upcomingEvents,
} from './resumo';

let seq = 0;
const task = (done: boolean): Task => ({
  id: String(++seq),
  title: 't',
  subject: '',
  deadline: '',
  priority: 'média',
  done,
  createdAt: seq,
});
const event = (date: string): CalendarEvent => ({
  id: String(++seq),
  title: `e${seq}`,
  date,
  category: 'outro',
  notes: '',
  createdAt: seq,
});
const session = (type: 'work' | 'break', minutes: number, date: string): FocusSession => ({
  id: String(++seq),
  type,
  minutes,
  subject: null,
  date,
  createdAt: seq,
});

const TODAY = '2026-09-25';

describe('greeting', () => {
  it('diz "Bom dia" antes das 12h', () => {
    expect(greeting(0)).toBe('Bom dia');
    expect(greeting(11)).toBe('Bom dia');
  });
  it('diz "Boa tarde" das 12h às 17h59', () => {
    expect(greeting(12)).toBe('Boa tarde');
    expect(greeting(17)).toBe('Boa tarde');
  });
  it('diz "Boa noite" a partir das 18h', () => {
    expect(greeting(18)).toBe('Boa noite');
    expect(greeting(23)).toBe('Boa noite');
  });
  it('usa só o primeiro nome quando houver nome, e nenhum nome quando não houver', () => {
    expect(greeting(9, 'Ana Maria Souza')).toBe('Bom dia, Ana');
    expect(greeting(9, '')).toBe('Bom dia');
    expect(greeting(9, null)).toBe('Bom dia');
  });
});

describe('countPendingTasks', () => {
  it('conta só as tarefas não concluídas', () => {
    expect(countPendingTasks([task(false), task(true), task(false)])).toBe(2);
  });
  it('é zero sem tarefas', () => {
    expect(countPendingTasks([])).toBe(0);
  });
});

describe('upcomingEvents', () => {
  it('inclui eventos de hoje e exclui os anteriores', () => {
    const result = upcomingEvents([event('2026-09-24'), event(TODAY), event('2026-09-26')], TODAY);
    expect(result.map((e) => e.date)).toEqual([TODAY, '2026-09-26']);
  });

  it('ordena por data crescente', () => {
    const result = upcomingEvents(
      [event('2026-12-01'), event('2026-10-05'), event('2026-09-30')],
      TODAY,
    );
    expect(result.map((e) => e.date)).toEqual(['2026-09-30', '2026-10-05', '2026-12-01']);
  });

  it('devolve o total de eventos futuros, sem limitar a 5', () => {
    const many = Array.from({ length: 12 }, (_, i) =>
      event(`2026-10-${String(i + 1).padStart(2, '0')}`),
    );
    const result = upcomingEvents(many, TODAY);
    expect(result).toHaveLength(12);
    expect(result.slice(0, UPCOMING_EVENTS_LIMIT)).toHaveLength(5);
    expect(UPCOMING_EVENTS_LIMIT).toBe(5);
  });
});

describe('focusedMinutesToday', () => {
  it('soma os minutos de foco de hoje', () => {
    expect(
      focusedMinutesToday([session('work', 25, TODAY), session('work', 50, TODAY)], TODAY),
    ).toBe(75);
  });
  it('não conta pausas', () => {
    expect(
      focusedMinutesToday([session('work', 25, TODAY), session('break', 5, TODAY)], TODAY),
    ).toBe(25);
  });
  it('não conta sessões de outros dias', () => {
    expect(focusedMinutesToday([session('work', 25, '2026-09-24')], TODAY)).toBe(0);
  });
  it('é zero sem sessões', () => {
    expect(focusedMinutesToday([], TODAY)).toBe(0);
  });
});
