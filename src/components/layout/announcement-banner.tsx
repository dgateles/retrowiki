"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Announcement } from "@/lib/announcements";

const KEY = "rw-dismissed-announcements";

export function AnnouncementBanner({ items }: { items: Announcement[] }) {
  const [dismissed, setDismissed] = useState<number[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setDismissed(JSON.parse(localStorage.getItem(KEY) ?? "[]"));
    } catch {
      setDismissed([]);
    }
    setReady(true);
  }, []);

  function dismiss(id: number) {
    const next = [...new Set([...dismissed, id])];
    setDismissed(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignora */
    }
  }

  if (!ready) return null;
  const visible = items.filter((a) => !dismissed.includes(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="announce">
      {visible.map((a) => (
        <div key={a.id} className={cn("announce__bar", `announce__bar--${a.variant}`)} role="status">
          <p className="announce__msg">
            {a.message}
            {/^(https?:\/\/|\/)/i.test(a.linkUrl) && (
              <>
                {" "}
                <Link href={a.linkUrl} className="announce__link">{a.linkLabel || "Saiba mais"}</Link>
              </>
            )}
          </p>
          <button type="button" className="announce__close" onClick={() => dismiss(a.id)} aria-label="Dispensar aviso">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
