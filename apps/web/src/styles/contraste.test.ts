/**
 * Garante o contraste mínimo (4,5:1) dos pares texto/fundo declarados em global.css, nos dois
 * temas. Se alguém trocar uma cor e piorar a leitura, este teste falha.
 */
import { describe, expect, it } from 'vitest';
import css from './global.css?raw';
import { SUBJECT_COLORS } from '../features/mapa/utils/mapa';
import { MIN_TEXT_CONTRAST, contrastRatio, readableTextColor } from '../shared/contrast';

function block(selector: RegExp): Record<string, string> {
  const match = selector.exec(css);
  if (!match) throw new Error(`Bloco não encontrado: ${selector}`);
  const body = css.slice(match.index + match[0].length, css.indexOf('}', match.index));
  return Object.fromEntries([...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2]]));
}

const dark = block(/:root,\s*:root\[data-theme='dark'\]\s*\{/);
const light = { ...dark, ...block(/:root\[data-theme='light'\]\s*\{/) };

const themes = { escuro: dark, claro: light } as const;

describe.each(Object.entries(themes))('contraste no tema %s', (_name, tokens) => {
  const t = (name: string) => {
    const value = tokens[name];
    if (!value) throw new Error(`Token ausente: ${name}`);
    return value;
  };
  const ratio = (fg: string, bg: string) => contrastRatio(t(fg), t(bg));

  it.each([
    ['--text', '--bg'],
    ['--text', '--card'],
    ['--muted', '--bg'],
    ['--muted', '--card'],
    ['--primary-text', '--bg'],
    ['--primary-text', '--card'],
    ['--accent-text', '--card'],
    ['--accent-text', '--bg'],
    ['--danger-text', '--card'],
    ['--danger-text', '--bg'],
    ['--warn-text', '--card'],
    ['--warn-text', '--bg'],
  ])('texto %s sobre %s', (fg, bg) => {
    expect(ratio(fg as string, bg as string)).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
  });

  it.each([
    ['#ffffff', '--primary'],
    ['#ffffff', '--primary-d'],
    ['#ffffff', '--danger-strong'],
    ['#ffffff', '--c-provas'],
    ['#ffffff', '--c-aulas'],
    ['#ffffff', '--c-outro'],
    ['--text-on-light', '--c-trabalho'],
    ['--text-on-light', '--c-ferias'],
    ['--text-on-light', '--accent'],
  ])('texto %s sobre o fundo colorido %s', (fg, bg) => {
    const color = (fg as string).startsWith('#') ? (fg as string) : t(fg as string);
    expect(contrastRatio(color, t(bg as string))).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
  });
});

describe('cores das matérias no Mapa', () => {
  it.each([...SUBJECT_COLORS])('o texto da pílula %s é legível', (color) => {
    expect(contrastRatio(readableTextColor(color), color)).toBeGreaterThanOrEqual(
      MIN_TEXT_CONTRAST,
    );
  });
});
