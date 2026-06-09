import {
  Hand, Leaf, Lightbulb, Share2, Star, Award, Crown, Gem, Flame, Trophy,
  Shield, Sparkles, Medal, Rocket, Zap, type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Hand, Leaf, Lightbulb, Share2, Star, Award, Crown, Gem, Flame, Trophy,
  Shield, Sparkles, Medal, Rocket, Zap,
};

export const RANK_ICON_NAMES = Object.keys(MAP);

export function RankIcon({ name, image, className }: { name: string; image?: string | null; className?: string }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" className={className} />;
  }
  const Icon = MAP[name] ?? Shield;
  return <Icon className={className} aria-hidden="true" />;
}
