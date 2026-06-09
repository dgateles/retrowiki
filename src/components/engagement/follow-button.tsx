"use client";

import { useState } from "react";
import { Bell, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleFollowAction } from "@/lib/actions/engagement-actions";

export function FollowButton({ articleId, initialFollowing }: { articleId: number; initialFollowing: boolean }) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    const res = await toggleFollowAction(articleId);
    setPending(false);
    if (res.ok && res.data) {
      setFollowing(res.data.following);
      toast.success(res.data.following ? "Você está seguindo este guia." : "Você deixou de seguir.");
    } else {
      toast.error(res.error ?? "Não foi possível seguir.");
    }
  }

  return (
    <Button type="button" variant={following ? "secondary" : "outline"} size="sm" onClick={toggle} disabled={pending}>
      {following ? <Check className="size-4" aria-hidden="true" /> : <Bell className="size-4" aria-hidden="true" />}
      {following ? "Seguindo" : "Seguir"}
    </Button>
  );
}
