"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const ALL = "__all";

export type FilterDef = {
  name: string;
  label: string;
  value: string;
  allLabel: string;
  options: { value: string; label: string }[];
};

export function FilterBar({ path, filters }: { path: string; filters: FilterDef[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const current = Object.fromEntries(filters.map((f) => [f.name, f.value]));

  function change(name: string, raw: string) {
    const next = { ...current, [name]: raw === ALL ? "" : raw };
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v) sp.set(k, v);
    const qs = sp.toString();
    start(() => router.push(qs ? `${path}?${qs}` : path));
  }

  return (
    <div className="filter-bar" data-pending={pending ? "" : undefined}>
      {filters.map((f) => (
        <div key={f.name} className="filter-bar__field">
          <Label htmlFor={`f-${f.name}`} className="filter-bar__label">
            {f.label}
          </Label>
          <Select value={f.value || ALL} onValueChange={(v) => change(f.name, v)}>
            <SelectTrigger id={`f-${f.name}`} aria-label={f.label}>
              <SelectValue placeholder={f.allLabel} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{f.allLabel}</SelectItem>
              {f.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}
