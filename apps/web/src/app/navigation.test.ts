import { describe, expect, it } from 'vitest';
import {
  MAIN_AREAS,
  MOBILE_TABS,
  MENU_GROUPS,
  documentTitleFor,
  headerFor,
  pageNameFor,
} from './navigation';

describe('divisão da navegação no celular', () => {
  it('a barra de baixo tem 4 áreas e o menu ⋯ lista todas, agrupadas, sem repetir nenhuma', () => {
    expect(MOBILE_TABS.map((area) => area.path)).toEqual(['/', '/agenda', '/materias', '/foco']);
    const groups = MENU_GROUPS.map((group) => [group.title, group.areas.map((a) => a.path)]);
    expect(groups).toEqual([
      ['Principais', ['/', '/agenda', '/materias', '/foco']],
      ['Estudar', ['/mapa', '/questoes', '/assessora']],
      ['Mais', ['/ideias', '/busca', '/perfil']],
    ]);
    const listed = MENU_GROUPS.flatMap((group) => group.areas.map((area) => area.path));
    expect(new Set(listed).size).toBe(listed.length);
    for (const area of MAIN_AREAS) expect(listed, area.path).toContain(area.path);
  });
});

describe('cabeçalho do celular', () => {
  it('dá título e legenda a cada tela, inclusive sub-abas, e cai no Início', () => {
    expect(headerFor('/').title).toBe('Início');
    expect(headerFor('/agenda/tarefas').title).toBe('Agenda');
    expect(headerFor('/ideias/caderno').title).toBe('Ideias');
    expect(headerFor('/perfil/').title).toBe('Perfil acadêmico');
    expect(headerFor('/nao-existe').title).toBe('Início');
    for (const area of MAIN_AREAS) expect(headerFor(area.path).kicker, area.path).toBeTruthy();
  });
});

describe('nomes das telas', () => {
  it('toda área da navegação tem nome', () => {
    for (const area of MAIN_AREAS) expect(pageNameFor(area.path), area.path).toBeTruthy();
  });
  it('ignora a barra final e devolve null para telas desconhecidas', () => {
    expect(pageNameFor('/agenda/')).toBe('Agenda · Eventos');
    expect(pageNameFor('/mais')).toBeNull();
    expect(pageNameFor('/nao-existe')).toBeNull();
  });
  it('o título da aba termina com o nome do app', () => {
    expect(documentTitleFor('/')).toBe('Início · MedFoco');
    expect(documentTitleFor('/perfil')).toBe('Perfil acadêmico · MedFoco');
    expect(documentTitleFor('/nao-existe')).toBe('MedFoco');
  });
});
