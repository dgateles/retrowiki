"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendBulkMailAction } from "@/lib/actions/bulk-mail-actions";

const AUDIENCES = [
  { value: "all", label: "Todos os membros" },
  { value: "member", label: "Membros" },
  { value: "contributor", label: "Colaboradores" },
  { value: "moderator", label: "Moderadores" },
  { value: "admin", label: "Administradores" },
];

export function BulkMailForm() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [audience, setAudience] = useState("all");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);

  async function send() {
    if (subject.trim().length < 1 || body.trim().length < 1) { toast.error("Preencha assunto e mensagem."); return; }
    if (!window.confirm("Enviar este e-mail para a audiência selecionada? Membros que optaram por não receber são excluídos.")) return;
    setPending(true);
    const res = await sendBulkMailAction(subject, body, audience);
    setPending(false);
    if (res.ok) { toast.success(`Enviado para ${res.data?.sent ?? 0} membro(s).`); setSubject(""); setBody(""); router.refresh(); } else toast.error(res.error ?? "Falha.");
  }

  return (
    <div className="rule-form">
      <section className="rule-form__section">
        <div className="field">
          <Label htmlFor="bm-aud">Audiência</Label>
          <select id="bm-aud" className="rte__select" value={audience} onChange={(e) => setAudience(e.target.value)}>
            {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </div>
        <div className="field">
          <Label htmlFor="bm-subj">Assunto</Label>
          <Input id="bm-subj" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} />
        </div>
        <div className="field">
          <Label htmlFor="bm-body">Mensagem (HTML simples permitido)</Label>
          <textarea id="bm-body" className="q-textarea" rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
          <p className="field__hint">Membros que optaram por não receber e contas removidas são sempre excluídos.</p>
        </div>
      </section>
      <div className="rule-form__foot">
        <Button type="button" size="sm" onClick={send} disabled={pending}><Send className="size-4" aria-hidden="true" /> {pending ? "Enviando…" : "Enviar"}</Button>
      </div>
    </div>
  );
}
