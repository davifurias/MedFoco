import { PlaceholderPage } from '../../components/PlaceholderPage';

const LEGACY_FEATURES = [
  'Novo evento com título, data, categoria (Trabalho, Provas, Férias, Aulas, Outro) e observação',
  'Lista de todos os eventos',
];

export function EventosPage() {
  return <PlaceholderPage title="Eventos" legacyFeatures={LEGACY_FEATURES} />;
}
