"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { uploadImageAction } from "@/lib/actions/upload-actions";

export type PickedAttachment = { url: string; filename: string; contentType: string };

const MAX = 8;

/** Seletor de anexos de imagem para um post do fórum (envia ao BunnyCDN). */
export function AttachmentPicker({ value, onChange }: { value: PickedAttachment[]; onChange: (v: PickedAttachment[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function addFiles(files: FileList) {
    const room = MAX - value.length;
    if (room <= 0) { toast.error(`Máximo de ${MAX} anexos.`); return; }
    const picked = Array.from(files).slice(0, room);
    setBusy(true);
    const added: PickedAttachment[] = [];
    for (const file of picked) {
      const fd = new FormData();
      fd.set("folder", "forum");
      fd.set("file", file);
      const res = await uploadImageAction(fd);
      if (res.ok && res.url) added.push({ url: res.url, filename: file.name, contentType: file.type });
      else toast.error(res.error ?? `Falha ao enviar ${file.name}.`);
    }
    setBusy(false);
    if (added.length) onChange([...value, ...added]);
  }

  function remove(url: string) {
    onChange(value.filter((a) => a.url !== url));
  }

  return (
    <div className="fatt-picker">
      <input
        ref={inputRef}
        type="file"
        multiple
        aria-label="Selecionar imagens para anexar"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }}
      />
      {value.length > 0 && (
        <ul className="fatt-picker__list">
          {value.map((a) => (
            <li key={a.url} className="fatt-picker__item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.url} alt={a.filename} className="fatt-picker__thumb" />
              <button type="button" className="fatt-picker__remove" aria-label={`Remover ${a.filename}`} onClick={() => remove(a.url)}>
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className="fatt-picker__add"
        disabled={busy || value.length >= MAX}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ImagePlus className="size-4" aria-hidden="true" />}
        {busy ? "Enviando…" : "Anexar imagem"}
        <span className="fatt-picker__count">{value.length}/{MAX}</span>
      </button>
    </div>
  );
}
