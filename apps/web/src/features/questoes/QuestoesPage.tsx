import { PlaceholderPage } from '../../components/PlaceholderPage';

const LEGACY_FEATURES = [
  'Seu desempenho: os assuntos com menor percentual de acerto',
  'Praticar com filtro de matéria e de dificuldade',
  'Adicionar questão com enunciado, 4 alternativas e explicação',
  'Lista de todas as questões',
];

export function QuestoesPage() {
  return <PlaceholderPage title="Banco de questões" legacyFeatures={LEGACY_FEATURES} />;
}
