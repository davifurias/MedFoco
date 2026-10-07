import { describe, expect, it } from 'vitest';
import { toSafeHttpUrl } from './url';

describe('toSafeHttpUrl', () => {
  it('aceita links http e https', () => {
    expect(toSafeHttpUrl('https://www.youtube.com/watch?v=abc')).toBe(
      'https://www.youtube.com/watch?v=abc',
    );
    expect(toSafeHttpUrl('http://exemplo.com/a')).toBe('http://exemplo.com/a');
  });

  it('assume https quando não há esquema e remove espaços das pontas', () => {
    expect(toSafeHttpUrl('  youtube.com/watch?v=abc  ')).toBe('https://youtube.com/watch?v=abc');
  });

  it('recusa javascript:, data:, vbscript:, file: e variações de maiúsculas', () => {
    for (const value of [
      'javascript:alert(1)',
      'JaVaScRiPt:alert(1)',
      '  javascript:alert(1)',
      'java\tscript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'vbscript:msgbox(1)',
      'file:///etc/passwd',
    ]) {
      expect(toSafeHttpUrl(value), value).toBeNull();
    }
  });

  it('recusa vazio, não texto e endereços sem domínio', () => {
    for (const value of ['', '   ', 'https://', null, undefined, 42, {}]) {
      expect(toSafeHttpUrl(value), String(value)).toBeNull();
    }
  });
});
