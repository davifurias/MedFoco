/**
 * Texto para comparação: sem acentos, sem diferença entre maiúsculas e minúsculas, sem espaços
 * nas pontas e com espaços internos repetidos reduzidos a um. Usado no Mapa e na Busca.
 */
export function foldText(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim().replace(/\s+/g, ' ');
}
