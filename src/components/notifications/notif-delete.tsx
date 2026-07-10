"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import { deleteNotificationAction } from "@/lib/actions/notification-actions";

export function NotifDelete({ id }: { id: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="notif__delete"
      aria-label="Excluir notificação"
      disabled={pending}
      onClick={() =>
        start(async () => {
          try {
            const res = await deleteNotificationAction(id);
            if (!res?.ok) {
              toast.error("Não foi possível excluir a notificação.");
              return;
            }
            router.refresh();
          } catch {
            toast.error("Não foi possível excluir a notificação.");
          }
        })
      }
    >
      <X className="size-4" aria-hidden="true" />
    </button>
  );
}
