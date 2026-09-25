import type { ReactNode } from 'react';

interface PlaceholderPageProps {
  title: string;
  /** O que esta área oferece no app original (legacy/MedFoco.html). */
  legacyFeatures: readonly string[];
  children?: ReactNode;
}

/** Área ainda em migração: mostra o que existe no app original e será reconstruído. */
export function PlaceholderPage({ title, legacyFeatures, children }: PlaceholderPageProps) {
  return (
    <>
      <section className="card" aria-labelledby="placeholder-title">
        <h2 id="placeholder-title">{title}</h2>
        <p className="note">
          Esta área ainda está sendo migrada para a nova versão. No aplicativo original ela oferece:
        </p>
        <ul className="placeholder-list">
          {legacyFeatures.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </section>
      {children}
    </>
  );
}
