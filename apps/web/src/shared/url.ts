/**
 * Valida um link digitado pelo usuário. Só aceita http e https (recusa javascript:, data: etc.).
 * Sem esquema (ex.: "youtube.com/watch?v=x"), assume https. Devolve o link normalizado ou null.
 */
export function toSafeHttpUrl(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const value = input.trim();
  if (!value) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (!url.hostname) return null;
  return url.href;
}
