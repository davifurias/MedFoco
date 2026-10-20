import {
  BookOpen,
  Calendar,
  Check,
  CircleCheck,
  CircleHelp,
  CircleX,
  Clock,
  Coffee,
  Compass,
  FileText,
  Flag,
  Image,
  Laptop,
  Lightbulb,
  MessageCircle,
  NotebookText,
  Paperclip,
  RefreshCw,
  Settings,
  Sparkles,
  SquarePen,
  Timer,
  Video,
  X,
  type LucideIcon,
} from 'lucide-react';

/**
 * Ícones desenhados do MedFoco (biblioteca lucide, só os usados entram no app). São sempre
 * decorativos: quem precisa de nome acessível o dá ao botão ou ao texto ao lado, nunca ao ícone.
 * Para usar outro ícone, inclua-o aqui. Os nomes dizem o que o ícone representa no app.
 */
const ICONS = {
  remover: X,
  tarefa: CircleCheck,
  evento: Calendar,
  horario: Clock,
  ideia: Lightbulb,
  caderno: NotebookText,
  material: FileText,
  nota: SquarePen,
  video: Video,
  materias: BookOpen,
  questoes: CircleHelp,
  perguntar: MessageCircle,
  ia: Sparkles,
  atualizar: RefreshCw,
  organizar: Compass,
  perfil: Settings,
  acerto: Check,
  erro: X,
  correto: CircleCheck,
  errado: CircleX,
  foco: Timer,
  pausa: Coffee,
  prioridade: Flag,
  anexo: Paperclip,
  imagem: Image,
  arquivo: FileText,
  computador: Laptop,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export function Icon({ name }: { name: IconName }) {
  const Component = ICONS[name];
  return <Component className="icon" aria-hidden="true" focusable="false" />;
}
