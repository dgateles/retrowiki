"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { addCommentAction } from "@/lib/actions/engagement-actions";

export function CommentForm({ articleId }: { articleId: number }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await addCommentAction({ articleId, body });
    setPending(false);
    if (res.ok) {
      setBody("");
      toast.success("Comentário publicado.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Não foi possível comentar.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <Label htmlFor="comment">Deixe um comentário</Label>
      <textarea
        id="comment"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
        minLength={2}
        maxLength={2000}
        rows={3}
        className="w-full rounded-md border border-input bg-background p-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        placeholder="Compartilhe sua experiência ou tire uma dúvida"
      />
      <Button type="submit" size="sm" disabled={pending || body.trim().length < 2}>
        {pending ? "Enviando…" : "Comentar"}
      </Button>
    </form>
  );
}
