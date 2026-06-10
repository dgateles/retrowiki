"use client";

import Link from "next/link";
import { Pencil, ChevronDown, UserCircle, Image as ImageIcon, ListChecks, Images } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function ProfileEditMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" size="sm" variant="secondary">
          <Pencil className="size-4" aria-hidden="true" /> Editar perfil <ChevronDown className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/conta?secao=geral"><UserCircle className="size-4" aria-hidden="true" /> Foto e capa</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/conta?secao=galeria"><Images className="size-4" aria-hidden="true" /> Galeria de fotos</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/conta?secao=perfil"><ImageIcon className="size-4" aria-hidden="true" /> Editar perfil</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/conta"><ListChecks className="size-4" aria-hidden="true" /> Configurações da conta</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
