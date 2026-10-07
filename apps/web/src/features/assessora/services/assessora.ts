/**
 * Pontos de entrada da IA da Assessora: aula guiada, chat e criação de questões.
 *
 * A IA ainda não existe nesta versão: ela será feita na Fase 3, pelo backend do próprio MedFoco
 * (nunca direto do navegador). Até lá, estas funções apenas informam que o recurso está
 * indisponível — não simulam resposta e não enviam nenhum dado para fora do aparelho. O texto de
 * contexto (provas, tarefas, desempenho…) também só será montado quando o backend existir.
 */
import { AiUnavailableError } from '../../../shared/ai';

export { AiUnavailableError };

export interface LessonStep {
  title: string;
  explanation: string;
  analogy: string;
  check: string;
  checkAnswer: string;
}

export type Attachment =
  { kind: 'text'; title: string; content: string } | { kind: 'image'; title: string; file: File };

export interface ChatRequest {
  text: string;
  attachment: Attachment | null;
}

export type GenerateLesson = (topic: string) => Promise<LessonStep[]>;
export type SendChatMessage = (request: ChatRequest) => Promise<string>;
export type CreateLessonQuestions = (topic: string, steps: LessonStep[]) => Promise<void>;

export const generateLesson: GenerateLesson = async () => {
  throw new AiUnavailableError();
};

export const sendChatMessage: SendChatMessage = async () => {
  throw new AiUnavailableError();
};

export const createLessonQuestions: CreateLessonQuestions = async () => {
  throw new AiUnavailableError();
};

const text = (value: unknown) => (typeof value === 'string' ? value : '');

/** Passos recebidos de um serviço de IA são tratados como dados não confiáveis. */
export function normalizeSteps(raw: unknown): LessonStep[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      title: text(item.title),
      explanation: text(item.explanation),
      analogy: text(item.analogy),
      check: text(item.check),
      checkAnswer: text(item.checkAnswer),
    }))
    .filter((step) => step.title || step.explanation);
}
