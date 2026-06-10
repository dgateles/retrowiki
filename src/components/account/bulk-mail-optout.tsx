"use client";

import { useState } from "react";
import { toast } from "sonner";
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
    <label className="rule-form__check">
      <input type="checkbox" checked={!optOut} disabled={pending} onChange={(e) => toggle(!e.target.checked)} />{" "}
      Receber comunicados e novidades por e-mail
    </label>
  );
}
