"use client";

import { useId } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SYSTEMS = [
  "NES / Famicom", "SNES", "Game Boy / GBC", "Game Boy Advance", "Nintendo 64",
  "Nintendo DS", "GameCube", "Master System", "Mega Drive", "Game Gear",
  "Sega Saturn", "Dreamcast", "PS1", "PSP", "Neo Geo", "Arcade (FBNeo/MAME)",
  "Atari 2600", "TurboGrafx-16 / PC Engine", "WonderSwan", "Nintendo 3DS",
];

function level(score: number): { label: string; mod: string } {
  if (score >= 95) return { label: "Excelente", mod: "status--ok" };
  if (score >= 75) return { label: "Bom", mod: "status--warn" };
  if (score >= 50) return { label: "Jogável", mod: "status--warn" };
  return { label: "Ruim", mod: "status--bad" };
}

/** Lista de strings (prós, contras), com adicionar e remover. */
export function ListEditor({
  legend,
  items,
  onChange,
  placeholder,
}: {
  legend: string;
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const set = (i: number, v: string) => onChange(items.map((it, idx) => (idx === i ? v : it)));
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, ""]);

  return (
    <fieldset className="repeat">
      <legend className="repeat__legend">{legend}</legend>
      {items.length === 0 && <p className="repeat__empty">Nenhum item.</p>}
      {items.map((item, i) => (
        <div key={i} className="repeat__row">
          <Input
            className="repeat__grow"
            value={item}
            placeholder={placeholder}
            aria-label={`${legend} ${i + 1}`}
            onChange={(e) => set(i, e.target.value)}
          />
          <button type="button" className="repeat__remove" onClick={() => remove(i)} aria-label={`Remover item ${i + 1}`}>
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="size-4" aria-hidden="true" /> Adicionar
      </Button>
    </fieldset>
  );
}

export type EmuRow = { system: string; score: number };

/** Editor de emulação: sistema + nota, por linha, com nível calculado. */
export function EmulationEditor({
  items,
  onChange,
}: {
  items: EmuRow[];
  onChange: (next: EmuRow[]) => void;
}) {
  const listId = useId();
  const set = (i: number, patch: Partial<EmuRow>) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { system: "", score: 75 }]);

  return (
    <fieldset className="repeat">
      <legend className="repeat__legend">Emulação por sistema</legend>
      <datalist id={listId}>
        {SYSTEMS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      {items.length === 0 && <p className="repeat__empty">Nenhum sistema.</p>}
      {items.map((row, i) => {
        const lv = level(row.score);
        return (
          <div key={i} className="repeat__row">
            <Input
              className="repeat__grow"
              list={listId}
              value={row.system}
              placeholder="Sistema"
              aria-label={`Sistema ${i + 1}`}
              onChange={(e) => set(i, { system: e.target.value })}
            />
            <Input
              className="repeat__score"
              type="number"
              min={0}
              max={100}
              value={row.score}
              aria-label={`Nota do sistema ${i + 1} (0 a 100)`}
              onChange={(e) => set(i, { score: Number(e.target.value) })}
            />
            <span className={`repeat__level ${lv.mod}`} aria-hidden="true">{lv.label}</span>
            <button type="button" className="repeat__remove" onClick={() => remove(i)} aria-label={`Remover sistema ${i + 1}`}>
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="size-4" aria-hidden="true" /> Adicionar sistema
      </Button>
    </fieldset>
  );
}
