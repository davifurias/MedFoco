import { cleanup, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('App', () => {
  it('inicializa exibindo o nome do aplicativo', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('MedFoco');
  });

  it('renderiza a área principal', () => {
    render(<App />);
    expect(screen.getByRole('main')).toBeTruthy();
  });

  it('inicializa em StrictMode sem erros no console', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    expect(consoleError).not.toHaveBeenCalled();
  });
});
