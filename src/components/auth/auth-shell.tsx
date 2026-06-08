import Link from "next/link";
import { Gamepad2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main id="main" className="auth-page">
      <div className="auth-page__inner">
        <Link href="/" className="auth-page__brand">
          <Gamepad2 className="brand-icon" aria-hidden="true" />
          RetroWiki
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
        {footer && <p className="auth-page__footer">{footer}</p>}
      </div>
    </main>
  );
}
