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

export function BadgeIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MAP[name] ?? Award;
  return <Icon className={className} aria-hidden="true" />;
}
