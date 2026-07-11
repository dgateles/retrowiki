"use client";

import { useState } from "react";
import { count } from "@/lib/plural";
import Image from "next/image";
import { toast } from "sonner";
import { ShieldCheck, ShieldAlert, KeyRound, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import {
  beginMfaSetupAction,
  confirmMfaSetupAction,
  disableMfaAction,
  regenerateRecoveryCodesAction,
} from "@/lib/actions/mfa-actions";

type Props = { initialEnabled: boolean; remainingCodes: number };

/** Painel completo de verificação em duas etapas (TOTP) na conta do usuário. */
export function MfaSetup({ initialEnabled, remainingCodes }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [remaining, setRemaining] = useState(remainingCodes);
  const [pending, setPending] = useState(false);

  // Estado do fluxo de ativação.
  const [setup, setSetup] = useState<{ secret: string; qrDataUri: string } | null>(null);
  const [recovery, setRecovery] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);

  async function begin() {
    setPending(true);
    const res = await beginMfaSetupAction();
    setPending(false);
    if (res.ok && res.data) setSetup(res.data);
    else toast.error(res.error ?? "Não foi possível iniciar.");
  }

  async function confirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code") ?? "");
    setPending(true);
    const res = await confirmMfaSetupAction(code);
    setPending(false);
    if (res.ok && res.data) {
      setEnabled(true);
      setRemaining(res.data.recoveryCodes.length);
      setSetup(null);
      setRecovery(res.data.recoveryCodes);
      toast.success("Verificação em duas etapas ativada.");
    } else {
      toast.error(res.error ?? "Código inválido.");
    }
  }

  async function disable(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    setPending(true);
    const res = await disableMfaAction(password);
    setPending(false);
    if (res.ok) {
      setEnabled(false);
      setRemaining(0);
      toast.success("Verificação em duas etapas desativada.");
    } else {
      toast.error(res.error ?? "Não foi possível desativar.");
    }
  }

  async function regenerate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    setPending(true);
    const res = await regenerateRecoveryCodesAction(password);
    setPending(false);
    if (res.ok && res.data) {
      setRemaining(res.data.recoveryCodes.length);
      setRecovery(res.data.recoveryCodes);
      toast.success("Novos códigos de recuperação gerados.");
    } else {
      toast.error(res.error ?? "Não foi possível gerar.");
    }
  }

  function copyRecovery() {
    if (!recovery) return;
    navigator.clipboard.writeText(recovery.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="mfa">
      <div className="mfa__head">
        <span className={enabled ? "mfa__icon mfa__icon--on" : "mfa__icon"} aria-hidden="true">
          {enabled ? <ShieldCheck className="size-5" /> : <ShieldAlert className="size-5" />}
        </span>
        <div>
          <h3 className="mfa__title">Verificação em duas etapas (2FA)</h3>
          <p className="mfa__desc">
            {enabled
              ? "Ativa. No login pedimos um código do seu app autenticador."
              : "Adicione uma camada extra: além da senha, um código do app autenticador."}
          </p>
        </div>
        <span className={enabled ? "mfa__badge mfa__badge--on" : "mfa__badge"}>
          {enabled ? "Ativa" : "Inativa"}
        </span>
      </div>

      {/* Estado desativado — botão para iniciar, e formulário de confirmação quando em setup */}
      {!enabled && !setup && (
        <Button onClick={begin} disabled={pending} className="mt-3">
          <KeyRound className="size-4" aria-hidden="true" /> Ativar 2FA
        </Button>
      )}

      {!enabled && setup && (
        <div className="mfa__setup mt-4">
          <ol className="mfa__steps">
            <li>Abra seu app autenticador (Google Authenticator, Authy, 1Password…).</li>
            <li>Escaneie o QR code ou digite a chave manualmente.</li>
            <li>Informe o código de 6 dígitos gerado para confirmar.</li>
          </ol>
          <div className="mfa__qr">
            <Image src={setup.qrDataUri} alt="QR code para configurar a verificação em duas etapas" width={200} height={200} unoptimized />
            <div className="mfa__manual">
              <span className="mfa__manual-label">Chave manual</span>
              <code className="mfa__secret">{setup.secret.replace(/(.{4})/g, "$1 ").trim()}</code>
            </div>
          </div>
          <form onSubmit={confirm} className="mfa__confirm">
            <div className="field">
              <Label htmlFor="mfa-code">Código do app</Label>
              <Input id="mfa-code" name="code" inputMode="numeric" autoComplete="one-time-code" placeholder="000000" required />
            </div>
            <div className="mfa__actions">
              <Button type="button" variant="ghost" size="sm" onClick={() => setSetup(null)} disabled={pending}>Cancelar</Button>
              <Button type="submit" size="sm" disabled={pending}>{pending ? "Confirmando…" : "Confirmar e ativar"}</Button>
            </div>
          </form>
        </div>
      )}

      {/* Estado ativado — gerenciar códigos de recuperação e desativar */}
      {enabled && (
        <div className="mfa__manage mt-4">
          <div className="mfa__manage-row">
            <div>
              <p className="mfa__manage-title">Códigos de recuperação</p>
              <p className="mfa__manage-note">
                {remaining > 0
                  ? `${count(remaining, "código restante", "códigos restantes")}. Use-os se perder o acesso ao app.`
                  : "Nenhum código restante. Gere novos agora."}
              </p>
            </div>
          </div>

          <details className="mfa__danger">
            <summary>Gerar novos códigos de recuperação</summary>
            <form onSubmit={regenerate} className="mfa__pwform">
              <div className="field">
                <Label htmlFor="regen-pw">Confirme sua senha</Label>
                <Input id="regen-pw" name="password" type="password" autoComplete="current-password" required />
              </div>
              <Button type="submit" size="sm" variant="outline" disabled={pending}>Gerar novos códigos</Button>
            </form>
          </details>

          <details className="mfa__danger">
            <summary className="text-destructive">Desativar verificação em duas etapas</summary>
            <form onSubmit={disable} className="mfa__pwform">
              <div className="field">
                <Label htmlFor="disable-pw">Confirme sua senha</Label>
                <Input id="disable-pw" name="password" type="password" autoComplete="current-password" required />
              </div>
              <Button type="submit" size="sm" variant="destructive" disabled={pending}>Desativar 2FA</Button>
            </form>
          </details>
        </div>
      )}

      {/* Diálogo com os códigos de recuperação (mostrados uma única vez) */}
      <Dialog open={!!recovery} onOpenChange={(o) => !o && setRecovery(null)}>
        <DialogContent aria-describedby="mfa-recovery-desc">
          <DialogTitle>Guarde seus códigos de recuperação</DialogTitle>
          <DialogDescription id="mfa-recovery-desc">
            Cada código funciona uma única vez. Guarde-os num lugar seguro — eles não serão exibidos novamente.
          </DialogDescription>
          <ul className="mfa__codes" aria-label="Códigos de recuperação">
            {recovery?.map((c) => <li key={c}><code>{c}</code></li>)}
          </ul>
          <div className="modal-actions">
            <Button type="button" variant="outline" size="sm" onClick={copyRecovery}>
              {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
              {copied ? "Copiado" : "Copiar todos"}
            </Button>
            <DialogClose asChild><Button size="sm">Guardei em segurança</Button></DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
