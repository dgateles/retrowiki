# 09 — Segurança

Plataforma comunitária = **conteúdo gerado por usuário** + **integrações externas**
+ **autenticação/papéis**. Cada uma é uma superfície de ataque. Esta seção aplica
o checklist de segurança ao caso concreto. Regra geral: **o cliente nunca é fonte
de verdade; valide e autorize sempre no servidor.**

## 9.1 Modelo de ameaças (o que pode dar errado)

| Vetor | Cenário | Mitigação principal |
|---|---|---|
| **XSS via conteúdo** | Autor injeta HTML/JS no corpo do artigo | Árvore de blocos com allowlist; sem `dangerouslySetInnerHTML` de UGC; sanitização de marcas inline |
| **SSRF** | Bloco dinâmico faz o servidor buscar URL arbitrária | Allowlist de `owner/repo` e `Store.domain`; nunca URL livre do cliente |
| **Escalada de privilégio** | Membro publica sem revisão / acessa moderação | RBAC no servidor em toda action/rota; estados de artigo no servidor |
| **Spam / link farming** | Submissões em massa, afiliados disfarçados | Rate limit, allowlist de domínios, antispam, fila de moderação |
| **Abuso de integração** | Esgotar rate limit do GitHub, vazar token | Token só no servidor, cache, allowlist, timeout |
| **Exposição de dados** | Stack trace, e-mail, rascunhos de terceiros | Erros genéricos; autorização por dono; logs sem PII |
| **CSRF** | Ação de escrita disparada de outro site | Cookies `SameSite=Strict`/`Lax` + Server Actions; checagem de origem |
| **Upload malicioso** | Arquivo perigoso/imagem gigante | Validação de tipo/tamanho/extensão; reprocessar imagem; storage isolado |

## 9.2 XSS — a regra mais importante para UGC

**Nunca** renderizar HTML/MDX arbitrário do usuário. O corpo é uma **árvore de
blocos** (ver [05](./05-editor-e-componentes-dinamicos.md)); só tipos da allowlist
renderizam, via componentes que **escapam texto por padrão** (JSX já escapa).

Marcas inline (`b/i/code/link`) são aplicadas por um renderer próprio que:
- escapa todo o texto;
- só permite as tags da allowlist;
- em `link`, valida o protocolo (`https:` apenas) e adiciona `rel`.

Se em algum ponto for inevitável renderizar HTML (ex.: importar conteúdo legado),
sanitizar com allowlist estrita **no servidor**:

```ts
import DOMPurify from 'isomorphic-dompurify';
export function sanitizeLegacyHtml(html: string) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p','strong','em','code','ul','ol','li','a','h2','h3','kbd'],
    ALLOWED_ATTR: ['href'],
    ALLOWED_URI_REGEXP: /^https:\/\//i,   // só https
  });
}
```

**Content Security Policy** estrita (headers no `next.config`/middleware):

```
default-src 'self';
script-src 'self';                /* sem 'unsafe-inline' — use nonce se preciso */
style-src 'self' 'unsafe-inline'; /* Tailwind injeta estilos */
img-src 'self' data: https://<seu-storage-cdn>;
connect-src 'self';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```
Mais headers: `X-Content-Type-Options: nosniff`, `Referrer-Policy:
strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, HSTS.

## 9.3 SSRF — blocos dinâmicos

Os blocos que fazem fetch (GitHub, loja) **só aceitam alvos de uma allowlist**
(tabelas `GithubRepo`, `Store`), nunca uma URL escolhida pelo cliente. Reforços:

- Validar `owner`/`repo` por regex **e** existência na allowlist antes do fetch.
- Construir a URL final no servidor a partir de campos validados (sem
  interpolar entrada bruta).
- `AbortSignal.timeout` em todo fetch; tratar erro com fallback ao cache.
- Não seguir redirects para hosts fora do esperado.

## 9.4 Autenticação e sessão

- **Auth.js (NextAuth v5)** com OAuth (Google/GitHub) e/ou magic-link.
- Sessão em **cookie httpOnly, Secure, SameSite=Lax** (ou Strict). **Nunca** token
  em `localStorage` (vulnerável a XSS).
- Rotação de sessão no login; expiração; logout invalida.
- Cadastro com antispam (Turnstile/hCaptcha) e verificação de e-mail.

```ts
// exemplo de cookie de sessão
'Set-Cookie: session=<id>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=...'
```

## 9.5 Autorização (RBAC) — sempre no servidor

Toda Server Action e rota protegida revalida sessão **e** papel:

```ts
export async function approveArticle(articleId: string) {
  const session = await auth();
  if (!can.moderate(session?.user)) {     // checagem no servidor
    return { ok: false, error: 'FORBIDDEN' };   // 403, mensagem genérica
  }
  // ... publica, revalida, grava AuditLog
}
```

- **Autorização por dono**: editar/excluir rascunho exige `article.authorId ===
  session.user.id` (ou papel ≥ moderador).
- **Estados no servidor**: o cliente não decide se algo está "publicado" — só a
  Server Action altera `status`.
- **Defesa em profundidade**: middleware protege grupos de rota (`(studio)`,
  `(moderation)`) **e** cada action revalida.

## 9.6 Validação de entrada (Zod em toda borda)

- **Um schema por entrada** (criar/editar artigo, comentário, perfil, device).
- A árvore de blocos é validada por `BlockTreeSchema` (allowlist) na submissão
  **e** defensivamente na leitura de conteúdo migrado.
- **Allowlist, não blacklist**. Limites de tamanho em todos os campos.
- Comentários: texto puro; renderizados com escape (sem HTML).

## 9.7 Rate limiting e antiabuso

```ts
// por usuário e por IP, com limites mais agressivos no que é caro/abusável
await rateLimit(`submit:${userId}`,  { max: 5,  windowMs: 60_000 });
await rateLimit(`comment:${userId}`, { max: 10, windowMs: 60_000 });
await rateLimit(`search:${ip}`,      { max: 30, windowMs: 60_000 });
await rateLimit(`gh-preview:${ip}`,  { max: 20, windowMs: 60_000 }); // preview de bloco
```

- Limites mais rígidos em busca, preview de blocos dinâmicos e submissão.
- Allowlist de domínios em links; bloquear encurtadores; limitar nº de links por
  artigo; detectar duplicidade. (Fluxo em [04 — Comunidade](./04-comunidade-e-moderacao.md).)

## 9.8 Uploads de imagem

```ts
function validateUpload(file: File) {
  const maxSize = 5 * 1024 * 1024;                       // 5 MB
  const allowed = ['image/jpeg','image/png','image/webp'];
  if (file.size > maxSize) throw new Error('Arquivo muito grande (máx 5 MB)');
  if (!allowed.includes(file.type)) throw new Error('Tipo inválido');
  // valide a extensão e os magic bytes, não confie só no Content-Type
}
```

- **Reprocessar** a imagem no servidor (ex.: sharp) — remove EXIF e payloads
  embutidos; gera tamanhos otimizados.
- Servir de **storage/CDN isolado** (domínio próprio na CSP `img-src`).
- `alt` obrigatório na publicação (a11y — ver [07](./07-semantica-e-acessibilidade.md)).

## 9.9 Segredos e configuração

- Tudo sensível em **env vars** (`GITHUB_TOKEN`, `DATABASE_URL`, `AUTH_SECRET`,
  `CRON_SECRET`, chaves de storage). Nada hardcoded; `.env.local` no `.gitignore`.
- Validar presença na inicialização (falhar cedo).
- Segredos de produção no painel do host; rotação periódica.

## 9.10 Banco de dados

- **Queries parametrizadas** sempre (ORM/Prisma já faz). Nunca concatenar SQL.
- Se usar Postgres com RLS (ex.: Supabase), habilitar RLS e políticas por dono.
- Migrations versionadas; backups; princípio do menor privilégio no usuário de DB.

## 9.11 Endpoints de cron/webhook

- Proteger por **secret** comparado em **tempo constante**:

```ts
function assertCronSecret(req: Request) {
  const got = req.headers.get('authorization') ?? '';
  const ok = timingSafeEqual(got, `Bearer ${process.env.CRON_SECRET}`);
  if (!ok) throw new Response('Unauthorized', { status: 401 });
}
```
- Webhooks externos (se houver): validar assinatura HMAC.

## 9.12 Tratamento de erros e logs

- **Erros genéricos ao usuário** ("Ocorreu um erro, tente novamente"); detalhes só
  no log do servidor. Nunca expor stack trace/SQL.
- **Logs sem PII/segredos** (sem senhas, tokens, e-mails completos).
- **AuditLog** para ações de moderação/admin (quem fez, o quê, quando) — ver
  [03 — Modelo de Dados](./03-modelo-de-dados.md).

## 9.13 Dependências

- `npm audit` no CI; Dependabot/Renovate; lockfile commitado; `npm ci`.
- Bloquear scripts de pós-instalação; período de carência para versões novas;
  auditar pacotes (Socket) antes de adicionar.

## 9.14 Checklist pré-deploy

- [ ] Conteúdo do usuário renderizado **só** via allowlist de blocos (sem HTML cru)
- [ ] CSP + headers de segurança configurados
- [ ] Blocos dinâmicos só acessam alvos da allowlist (anti-SSRF); token no servidor
- [ ] Toda Server Action/rota protegida revalida sessão **e** papel
- [ ] Submissões entram como `PENDING`; nada publica sem aprovação/autotrust auditado
- [ ] Entrada validada com Zod (criação, edição, comentário, perfil)
- [ ] Rate limiting em criação, comentário, busca e preview de blocos
- [ ] Uploads validados e reprocessados; storage isolado; `alt` obrigatório
- [ ] Sessão em cookie httpOnly/Secure/SameSite; sem token em localStorage
- [ ] Secrets em env vars; `.env*` no gitignore; sem segredo no histórico
- [ ] Erros genéricos ao usuário; logs sem PII; AuditLog em ações sensíveis
- [ ] Cron/webhooks protegidos por secret (comparação em tempo constante)
- [ ] `npm audit` limpo; lockfile commitado
- [ ] HTTPS forçado; CORS restrito
