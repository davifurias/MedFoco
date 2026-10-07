/** Contraste de cores (WCAG 2.x): o texto precisa de pelo menos 4,5:1 sobre o fundo. */

export const MIN_TEXT_CONTRAST = 4.5;
export const WHITE = '#ffffff';
export const DARK_TEXT = '#1c1c28';

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const [r = 0, g = 0, b = 0] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Razão de contraste entre duas cores no formato #rrggbb. */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

/** Branco ou texto escuro, o que tiver mais contraste sobre o fundo dado. */
export function readableTextColor(background: string): string {
  return contrastRatio(WHITE, background) >= contrastRatio(DARK_TEXT, background)
    ? WHITE
    : DARK_TEXT;
}
