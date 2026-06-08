"use client";

import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";

const NETWORKS: { name: string; build: (url: string, title: string) => string; glyph: React.ReactNode }[] = [
  {
    name: "Bluesky",
    build: (u, t) => `https://bsky.app/intent/compose?text=${encodeURIComponent(`${t} ${u}`)}`,
    glyph: <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true"><path d="M12 10.8C10.9 8.6 7.9 4.6 5.1 2.6 2.4.7 1.4 1 .8 1.3.1 1.6 0 2.7 0 3.3c0 .6.3 5.2.6 6 .8 2.5 3.5 3.4 6 3.1-3.7.5-7 1.9-2.7 6.6 4.8 4.9 6.6-1 7.5-4 .9 3 2 8.7 7.4 4 4.6-4.7 1.1-6.1-2.6-6.6 2.5.3 5.2-.6 6-3.1.3-.8.6-5.4.6-6 0-.6-.1-1.7-.8-2C22.6 1 21.6.7 18.9 2.6 16.1 4.6 13.1 8.6 12 10.8Z"/></svg>,
  },
  {
    name: "X",
    build: (u, t) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}`,
    glyph: <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true"><path d="M18.9 1.2h3.7l-8 9.1L24 22.8h-7.4l-5.8-7.6-6.6 7.6H.4l8.6-9.8L0 1.2h7.6l5.2 6.9 6.1-6.9Zm-1.3 19.4h2L6.5 3.3H4.3L17.6 20.6Z"/></svg>,
  },
  {
    name: "Facebook",
    build: (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`,
    glyph: <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true"><path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.7.2 2.7.2v2.9h-1.5c-1.5 0-2 .9-2 1.9V12h3.3l-.5 3.5h-2.8v8.4A12 12 0 0 0 24 12Z"/></svg>,
  },
  {
    name: "LinkedIn",
    build: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}`,
    glyph: <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true"><path d="M20.4 20.4h-3.6v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9v5.7H9.3V9h3.4v1.6h.1c.5-.9 1.6-1.9 3.4-1.9 3.6 0 4.3 2.4 4.3 5.5v6.2ZM5.3 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2ZM7.1 20.4H3.5V9h3.6v11.4ZM22.2 0H1.8C.8 0 0 .8 0 1.7v20.6C0 23.2.8 24 1.8 24h20.4c1 0 1.8-.8 1.8-1.7V1.7C24 .8 23.2 0 22.2 0Z"/></svg>,
  },
  {
    name: "Reddit",
    build: (u, t) => `https://www.reddit.com/submit?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}`,
    glyph: <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true"><path d="M24 11.8a2.2 2.2 0 0 0-3.7-1.6 11 11 0 0 0-5.8-1.8l1-4.6 3.2.7a1.6 1.6 0 1 0 .2-1l-3.6-.8a.5.5 0 0 0-.6.4l-1.1 5.1a11 11 0 0 0-5.9 1.8 2.2 2.2 0 1 0-2.4 3.6 4 4 0 0 0 0 .7c0 3.5 4.1 6.3 9.1 6.3s9.1-2.8 9.1-6.3a4 4 0 0 0 0-.7 2.2 2.2 0 0 0 1.2-2Zm-16 1.6a1.6 1.6 0 1 1 3.2 0 1.6 1.6 0 0 1-3.2 0Zm9 4.3c-1.1 1.1-3.2 1.2-3.9 1.2s-2.8 0-3.9-1.2a.4.4 0 0 1 .6-.6c.7.7 2.2.9 3.3.9s2.6-.2 3.3-.9a.4.4 0 1 1 .6.6Zm-.3-2.7a1.6 1.6 0 1 1 0-3.2 1.6 1.6 0 0 1 0 3.2Z"/></svg>,
  },
  {
    name: "Pinterest",
    build: (u, t) => `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(u)}&description=${encodeURIComponent(t)}`,
    glyph: <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true"><path d="M12 0a12 12 0 0 0-4.4 23.2c-.1-1 0-2.2.2-3.2l1.3-5.4s-.3-.6-.3-1.6c0-1.6.9-2.7 2-2.7.9 0 1.4.7 1.4 1.5 0 1-.6 2.4-.9 3.7-.3 1.1.5 2 1.6 2 2 0 3.4-2.5 3.4-5.5 0-2.3-1.5-4-4.3-4a5 5 0 0 0-5.2 5c0 .9.3 1.6.7 2 .2.3.2.4.1.6l-.2.8c0 .3-.2.4-.5.3-1.4-.6-2-2-2-3.8 0-2.8 2.4-6.2 7-6.2 3.7 0 6.2 2.7 6.2 5.6 0 3.8-2.1 6.7-5.3 6.7-1 0-2-.6-2.4-1.2l-.6 2.6c-.3 1-.9 2.2-1.3 3A12 12 0 1 0 12 0Z"/></svg>,
  },
];

export function SharePopover({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado.");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="size-4" aria-hidden="true" /> Compartilhar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="share">
        <div className="share__url">
          <span className="share__url-text">{url}</span>
          <button type="button" className="share__copy" onClick={copy} aria-label="Copiar link">
            {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
          </button>
        </div>
        <div className="share__grid">
          {NETWORKS.map((n) => (
            <a
              key={n.name}
              className="share__btn"
              href={n.build(url, title)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Compartilhar no ${n.name}`}
            >
              {n.glyph}
            </a>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
