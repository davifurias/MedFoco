import { PlaceholderPage } from '../../components/PlaceholderPage';

const LEGACY_FEATURES = [
  'Nova tarefa com matéria, prazo e prioridade',
  'Tarefas pendentes e concluídas',
  'Organizar a semana com IA',
];

export function TarefasPage() {
  return <PlaceholderPage title="Tarefas" legacyFeatures={LEGACY_FEATURES} />;
}
