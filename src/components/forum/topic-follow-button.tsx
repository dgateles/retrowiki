"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleFollowTopicAction } from "@/lib/actions/forum-actions";

export function TopicFollowButton({ topicId, initialFollowing }: { topicId: number; initialFollowing: boolean }) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, start] = useTransition();

  return (
    <Button
      type="button"
      variant={following ? "secondary" : "outline"}
      size="sm"
      disabled={pending}
      aria-pressed={following}
      onClick={() =>
        start(async () => {
          const res = await toggleFollowTopicAction(topicId);
          if (res.ok && res.data) {
            setFollowing(res.data.following);
            toast.success(res.data.following ? "Seguindo o tópico." : "Deixou de seguir.");
          } else {
            toast.error(res.error ?? "Não foi possível atualizar.");
          }
        })
      }
    >
      {following ? <BellOff className="size-4" aria-hidden="true" /> : <Bell className="size-4" aria-hidden="true" />}
      {following ? "Seguindo" : "Seguir"}
    </Button>
  );
}
