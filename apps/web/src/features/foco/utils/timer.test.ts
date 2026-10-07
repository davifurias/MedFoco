import { describe, expect, it } from 'vitest';
import {
  advance,
  checkCustom,
  createTimer,
  focusedMinutes,
  formatClock,
  isFresh,
  pause,
  remainingSeconds,
  resume,
} from './timer';

const MIN = 60_000;

describe('checkCustom', () => {
  it('aceita inteiros dentro dos limites', () => {
    expect(checkCustom('1', '1')).toEqual({ ok: true, workMin: 1, breakMin: 1 });
    expect(checkCustom(' 180 ', '60')).toEqual({ ok: true, workMin: 180, breakMin: 60 });
  });
  it.each([
    ['0', '5', 'work'],
    ['181', '5', 'work'],
    ['', '5', 'work'],
    ['2.5', '5', 'work'],
    ['-3', '5', 'work'],
    ['abc', '5', 'work'],
    ['25', '0', 'break'],
    ['25', '61', 'break'],
    ['25', '', 'break'],
  ])('recusa foco "%s" e pausa "%s" apontando o campo %s', (work, brk, field) => {
    const check = checkCustom(work, brk);
    expect(check.ok).toBe(false);
    expect(check.ok ? '' : check.field).toBe(field);
  });
});

describe('formatClock', () => {
  it('mostra MM:SS', () => {
    expect([0, 5, 65, 1500, 3600].map(formatClock)).toEqual([
      '00:00',
      '00:05',
      '01:05',
      '25:00',
      '60:00',
    ]);
  });
});

describe('contagem', () => {
  it('só corre enquanto está rodando; pausar congela o tempo', () => {
    const t0 = 1_000_000;
    let timer = createTimer(25, 5, '');
    expect(isFresh(timer, t0)).toBe(true);
    expect(remainingSeconds(timer, t0 + 10 * MIN)).toBe(1500);
    timer = resume(timer, t0);
    expect(remainingSeconds(timer, t0 + 10_000)).toBe(1490);
    expect(isFresh(timer, t0 + 10_000)).toBe(false);
    timer = pause(timer, t0 + 10_000);
    expect(remainingSeconds(timer, t0 + 99 * MIN)).toBe(1490);
    timer = resume(timer, t0 + 99 * MIN);
    expect(remainingSeconds(timer, t0 + 99 * MIN + 1_000)).toBe(1489);
  });
  it('arredonda para cima: só chega a 00:00 quando acaba', () => {
    const timer = resume(createTimer(1, 1, ''), 0);
    expect(remainingSeconds(timer, 59_001)).toBe(1);
    expect(remainingSeconds(timer, 60_000)).toBe(0);
  });
  it('resume e pause repetidos não mudam nada', () => {
    const running = resume(createTimer(25, 5, ''), 0);
    expect(resume(running, 5_000)).toBe(running);
    const paused = createTimer(25, 5, '');
    expect(pause(paused, 5_000)).toBe(paused);
  });
});

describe('advance', () => {
  it('não conclui nada antes da hora', () => {
    const timer = resume(createTimer(25, 5, ''), 0);
    const result = advance(timer, 25 * MIN - 1);
    expect(result.completed).toEqual([]);
    expect(result.timer).toBe(timer);
  });
  it('conclui o foco e passa sozinho para a pausa, sem perder o instante exato', () => {
    const timer = resume(createTimer(25, 5, 'Cardio'), 0);
    const { timer: next, completed } = advance(timer, 25 * MIN + 700);
    expect(completed).toEqual([{ phase: 'work', minutes: 25, endedAt: 25 * MIN }]);
    expect(next).toMatchObject({ phase: 'break', cycles: 1, running: true, endsAt: 30 * MIN });
  });
  it('recupera várias fases quando ficou muito tempo em segundo plano', () => {
    const timer = resume(createTimer(25, 5, ''), 0);
    const { timer: next, completed } = advance(timer, 57 * MIN);
    expect(completed.map((c) => [c.phase, c.minutes])).toEqual([
      ['work', 25],
      ['break', 5],
      ['work', 25],
    ]);
    expect(next).toMatchObject({ phase: 'break', cycles: 2, endsAt: 60 * MIN });
  });
  it('limita a recuperação, sem travar nem registrar centenas de sessões', () => {
    const timer = resume(createTimer(1, 1, ''), 0);
    const { timer: next, completed } = advance(timer, 10_000 * MIN);
    expect(completed).toHaveLength(100);
    expect(next.endsAt).toBeGreaterThan(10_000 * MIN);
  });
  it('não avança um timer parado', () => {
    const timer = createTimer(25, 5, '');
    expect(advance(timer, 99 * MIN)).toEqual({ timer, completed: [] });
  });
});

describe('focusedMinutes', () => {
  it('conta só minutos inteiros de foco, sem pausas do usuário', () => {
    let timer = resume(createTimer(25, 5, ''), 0);
    expect(focusedMinutes(timer, 59_999)).toBe(0);
    expect(focusedMinutes(timer, 10 * MIN + 30_000)).toBe(10);
    timer = pause(timer, 10 * MIN);
    expect(focusedMinutes(timer, 500 * MIN)).toBe(10);
  });
  it('é zero durante a pausa do ciclo', () => {
    const timer = advance(resume(createTimer(25, 5, ''), 0), 27 * MIN).timer;
    expect(focusedMinutes(timer, 27 * MIN)).toBe(0);
  });
});
