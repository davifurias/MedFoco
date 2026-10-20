import { X, type LucideIcon } from 'lucide-react';

/**
 * Ícones desenhados do MedFoco (biblioteca lucide, só os usados entram no app). São sempre
 * decorativos: quem precisa de nome acessível o dá ao botão ou ao texto ao lado, nunca ao ícone.
 * Para usar outro ícone, inclua-o aqui.
 */
const ICONS = {
  remover: X,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export function Icon({ name }: { name: IconName }) {
  const Component = ICONS[name];
  return <Component className="icon" aria-hidden="true" focusable="false" />;
}
