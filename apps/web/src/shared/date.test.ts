import { describe, expect, it } from 'vitest';
import { formatLongDate, formatShortDate, fromDateKey, toLocalDateKey } from './date';

describe('datas locais', () => {
  it('usa a data local, não a UTC (23h de 25/09 continua sendo 25/09)', () => {
    const lateNight = new Date(2026, 8, 25, 23, 30);
    expect(toLocalDateKey(lateNight)).toBe('2026-09-25');
  });

  it('usa a data local logo após a meia-noite', () => {
    expect(toLocalDateKey(new Date(2026, 8, 26, 0, 5))).toBe('2026-09-26');
  });

  it('completa mês e dia com zero', () => {
    expect(toLocalDateKey(new Date(2026, 0, 5, 12))).toBe('2026-01-05');
  });

  it('interpreta AAAA-MM-DD como meia-noite local', () => {
    const date = fromDateKey('2026-09-25');
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([
      2026, 8, 25, 0,
    ]);
  });

  it('formata a data por extenso em português', () => {
    expect(formatLongDate(new Date(2026, 8, 25, 10))).toBe('sexta-feira, 25 de setembro');
  });

  it('formata a data curta dos eventos como no app original', () => {
    expect(formatShortDate('2026-09-25')).toBe('25 de set. de 2026');
  });
});

describe('ambiente de teste', () => {
  it('roda no fuso do Brasil, para detectar erros de UTC', () => {
    expect(new Date(2026, 8, 25, 23, 30).toISOString().slice(0, 10)).toBe('2026-09-26');
  });
});
