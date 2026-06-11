import {
  Award,
  BookOpen,
  PenLine,
  Library,
  MessageCircle,
  MessagesSquare,
  Star,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserBadge } from "@/lib/badges";

const ICONS: Record<string, LucideIcon> = {
  Award,
  BookOpen,
  PenLine,
  Library,
  MessageCircle,
  MessagesSquare,
  Star,
  Trophy,
};

export function BadgeList({ items }: { items: UserBadge[] }) {
  if (items.length === 0) {
    return <p className="empty__text">Nenhuma conquista ainda.</p>;
  }
  return (
    <ul className="badges">
      {items.map((b) => {
        const Icon = ICONS[b.icon] ?? Award;
        return (
          <li key={b.slug} className={cn("badge-pill", `badge-pill--${b.tier}`)} title={b.description}>
            <Icon className="size-4" aria-hidden="true" />
            {b.name}
          </li>
        );
      })}
    </ul>
  );
}
