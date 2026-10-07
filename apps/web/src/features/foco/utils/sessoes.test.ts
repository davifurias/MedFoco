import { describe, expect, it } from 'vitest';
import type { FocusSession } from '../../../data/types';
import { HISTORY_LIMIT, focusMinutesOn, recentSessions } from './sessoes';

const s = (id: number, extra: Partial<FocusSession> = {}): FocusSession => ({
  id: String(id),
  type: 'work',
  minutes: 25,
  subject: null,
  date: '2026-10-07',
  createdAt: id,
  ...extra,
});

describe('focusMinutesOn', () => {
  it('soma só o foco do dia, sem pausas nem outros dias', () => {
    expect(
      focusMinutesOn(
        [
          s(1),
          s(2, { minutes: 50 }),
          s(3, { type: 'break', minutes: 5 }),
          s(4, { date: '2026-10-06' }),
        ],
        '2026-10-07',
      ),
    ).toBe(75);
  });
  it('é zero sem sessões', () => {
    expect(focusMinutesOn([], '2026-10-07')).toBe(0);
  });
});

describe('recentSessions', () => {
  it('mostra as mais recentes primeiro, no máximo 10', () => {
    const all = Array.from({ length: 15 }, (_, i) => s(i + 1));
    const recent = recentSessions(all);
    expect(recent).toHaveLength(HISTORY_LIMIT);
    expect(recent[0]?.id).toBe('15');
    expect(recent.at(-1)?.id).toBe('6');
  });
  it('no empate, a gravada por último vem primeiro', () => {
    expect(
      recentSessions([s(1, { createdAt: 5 }), s(2, { createdAt: 5 })]).map((x) => x.id),
    ).toEqual(['2', '1']);
  });
});
