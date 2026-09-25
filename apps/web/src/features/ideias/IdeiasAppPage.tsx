import { PlaceholderPage } from '../../components/PlaceholderPage';

const LEGACY_FEATURES = [
  'Espaço compartilhado de sugestões de melhoria para o MedFoco',
  'Lista de ideias salvas',
];

export function IdeiasAppPage() {
  return <PlaceholderPage title="Ideias do App" legacyFeatures={LEGACY_FEATURES} />;
}
