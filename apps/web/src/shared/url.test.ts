import { describe, expect, it } from 'vitest';
import { checkHttpUrl, toSafeHttpUrl } from './url';

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

describe('só http e https', () => {
  it('recusa outros tipos de endereço que têm domínio', () => {
    for (const value of [
      'ftp://exemplo.com/a',
      'ws://exemplo.com',
      'wss://exemplo.com',
      'ssh://exemplo.com',
      'blob:https://exemplo.com/abc',
      'mailto:alguem@exemplo.com',
      'tel:+5511999999999',
      'intent://exemplo.com#Intent;end',
    ]) {
      expect(toSafeHttpUrl(value), value).toBeNull();
    }
  });
});

describe('links com porta, sem https://', () => {
  it('trata o que vem depois dos ":" como porta e assume https', () => {
    expect(toSafeHttpUrl('meusite.com:8080/video')).toBe('https://meusite.com:8080/video');
    expect(toSafeHttpUrl('localhost:3000')).toBe('https://localhost:3000/');
    expect(toSafeHttpUrl('localhost:3000/v?x=1#t')).toBe('https://localhost:3000/v?x=1#t');
    expect(toSafeHttpUrl('exemplo.com:443?x=1')).toBe('https://exemplo.com/?x=1');
  });

  it('continua recusando esquemas perigosos, mesmo parecidos com porta', () => {
    for (const value of [
      'javascript:alert(1)',
      'javascript:alert(1)//:80',
      'JAVASCRIPT:0',
      'data:text/html;base64,AAAA',
      'java\nscript:alert(1)',
      '\u0001javascript:alert(1)',
    ]) {
      const url = toSafeHttpUrl(value);
      expect(url === null || url.startsWith('https://'), value).toBe(true);
      expect(url ?? '', value).not.toMatch(/^javascript:/i);
    }
    // "javascript:1" só vira um link comum para um site chamado "javascript" na porta 1
    expect(toSafeHttpUrl('javascript:1')).toBe('https://javascript:1/');
  });
});

describe('links com usuário e senha', () => {
  it('são recusados, dizendo o motivo', () => {
    for (const value of [
      'https://usuario:senha@site.com/v',
      'http://usuario@site.com',
      'https://:senha@site.com',
    ]) {
      expect(checkHttpUrl(value), value).toEqual({ ok: false, reason: 'credentials' });
      expect(toSafeHttpUrl(value), value).toBeNull();
    }
  });

  it('sem https://, "usuario:senha@site.com" também é recusado (visto como esquema desconhecido)', () => {
    expect(toSafeHttpUrl('usuario:senha@site.com')).toBeNull();
  });

  it('um "@" no caminho ou na busca não é usuário', () => {
    expect(toSafeHttpUrl('https://site.com/@canal')).toBe('https://site.com/@canal');
    expect(toSafeHttpUrl('https://site.com/v?email=a@b.com')).toBe(
      'https://site.com/v?email=a@b.com',
    );
  });

  it('o motivo de um link inválido é "invalid"', () => {
    expect(checkHttpUrl('javascript:alert(1)')).toEqual({ ok: false, reason: 'invalid' });
    expect(checkHttpUrl('')).toEqual({ ok: false, reason: 'invalid' });
    expect(checkHttpUrl('https://site.com')).toEqual({ ok: true, url: 'https://site.com/' });
  });
});
