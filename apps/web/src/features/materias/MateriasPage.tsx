import { PlaceholderPage } from '../../components/PlaceholderPage';

const LEGACY_FEATURES = [
  'Adicionar material do tipo arquivo/nota ou aula em vídeo (link do YouTube)',
  'Matéria, título, resumo/anotações e assuntos-chave de cada material',
  'Materiais agrupados por matéria',
  'Resumo e questões gerados com IA a partir da transcrição de uma aula em vídeo',
];

export function MateriasPage() {
  return <PlaceholderPage title="Matérias" legacyFeatures={LEGACY_FEATURES} />;
}
