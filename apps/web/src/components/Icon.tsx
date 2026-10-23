import {
  BookOpen,
  Calendar,
  Check,
  ChevronRight,
  CircleCheck,
  CircleHelp,
  CircleX,
  Clock,
  Coffee,
  Compass,
  FileText,
  Brain,
  Ellipsis,
  Flag,
  House,
  Image,
  Info,
  Laptop,
  Lightbulb,
  MessageCircle,
  Moon,
  Network,
  NotebookText,
  Paperclip,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  SquarePen,
  Sun,
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
  marca: Brain,
  mais: Ellipsis,
  info: Info,
  seta: ChevronRight,
  inicio: House,
  agenda: Calendar,
  mapa: Network,
  assessora: MessageCircle,
  busca: Search,
  'tema-claro': Sun,
  'tema-escuro': Moon,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export function Icon({ name }: { name: IconName }) {
  const Component = ICONS[name];
  return <Component className="icon" aria-hidden="true" focusable="false" />;
}
