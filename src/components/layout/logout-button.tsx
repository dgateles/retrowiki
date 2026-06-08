"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })} aria-label="Sair">
      <LogOut className="size-4" aria-hidden="true" />
      <span className="logout__label">Sair</span>
    </Button>
  );
}
