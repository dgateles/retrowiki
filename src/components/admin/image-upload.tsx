"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, X, Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadImageAction } from "@/lib/actions/upload-actions";

export function ImageUpload({
  value,
  onChange,
  folder,
  shape = "rect",
}: {
  value: string;
  onChange: (url: string) => void;
  folder: "badges" | "ranks" | "quests" | "pages" | "avatars" | "covers" | "gallery";
  shape?: "rect" | "round";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onPick(file: File) {
    setBusy(true);
    const fd = new FormData();
    fd.set("folder", folder);
    fd.set("file", file);
    const res = await uploadImageAction(fd);
    setBusy(false);
    if (res.ok && res.url) {
      onChange(res.url);
      toast.success("Imagem enviada.");
    } else {
      toast.error(res.error ?? "Falha ao enviar.");
    }
  }

  return (
    <div className="image-upload">
      <input
        ref={inputRef}
        type="file"
        aria-label="Selecionar imagem para enviar"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        aria-label={value ? "Trocar imagem" : "Enviar imagem"}
        className={cn("image-upload__drop", shape === "round" && "image-upload__drop--round")}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="image-upload__preview" />
        ) : (
          <Upload className="size-5 text-muted-foreground" aria-hidden="true" />
        )}
        <span className="image-upload__overlay" aria-hidden="true">
          {busy ? <Loader2 className="size-5 animate-spin" /> : <Camera className="size-5" />}
        </span>
      </button>
      <div className="image-upload__actions">
        <button type="button" className="image-upload__cta" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? "Enviando…" : value ? "Trocar imagem" : "Enviar imagem"}
        </button>
        {value && (
          <button type="button" className="image-upload__remove" disabled={busy} onClick={() => onChange("")}>
            <X className="size-3.5" aria-hidden="true" /> Remover
          </button>
        )}
      </div>
    </div>
  );
}
