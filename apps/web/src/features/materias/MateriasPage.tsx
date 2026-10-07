import { useState } from 'react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import type { Material } from '../../data/types';
import { useFocusRequest } from '../../shared/useFocusRequest';
import { FormNovoMaterial } from './components/FormNovoMaterial';
import { MaterialItem } from './components/MaterialItem';
import { useMateriais } from './hooks/useMateriais';
import { summarizeMaterial, type SummarizeMaterial } from './services/resumirMaterial';
import { groupBySubject } from './utils/materias';
import './materias.css';

const LIST_TITLE_ID = 'materias-lista-title';

export function MateriasPage({ summarize = summarizeMaterial }: { summarize?: SummarizeMaterial }) {
  const { materials, loading, loadError, addMaterial, deleteMaterial } = useMateriais();
  const [pending, setPending] = useState<Material | null>(null);
  const [error, setError] = useState('');
  const focus = useFocusRequest();
  const groups = groupBySubject(materials);

  async function confirmDelete(id: string) {
    setPending(null);
    setError('');
    try {
      await deleteMaterial(id);
      focus(LIST_TITLE_ID);
    } catch {
      setError('Não foi possível excluir o material. Tente novamente.');
    }
  }

  return (
    <>
      <FormNovoMaterial onSave={addMaterial} />
      <section className="card" aria-labelledby={LIST_TITLE_ID}>
        <h2 id={LIST_TITLE_ID} tabIndex={-1}>
          Seus materiais
        </h2>
        {loadError ? (
          <div className="empty" role="alert">
            Não foi possível carregar os materiais.
          </div>
        ) : loading ? null : groups.length ? (
          groups.map((group, index) => (
            <div
              key={group.subject}
              className="subject-group"
              role="group"
              aria-labelledby={`materia-${index}`}
            >
              <h3 id={`materia-${index}`}>{group.subject}</h3>
              <ul className="material-list">
                {group.materials.map((material) => (
                  <MaterialItem
                    key={material.id}
                    material={material}
                    onDelete={setPending}
                    summarize={summarize}
                  />
                ))}
              </ul>
            </div>
          ))
        ) : (
          <div className="empty">Nenhum material ainda.</div>
        )}
        <div className="status" role="alert">
          {error}
        </div>
      </section>
      {pending && (
        <ConfirmDialog
          title="Excluir material?"
          message={`Tem certeza que deseja excluir o material "${pending.title}"?`}
          confirmLabel="Excluir"
          onCancel={() => setPending(null)}
          onConfirm={() => confirmDelete(pending.id)}
        />
      )}
    </>
  );
}
