import { AiUnavailableError } from '../../../shared/ai';

/**
 * "Organizar minha semana com IA". Sem IA nesta versão (Fase 3): apenas informa que o recurso
 * não está disponível, sem simular resultado.
 */
export type OrganizeWeek = () => Promise<string>;

export const organizeWeek: OrganizeWeek = async () => {
  throw new AiUnavailableError();
};
