# 13 — Sistema de Notificações

Notificações mantêm autores e moderadores informados sem ruído. Dois canais:
**in-app** (sino na interface) e **e-mail** (via Resend — ver
[12 — Autenticação e E-mails](./12-autenticacao-e-emails.md)). Arquitetura
preparada para um terceiro canal (web push) no futuro.

## 13.1 Princípios

- **Orientado a eventos:** o domínio emite eventos; um serviço de notificação
  decide quem recebe, por qual canal, respeitando preferências.
- **Não bloqueante:** a entrega roda em **job/fila**; a ação do usuário não espera
  o envio do e-mail.
- **Preferências do usuário:** cada tipo de notificação pode ser configurado por
  canal (in-app / e-mail / desligado) e em modo **imediato** ou **resumo diário**.
- **Anti-fadiga:** agrupamento (digest), deduplicação e limites evitam spam.
- **Descadastro fácil:** todo e-mail não essencial tem link de descadastro e
  cabeçalho `List-Unsubscribe` (LGPD/boas práticas).

## 13.2 Tipos de evento

| Tipo | Destinatário | Canais padrão | Agrupável (digest) |
|---|---|---|---|
| `submission.received` | Moderadores | in-app + e-mail | Sim |
| `article.approved` | Autor | in-app + e-mail | Não |
| `article.changes_requested` | Autor | in-app + e-mail | Não |
| `article.rejected` | Autor | in-app + e-mail | Não |
| `comment.created` | Autor do artigo | in-app | Sim |
| `comment.reply` | Autor do comentário | in-app + e-mail | Sim |
| `mention` | Usuário mencionado | in-app + e-mail | Sim |
| `role.changed` | Usuário | in-app + e-mail | Não |
| `digest.weekly` | Quem optou | e-mail | — |

Eventos de **segurança** (senha alterada, novo login, troca de e-mail) **não**
são "notificações configuráveis" — são e-mails transacionais sempre enviados
(ver [12](./12-autenticacao-e-emails.md)).

## 13.3 Modelo de dados

```prisma
model Notification {
  id         String   @id @default(cuid())
  recipient  User     @relation(fields: [recipientId], references: [id], onDelete: Cascade)
  recipientId String
  type       String              // "article.approved", "comment.reply"...
  payload    Json                // dados para renderizar (ids, títulos, autor)
  readAt     DateTime?
  createdAt  DateTime @default(now())
  @@index([recipientId, readAt])
}

model NotificationPreference {
  id        String  @id @default(cuid())
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  type      String                 // tipo de evento
  channel   NotifChannel
  mode      NotifMode  @default(IMMEDIATE)
  enabled   Boolean    @default(true)
  @@unique([userId, type, channel])
}
enum NotifChannel { IN_APP EMAIL }
enum NotifMode    { IMMEDIATE DAILY_DIGEST }

// token estável p/ descadastro em 1 clique a partir do e-mail
model UnsubscribeToken {
  id      String @id @default(cuid())
  userId  String @unique
  token   String @unique          // aleatório, não advinhável
}

// e-mails suprimidos por bounce/complaint (preenchido por webhook do Resend)
model EmailSuppression {
  email  String @id
  reason String
  at     DateTime @default(now())
}
```

## 13.4 Fluxo de entrega

```
Evento de domínio  ──notify()──▶  Serviço de Notificação
                                   │ 1. resolve destinatários
                                   │ 2. lê NotificationPreference (canal/modo)
                                   │ 3. dedupe + checa supressão de e-mail
                                   ▼
                 ┌───────────────────────────────┐
                 │ IN_APP: grava Notification     │  (sino atualiza via SWR/poll)
                 │ EMAIL IMMEDIATE: enfileira send│  (Resend, doc 12)
                 │ EMAIL DAILY_DIGEST: acumula    │  (job diário agrega e envia 1 e-mail)
                 └───────────────────────────────┘
```

```ts
// lib/notify.ts
import 'server-only';
export async function notify(type: string, recipientId: string, payload: object) {
  const prefs = await getPrefs(recipientId, type);          // defaults se não houver
  if (prefs.inApp.enabled) {
    await db.notification.create({ data: { recipientId, type, payload } });
  }
  if (prefs.email.enabled && !(await isSuppressed(recipientId))) {
    if (prefs.email.mode === 'IMMEDIATE') {
      await enqueueEmail('notification', { recipientId, type, payload });
    } else {
      await db.digestQueue.create({ data: { recipientId, type, payload } }); // job diário
    }
  }
}
```

- **Dedup:** chave por `(recipient, type, targetId)` numa janela curta evita
  múltiplos avisos do mesmo fato (ex.: vários comentários → 1 notificação agrupada).
- **Digest diário:** job agrega itens pendentes por usuário e envia **um** e-mail.

## 13.5 UI in-app (acessível)

- Sino no header com contagem (`aria-label="Notificações, 3 não lidas"`).
- Painel = **disclosure/menu** acessível (padrão APG — ver
  [07 — Acessibilidade](./07-semantica-e-acessibilidade.md)): operável por
  teclado, `Esc` fecha, foco gerenciado.
- Lista como `<ul>`; cada item com link para o alvo; "marcar como lida" / "marcar
  todas".
- Novos itens anunciados de forma discreta por `aria-live="polite"`.
- Página dedicada `/notificacoes` com histórico e filtros.

## 13.6 Preferências e descadastro

- Tela `/configuracoes/notificacoes`: matriz **tipo × canal** com toggle
  in-app/e-mail e seleção imediato/digest.
- Cada e-mail não essencial inclui:
  - link "Cancelar estas notificações" (usa `UnsubscribeToken`, **1 clique**, sem
    exigir login);
  - cabeçalhos `List-Unsubscribe: <https://…/unsub?t=…>, <mailto:…>` e
    `List-Unsubscribe-Post: List-Unsubscribe=One-Click`.
- Descadastro desliga o **tipo/canal** correto (não "tudo" cegamente).

## 13.7 Integração com o domínio

Pontos onde `notify()` é chamado (ver [04 — Comunidade](./04-comunidade-e-moderacao.md)):

```ts
// ao submeter → avisa moderadores
await notifyModerators('submission.received', { articleId, title });
// ao aprovar/pedir ajustes/rejeitar → avisa autor
await notify('article.approved', authorId, { articleId, slug });
// ao comentar/responder → avisa dono do conteúdo
await notify('comment.reply', parentAuthorId, { articleId, commentId });
```

## 13.8 Segurança e privacidade

- Notificação só renderiza dados que o destinatário **pode ver** (sem vazar
  rascunhos/PII de terceiros) — autorização ao montar o `payload`.
- `UnsubscribeToken` aleatório e não enumerável; descadastro não revela outras
  contas.
- E-mails suprimidos (`EmailSuppression`) nunca recebem novos envios.
- Entrega em job com retry/backoff; falha de e-mail não afeta a notificação in-app.
