/**
 * Geração da "Sugestão da IA para hoje".
 *
 * A IA ainda não existe nesta versão: ela será feita na Fase 3, pelo backend do próprio MedFoco
 * (nunca direto do navegador). Até lá, esta função apenas informa que o recurso está
 * indisponível — não simula resposta e não envia nenhum dado para fora do aparelho.
 */
import { AiUnavailableError } from '../../../shared/ai';

export { AiUnavailableError };

export type GenerateDailySuggestion = () => Promise<string>;

export const generateDailySuggestion: GenerateDailySuggestion = async () => {
  throw new AiUnavailableError();
};
