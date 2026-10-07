import type { Material } from '../../../data/types';
import type { SummarizeMaterial } from '../services/resumirMaterial';
import { notesPreview } from '../utils/materias';
import { ResumirVideo } from './ResumirVideo';

interface MaterialItemProps {
  material: Material;
  onDelete: (material: Material) => void;
  summarize: SummarizeMaterial;
}

/** Material: título (com link, se for vídeo), anotações, assuntos-chave e excluir. */
export function MaterialItem({ material, onDelete, summarize }: MaterialItemProps) {
  const isVideo = material.type === 'video';
  const label = `${isVideo ? '🎥' : '📝'} ${material.title}`;

  return (
    <li className="material">
      <div className="file-row">
        {material.videoLink ? (
          <a href={material.videoLink} target="_blank" rel="noopener noreferrer">
            {label}
            <span className="sr-only"> (abre em uma nova aba)</span>
          </a>
        ) : (
          <span className="file-title">{label}</span>
        )}
        <button
          type="button"
          className="del"
          aria-label={`Excluir material ${material.title}`}
          onClick={() => onDelete(material)}
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>
      {material.notes && <div className="note">{notesPreview(material.notes)}</div>}
      {material.tags.length > 0 && (
        <ul className="tag-list" aria-label="Assuntos-chave">
          {material.tags.map((tag) => (
            <li key={tag} className="pill cat-outro">
              {tag}
            </li>
          ))}
        </ul>
      )}
      {isVideo && material.notes && <ResumirVideo materialId={material.id} summarize={summarize} />}
    </li>
  );
}
