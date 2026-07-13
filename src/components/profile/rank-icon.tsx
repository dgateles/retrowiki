import { Hand, Leaf, Lightbulb, Share2, Star, Award, Crown, Gem, Flame, Trophy, type LucideIcon } from "lucide-react";

const MAP: Record<string, LucideIcon> = { Hand, Leaf, Lightbulb, Share2, Star, Award, Crown, Gem, Flame, Trophy };

/** Ícone de um rank a partir do nome (lucide). Fallback: Award. */
export function RankIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MAP[name] ?? Award;
  return <Icon className={className} aria-hidden="true" />;
}
