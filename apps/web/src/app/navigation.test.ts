import { describe, expect, it } from 'vitest';
import { MAIN_AREAS, documentTitleFor, pageNameFor } from './navigation';

describe('nomes das telas', () => {
  it('toda área da navegação tem nome', () => {
    for (const area of MAIN_AREAS) expect(pageNameFor(area.path), area.path).toBeTruthy();
  });
  it('ignora a barra final e devolve null para telas desconhecidas', () => {
    expect(pageNameFor('/agenda/')).toBe('Agenda · Eventos');
    expect(pageNameFor('/nao-existe')).toBeNull();
  });
  it('o título da aba termina com o nome do app', () => {
    expect(documentTitleFor('/')).toBe('Início · MedFoco');
    expect(documentTitleFor('/perfil')).toBe('Perfil acadêmico · MedFoco');
    expect(documentTitleFor('/nao-existe')).toBe('MedFoco');
  });
});
