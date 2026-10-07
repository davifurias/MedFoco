/**
 * "Organizar com IA" do Caderno de Ideias. Sem IA nesta versão (Fase 3, pelo backend do próprio
 * MedFoco): apenas informa que o recurso não está disponível, sem simular resultado.
 */
import { AiUnavailableError } from '../../../shared/ai';

export { AiUnavailableError };

export interface ThemeGroup {
  theme: string;
  items: string[];
}

export type OrganizeNotebook = (ideas: string[]) => Promise<ThemeGroup[]>;

export const organizeNotebook: OrganizeNotebook = async () => {
  throw new AiUnavailableError();
};

/** Grupos recebidos de um serviço de IA são tratados como dados não confiáveis. */
export function normalizeGroups(raw: unknown): ThemeGroup[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (group): group is Record<string, unknown> => typeof group === 'object' && group !== null,
    )
    .map((group) => ({
      theme: typeof group.theme === 'string' ? group.theme : '',
      items: Array.isArray(group.items)
        ? group.items.filter((item): item is string => typeof item === 'string' && item !== '')
        : [],
    }))
    .filter((group) => group.items.length > 0);
}
