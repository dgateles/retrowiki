"use client";

import { useEffect } from "react";

// Último recurso: só dispara quando o PRÓPRIO layout raiz falha (o error.tsx do
// grupo (main) cobre o resto). Precisa renderizar o próprio <html>/<body> porque
// substitui o layout raiz. Estilos inline para não depender de nada que possa ter
// falhado junto.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0f1c", color: "#f8fafc", fontFamily: "system-ui, sans-serif", padding: "1.5rem", textAlign: "center" }}>
        <div style={{ maxWidth: "28rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Algo deu errado</h1>
          <p style={{ color: "#94a3b8", marginBottom: "1.5rem" }}>
            Tivemos um problema inesperado. Tente recarregar a página.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{ cursor: "pointer", border: 0, borderRadius: "0.5rem", background: "#10b981", color: "#052e1a", fontWeight: 600, padding: "0.625rem 1.25rem", fontSize: "0.95rem" }}
          >
            Tentar de novo
          </button>
        </div>
      </body>
    </html>
  );
}
