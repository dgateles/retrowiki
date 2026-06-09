"use client";

import { Reply } from "lucide-react";
import type { JSONContent } from "@tiptap/react";

export const COMMENT_REPLY_EVENT = "rw-comment-reply";

type Props = {
  quotedDoc: JSONContent;
  authorName: string;
  when: string;
};

// Ao responder, insere o comentário citado (blockquote com cabeçalho) no editor
// do formulário e foca, para o usuário escrever a resposta abaixo.
export function CommentReplyButton({ quotedDoc, authorName, when }: Props) {
  function reply() {
    const quote: JSONContent = {
      type: "doc",
      content: [
        {
          type: "blockquote",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: `${when}, ${authorName} disse:`, marks: [{ type: "bold" }] }],
            },
            ...((quotedDoc.content ?? []).length ? quotedDoc.content! : [{ type: "paragraph" }]),
          ],
        },
        { type: "paragraph" },
      ],
    };
    window.dispatchEvent(new CustomEvent(COMMENT_REPLY_EVENT, { detail: quote }));
  }

  return (
    <button type="button" className="comment__action" onClick={reply}>
      <Reply className="size-3.5" aria-hidden="true" /> Responder
    </button>
  );
}
