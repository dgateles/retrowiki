import { cn } from "@/lib/utils";
// Efeitos puramente CSS (leves, sem motion/react) — import estático ok.
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { AuroraText } from "@/components/ui/aurora-text";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
// Efeitos com motion/react (pesados) ficam fora do bundle crítico (carga lazy).
import { FxTextMotion } from "@/components/pages/fx-text-motion";

export type TitleLevel = "p" | "h2" | "h3" | "h4" | "h5" | "h6";
export type TitleColor = "default" | "muted" | "primary" | "success" | "warn";
export type TitleAlign = "left" | "center" | "right";

const TEXT_COLOR: Record<string, string> = {
  default: "", muted: "text-muted-foreground", primary: "text-primary",
  success: "text-emerald-600", warn: "text-amber-600",
};
const TITLE_ALIGN_CLASS: Record<string, string> = { left: "text-left", center: "text-center", right: "text-right" };

/** Aplica um dos 8 efeitos de animação ao texto (compartilhado por Heading e
 * pelos títulos de widget). */
export function fxText(fx: string, text: string): React.ReactNode {
  return fx === "gradient" ? <AnimatedGradientText colorFrom="#10b981" colorTo="#6366f1" speed={1.2}>{text}</AnimatedGradientText> :
    fx === "aurora" ? <AuroraText colors={["#10b981", "#6366f1", "#22d3ee"]}>{text}</AuroraText> :
    fx === "shiny" ? <AnimatedShinyText className="inline">{text}</AnimatedShinyText> :
    (fx === "textanimate" || fx === "typing" || fx === "lineshadow" || fx === "hyper")
      ? <FxTextMotion fx={fx} text={text} /> :
    text;
}

/** Título de widget com nível semântico (p/h2–h6), cor, animação e alinhamento. */
export function WidgetTitle({
  text, level, color, fx, align = "left", className,
}: {
  text: string;
  level: TitleLevel;
  color: TitleColor;
  fx: string;
  align?: TitleAlign;
  className?: string;
}) {
  if (!text) return null;
  const Tag = level;
  return (
    <Tag className={cn("page-w__title", `page-w__title--${level}`, TITLE_ALIGN_CLASS[align], fx === "none" && TEXT_COLOR[color], className)}>
      {fxText(fx, text)}
    </Tag>
  );
}
