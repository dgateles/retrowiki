"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { createPageAction } from "@/lib/actions/page-actions";

export function NewPageButton() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [pending, setPending] = useState(false);

  async function create() {
    setPending(true);
    const res = await createPageAction(title);
    setPending(false);
    if (res.ok && res.data) {
      router.push(`/admin/paginas/${res.data.id}`);
    } else {
      toast.error(res.error ?? "Falha ao criar.");
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="size-4" aria-hidden="true" /> Nova página</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Nova página</DialogTitle>
        <p className="muted mt-1">Dê um título. Você monta o conteúdo no construtor em seguida.</p>
        <Input className="mt-4" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Sobre a RetroWiki" maxLength={200} autoFocus />
        <div className="modal-actions">
          <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancelar</Button></DialogClose>
          <Button type="button" size="sm" onClick={create} disabled={pending || title.trim().length < 3}>
            {pending ? "Criando…" : "Criar e montar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
