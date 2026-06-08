# 12 — Autenticação e E-mails (Resend)

Cobre **todos os fluxos que enviam e-mail**: cadastro, verificação de e-mail,
login, recuperação/redefinição de senha, troca de e-mail e magic link. Provedor
de e-mail: **Resend**. Bot/spam no cadastro: **captcha proprietário** (ver
[14 — Captcha Proprietário](./14-captcha-proprietario.md)).

## 12.1 Gerenciado vs. autogerido (decisão)

A skill de auth recomenda provedores **gerenciados** (Clerk/Descope/Auth0), que
internalizam verificação de e-mail e reset de senha — ótimos para setup rápido.

| Critério | Gerenciado (Clerk/Descope/Auth0) | **Autogerido (escolhido)** |
|---|---|---|
| Setup | Mais rápido | Mais trabalho |
| E-mails (todos) via **Resend** | Limitado/templates do provedor | **Controle total** (requisito) |
| **Captcha proprietário** no cadastro | Difícil de injetar | **Natural** (requisito) |
| Custo em escala | Por MAU | Infra própria |
| Lock-in | Alto | Baixo (self-host) |

Como o requisito é **todos os e-mails pelo Resend** e um **captcha próprio**,
adotamos **auth autogerida**: **Auth.js (NextAuth v5)** com provider
**Credentials** (e-mail+senha) e **Email** (magic link), tokens próprios para
verificação/reset e Resend como remetente. (Se no futuro quiserem reduzir
manutenção, Clerk é o caminho gerenciado — ver skill `vercel:auth`.)

## 12.2 Resend — configuração

```bash
npm install resend react-email @react-email/components
```

```ts
// lib/email/client.ts
import 'server-only';
import { Resend } from 'resend';
export const resend = new Resend(process.env.RESEND_API_KEY); // server-only
export const FROM = 'RetroWiki <nao-responda@mail.retro.wiki.br>';
export const REPLY_TO = 'contato@retro.wiki.br';
```

### Deliverability (entregabilidade) — obrigatório

- **Subdomínio de envio** dedicado (ex.: `mail.retro.wiki.br`) para isolar a
  reputação do domínio raiz.
- **SPF, DKIM e DMARC** configurados (o Resend fornece os registros DNS):
  - SPF: `include` do Resend no TXT do subdomínio.
  - DKIM: chave pública (CNAME/TXT) do Resend.
  - DMARC: `v=DMARC1; p=quarantine; rua=mailto:dmarc@retro.wiki.br`.
- **Aquecer** o domínio gradualmente; monitorar bounces/complaints.
- Cabeçalhos de descadastro em e-mails não essenciais (ver
  [13 — Notificações](./13-notificacoes.md)): `List-Unsubscribe` +
  `List-Unsubscribe-Post`.

### Envio com idempotência e retry

```ts
// lib/email/send.ts
import 'server-only';
import { resend, FROM, REPLY_TO } from './client';

export async function sendEmail(opts: {
  to: string; subject: string; react: React.ReactElement;
  idempotencyKey?: string; headers?: Record<string, string>;
}) {
  const { data, error } = await resend.emails.send({
    from: FROM, to: opts.to, replyTo: REPLY_TO,
    subject: opts.subject, react: opts.react, headers: opts.headers,
  }, opts.idempotencyKey ? { idempotencyKey: opts.idempotencyKey } : undefined);

  if (error) {
    // logar sem PII; reenfileirar (job) com backoff — nunca bloquear a request
    throw new Error('EMAIL_SEND_FAILED');
  }
  return data?.id;
}
```

> Envio real roda em **job/fila** (ver [02 — Arquitetura](./02-arquitetura.md)), não
> na request do usuário: a resposta ao usuário não depende do SMTP.

## 12.3 Modelo de tokens (verificação, reset, magic link)

Um único modelo, com `purpose`. **Guardamos só o hash** do token (nunca o valor),
single-use, com TTL curto, vinculado a usuário+propósito.

```prisma
model VerificationToken {
  id         String   @id @default(cuid())
  userId     String?                         // null no magic-link de cadastro
  email      String                          // alvo (verificação/troca)
  purpose    TokenPurpose
  tokenHash  String   @unique                // sha256(token) — nunca o token cru
  expiresAt  DateTime
  consumedAt DateTime?
  createdAt  DateTime @default(now())
  @@index([email, purpose])
}
enum TokenPurpose { EMAIL_VERIFY PASSWORD_RESET EMAIL_CHANGE MAGIC_LINK }
```

TTLs recomendados:

| Propósito | TTL | Observação |
|---|---|---|
| `EMAIL_VERIFY` | 24 h | Exigido antes de submeter conteúdo |
| `PASSWORD_RESET` | 1 h | Curto; invalida sessões ao concluir |
| `EMAIL_CHANGE` | 1 h | Verifica o **novo** e-mail antes de trocar |
| `MAGIC_LINK` | 15 min | Login sem senha |

Geração/validação (constante no tempo, single-use):

```ts
// lib/auth/tokens.ts
import 'server-only';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';

export function createToken() {
  const raw = randomBytes(32).toString('base64url'); // vai no link, por e-mail
  const tokenHash = createHash('sha256').update(raw).digest('hex'); // vai no banco
  return { raw, tokenHash };
}

export async function consumeToken(raw: string, purpose: TokenPurpose) {
  const tokenHash = createHash('sha256').update(raw).digest('hex');
  const row = await db.verificationToken.findUnique({ where: { tokenHash } });
  if (!row || row.purpose !== purpose) return null;
  if (row.consumedAt || row.expiresAt < new Date()) return null;
  // marca consumido atomicamente (evita reuso em corrida)
  const ok = await db.verificationToken.updateMany({
    where: { id: row.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  return ok.count === 1 ? row : null;
}
```

Senhas: **argon2id** (ou scrypt/bcrypt). Nunca texto puro.

```ts
import argon2 from 'argon2';
export const hashPassword = (p: string) => argon2.hash(p, { type: argon2.argon2id });
export const verifyPassword = (hash: string, p: string) => argon2.verify(hash, p);
```

## 12.4 Fluxos

### A) Cadastro (com captcha + verificação de e-mail)

```ts
// app/actions/register.ts
'use server';
export async function register(input: unknown) {
  const data = RegisterSchema.parse(input);          // Zod: email, senha forte, handle
  await rateLimit(`register:${clientIp()}`, { max: 5, windowMs: 600_000 });

  // 1) captcha proprietário — valida antes de qualquer escrita (ver doc 14)
  const ok = await verifyCaptcha(data.captcha, { action: 'register' });
  if (!ok) return { ok: false, error: 'CAPTCHA' };

  // 2) anti-enumeração: resposta genérica mesmo se o e-mail já existir
  const exists = await db.user.findUnique({ where: { email: data.email } });
  if (!exists) {
    const user = await db.user.create({
      data: { email: data.email, handle: data.handle,
              displayName: data.handle, passwordHash: await hashPassword(data.password) },
    });
    const { raw, tokenHash } = createToken();
    await db.verificationToken.create({ data: {
      userId: user.id, email: user.email, purpose: 'EMAIL_VERIFY',
      tokenHash, expiresAt: addHours(24) } });
    await enqueueEmail('verify', { email: user.email, raw }); // Resend via job
  }
  // sempre a mesma resposta (não revela existência)
  return { ok: true, message: 'Enviamos um e-mail de confirmação.' };
}
```

- Verificação obrigatória antes de **submeter conteúdo** (liga à comunidade).
- Link do e-mail → rota que chama `consumeToken(raw, 'EMAIL_VERIFY')` e marca
  `user.emailVerified`.

### B) Login

- **Credentials** (e-mail + senha): `verifyPassword`; mensagens genéricas
  ("e-mail ou senha inválidos") — sem dizer qual; rate limit + lockout progressivo
  por conta/IP. Sessão em cookie httpOnly (ver [09 — Segurança](./09-seguranca.md)).
- **Magic link** (Email provider): emite `MAGIC_LINK` e envia via Resend.

### C) Recuperação de senha

```
Solicitar → (sempre resposta genérica) → se existe: cria PASSWORD_RESET + envia e-mail
→ usuário abre link → valida token → define nova senha (argon2id)
→ invalida TODAS as sessões + tokens de reset pendentes → notifica por e-mail
```

- Página "esqueci a senha" **nunca** revela se o e-mail existe.
- Após redefinir: revogar sessões ativas e enviar e-mail "sua senha foi alterada".

### D) Troca de e-mail

- Verifica o **novo** e-mail via `EMAIL_CHANGE` antes de efetivar; ao trocar,
  **notifica o e-mail antigo** ("seu e-mail foi alterado") para detecção de
  sequestro de conta.

## 12.5 Templates de e-mail (React Email)

Templates versionados, com texto alternativo, marca, e link de descadastro nos
não essenciais.

```tsx
// emails/verify-email.tsx
import { Html, Button, Text, Container } from '@react-email/components';
export default function VerifyEmail({ url, handle }: { url: string; handle: string }) {
  return (
    <Html lang="pt-BR">
      <Container>
        <Text>Olá, @{handle}! Confirme seu e-mail para ativar sua conta na RetroWiki.</Text>
        <Button href={url}>Confirmar e-mail</Button>
        <Text>O link expira em 24 horas. Se não foi você, ignore este e-mail.</Text>
      </Container>
    </Html>
  );
}
```

E-mails transacionais e seus gatilhos:

| E-mail | Gatilho | Essencial? |
|---|---|---|
| Confirmar e-mail | Cadastro | Sim |
| Redefinir senha | Solicitação de reset | Sim |
| Senha alterada | Reset concluído | Sim (segurança) |
| Confirmar novo e-mail | Troca de e-mail | Sim |
| E-mail alterado (aviso ao antigo) | Troca de e-mail | Sim (segurança) |
| Magic link | Login sem senha | Sim |
| Notificações (aprovação, comentário, digest…) | Eventos | Não (com descadastro) — ver [13](./13-notificacoes.md) |

## 12.6 Webhooks do Resend (saúde de entrega)

Endpoint que recebe eventos (`email.delivered`, `bounced`, `complained`),
valida a **assinatura** do webhook e atualiza uma **lista de supressão**:

```ts
// app/api/webhooks/resend/route.ts
export async function POST(req: Request) {
  const evt = await verifyResendSignature(req);          // valida assinatura
  if (evt.type === 'email.bounced' || evt.type === 'email.complained') {
    await suppress(evt.data.to);                          // não enviar mais p/ esse e-mail
  }
  return Response.json({ ok: true });
}
```

- **Bounces/complaints** entram em supressão (protege reputação de envio).
- Reclamações de spam → desligar notificações daquele usuário.

## 12.7 Segurança (resumo — detalhes em [09](./09-seguranca.md))

- Token só por **hash** no banco; single-use; TTL curto; consumo atômico.
- **Anti-enumeração**: respostas genéricas em cadastro/reset.
- Rate limit + lockout em login/reset; captcha no cadastro (doc 14).
- Senha com **argon2id**; senha forte validada (Zod).
- Reset invalida sessões; troca de e-mail notifica o antigo.
- `RESEND_API_KEY`, `AUTH_SECRET` em env vars; webhooks com assinatura validada.
- Envio em job (não bloqueia request) com idempotência e retry.
