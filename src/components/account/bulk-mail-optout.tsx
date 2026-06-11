"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { setBulkMailOptOutAction } from "@/lib/actions/bulk-mail-actions";

export function BulkMailOptOut({ initial }: { initial: boolean }) {
  const [optOut, setOptOut] = useState(initial);
  const [pending, setPending] = useState(false);

  async function toggle(next: boolean) {
    setOptOut(next);
    setPending(true);
    const res = await setBulkMailOptOutAction(next);
    setPending(false);
    if (!res.ok) { setOptOut(!next); toast.error(res.error ?? "Falha."); } else toast.success("Preferência salva.");
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <Switch checked={!optOut} disabled={pending} onCheckedChange={(c) => toggle(!c)} />
      Receber comunicados e novidades por e-mail
    </label>
  );
}
