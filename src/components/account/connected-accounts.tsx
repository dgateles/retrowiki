"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { startGoogleLinkAction, unlinkGoogleAction } from "@/lib/actions/account-link-actions";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.48 14.97.5 12 .5A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 6.68 9.14 4.75 12 4.75Z" />
    </svg>
  );
}

const STATUS_MSG: Record<string, { kind: "success" | "error"; msg: string }> = {
  ok: { kind: "success", msg: "Conta Google conectada." },
  conflito: { kind: "error", msg: "Este Google já está vinculado a outra conta." },
  naoverificado: { kind: "error", msg: "O e-mail desse Google não está verificado." },
  cancelado: { kind: "error", msg: "Conexão cancelada." },
  erro: { kind: "error", msg: "Não foi possível conectar. Tente de novo." },
};

export function ConnectedAccounts({
  connected,
  linkedEmail,
  hasPassword,
  status,
}: {
  connected: boolean;
  linkedEmail: string | null;
  hasPassword: boolean;
  status?: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<null | "connect" | "disconnect">(null);
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  // Toast do retorno do callback (?vinculo=...).
  useEffect(() => {
    if (!status) return;
    const s = STATUS_MSG[status];
    if (s) (s.kind === "success" ? toast.success : toast.error)(s.msg);
    router.replace("/conta?secao=contas");
  }, [status, router]);

  async function doConnect(pwd: string) {
    setPending(true);
    const res = await startGoogleLinkAction({ password: pwd });
    setPending(false);
    if (res.ok && res.url) {
      window.location.assign(res.url);
    } else {
      toast.error(res.error ?? "Não foi possível iniciar.");
      setMode(null);
    }
  }

  async function doDisconnect(pwd: string) {
    setPending(true);
    const res = await unlinkGoogleAction({ password: pwd });
    setPending(false);
    setMode(null);
    setPassword("");
    if (res.ok) {
      toast.success("Conta Google desconectada.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Não foi possível desconectar.");
    }
  }

  function onConnect() {
    if (hasPassword) setMode("connect");
    else void doConnect(""); // conta só-Google: sem senha a confirmar
  }
  function onDisconnect() {
    if (hasPassword) setMode("disconnect");
    else void doDisconnect(""); // bloqueado no servidor (mostra o motivo)
  }

  return (
    <div className="conn-list">
      <div className="conn-item">
        <span className="conn-item__icon"><GoogleIcon /></span>
        <span className="conn-item__body">
          <span className="conn-item__name">Google</span>
          <span className="conn-item__meta">
            {connected ? (linkedEmail ? `Conectado · ${linkedEmail}` : "Conectado") : "Não conectado"}
          </span>
        </span>
        {connected ? (
          <Button type="button" variant="outline" size="sm" onClick={onDisconnect} disabled={pending}>Desconectar</Button>
        ) : (
          <Button type="button" size="sm" onClick={onConnect} disabled={pending}>Conectar</Button>
        )}
      </div>

      <Dialog open={mode !== null} onOpenChange={(o) => { if (!o) { setMode(null); setPassword(""); } }}>
        <DialogContent>
          <DialogTitle>{mode === "disconnect" ? "Desconectar o Google" : "Conectar o Google"}</DialogTitle>
          <DialogDescription>
            Confirme sua senha para {mode === "disconnect" ? "desconectar" : "conectar"} a conta Google.
          </DialogDescription>
          <form
            className="mt-2 space-y-3"
            onSubmit={(e) => { e.preventDefault(); if (mode === "disconnect") void doDisconnect(password); else void doConnect(password); }}
          >
            <div className="field">
              <Label htmlFor="link-pwd">Senha atual</Label>
              <Input id="link-pwd" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
            </div>
            <Button type="submit" className="w-full" disabled={pending || password.length === 0}>
              {pending ? "Aguarde…" : mode === "disconnect" ? "Desconectar" : "Continuar para o Google"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
