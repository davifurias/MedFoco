import type { Plugin } from 'vite';

/**
 * Content-Security-Policy da versão publicada: o navegador só aceita scripts, estilos e imagens
 * do próprio app, nenhuma conexão externa e nenhum plugin. Assim, mesmo que algum dia entre uma
 * falha, um script de fora não roda e nenhum dado sai do aparelho.
 *
 * Na Fase 3, o endereço do backend precisa ser acrescentado a `connect-src`.
 * (`frame-ancestors` não funciona em <meta>; precisa de cabeçalho HTTP da hospedagem.)
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

/** Coloca a política no index.html só ao gerar a versão publicada (o servidor de desenvolvimento
 * usa scripts embutidos que ela bloquearia). */
export function contentSecurityPolicy(): Plugin {
  return {
    name: 'medfoco-csp',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY },
          injectTo: 'head-prepend',
        },
      ];
    },
  };
}
