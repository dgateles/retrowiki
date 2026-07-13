import { Award, BookOpen, PenLine, Library, MessageCircle, MessagesSquare, Star, Trophy, type LucideIcon } from "lucide-react";

const MAP: Record<string, LucideIcon> = { Award, BookOpen, PenLine, Library, MessageCircle, MessagesSquare, Star, Trophy };

/** Ícone de uma badge a partir do nome (lucide). Fallback: Award. */
export function BadgeIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MAP[name] ?? Award;
  return <Icon className={className} aria-hidden="true" />;
}
