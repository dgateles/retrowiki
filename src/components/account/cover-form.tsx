"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImageUpload } from "@/components/admin/image-upload";
import { setCoverAction } from "@/lib/actions/account-actions";

export function CoverForm({ initial }: { initial: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [, start] = useTransition();

  function persist(url: string) {
    setValue(url);
    start(async () => {
      const res = await setCoverAction(url);
      if (res.ok) {
        toast.success(url ? "Capa atualizada." : "Capa removida.");
        router.refresh();
      } else {
        toast.error(res.error ?? "Falha.");
        setValue(initial);
      }
    });
  }

  return <ImageUpload value={value} onChange={persist} folder="covers" />;
}
