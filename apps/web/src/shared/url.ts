export type LinkCheck =
  { ok: true; url: string } | { ok: false; reason: 'invalid' | 'credentials' };

/** "meusite.com:8080/video" ou "localhost:3000": o que vem depois dos ":" é uma porta, não um esquema. */
const HOST_WITH_PORT = /^[^\s/?#:]+:\d+(?:[/?#]|$)/;
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/**
 * Valida um link digitado pelo usuário. Só aceita http e https (recusa javascript:, data: etc.)
 * e recusa links com usuário e senha. Sem esquema (ex.: "youtube.com/watch?v=x"), assume https.
 */
export function checkHttpUrl(input: unknown): LinkCheck {
  if (typeof input !== 'string') return { ok: false, reason: 'invalid' };
  const value = input.trim();
  if (!value) return { ok: false, reason: 'invalid' };
  const hasScheme = HAS_SCHEME.test(value) && !HOST_WITH_PORT.test(value);
  let url: URL;
  try {
    url = new URL(hasScheme ? value : `https://${value}`);
  } catch {
    return { ok: false, reason: 'invalid' };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:')
    return { ok: false, reason: 'invalid' };
  if (!url.hostname) return { ok: false, reason: 'invalid' };
  if (url.username || url.password) return { ok: false, reason: 'credentials' };
  return { ok: true, url: url.href };
}

/** Link normalizado, ou null se não for um link http(s) aceito. */
export function toSafeHttpUrl(input: unknown): string | null {
  const check = checkHttpUrl(input);
  return check.ok ? check.url : null;
}
