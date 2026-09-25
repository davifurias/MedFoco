import { PlaceholderPage } from '../../components/PlaceholderPage';

const LEGACY_FEATURES = [
  'Anotar ideias soltas, sem se preocupar com organização',
  'Organizar as ideias por tema com IA',
];

export function CadernoPage() {
  return <PlaceholderPage title="Caderno de ideias" legacyFeatures={LEGACY_FEATURES} />;
}
