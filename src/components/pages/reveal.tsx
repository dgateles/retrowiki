"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type AnimType = "none" | "fade" | "up" | "left" | "right" | "zoom";

/** Revela o conteúdo com uma animação de entrada quando ele entra na viewport.
 * Respeita prefers-reduced-motion (o CSS neutraliza o efeito). */
export function Reveal({ anim, className, children }: { anim: AnimType; className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(anim === "none");

  useEffect(() => {
    if (anim === "none") return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [anim]);

  if (anim === "none") return <div className={className}>{children}</div>;
  return (
    <div ref={ref} className={cn(className, "reveal", `reveal--${anim}`, shown && "reveal--in")}>
      {children}
    </div>
  );
}
