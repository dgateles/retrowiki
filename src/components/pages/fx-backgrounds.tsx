// Fundos animados no estilo Magic UI / React Bits. Puro CSS (sem JS), seguros
// como server components. Respeitam prefers-reduced-motion via CSS.

export function RetroGrid() {
  return (
    <div className="fx-retrogrid" aria-hidden="true">
      <div className="fx-retrogrid__grid" />
    </div>
  );
}

export function Meteors({ count = 14 }: { count?: number }) {
  return (
    <div className="fx-meteors" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="fx-meteor"
          style={{
            left: `${(i * 61) % 100}%`,
            animationDelay: `${((i * 7) % 50) / 10}s`,
            animationDuration: `${3 + ((i * 3) % 5)}s`,
          }}
        />
      ))}
    </div>
  );
}

export function DotPattern() {
  return <div className="fx-dots" aria-hidden="true" />;
}

export function Aurora() {
  return (
    <div className="fx-aurora" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

/** Renderiza o efeito de fundo certo (exceto partículas, que é client). */
export function SectionFx({ bg }: { bg: string }) {
  if (bg === "retrogrid") return <RetroGrid />;
  if (bg === "meteors") return <Meteors />;
  if (bg === "dots") return <DotPattern />;
  if (bg === "aurora") return <Aurora />;
  return null;
}
