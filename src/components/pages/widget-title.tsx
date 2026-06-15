import { cn } from "@/lib/utils";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { AuroraText } from "@/components/ui/aurora-text";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { TextAnimate } from "@/components/ui/text-animate";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { LineShadowText } from "@/components/ui/line-shadow-text";
import { HyperText } from "@/components/ui/hyper-text";

export type TitleLevel = "p" | "h2" | "h3" | "h4" | "h5" | "h6";
export type TitleColor = "default" | "muted" | "primary" | "success" | "warn";

const TEXT_COLOR: Record<string, string> = {
  default: "", muted: "text-muted-foreground", primary: "text-primary",
  success: "text-emerald-600", warn: "text-amber-600",
};

/** Aplica um dos 8 efeitos de animação ao texto (compartilhado por Heading e
 * pelos títulos de widget). */
export function fxText(fx: string, text: string): React.ReactNode {
  return fx === "gradient" ? <AnimatedGradientText colorFrom="#10b981" colorTo="#6366f1" speed={1.2}>{text}</AnimatedGradientText> :
    fx === "aurora" ? <AuroraText colors={["#10b981", "#6366f1", "#22d3ee"]}>{text}</AuroraText> :
    fx === "shiny" ? <AnimatedShinyText className="inline">{text}</AnimatedShinyText> :
    fx === "textanimate" ? <TextAnimate as="span" animation="blurInUp" by="word" className="inline-block">{text}</TextAnimate> :
    fx === "typing" ? <TypingAnimation as="span" className="inline">{text}</TypingAnimation> :
    fx === "lineshadow" ? <LineShadowText shadowColor="#10b981">{text}</LineShadowText> :
    fx === "hyper" ? <HyperText as="span" className="inline-block">{text}</HyperText> :
    text;
}

/** Título de widget com nível semântico (p/h2–h6), cor e animação. */
export function WidgetTitle({
  text, level, color, fx, className,
}: {
  text: string;
  level: TitleLevel;
  color: TitleColor;
  fx: string;
  className?: string;
}) {
  if (!text) return null;
  const Tag = level;
  return (
    <Tag className={cn("page-w__title", `page-w__title--${level}`, fx === "none" && TEXT_COLOR[color], className)}>
      {fxText(fx, text)}
    </Tag>
  );
}
