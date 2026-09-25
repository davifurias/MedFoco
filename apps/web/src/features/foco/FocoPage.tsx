import { PlaceholderPage } from '../../components/PlaceholderPage';

const LEGACY_FEATURES = [
  'Técnicas: Pomodoro (25/5), Pomodoro longo (50/10), 52/17, Foco curto (15/3) e Personalizado',
  'Cronômetro com iniciar, pausar, continuar e encerrar',
  'Minutos de foco de hoje e ciclos completos',
  'Histórico recente de sessões',
];

export function FocoPage() {
  return <PlaceholderPage title="Foco" legacyFeatures={LEGACY_FEATURES} />;
}
