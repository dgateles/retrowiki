"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleFollowUserAction } from "@/lib/actions/follow-actions";

/** Botão de seguir/deixar de seguir um usuário. */
export function FollowButton({ targetId, initialFollowing }: { targetId: number; initialFollowing: boolean }) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, start] = useTransition();

  function toggle() {
    start(async () => {
      const res = await toggleFollowUserAction(targetId);
      if (res.ok) {
        setFollowing(!!res.data?.following);
        toast.success(res.data?.following ? "Agora você segue este membro." : "Você deixou de seguir.");
        router.refresh();
      } else {
        toast.error(res.error ?? "Não foi possível concluir.");
      }
    });
  }

  return (
    <Button variant={following ? "secondary" : "default"} size="sm" disabled={pending} onClick={toggle}>
      {following ? <><UserCheck className="size-4" aria-hidden="true" /> Seguindo</> : <><UserPlus className="size-4" aria-hidden="true" /> Seguir</>}
    </Button>
  );
}
