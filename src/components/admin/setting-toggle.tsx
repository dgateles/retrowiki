"use client";

import { useId } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

/** Card que agrupa linhas de configuração com divisória. */
export function SettingGroup({ children }: { children: React.ReactNode }) {
  return <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">{children}</div>;
}

/** Linha de configuração: rótulo (+ descrição) à esquerda, Switch à direita. */
export function SettingToggle({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="min-w-0">
        <Label htmlFor={id} className="font-normal">{label}</Label>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} className="shrink-0" />
    </div>
  );
}
