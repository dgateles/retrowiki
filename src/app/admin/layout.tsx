import Link from "next/link";
import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { getCurrentUser, can } from "@/lib/auth-helpers";
import { SiteHeader } from "@/components/layout/site-header";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Administração", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const isAdmin = can.admin(user);

  return (
    <>
      <SiteHeader />
      <div className={isAdmin ? "admin" : undefined}>
        {isAdmin && <AdminNav />}
        <main id="main" className={isAdmin ? "admin__main" : "page restricted"}>
          {isAdmin ? (
            children
          ) : (
            <>
              <ShieldAlert className="restricted__icon" aria-hidden="true" />
              <h1 className="restricted__title">Acesso restrito</h1>
              <p className="restricted__text">Esta área é exclusiva para administradores.</p>
              <Button asChild className="mt-6">
                <Link href="/">Início</Link>
              </Button>
            </>
          )}
        </main>
      </div>
    </>
  );
}
