import { Check, Star, Zap, Shield, Heart, Gamepad2, Download, Settings, Info, Trophy, Sparkles, Rocket, type LucideIcon } from "lucide-react";
import type { IconKey } from "@/lib/page-icons";

const ICONS: Record<IconKey, LucideIcon> = {
  check: Check, star: Star, zap: Zap, shield: Shield, heart: Heart, gamepad: Gamepad2,
  download: Download, settings: Settings, info: Info, trophy: Trophy, sparkles: Sparkles, rocket: Rocket,
};

/** Renderiza o ícone de um item de menu pela chave (allowlist de page-icons). */
export function MenuIcon({ name, className }: { name: string | null; className?: string }) {
  const Icon = name && (ICONS as Record<string, LucideIcon>)[name];
  if (!Icon) return null;
  return <Icon className={className} aria-hidden="true" />;
}
