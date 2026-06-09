"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, PenLine, ShieldCheck, UserRound, Cog, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Rank } from "@/lib/ranks";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function UserMenu({
  handle,
  rank,
  isStaff,
  isAdmin,
}: {
  handle: string;
  rank: Rank | null;
  isStaff: boolean;
  isAdmin: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Menu da conta">
          <span className="user-menu__avatar">
            {handle.slice(0, 2).toUpperCase()}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        <DropdownMenuLabel className="truncate">@{handle}</DropdownMenuLabel>
        {rank && (
          <div className="user-menu__rank">
            <div className="user-menu__rank-head">
              <span className="user-menu__rank-label">{rank.label}</span>
              <span className="user-menu__rank-index">{rank.index}/{rank.total}</span>
            </div>
            <progress
              className="rank__progress"
              value={Math.round(rank.progress * 100)}
              max={100}
              aria-label={`Progresso no rank ${rank.label}`}
            />
            <p className="user-menu__rank-sub">
              {rank.next === null
                ? "Rank máximo"
                : `${rank.pointsToNext} ${rank.pointsToNext === 1 ? "ponto" : "pontos"} até o próximo`}
            </p>
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/painel">
            <LayoutDashboard aria-hidden="true" /> Painel
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/estudio">
            <PenLine aria-hidden="true" /> Escrever
          </Link>
        </DropdownMenuItem>
        {isStaff && (
          <DropdownMenuItem asChild>
            <Link href="/moderacao">
              <ShieldCheck aria-hidden="true" /> Moderação
            </Link>
          </DropdownMenuItem>
        )}
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <Cog aria-hidden="true" /> Administração
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href={`/u/${handle}`}>
            <UserRound aria-hidden="true" /> Meu perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/conta">
            <UserRound aria-hidden="true" /> Conta
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/" })}>
          <LogOut aria-hidden="true" /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
