import { AiUnavailableError } from '../../../shared/ai';

/**
 * "Gerar resumo e questões com IA" de uma aula em vídeo. Sem IA nesta versão (Fase 3): apenas
 * informa que o recurso não está disponível, sem simular resultado.
 */
export type SummarizeMaterial = (materialId: string) => Promise<string>;

export const summarizeMaterial: SummarizeMaterial = async () => {
  throw new AiUnavailableError();
};
