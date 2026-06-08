"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateDisplayNameAction } from "@/lib/actions/account-actions";

export function DisplayNameForm({ initial }: { initial: string }) {
  const router = useRouter();
  const [name, setName] = useState(initial);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await updateDisplayNameAction({ displayName: name });
    setPending(false);
    if (res.ok) {
      toast.success(res.message ?? "Nome atualizado.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Não foi possível atualizar.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="form form--narrow">
      <div className="field">
        <Label htmlFor="dn">Nome de exibição</Label>
        <Input id="dn" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={120} />
        <p className="field__hint">Aparece nos seus guias e no perfil.</p>
      </div>
      <Button type="submit" disabled={pending || name.trim().length < 2}>
        {pending ? "Salvando…" : "Salvar"}
      </Button>
    </form>
  );
}
