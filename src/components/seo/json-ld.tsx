/**
 * Renderiza JSON-LD com segurança. O `<` é escapado para `<` para que
 * conteúdo do usuário (título, descrição) nunca feche a tag <script>.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
