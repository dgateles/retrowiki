"use client";

import { useState } from "react";
import { Dialog as Primitive } from "radix-ui";
import { X } from "lucide-react";
import type { PostAttachment } from "@/lib/forum-attachments";

/** Galeria de anexos de um post + visualizador (lightbox) ao clicar. */
export function PostAttachments({ attachments }: { attachments: PostAttachment[] }) {
  const [open, setOpen] = useState<PostAttachment | null>(null);
  if (attachments.length === 0) return null;

  return (
    <>
      <ul className="fpost__attachments" aria-label="Anexos">
        {attachments.map((a) => (
          <li key={a.id}>
            <button type="button" className="fpost__attach" onClick={() => setOpen(a)} aria-label={`Ampliar ${a.filename}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.url} alt={a.filename} loading="lazy" className="fpost__attach-img" />
            </button>
          </li>
        ))}
      </ul>

      <Primitive.Root open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <Primitive.Portal>
          <Primitive.Overlay className="fixed inset-0 z-50 bg-black/85 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Primitive.Content
            className="fixed inset-0 z-50 flex items-center justify-center p-4 data-[state=open]:animate-in data-[state=open]:zoom-in-95 focus:outline-none"
            aria-describedby={undefined}
          >
            <Primitive.Title className="sr-only">{open?.filename ?? "Imagem"}</Primitive.Title>
            {open && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={open.url} alt={open.filename} className="max-h-[90vh] max-w-[92vw] rounded-lg object-contain shadow-2xl" />
            )}
            <Primitive.Close
              className="fixed right-4 top-4 grid size-10 place-items-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label="Fechar"
            >
              <X className="size-5" aria-hidden="true" />
            </Primitive.Close>
          </Primitive.Content>
        </Primitive.Portal>
      </Primitive.Root>
    </>
  );
}
