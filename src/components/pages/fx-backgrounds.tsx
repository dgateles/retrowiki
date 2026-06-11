"use client";

import { RetroGrid } from "@/components/ui/retro-grid";
import { Meteors } from "@/components/ui/meteors";
import { Particles } from "@/components/ui/particles";
import { DotPattern } from "@/components/ui/dot-pattern";
import { Ripple } from "@/components/ui/ripple";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { cn } from "@/lib/utils";

// Verde-esmeralda da marca (≈ --primary), usado nos efeitos que aceitam cor.
const EMERALD = "#10b981";

/** Renderiza o fundo animado (Magic UI) da seção conforme o tipo. */
export function SectionFx({ bg }: { bg: string }) {
  switch (bg) {
    case "retrogrid":
      return <RetroGrid className="absolute inset-0" lightLineColor={EMERALD} darkLineColor={EMERALD} opacity={0.4} />;
    case "meteors":
      return <Meteors number={18} className="text-primary" />;
    case "particles":
      return <Particles className="absolute inset-0" quantity={90} ease={70} color={EMERALD} />;
    case "dots":
      return (
        <DotPattern
          glow
          className={cn(
            "absolute inset-0 fill-primary/35",
            "[mask-image:radial-gradient(ellipse_at_center,white,transparent_72%)]",
          )}
        />
      );
    case "ripple":
      return <Ripple className="absolute inset-0" mainCircleOpacity={0.18} />;
    case "flickering":
      return (
        <FlickeringGrid
          className="absolute inset-0"
          color={EMERALD}
          squareSize={3}
          gridGap={6}
          maxOpacity={0.3}
          flickerChance={0.25}
        />
      );
    default:
      return null;
  }
}
