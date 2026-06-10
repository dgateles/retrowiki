"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadImageAction } from "@/lib/actions/upload-actions";

export function ImageUpload({
  value,
  onChange,
  folder,
  shape = "rect",
}: {
  value: string;
  onChange: (url: string) => void;
  folder: "badges" | "ranks" | "quests" | "avatars" | "covers" | "gallery";
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
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className={`image-upload__preview${shape === "round" ? " image-upload__preview--round" : ""}`} />
      ) : (
        <span className={`image-upload__placeholder${shape === "round" ? " image-upload__placeholder--round" : ""}`} aria-hidden="true">
          <Upload className="size-5" />
        </span>
      )}
      <div className="image-upload__actions">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(f);
            e.target.value = "";
          }}
        />
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
          <Upload className="size-4" aria-hidden="true" /> {busy ? "Enviando…" : value ? "Trocar" : "Enviar imagem"}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => onChange("")}>
            <X className="size-4" aria-hidden="true" /> Remover
          </Button>
        )}
      </div>
    </div>
  );
}
