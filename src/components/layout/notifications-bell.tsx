"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { CommentAvatar } from "@/components/engagement/comment-avatar";
import { markNotificationReadAction } from "@/lib/actions/notification-actions";

export type NotifItem = {
  id: number;
  text: string;
  href: string | null;
  read: boolean;
  date: string;
  image?: string | null;
  actor?: string | null;
};

export function NotificationsBell({ unread: initialUnread, items: initial }: { unread: number; items: NotifItem[] }) {
  const [items, setItems] = useState(initial);
  const [unread, setUnread] = useState(initialUnread);

  function onItemClick(id: number) {
    setItems((prev) => prev.filter((x) => x.id !== id));
    setUnread((c) => Math.max(0, c - 1));
    markNotificationReadAction(id);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notificações${unread ? `, ${unread} não lidas` : ""}`}
        >
          <Bell className="size-4" aria-hidden="true" />
          {unread > 0 && <span className="site-header__badge">{unread > 9 ? "9+" : unread}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="notif-pop">
        <div className="notif-pop__head">
          <span className="notif-pop__title">Notificações</span>
          <Link href="/notificacoes" className="notif-pop__settings">Ver todas</Link>
        </div>

        {items.length === 0 ? (
          <p className="notif-pop__empty">Nada por aqui ainda.</p>
        ) : (
          <div className="notif-pop__list">
            {items.map((n) => {
              const inner = (
                <>
                  <CommentAvatar name={n.actor ?? "?"} src={n.image} />
                  <span className="notif-pop__body">
                    <span className="notif-pop__text">{n.text}</span>
                    <span className="notif-pop__date">{n.date}</span>
                  </span>
                </>
              );
              return n.href ? (
                <Link key={n.id} href={n.href} className="notif-pop__item notif-pop__item--unread" onClick={() => onItemClick(n.id)}>
                  {inner}
                </Link>
              ) : (
                <button key={n.id} type="button" className="notif-pop__item notif-pop__item--unread" onClick={() => onItemClick(n.id)}>
                  {inner}
                </button>
              );
            })}
          </div>
        )}

        <div className="notif-pop__foot">
          <Link href="/notificacoes" className="notif-pop__foot-link">Abrir notificações</Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
