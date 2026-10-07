/**
 * Padrão para funcionalidades de IA ainda não disponíveis.
 *
 * A IA do MedFoco será feita na Fase 3, pelo backend do próprio app (nunca direto do navegador).
 * Até lá, os serviços de IA lançam este erro: a interface informa que o recurso não está
 * disponível, sem simular resposta e sem enviar dados para fora do aparelho.
 */
export class AiUnavailableError extends Error {
  constructor() {
    super('A IA ainda não está disponível nesta versão do MedFoco.');
    this.name = 'AiUnavailableError';
  }
}
