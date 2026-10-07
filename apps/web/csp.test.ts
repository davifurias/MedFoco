import { describe, expect, it } from 'vitest';
import { CONTENT_SECURITY_POLICY, contentSecurityPolicy } from './csp';

const directives = Object.fromEntries(
  CONTENT_SECURITY_POLICY.split('; ').map((part) => {
    const [name = '', ...values] = part.split(' ');
    return [name, values];
  }),
);

describe('Content-Security-Policy', () => {
  it('só aceita código, estilo, imagem e conexão do próprio app', () => {
    expect(directives['default-src']).toEqual(["'self'"]);
    expect(directives['script-src']).toEqual(["'self'"]);
    expect(directives['style-src']).toEqual(["'self'"]);
    expect(directives['connect-src']).toEqual(["'self'"]);
    expect(directives['object-src']).toEqual(["'none'"]);
    expect(directives['base-uri']).toEqual(["'self'"]);
    expect(directives['form-action']).toEqual(["'self'"]);
  });

  it('não abre exceções perigosas', () => {
    expect(CONTENT_SECURITY_POLICY).not.toMatch(/unsafe-inline|unsafe-eval|\*|https?:/);
  });

  it('é colocada no <head> só ao gerar a versão publicada', () => {
    const plugin = contentSecurityPolicy();
    expect(plugin.apply).toBe('build');
    const transform = plugin.transformIndexHtml as () => {
      tag: string;
      attrs: Record<string, string>;
      injectTo: string;
    }[];
    expect(transform()).toEqual([
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY },
        injectTo: 'head-prepend',
      },
    ]);
  });
});
