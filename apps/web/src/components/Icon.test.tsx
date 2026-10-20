import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Icon } from './Icon';

describe('Icon', () => {
  it('desenha um SVG decorativo, escondido de leitores de tela e sem estilo embutido', () => {
    const { container } = render(<Icon name="remover" />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.classList.contains('icon')).toBe(true);
    // A política de segurança do app proíbe style="": o ícone não pode depender disso.
    expect(svg?.hasAttribute('style')).toBe(false);
  });
});
