# 02 — Arquitetura

## 2.1 Stack recomendada

| Camada | Escolha | Por quê |
|---|---|---|
| Framework | **Next.js (App Router)** + React Server Components | HTML semântico no servidor (SEO/a11y), ilhas de cliente, streaming, ISR. Mantém continuidade com a v1. |
| Linguagem | **TypeScript** estrito | Tipagem ponta a ponta (DB → API → UI). |
| Banco | **PostgreSQL** | Relacional, JSONB para árvore de blocos, full-text search nativo. |
| ORM | **Prisma** (ou Drizzle) | Schema tipado, migrations, ótimo DX. |
| Auth | **Auth.js (NextAuth v5)** | OAuth (Google/GitHub) + e-mail, sessão em cookie httpOnly. Ver [12](./12-autenticacao-e-emails.md). |
| E-mail | **Resend** (+ React Email) | Todos os e-mails: verificação, reset de senha, notificações. Ver [12](./12-autenticacao-e-emails.md). |
| Notificações | In-app (DB) + e-mail | Orientado a eventos, com preferências e digest. Ver [13](./13-notificacoes.md). |
| Anti-bot | **RetroGuard** (captcha próprio) | PoW invisível + sinais + nonce assinado, acessível. Ver [14](./14-captcha-proprietario.md). |
| Validação | **Zod** | Um schema validando borda da API e formulários do editor. |
| Estilo | **Tailwind CSS v4** (CSS-first) + **shadcn/ui** | Ver [08 — Design System](./08-design-system.md). |
| Conteúdo do usuário | **Árvore de blocos em JSONB** + renderer fechado | Seguro e estruturado; sem `eval` de MDX de terceiros. Ver [05](./05-editor-e-componentes-dinamicos.md). |
| Imagens | **Object storage** (S3/R2/Blob) + `next/image` | Uploads moderados; CDN; otimização. |
| Busca | **Postgres FTS** no MVP → **Meilisearch/Typesense** depois | Ver [10 — Busca e Performance](./10-busca-e-performance.md). |
| Cache | **ISR + cache tags** (`revalidateTag`) | Casa "dinâmico" (releases, lojas) com performance. |
| Filas/Jobs | **Cron + fila** (ex.: Inngest/QStash) | Revalidar releases, recalcular reputação, notificar moderação. |

> A stack acima é compatível com hospedagem serverless (ex.: Vercel) **ou**
> self-host (Node + Postgres). Nada exige um provedor proprietário específico.

## 2.2 Visão em camadas

```
┌──────────────────────────────────────────────────────────────┐
│  Cliente (browser)                                            │
│  • Páginas RSC (HTML semântico)  • Ilhas interativas (editor, │
│    filtros, comparador)          • shadcn/ui + Tailwind v4    │
└───────────────▲──────────────────────────────┬───────────────┘
                │ HTML/stream                   │ Server Actions / API (JSON)
┌───────────────┴──────────────────────────────▼───────────────┐
│  Aplicação (Next.js App Router, servidor)                    │
│  • Server Components (leitura)   • Server Actions (escrita)   │
│  • Renderer de blocos (allowlist)• Auth/RBAC middleware       │
│  • Validação Zod                 • Rate limiting              │
└───────────────▲──────────────────────────────┬───────────────┘
                │                               │
   ┌────────────┴─────────┐        ┌────────────▼──────────────┐
   │ Integrações (server) │        │ Domínio / Serviços        │
   │ • GitHub Releases     │        │ • Devices  • Conteúdo     │
   │ • Lojas/afiliados     │        │ • Moderação• Reputação    │
   │ (allowlist + cache)   │        │ • Busca                   │
   └────────────▲─────────┘        └────────────┬──────────────┘
                │                               │
   ┌────────────┴───────────────────────────────▼──────────────┐
   │ Persistência: PostgreSQL (+ JSONB)  •  Object Storage      │
   │ Cache: ISR/tags  •  Índice de busca                        │
   └────────────────────────────────────────────────────────────┘
```

## 2.3 Estratégia de renderização

| Tipo de página | Renderização | Cache |
|---|---|---|
| Catálogo / ficha de device | **RSC estático com ISR** | `revalidate` por tempo + `revalidateTag('device:<id>')` ao editar |
| Artigo publicado (tutorial/guia) | **RSC estático com ISR** | tag `article:<id>`; revalida ao publicar nova revisão |
| Bloco "GitHub Releases" dentro de um artigo | Dados buscados no **servidor** com cache de curta duração | tag `gh:<owner>/<repo>` revalidada por cron (ex.: a cada hora) |
| Editor / fila de moderação / perfil | **Dinâmico** (dados do usuário, sem cache) | `no-store`, atrás de auth |
| Busca/filtros | Ilha cliente sobre API paginada (ou índice externo) | cache curto na API |

**Princípio:** leitura pública é estática/ISR (rápida, indexável); escrita é por
**Server Actions** autenticadas; "frescor" vem de **revalidação por tags**, não de
renderização dinâmica a cada request.

## 2.4 Fluxo de escrita (Server Actions + validação)

```ts
// app/actions/submit-article.ts
'use server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { BlockTreeSchema } from '@/lib/blocks/schema';

const SubmitSchema = z.object({
  title: z.string().min(8).max(140),
  type: z.enum(['tutorial', 'buying-guide', 'troubleshooting']),
  deviceId: z.string().uuid().nullable(),
  body: BlockTreeSchema, // valida a árvore de blocos (allowlist de tipos)
});

export async function submitArticle(input: unknown) {
  const session = await auth();
  if (!session?.user) return { ok: false, error: 'UNAUTHENTICATED' };

  await rateLimit(`submit:${session.user.id}`, { max: 5, windowMs: 60_000 });

  const parsed = SubmitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'INVALID', issues: parsed.error.issues };

  // grava como SUBMISSION pendente — NUNCA publica direto
  const article = await createPendingSubmission(session.user.id, parsed.data);
  await enqueueModeration(article.id);
  return { ok: true, id: article.id };
}
```

Pontos-chave (detalhados em [09 — Segurança](./09-seguranca.md)):

- Toda escrita exige **sessão**; toda submissão entra como **pendente**.
- O corpo do artigo é validado contra um **schema de blocos** (allowlist) — não
  aceitamos HTML/MDX arbitrário.
- **Rate limiting** por usuário/IP em operações de criação.

## 2.5 Estrutura de pastas sugerida

```
src/
  app/
    (public)/                # catálogo, fichas, artigos (RSC/ISR)
      consoles/[slug]/
      guias/[slug]/
      buscar/
    (auth)/                  # login, perfil
    (studio)/                # editor + "meus rascunhos" (auth)
      editor/[id]/
    (moderation)/            # fila de moderação (role: moderator+)
    api/                     # rotas de leitura paginada, webhooks
    actions/                 # Server Actions (escrita)
  lib/
    auth.ts                  # Auth.js + RBAC
    db.ts                    # Prisma client
    rate-limit.ts
    blocks/
      schema.ts              # Zod da árvore de blocos (allowlist)
      registry.tsx           # mapeamento tipo→componente (render)
      render.tsx             # renderer servidor seguro
    integrations/
      github.ts              # releases (cache + SSRF guard)
      stores.ts              # links de loja (allowlist de domínios)
  components/
    blocks/                  # 1 componente por tipo de bloco
    ui/                      # shadcn/ui
    catalog/                 # cards, filtros, comparador
  styles/
    globals.css              # Tailwind v4 (@theme, tokens)
prisma/
  schema.prisma
```

## 2.6 Decisões e trade-offs

- **Por que não continuar no Fumadocs?** Fumadocs é file-based e single-author; o
  requisito central da v2 (contribuição comunitária + moderação + dados
  estruturados + editor visual) não cabe no modelo de arquivos. Mantemos o
  *aprendizado* dos componentes (FirmwareList/BuyingGuide/ConsoleOverview).
- **Por que blocos em JSON e não MDX salvo no banco?** Renderizar MDX de terceiros
  significa compilar/avaliar código enviado por usuários — superfície de ataque
  enorme. Uma **árvore de blocos** com allowlist é segura, versionável e gera um
  editor visual naturalmente. Ver [05](./05-editor-e-componentes-dinamicos.md).
- **Por que ISR + tags?** Conteúdo público precisa ser rápido e indexável; ao
  mesmo tempo, releases do GitHub e preços mudam. Revalidação por tag entrega
  ambos sem renderizar tudo a cada request.
