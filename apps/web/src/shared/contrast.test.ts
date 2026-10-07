import { describe, expect, it } from 'vitest';
import { DARK_TEXT, WHITE, contrastRatio, readableTextColor } from './contrast';

describe('contrastRatio', () => {
  it('bate com valores conhecidos do WCAG', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 1);
    expect(contrastRatio('#00b894', '#ffffff')).toBeCloseTo(2.54, 1);
  });
  it('não depende da ordem das cores', () => {
    expect(contrastRatio('#6c5ce7', '#ffffff')).toBe(contrastRatio('#ffffff', '#6c5ce7'));
  });
});

describe('readableTextColor', () => {
  it('escolhe o texto com mais contraste sobre o fundo', () => {
    expect(readableTextColor('#6c5ce7')).toBe(WHITE);
    expect(readableTextColor('#636e72')).toBe(WHITE);
    expect(readableTextColor('#00b894')).toBe(DARK_TEXT);
    expect(readableTextColor('#fdcb6e')).toBe(DARK_TEXT);
    expect(readableTextColor('#ffffff')).toBe(DARK_TEXT);
    expect(readableTextColor('#000000')).toBe(WHITE);
  });
  it('o texto escolhido nunca tem menos contraste que o outro', () => {
    for (const bg of ['#e17055', '#0a76cc', '#e84393', '#808080', '#777777']) {
      const chosen = readableTextColor(bg);
      const other = chosen === WHITE ? DARK_TEXT : WHITE;
      expect(contrastRatio(chosen, bg)).toBeGreaterThanOrEqual(contrastRatio(other, bg));
    }
  });
});
