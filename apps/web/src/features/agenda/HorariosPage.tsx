import { PlaceholderPage } from '../../components/PlaceholderPage';

const LEGACY_FEATURES = [
  'Seus horários fixos da semana, escritos livremente (aulas, estágio, trabalho)',
];

export function HorariosPage() {
  return <PlaceholderPage title="Horários" legacyFeatures={LEGACY_FEATURES} />;
}
