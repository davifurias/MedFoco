import { PlaceholderPage } from '../../components/PlaceholderPage';

const LEGACY_FEATURES = [
  'Cada material aparece como um ponto, agrupado por matéria',
  'Linhas ligam materiais que compartilham assuntos-chave',
  'Tocar num material mostra seus detalhes',
];

export function MapaPage() {
  return <PlaceholderPage title="Mapa visual de conexões" legacyFeatures={LEGACY_FEATURES} />;
}
