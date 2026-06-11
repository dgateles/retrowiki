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
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { type FxParams, fxColor, fxNum, fxBool, fxStr } from "@/lib/fx-effects";

// Efeitos shader (Three/OGL) — carregados só no cliente para evitar SSR/WebGL.
const Lightfall = dynamic(() => import("@/components/Lightfall"), { ssr: false });
const LightPillar = dynamic(() => import("@/components/LightPillar"), { ssr: false });
const Silk = dynamic(() => import("@/components/Silk"), { ssr: false });
const SideRays = dynamic(() => import("@/components/SideRays"), { ssr: false });
const PixelBlast = dynamic(() => import("@/components/PixelBlast"), { ssr: false });
const SoftAurora = dynamic(() => import("@/components/SoftAurora"), { ssr: false });
const Aurora = dynamic(() => import("@/components/Aurora"), { ssr: false });
const Grainient = dynamic(() => import("@/components/Grainient"), { ssr: false });

const FILL = "absolute inset-0 h-full w-full";

// Verde-esmeralda da marca (≈ --primary), usado nos efeitos que aceitam cor.
const EMERALD = "#10b981";

// Hexágonos em esmeralda (SVG inline como data-URI) — padrão geométrico leve.
const HEX_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100' viewBox='0 0 56 100'%3E%3Cg fill='none' stroke='%2310b981' stroke-opacity='0.25' stroke-width='1.2'%3E%3Cpath d='M28 0l28 16v32L28 64 0 48V16z'/%3E%3Cpath d='M28 36l28 16v32L28 100 0 84V52z'/%3E%3C/g%3E%3C/svg%3E\")";

/** Renderiza o fundo animado (Magic UI / React Bits) da seção conforme o tipo. */
export function SectionFx({ bg, params }: { bg: string; params?: FxParams }) {
  switch (bg) {
    case "lightfall":
      return (
        <div className={FILL}>
          <Lightfall
            className={FILL}
            colors={[fxColor(bg, params, "color1"), fxColor(bg, params, "color2"), fxColor(bg, params, "color3")]}
            backgroundColor={fxColor(bg, params, "backgroundColor")}
            speed={fxNum(bg, params, "speed")}
            streakCount={fxNum(bg, params, "streakCount")}
            streakWidth={fxNum(bg, params, "streakWidth")}
            streakLength={fxNum(bg, params, "streakLength")}
            density={fxNum(bg, params, "density")}
            twinkle={fxNum(bg, params, "twinkle")}
            glow={fxNum(bg, params, "glow")}
            backgroundGlow={fxNum(bg, params, "backgroundGlow")}
            zoom={fxNum(bg, params, "zoom")}
            mouseInteraction={fxBool(bg, params, "mouseInteraction")}
            mouseStrength={fxNum(bg, params, "mouseStrength")}
            mouseRadius={fxNum(bg, params, "mouseRadius")}
          />
        </div>
      );
    case "lightpillar":
      return (
        <div className={FILL}>
          <LightPillar
            className={FILL}
            topColor={fxColor(bg, params, "topColor")}
            bottomColor={fxColor(bg, params, "bottomColor")}
            intensity={fxNum(bg, params, "intensity")}
            rotationSpeed={fxNum(bg, params, "rotationSpeed")}
            glowAmount={fxNum(bg, params, "glowAmount")}
            pillarWidth={fxNum(bg, params, "pillarWidth")}
            pillarHeight={fxNum(bg, params, "pillarHeight")}
            noiseIntensity={fxNum(bg, params, "noiseIntensity")}
            pillarRotation={fxNum(bg, params, "pillarRotation")}
            interactive={fxBool(bg, params, "interactive")}
            mixBlendMode={(fxStr(bg, params, "mixBlendMode") || "screen") as React.CSSProperties["mixBlendMode"]}
            quality={(fxStr(bg, params, "quality") || "high") as "low" | "medium" | "high"}
          />
        </div>
      );
    case "silk":
      return (
        <div className={FILL}>
          <Silk
            speed={fxNum(bg, params, "speed")}
            scale={fxNum(bg, params, "scale")}
            noiseIntensity={fxNum(bg, params, "noiseIntensity")}
            rotation={fxNum(bg, params, "rotation")}
            color={fxColor(bg, params, "color")}
          />
        </div>
      );
    case "siderays":
      return (
        <SideRays
          className={FILL}
          rayColor1={fxColor(bg, params, "rayColor1")}
          rayColor2={fxColor(bg, params, "rayColor2")}
          origin={(fxStr(bg, params, "origin") || "top-right") as "top-right" | "top-left" | "bottom-right" | "bottom-left"}
          speed={fxNum(bg, params, "speed")}
          intensity={fxNum(bg, params, "intensity")}
          spread={fxNum(bg, params, "spread")}
          tilt={fxNum(bg, params, "tilt")}
          saturation={fxNum(bg, params, "saturation")}
          blend={fxNum(bg, params, "blend")}
          falloff={fxNum(bg, params, "falloff")}
          opacity={fxNum(bg, params, "opacity")}
        />
      );
    case "pixelblast":
      return (
        <PixelBlast
          className={FILL}
          color={fxColor(bg, params, "color")}
          variant={(fxStr(bg, params, "variant") || "square") as "square" | "circle" | "triangle" | "diamond"}
          pixelSize={fxNum(bg, params, "pixelSize")}
          patternScale={fxNum(bg, params, "patternScale")}
          patternDensity={fxNum(bg, params, "patternDensity")}
          pixelSizeJitter={fxNum(bg, params, "pixelSizeJitter")}
          speed={fxNum(bg, params, "speed")}
          edgeFade={fxNum(bg, params, "edgeFade")}
          enableRipples={fxBool(bg, params, "enableRipples")}
          liquid={fxBool(bg, params, "liquid")}
          transparent
        />
      );
    case "softaurora":
      return (
        <div className={FILL}>
          <SoftAurora
            color1={fxColor(bg, params, "color1")}
            color2={fxColor(bg, params, "color2")}
            speed={fxNum(bg, params, "speed")}
            scale={fxNum(bg, params, "scale")}
            brightness={fxNum(bg, params, "brightness")}
            noiseFrequency={fxNum(bg, params, "noiseFrequency")}
            noiseAmplitude={fxNum(bg, params, "noiseAmplitude")}
            bandHeight={fxNum(bg, params, "bandHeight")}
            bandSpread={fxNum(bg, params, "bandSpread")}
            octaveDecay={fxNum(bg, params, "octaveDecay")}
            layerOffset={fxNum(bg, params, "layerOffset")}
            colorSpeed={fxNum(bg, params, "colorSpeed")}
            enableMouseInteraction={fxBool(bg, params, "enableMouseInteraction")}
            mouseInfluence={fxNum(bg, params, "mouseInfluence")}
          />
        </div>
      );
    case "aurora":
      return (
        <div className={FILL}>
          <Aurora
            colorStops={[fxColor(bg, params, "color1"), fxColor(bg, params, "color2"), fxColor(bg, params, "color3")]}
            speed={fxNum(bg, params, "speed")}
            blend={fxNum(bg, params, "blend")}
            amplitude={fxNum(bg, params, "amplitude")}
          />
        </div>
      );
    case "grainient":
      return (
        <Grainient
          className={FILL}
          color1={fxColor(bg, params, "color1")}
          color2={fxColor(bg, params, "color2")}
          color3={fxColor(bg, params, "color3")}
          timeSpeed={fxNum(bg, params, "timeSpeed")}
          colorBalance={fxNum(bg, params, "colorBalance")}
          warpStrength={fxNum(bg, params, "warpStrength")}
          warpFrequency={fxNum(bg, params, "warpFrequency")}
          warpSpeed={fxNum(bg, params, "warpSpeed")}
          warpAmplitude={fxNum(bg, params, "warpAmplitude")}
          blendAngle={fxNum(bg, params, "blendAngle")}
          blendSoftness={fxNum(bg, params, "blendSoftness")}
          rotationAmount={fxNum(bg, params, "rotationAmount")}
          noiseScale={fxNum(bg, params, "noiseScale")}
          grainAmount={fxNum(bg, params, "grainAmount")}
          grainScale={fxNum(bg, params, "grainScale")}
          grainAnimated={fxBool(bg, params, "grainAnimated")}
          contrast={fxNum(bg, params, "contrast")}
          gamma={fxNum(bg, params, "gamma")}
          saturation={fxNum(bg, params, "saturation")}
          centerX={fxNum(bg, params, "centerX")}
          centerY={fxNum(bg, params, "centerY")}
          zoom={fxNum(bg, params, "zoom")}
        />
      );
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
