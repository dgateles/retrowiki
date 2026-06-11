"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { createMemberAction, importMembersAction } from "@/lib/actions/member-actions";

export function MemberAdminTools() {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // Criar membro
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [setPwd, setSetPwd] = useState(false);
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);

  // Importar
  const [csv, setCsv] = useState("");
  const [importing, setImporting] = useState(false);

  async function create() {
    setCreating(true);
    const res = await createMemberAction(JSON.stringify({ displayName, email, role, setPassword: setPwd, password }));
    setCreating(false);
    if (res.ok) {
      toast.success(setPwd ? "Membro criado." : "Membro criado; e-mail para definir a senha enviado.");
      setCreateOpen(false);
      setDisplayName(""); setEmail(""); setRole("member"); setSetPwd(false); setPassword("");
      router.refresh();
    } else {
      toast.error(res.error ?? "Falha.");
    }
  }

  async function runImport() {
    setImporting(true);
    const res = await importMembersAction(csv);
    setImporting(false);
    if (res.ok && res.data) {
      toast.success(`${res.data.created} criado(s), ${res.data.skipped} ignorado(s), ${res.data.errors} erro(s).`);
      setImportOpen(false);
      setCsv("");
      router.refresh();
    } else {
      toast.error(res.error ?? "Falha.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <a href="/admin/membros/export"><Download className="size-4" aria-hidden="true" /> Exportar</a>
      </Button>
      <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
        <Upload className="size-4" aria-hidden="true" /> Importar
      </Button>
      <Button size="sm" onClick={() => setCreateOpen(true)}>
        <Plus className="size-4" aria-hidden="true" /> Novo membro
      </Button>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Novo membro</DialogTitle>
          <div className="member-create">
            <div className="field">
              <Label htmlFor="cm-name">Nome de exibição</Label>
              <Input id="cm-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={120} />
            </div>
            <div className="field">
              <Label htmlFor="cm-email">E-mail</Label>
              <Input id="cm-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <Label htmlFor="cm-role">Papel</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="cm-role" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="contributor">Colaborador</SelectItem>
                  <SelectItem value="moderator">Moderador</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={setPwd} onCheckedChange={(c) => setSetPwd(c === true)} /> Definir uma senha agora
            </label>
            {setPwd ? (
              <div className="field">
                <Label htmlFor="cm-pwd">Senha (mín. 8)</Label>
                <Input id="cm-pwd" type="text" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            ) : (
              <p className="muted">Sem senha: o membro recebe um e-mail para criar a própria.</p>
            )}
          </div>
          <div className="modal-actions">
            <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancelar</Button></DialogClose>
            <Button type="button" size="sm" onClick={create} disabled={creating}>{creating ? "Criando…" : "Criar"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Importar membros</DialogTitle>
          <p className="muted mt-1">Cole um CSV com colunas: e-mail, nome, papel (opcional). Cada novo membro recebe um e-mail para definir a senha. Até 200 linhas.</p>
          <textarea className="q-textarea mt-3" rows={8} value={csv} onChange={(e) => setCsv(e.target.value)} placeholder={"email,nome,papel\nfulano@exemplo.com,Fulano,member"} />
          <div className="modal-actions">
            <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancelar</Button></DialogClose>
            <Button type="button" size="sm" onClick={runImport} disabled={importing || csv.trim().length === 0}>{importing ? "Importando…" : "Importar"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
