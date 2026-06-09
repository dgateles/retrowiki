import { RichContent } from "@/components/blocks/rich-content";
import { RichDocSchema, isRichDoc } from "@/lib/blocks/rich-schema";

// Corpo do comentário: novo formato rico (JSON do editor) ou texto puro (antigo).
export function CommentBody({ body }: { body: string }) {
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(body);
  } catch {
    parsed = null;
  }
  if (isRichDoc(parsed)) {
    const r = RichDocSchema.safeParse(parsed);
    if (r.success) {
      return (
        <div className="comment__body">
          <RichContent doc={r.data} />
        </div>
      );
    }
  }
  return <p className="comment__body">{body}</p>;
}
