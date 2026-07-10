"use client";

import { useState } from "react";
import { X } from "lucide-react";

/** Entrada de tags em chips: adiciona por Enter/vírgula, remove por X ou Backspace. */
export function TagInput({ tags, onChange, max = 6 }: { tags: string[]; onChange: (t: string[]) => void; max?: number }) {
  const [text, setText] = useState("");

  function add(raw: string) {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    const next = [...tags];
    for (const p of parts) {
      const norm = p.slice(0, 40);
      if (norm && next.length < max && !next.some((t) => t.toLowerCase() === norm.toLowerCase())) next.push(norm);
    }
    onChange(next);
    setText("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (text.trim()) add(text);
    } else if (e.key === "Backspace" && !text && tags.length) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div className="ftag-input">
      {tags.map((t, i) => (
        <span key={`${t}-${i}`} className="ftag-chip">
          {t}
          <button type="button" onClick={() => onChange(tags.filter((_, j) => j !== i))} aria-label={`Remover tag ${t}`}>
            <X className="size-3" aria-hidden="true" />
          </button>
        </span>
      ))}
      {tags.length < max && (
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => text.trim() && add(text)}
          placeholder={tags.length ? "" : "Adicione tags e pressione Enter…"}
          className="ftag-input__field"
          maxLength={40}
          aria-label="Adicionar tag"
        />
      )}
    </div>
  );
}
