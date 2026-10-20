import { describe, expect, it } from 'vitest';
import {
  MAIN_AREAS,
  MOBILE_TABS,
  MORE_AREAS,
  documentTitleFor,
  isInMore,
  pageNameFor,
} from './navigation';

describe('divisão da navegação no celular', () => {
  it('cada uma das 8 áreas está na barra de baixo ou na página Mais, nunca nas duas', () => {
    const tabs = MOBILE_TABS.map((area) => area.path);
    const more = MORE_AREAS.map((area) => area.path);
    expect(tabs).toEqual(['/', '/agenda', '/materias', '/foco']);
    expect(more).toEqual(['/mapa', '/questoes', '/assessora', '/ideias', '/perfil']);
    for (const area of MAIN_AREAS) {
      expect([tabs.includes(area.path), more.includes(area.path)].filter(Boolean)).toHaveLength(1);
    }
  });
  it('reconhece a página Mais e as telas dela, mas não telas parecidas', () => {
    expect(isInMore('/mais')).toBe(true);
    expect(isInMore('/mais/')).toBe(true);
    expect(isInMore('/ideias/caderno')).toBe(true);
    expect(isInMore('/mapa')).toBe(true);
    expect(isInMore('/mapas')).toBe(false);
    expect(isInMore('/maisfoco')).toBe(false);
    expect(isInMore('/agenda')).toBe(false);
    expect(isInMore('/')).toBe(false);
  });
});

describe('nomes das telas', () => {
  it('toda área da navegação tem nome', () => {
    for (const area of MAIN_AREAS) expect(pageNameFor(area.path), area.path).toBeTruthy();
  });
  it('ignora a barra final e devolve null para telas desconhecidas', () => {
    expect(pageNameFor('/agenda/')).toBe('Agenda · Eventos');
    expect(pageNameFor('/mais')).toBe('Mais');
    expect(pageNameFor('/nao-existe')).toBeNull();
  });
  it('o título da aba termina com o nome do app', () => {
    expect(documentTitleFor('/')).toBe('Início · MedFoco');
    expect(documentTitleFor('/perfil')).toBe('Perfil acadêmico · MedFoco');
    expect(documentTitleFor('/nao-existe')).toBe('MedFoco');
  });
});
