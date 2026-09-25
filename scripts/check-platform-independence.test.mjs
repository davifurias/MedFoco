import { describe, expect, it } from 'vitest';
import { findViolations, isCheckedFile } from './check-platform-independence.mjs';

// Montado em partes para que este próprio arquivo não seja acusado pelo verificador.
const forbiddenCall = ['window', 'claude', "use('db')"].join('.');

describe('check-platform-independence', () => {
  it('acusa uso da API interna de Artifacts do Claude', () => {
    const violations = findViolations('apps/web/src/db.ts', `const db = await ${forbiddenCall};`);
    expect(violations).toHaveLength(2);
    expect(violations[0]).toMatchObject({ path: 'apps/web/src/db.ts', line: 1 });
  });

  it('aceita código sem dependência de plataforma', () => {
    expect(findViolations('apps/web/src/ok.ts', 'const claude = "nome qualquer";')).toEqual([]);
  });

  it('verifica arquivos de código e ignora legacy/ e documentação', () => {
    expect(isCheckedFile('apps/web/src/App.tsx')).toBe(true);
    expect(isCheckedFile('packages/core/index.mjs')).toBe(true);
    expect(isCheckedFile('legacy/MedFoco.html')).toBe(false);
    expect(isCheckedFile('AGENTS.md')).toBe(false);
  });
});
