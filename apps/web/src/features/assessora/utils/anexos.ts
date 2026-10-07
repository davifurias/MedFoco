/** Regras dos anexos da Assessora. Os arquivos são lidos só neste aparelho e não são enviados. */

export const ACCEPTED_FILES = '.txt,.md,image/*';
export const MAX_TEXT_BYTES = 1024 * 1024;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
/** Trecho do texto anexado que seguirá para a IA (como no app original). */
export const MAX_ATTACHMENT_CHARS = 6000;

export type FileKind = 'text' | 'image' | 'unsupported';

export function classifyFile(file: Pick<File, 'name' | 'type'>): FileKind {
  if (file.type.startsWith('image/')) return 'image';
  if (
    file.type === 'text/plain' ||
    file.type === 'text/markdown' ||
    /\.(txt|md)$/i.test(file.name)
  ) {
    return 'text';
  }
  return 'unsupported';
}

export const UNSUPPORTED_MESSAGE =
  'Esse tipo de arquivo (ex: PDF) não pode ter o texto lido automaticamente aqui. Cole o texto na aba Matérias, ou envie uma foto/print como imagem.';

export const tooLargeMessage = (kind: 'text' | 'image') =>
  kind === 'text'
    ? 'O arquivo é grande demais (máximo 1 MB). Cole só o trecho que importa na aba Matérias.'
    : 'A imagem é grande demais (máximo 5 MB). Tente uma menor.';

export const explainMaterialPrompt = (title: string) =>
  `Explique o material "${title}" de forma simples.`;
export const EXPLAIN_IMAGE_PROMPT = 'Explique o que está nesta imagem/material de forma simples.';

/** Atalhos do chat (sem referência à condição de saúde do estudante). */
export const SHORTCUTS = [
  {
    label: '😵 Estou perdido, o que faço agora?',
    prompt:
      'Estou perdido, não sei nem por onde começar agora. Me diga apenas UMA tarefa simples e específica para eu fazer agora, com duração sugerida entre 15 e 25 minutos. Não me dê uma lista — só uma coisa.',
    primary: true,
  },
  {
    label: 'Planejar semana',
    prompt: 'Planeje minha semana de estudos com base nos meus próximos eventos e materiais.',
  },
  {
    label: 'Me explique algo',
    prompt: 'Explique de forma bem simples e visual um assunto que eu escolher.',
  },
  {
    label: 'Priorizar provas',
    prompt: 'Quais são minhas provas mais próximas e como devo priorizar os estudos?',
  },
] as const;

/** Mensagens da conversa que ficam na tela. */
export const MAX_MESSAGES = 30;
