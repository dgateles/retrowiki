"use client";

import { useId } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

/** Card que agrupa linhas de configuração com divisória. */
export function SettingGroup({ children }: { children: React.ReactNode }) {
  return <div className="divide-y divide-border overflow-hidden rounded-lg border border-border [&>*]:px-4">{children}</div>;
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
    <div className="flex items-start gap-3 py-3">
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        <Label htmlFor={id} className="font-medium">{label}</Label>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}
