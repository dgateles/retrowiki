"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ProfileFieldsManager } from "@/components/admin/profile-fields-manager";
import { ProfileSettingsForm } from "@/components/admin/profile-settings-form";
import type { GroupWithFields } from "@/lib/admin/profile-fields";

type Tab = "campos" | "config" | "completar" | "galeria";

const TABS: { key: Tab; label: string }[] = [
  { key: "campos", label: "Campos de perfil" },
  { key: "config", label: "Configurações" },
  { key: "completar", label: "Conclusão de perfil" },
  { key: "galeria", label: "Galeria de fotos" },
];

export function ProfilesTabs({
  groups,
  settings,
}: {
  groups: GroupWithFields[];
  settings: { nameMin: number; nameMax: number };
}) {
  const [tab, setTab] = useState<Tab>("campos");
  return (
    <div className="mt-6">
      <div className="perm-form__tabs" role="tablist" aria-label="Seções de perfis">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={cn("perm-form__tab", tab === t.key && "perm-form__tab--active")}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "campos" && <ProfileFieldsManager groups={groups} />}
        {tab === "config" && <ProfileSettingsForm initial={settings} />}
        {tab === "completar" && (
          <p className="muted">Etapas de conclusão de perfil pós-cadastro. Em breve.</p>
        )}
        {tab === "galeria" && (
          <p className="muted">Galeria de fotos dos membros. Em breve.</p>
        )}
      </div>
    </div>
  );
}
