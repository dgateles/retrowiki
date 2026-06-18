# 18 — Vínculo de conta Google

Design para vincular uma conta Google a uma conta RetroWiki, incluindo o caso de
e-mail diferente do cadastrado, com painel de "Contas conectadas" e persistência
da identidade do Google (`sub`).

Status: **design aprovado** (brainstorming concluído). Implementação pendente.

## Resumo do entendimento

- **O quê:** (a) reforçar o auto-vínculo por mesmo e-mail já existente; (b)
  vincular manualmente um Google de **e-mail diferente** via `/conta`; (c) painel
  "Contas conectadas"; (d) persistir a identidade Google (`sub`).
- **Por quê:** permitir login Google mesmo quando o e-mail do Google difere do
  cadastrado, e tornar o vínculo robusto a troca de e-mail e seguro.
- **Para quem:** membros logados (qualquer papel).
- **NFR principal — segurança:** reautenticação por senha antes de
  conectar/desconectar; "verificado vence" no e-mail não verificado; conflito de
  identidade rejeitado.
- **Não-objetivos:** outros provedores além do Google (a tabela é extensível, mas
  só Google é implementado agora); gestão de contas pelo adapter do NextAuth
  (segue JWT, sem adapter).

## Premissas

- NextAuth v5 (`next-auth` 5 beta) com estratégia **JWT, sem adapter** — por isso
  o vínculo de e-mail diferente usa fluxo OAuth próprio, não o `signIn` padrão.
- `AUTH_URL`/`APP_URL` apontam o domínio canônico (`https://retro.wiki.br`); o
  `redirect_uri` do vínculo é montado a partir do `APP_URL` (nunca por header).
- O e-mail do Google é verificado pelo próprio Google (prova de posse).

## Decision Log

1. **Reauth por senha** antes de vincular/desvincular. Alternativas: só estar
   logado (mais simples, inseguro); só ao desvincular. Escolhido: confirmar senha
   — protege contra sessão sequestrada adicionar/remover login.
2. **E-mail não verificado (mesmo e-mail, login Google):** vincular + **anular
   `password_hash`** + bump `session_version`. Alternativas: continuar recusando
   (trava usuário legítimo); manter a senha (inseguro). Escolhido: "verificado
   vence" — o Google prova a posse e neutraliza senha de possível squatter.
3. **Armazenamento:** tabela `oauth_accounts` (vs colunas em `users`). Escolhido:
   tabela — mais limpa e extensível, com unicidade por `(provider, sub)`.
4. **Resolução no login:** por `sub` → por e-mail → cria. Ao casar por e-mail,
   grava o `sub`. Robusto a troca de e-mail.
5. **Conflito:** `sub` já vinculado a outra conta → recusa. (E-mail do Google
   coincidir com outra conta NÃO é conflito — vínculo é por `sub`, não muda
   e-mails.)
6. **Desvincular:** só se a conta tiver senha utilizável; conta só-Google é
   bloqueada (orienta definir senha antes).
7. **Mecanismo:** fluxo OAuth próprio (`/api/account/link/google/start` +
   `/callback`) com `state` assinado (HMAC AUTH_SECRET) + cookie `nonce`.

## Design

### Dados

Nova tabela `oauth_accounts` (migração nova):

| coluna | tipo | nota |
|---|---|---|
| `id` | int PK auto | |
| `user_id` | int FK→users | índice |
| `provider` | varchar(32) | `"google"` |
| `provider_account_id` | varchar(255) | o `sub` do Google |
| `email` | varchar(255) | e-mail do Google (pode diferir do da conta) |
| `created_at` | datetime | |

Único em **(`provider`, `provider_account_id`)**.

### Resolução no login (`getOrCreateOAuthUser`, passa a receber o `sub`)

1. Por `sub` em `oauth_accounts` → conta vinculada (inclusive e-mail diferente);
   atualiza o `email` guardado se mudou.
2. Senão por e-mail em `users`:
   - verificada **ou** sem senha → vincula (insere `oauth_accounts`, adota avatar).
   - com senha **e não verificada** → *verificado vence*: marca verificado, zera
     `password_hash`, bump `session_version`, insere `oauth_accounts`.
3. Senão → cria conta nova + `oauth_accounts`.

O `sub` vem de `account.providerAccountId` no callback do NextAuth (`auth.ts`).

### Painel "Contas conectadas" (`/conta`)

Novo componente na navegação de settings. Linha "Google": vinculado → mostra o
e-mail do Google + **Desconectar**; senão → **Conectar Google**. "Conectar" só
aparece sem Google vinculado (essas contas têm senha → reauth sempre se aplica).

### Fluxo de conectar (OAuth próprio)

1. "Conectar Google" → modal pede a senha atual.
2. Servidor valida senha → emite `state` HMAC `{userId, nonce, exp~10min,
   purpose:"link"}` + cookie `nonce` (`httpOnly`, `secure`, `sameSite=lax`).
   Retorna a URL de autorização do Google (`client_id`,
   `redirect_uri=${APP_URL}/api/account/link/google/callback`, scope
   `openid email profile`, `state`).
3. Browser → Google → consente → `/api/account/link/google/callback?code&state`.
4. Callback: valida HMAC + `exp` + cookie `nonce`; troca `code` por tokens;
   extrai `sub`+e-mail.
5. Conflito: `(google, sub)` de outra conta → recusa; do mesmo usuário → ok.
6. Insere `oauth_accounts` e volta a `/conta` com sucesso.

### Fluxo de desconectar

"Desconectar" → confirma senha → se sem senha (só-Google) → bloqueia. Senão
remove a linha de `oauth_accounts`.

### Segurança / borda

- `state` assinado + `exp` + `nonce` de uso único; `redirect_uri` fixo no
  canônico.
- "Verificado vence" derruba sessões (bump `session_version`).
- Vincular Google cujo e-mail é de outra conta de senha é permitido (não mexe em
  e-mails; só `sub` é único). Banido/suspenso seguem bloqueados.

### Infra (Google Cloud)

Adicionar redirect URI: `https://retro.wiki.br/api/account/link/google/callback`
(canônico basta; o do `.com.br` é opcional).

## Endurecimento (revisão multi-agente — obrigatório)

Achados de revisores de segurança e lógica, incorporados ao design:

**Resolução no login (auth.ts) — colapsar para UMA chamada:**
- `getOrCreateOAuthUser`/`resolveOAuthUser` roda **só no `signIn`** (onde
  `account.providerAccountId`=`sub` existe). O `signIn` resolve, aplica regras e
  **escreve no objeto `user`** (`id/role/handle/sv`); o `jwt` vira leitura pura
  (sem 2ª query, sem escrita). Senão: insert duplicado → `return null` →
  login quebra; e `account` é `undefined` no `jwt` (refreshes).
- "Verificado vence" deve retornar o `session_version` **pós-bump** (existing+1),
  senão o token recém-emitido carrega o `sv` antigo e o usuário é deslogado na
  hora. Envia e-mail avisando que o login por senha foi removido.
- Checar **banido/suspenso contra a conta resolvida** (e-mail RetroWiki), não só
  o e-mail do Google.

**`email_verified` (CRÍTICO):** só auto-vincular / "verificado vence" / vincular
manual quando `email_verified === true`. Se `false` (ex.: Workspace de domínio
não verificado) → **recusa**. `resolveOAuthUser` recebe a claim.

**Idempotência:** `oauth_accounts` por `INSERT ... ON DUPLICATE KEY UPDATE`
(re-login e re-vínculo viram no-op). Parar de engolir erro de DB como
`return null` no caminho esperado de duplicata. Handle de criação à prova de
colisão (sufixo com id/token longo).

**Fluxo manual — segurança:**
- Callback exige **sessão ativa** e `state.userId === session.id`.
- `state`/PKCE guardados **server-side** (tabela `oauth_link_states`, uso único:
  apaga na troca) + cookie `httpOnly/secure/sameSite=lax` com o id.
- **PKCE** (`code_challenge` S256 + `code_verifier`).
- Lê `sub`/`email`/`email_verified` do **userinfo autenticado** (token trocado
  server-to-server) + valida `aud`/`iss` do `id_token`.
- Redirect pós-callback **fixo e relativo** (`/conta`), sem `returnTo`.
- Conflito de `sub` resolvido pela **constraint única** (atômico).

**Desvincular — "sem método de login":** bloquear se sobrar zero meio de login.
Regra: permitir só se restar **senha utilizável** OU **≥1 outra linha
`oauth_accounts`**. Conta só-Google (`password_hash === ""`) → bloqueada.

**Migração / conta só-Google sem linha:** usuários OAuth atuais não têm `sub`
guardado nem `password_hash`. O painel não pode assumir "sem vínculo ⇒ tem
senha". Para `password_hash === ""`, o "Conectar" **dispensa** a senha (nada a
confirmar) — autocura no próximo login Google (vínculo por e-mail, insert
idempotente).

### Testes (E2E navegador + axe)

Vincular mesmo e-mail; vincular e-mail diferente; rejeição por conflito de `sub`;
desvincular; desvincular bloqueado em conta só-Google; resolução do e-mail não
verificado (senha zerada).
