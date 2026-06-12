"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Marquee } from "@/components/ui/marquee";

/** Faixa de logos: estática e centralizada quando os logos cabem na largura;
 *  só ativa a rolagem (marquee) quando ultrapassam o container. */
export function LogoMarquee({ children }: { children: ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState(false);

  useEffect(() => {
    const measure = () => {
      const wrap = wrapRef.current;
      const row = measureRef.current;
      if (!wrap || !row) return;
      // Sobra de ~16px evita ligar o marquee por uma diferença mínima.
      setScroll(row.scrollWidth > wrap.clientWidth + 16);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [children]);

  return (
    <div ref={wrapRef} className="relative w-full overflow-hidden">
      {/* Linha de medição (largura natural, sem quebra) — invisível, fora do fluxo. */}
      <div ref={measureRef} aria-hidden="true" className="pointer-events-none invisible absolute left-0 top-0 flex flex-nowrap items-center gap-x-14">
        {children}
      </div>

      {scroll ? (
        <Marquee className="[--duration:28s] [--gap:3.5rem]" pauseOnHover>
          {children}
        </Marquee>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 sm:gap-x-16">
          {children}
        </div>
      )}
    </div>
  );
}
