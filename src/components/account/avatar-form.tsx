"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImageUpload } from "@/components/admin/image-upload";
import { setAvatarAction } from "@/lib/actions/account-actions";

export function AvatarForm({ initial }: { initial: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [, start] = useTransition();

  function persist(url: string) {
    setValue(url);
    start(async () => {
      const res = await setAvatarAction(url);
      if (res.ok) {
        toast.success(url ? "Avatar atualizado." : "Avatar removido.");
        router.refresh();
      } else {
        toast.error(res.error ?? "Falha.");
        setValue(initial);
      }
    });
  }

  return <ImageUpload value={value} onChange={persist} folder="avatars" shape="round" />;
}
