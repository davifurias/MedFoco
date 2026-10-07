import { describe, expect, it } from 'vitest';
import {
  formatLongDate,
  formatShortDate,
  fromDateKey,
  isValidDateKey,
  toLocalDateKey,
} from './date';

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

describe('isValidDateKey', () => {
  it('aceita datas existentes no formato AAAA-MM-DD', () => {
    for (const value of ['2026-09-25', '2028-02-29', '2026-12-31', '2027-01-01', '0050-06-15']) {
      expect(isValidDateKey(value)).toBe(true);
    }
  });

  it('recusa formatos inválidos, datas inexistentes e valores que não são texto', () => {
    for (const value of [
      '',
      '25/09/2026',
      '2026-9-25',
      '2026-02-30',
      '2027-02-29',
      '2026-13-01',
      'abc',
      null,
      undefined,
      20260925,
    ]) {
      expect(isValidDateKey(value)).toBe(false);
    }
  });
});

describe('viradas de mês e de ano', () => {
  it('converte sem trocar o dia na virada do mês e do ano', () => {
    for (const key of ['2026-09-30', '2026-10-01', '2026-12-31', '2027-01-01', '2028-02-29']) {
      expect(toLocalDateKey(fromDateKey(key))).toBe(key);
    }
  });

  it('formata as datas de virada corretamente', () => {
    expect(formatShortDate('2026-12-31')).toBe('31 de dez. de 2026');
    expect(formatShortDate('2027-01-01')).toBe('01 de jan. de 2027');
  });

  it('23h59 de 31/12 ainda é 31/12; 0h de 01/01 já é o ano novo', () => {
    expect(toLocalDateKey(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31');
    expect(toLocalDateKey(new Date(2027, 0, 1, 0, 0))).toBe('2027-01-01');
  });

  it('trata anos de 0001 a 0099 sem convertê-los para 1900', () => {
    expect(toLocalDateKey(fromDateKey('0050-06-15'))).toBe('0050-06-15');
  });
});
