import { useMateriais } from '../materias/hooks/useMateriais';
import { AulaGuiada } from './components/AulaGuiada';
import { Chat } from './components/Chat';
import {
  createLessonQuestions,
  generateLesson,
  sendChatMessage,
  type CreateLessonQuestions,
  type GenerateLesson,
  type SendChatMessage,
} from './services/assessora';
import './assessora.css';

interface AssessoraPageProps {
  generate?: GenerateLesson;
  send?: SendChatMessage;
  createQuestions?: CreateLessonQuestions;
}

export function AssessoraPage({
  generate = generateLesson,
  send = sendChatMessage,
  createQuestions = createLessonQuestions,
}: AssessoraPageProps) {
  const { materials } = useMateriais();
  return (
    <>
      <p className="note ai-notice" role="note">
        A IA da assessora ainda não está disponível nesta versão do MedFoco: ela chega numa próxima
        fase. Enquanto isso, você já pode conhecer a tela e preparar anexos.
      </p>
      <AulaGuiada generate={generate} createQuestions={createQuestions} />
      <Chat materials={materials.filter((m) => m.notes.trim())} send={send} />
    </>
  );
}
