import { useState } from 'react';
import { readableTextColor } from '../../shared/contrast';
import { useMateriais } from '../materias/hooks/useMateriais';
import './mapa.css';
import {
  MAP_HEIGHT,
  MAP_WIDTH,
  buildMapLayout,
  edgeWidth,
  notesPreview,
  shortLabel,
} from './utils/mapa';

const TITLE_ID = 'mapa-title';

export function MapaPage() {
  const { materials, loading, loadError } = useMateriais();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const layout = buildMapLayout(materials);
  const selected = materials.find((m) => m.id === selectedId) ?? null;
  const title = (
    <h2 id={TITLE_ID} tabIndex={-1}>
      Mapa visual de conexões
    </h2>
  );

  if (loadError) {
    return (
      <section className="card" aria-labelledby={TITLE_ID}>
        {title}
        <div className="empty" role="alert">
          Não foi possível carregar os materiais.
        </div>
      </section>
    );
  }
  if (loading) {
    return (
      <section className="card" aria-labelledby={TITLE_ID}>
        {title}
      </section>
    );
  }
  if (!materials.length) {
    return (
      <section className="card" aria-labelledby={TITLE_ID}>
        {title}
        <div className="empty">
          Adicione materiais com assuntos-chave (tags) na aba Matérias para ver as conexões aqui.
        </div>
      </section>
    );
  }

  const nameOf = (index: number) => layout.nodes[index]?.material.title ?? '';

  return (
    <section className="card" aria-labelledby={TITLE_ID}>
      {title}
      <p className="note">
        Cada bolinha é um material; linhas ligam materiais que compartilham assuntos-chave. Toque
        (ou use Tab e Enter) numa bolinha para ver detalhes.
      </p>
      <ul className="quick mapa-legend" aria-label="Matérias">
        {layout.subjects.map((subject) => (
          <li key={subject.name}>
            <span
              className="pill"
              style={{ background: subject.color, color: readableTextColor(subject.color) }}
            >
              {subject.name}
            </span>
          </li>
        ))}
      </ul>
      <div className="mapa-scroll">
        <svg
          className="mapa-svg"
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          role="group"
          aria-label="Mapa de materiais e conexões"
        >
          {layout.edges.map((edge) => {
            const from = layout.nodes[edge.a];
            const to = layout.nodes[edge.b];
            if (!from || !to) return null;
            return (
              <line
                key={`${from.material.id}-${to.material.id}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="var(--border)"
                strokeWidth={edgeWidth(edge.shared.length)}
                opacity={0.65}
              >
                <title>{edge.shared.join(', ')}</title>
              </line>
            );
          })}
          {layout.nodes.map((node) => {
            const { material } = node;
            const isSelected = material.id === selectedId;
            const select = () => setSelectedId(material.id);
            return (
              <g
                key={material.id}
                className="mapa-node"
                role="button"
                tabIndex={0}
                aria-label={`${material.title}, ${material.subject}`}
                aria-pressed={isSelected}
                onClick={select}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    select();
                  }
                }}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isSelected ? 19 : 16}
                  fill={node.color}
                  stroke={isSelected ? 'var(--text)' : 'var(--card)'}
                  strokeWidth={isSelected ? 3 : 2}
                />
                <text
                  x={node.x}
                  y={node.y + 32}
                  textAnchor="middle"
                  fontSize="11"
                  fill="var(--text)"
                >
                  {shortLabel(material.title)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="note mapa-detalhes" aria-live="polite">
        {selected && (
          <>
            <strong>{selected.title}</strong> · {selected.subject}
            {selected.tags.length > 0 && <div>Assuntos: {selected.tags.join(', ')}</div>}
            {selected.notes && <div className="mapa-notas">{notesPreview(selected.notes)}</div>}
          </>
        )}
      </div>
      <h3 className="mapa-subtitle">Conexões</h3>
      {layout.edges.length ? (
        <ul className="mapa-conexoes">
          {layout.edges.map((edge) => (
            <li key={`${edge.a}-${edge.b}`}>
              {nameOf(edge.a)} ↔ {nameOf(edge.b)}: {edge.shared.join(', ')}
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty">
          Nenhuma conexão ainda: materiais se ligam quando têm um assunto-chave em comum.
        </div>
      )}
    </section>
  );
}
