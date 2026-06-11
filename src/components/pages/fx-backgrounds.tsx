"use client";

import { RetroGrid } from "@/components/ui/retro-grid";
import { Meteors } from "@/components/ui/meteors";
import { Particles } from "@/components/ui/particles";
import { DotPattern } from "@/components/ui/dot-pattern";
import { Ripple } from "@/components/ui/ripple";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { InteractiveGridPattern } from "@/components/ui/interactive-grid-pattern";
import LightRays from "@/components/LightRays";
import { cn } from "@/lib/utils";

// Verde-esmeralda da marca (≈ --primary), usado nos efeitos que aceitam cor.
const EMERALD = "#10b981";

// Hexágonos em esmeralda (SVG inline como data-URI) — padrão geométrico leve.
const HEX_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100' viewBox='0 0 56 100'%3E%3Cg fill='none' stroke='%2310b981' stroke-opacity='0.25' stroke-width='1.2'%3E%3Cpath d='M28 0l28 16v32L28 64 0 48V16z'/%3E%3Cpath d='M28 36l28 16v32L28 100 0 84V52z'/%3E%3C/g%3E%3C/svg%3E\")";

/** Renderiza o fundo animado (Magic UI / React Bits) da seção conforme o tipo. */
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
    case "animgrid":
      return (
        <AnimatedGridPattern
          className="absolute inset-0 h-full w-full fill-primary/20 stroke-primary/25"
          numSquares={40}
          maxOpacity={0.35}
          duration={3}
        />
      );
    case "interactivegrid":
      return <InteractiveGridPattern className="absolute inset-0 h-full w-full" squares={[40, 20]} squaresClassName="fill-transparent stroke-primary/20 hover:fill-primary/30" />;
    case "hexagon":
      return <div className="absolute inset-0" aria-hidden="true" style={{ backgroundImage: HEX_BG, backgroundSize: "56px 100px" }} />;
    case "striped":
      return (
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, color-mix(in srgb, var(--primary) 12%, transparent) 0, color-mix(in srgb, var(--primary) 12%, transparent) 1px, transparent 1px, transparent 12px)",
          }}
        />
      );
    case "lightrays":
      return (
        <div className="absolute inset-0">
          <LightRays raysOrigin="top-center" raysColor={EMERALD} raysSpeed={0.8} lightSpread={1.1} rayLength={1.4} className="!h-full !w-full" />
        </div>
      );
    default:
      return null;
  }
}
