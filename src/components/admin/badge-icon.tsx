import {
  Award, BookOpen, PenLine, Library, MessageCircle, MessagesSquare, MessageCirclePlus,
  Star, Trophy, ThumbsUp, CircleCheck, UserRound, Clock, Calendar, Flame, Heart,
  Gem, Crown, Medal, Sparkles, Zap, Target, type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Award, BookOpen, PenLine, Library, MessageCircle, MessagesSquare, MessageCirclePlus,
  Star, Trophy, ThumbsUp, CircleCheck, UserRound, Clock, Calendar, Flame, Heart,
  Gem, Crown, Medal, Sparkles, Zap, Target,
};

export const BADGE_ICON_NAMES = Object.keys(MAP);

export function BadgeIcon({ name, image, className }: { name: string; image?: string | null; className?: string }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" className={className} />;
  }
  const Icon = MAP[name] ?? Award;
  return <Icon className={className} aria-hidden="true" />;
}
