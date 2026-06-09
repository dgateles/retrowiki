"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
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
          await deleteNotificationAction(id);
          router.refresh();
        })
      }
    >
      <X className="size-4" aria-hidden="true" />
    </button>
  );
}
