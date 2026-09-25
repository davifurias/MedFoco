import { PlaceholderPage } from '../../components/PlaceholderPage';

const LEGACY_FEATURES = [
  'Buscar em eventos, matérias, tarefas, questões, ideias do app e caderno de ideias',
  'Resultados agrupados por área, com atalho para a aba correspondente',
];

export function BuscaPage() {
  return <PlaceholderPage title="Busca global" legacyFeatures={LEGACY_FEATURES} />;
}
