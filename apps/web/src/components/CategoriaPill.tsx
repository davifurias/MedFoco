import { EVENT_CATEGORY_LABELS } from '../data/categories';
import type { EventCategory } from '../data/types';

export function CategoriaPill({ category }: { category: EventCategory }) {
  const label = EVENT_CATEGORY_LABELS[category] ?? category;
  const known = category in EVENT_CATEGORY_LABELS;
  return <span className={`pill cat-${known ? category : 'outro'}`}>{label}</span>;
}
