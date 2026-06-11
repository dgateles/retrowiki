"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { seedHomePageAction } from "@/lib/actions/page-actions";

/** Abre (ou cria) a página inicial editável a partir da home atual. */
export function HomePageButton({ hasHome }: { hasHome: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function open() {
    setPending(true);
    const res = await seedHomePageAction();
    setPending(false);
    if (res.ok && res.data) {
      router.push(`/construtor/${res.data.id}`);
    } else {
      toast.error(res.error ?? "Falha ao abrir a página inicial.");
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={open} disabled={pending}>
      <Home className="size-4" aria-hidden="true" />
      {pending ? "Abrindo…" : hasHome ? "Editar página inicial" : "Editar a home no construtor"}
    </Button>
  );
}
