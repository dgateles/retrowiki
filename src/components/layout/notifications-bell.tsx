"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";

export type NotifItem = {
  id: number;
  text: string;
  href: string | null;
  read: boolean;
  date: string;
};

export function NotificationsBell({ unread, items }: { unread: number; items: NotifItem[] }) {
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
              const cls = cn("notif-pop__item", !n.read && "notif-pop__item--unread");
              const inner = (
                <>
                  <span>{n.text}</span>
                  <span className="notif-pop__date">{n.date}</span>
                </>
              );
              return n.href ? (
                <Link key={n.id} href={n.href} className={cls}>{inner}</Link>
              ) : (
                <div key={n.id} className={cls}>{inner}</div>
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
