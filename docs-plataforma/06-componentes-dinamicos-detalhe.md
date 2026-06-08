# 06 — Componentes Dinâmicos em Detalhe

Os blocos dinâmicos buscam dados externos **no servidor**, com cache e
revalidação. Eles são a evolução do `FirmwareList`/`BuyingGuide` da v1 para
"blocos de primeira classe" usáveis por qualquer autor.

Regras de ouro (todas reforçadas em [09 — Segurança](./09-seguranca.md)):

1. **Nunca** o cliente escolhe a URL final do fetch. Ele escolhe um **ID/ref** de
   uma **allowlist** (repo cadastrado, loja cadastrada, device do catálogo).
2. Todo fetch externo é **server-side**, com **timeout**, **cache** e **tratamento
   de erro** que degrada graciosamente.
3. Segredos (tokens) só no servidor, em env vars.

## 6.1 Bloco "GitHub Releases" (auto-atualizável)

### Fonte e allowlist

O bloco grava `{ owner, repo, limit }`. Antes de buscar, validamos contra a
tabela `GithubRepo` (allowlist mantida por admin). Isso evita SSRF e uso da nossa
infra/token para repositórios arbitrários.

```ts
// lib/integrations/github.ts
import 'server-only';
import { z } from 'zod';
import { db } from '@/lib/db';

const Release = z.object({
  tag_name: z.string(),
  name: z.string().nullable(),
  html_url: z.string().url(),
  published_at: z.string(),
  prerelease: z.boolean(),
  assets: z.array(z.object({
    name: z.string(),
    browser_download_url: z.string().url(),
    size: z.number(),
    download_count: z.number(),
  })),
});
export type Release = z.infer<typeof Release>;

export async function getReleases(owner: string, repo: string, limit = 3): Promise<Release[]> {
  // 1) allowlist — repo precisa estar cadastrado e aprovado
  const allowed = await db.githubRepo.findUnique({ where: { owner_repo: { owner, repo } } });
  if (!allowed) return [];

  // 2) fetch server-side com cache + tag para revalidação
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases?per_page=${limit}`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        // token só no servidor, eleva o rate limit de 60→5000/h
        ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 3600, tags: [`gh:${owner}/${repo}`] }, // ISR + tag
    },
  );
  if (!res.ok) return cachedFallback(owner, repo);   // degrada para último payload salvo

  const json = await res.json();
  const parsed = z.array(Release).safeParse(json);
  const releases = parsed.success ? parsed.data.slice(0, limit) : [];

  // 3) materializa o último payload (fallback + revalidação por cron)
  await db.githubRepo.update({
    where: { owner_repo: { owner, repo } },
    data: { lastSynced: new Date(), cache: releases as any },
  });
  return releases;
}

async function cachedFallback(owner: string, repo: string): Promise<Release[]> {
  const row = await db.githubRepo.findUnique({ where: { owner_repo: { owner, repo } } });
  return (row?.cache as Release[] | undefined) ?? [];
}
```

### O bloco (Server Component)

```tsx
// components/blocks/github-releases.tsx  (async RSC)
import { getReleases } from '@/lib/integrations/github';
import { Download } from 'lucide-react';

export async function GithubReleasesBlock({ owner, repo, limit = 3 }: {
  owner: string; repo: string; limit?: number;
}) {
  const releases = await getReleases(owner, repo, limit);

  if (releases.length === 0) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Releases de <code>{owner}/{repo}</code> indisponíveis no momento.
      </p>
    );
  }

  return (
    <section aria-label={`Últimos releases de ${owner}/${repo}`} className="not-prose my-6 space-y-3">
      {releases.map((r) => (
        <article key={r.tag_name} className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold">{r.name || r.tag_name}</h3>
          <p className="text-sm text-muted-foreground">
            <time dateTime={r.published_at}>
              {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(r.published_at))}
            </time>
          </p>
          <ul className="mt-2 space-y-1">
            {r.assets.slice(0, 4).map((a) => (
              <li key={a.name}>
                {/* download externo: rel de segurança + nofollow */}
                <a
                  href={a.browser_download_url}
                  rel="nofollow noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline focus-visible:outline-2"
                >
                  <Download className="size-4" aria-hidden="true" />
                  {a.name}
                  <span className="text-muted-foreground">
                    ({(a.size / 1e6).toFixed(0)} MB)
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}
```

### Revalidação "sempre atualizado"

Dois mecanismos combinados:

- **ISR por tempo** (`revalidate: 3600`): cada página com o bloco revalida ~1h.
- **Cron de sincronização**: um job percorre `GithubRepo` e chama
  `revalidateTag('gh:<owner>/<repo>')` (ou regrava `cache`) periodicamente — mesmo
  páginas sem tráfego ficam atualizadas, e há **fallback** quando a API do GitHub
  falha/rate-limita.

```ts
// app/api/cron/sync-github/route.ts  (protegido por secret de cron)
export async function POST(req: Request) {
  assertCronSecret(req);                 // ver 09 — segurança
  const repos = await db.githubRepo.findMany();
  for (const { owner, repo } of repos) {
    await getReleases(owner, repo).catch(() => {});  // atualiza cache
    revalidateTag(`gh:${owner}/${repo}`);
  }
  return Response.json({ ok: true, count: repos.length });
}
```

## 6.2 Bloco "Onde Comprar" (lojas/afiliados)

O bloco grava IDs de `Store` (allowlist). A renderização aplica `trustLevel`,
badges e — crucialmente — `rel="sponsored nofollow"` em links de afiliado.

```tsx
// components/blocks/store-links.tsx (async RSC)
import { db } from '@/lib/db';
import { ShieldCheck, ExternalLink } from 'lucide-react';

const TRUST = {
  VERIFIED: { label: 'Verificado', cls: 'text-emerald-600' },
  TRUSTED:  { label: 'Confiável',  cls: 'text-sky-600' },
  CAUTION:  { label: 'Cautela',    cls: 'text-amber-600' },
} as const;

export async function StoreLinksBlock({ stores }: { stores: string[] }) {
  // só lojas cadastradas e ativas — allowlist por id
  const rows = await db.store.findMany({ where: { id: { in: stores } } });

  return (
    <section aria-label="Onde comprar" className="not-prose my-6 grid gap-3 sm:grid-cols-2">
      {rows.map((s) => {
        const t = TRUST[s.trust];
        return (
          <a
            key={s.id}
            href={`https://${s.domain}`}                       // domínio da allowlist
            rel={s.affiliate ? 'sponsored nofollow noopener' : 'nofollow noopener'}
            target="_blank"
            className="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:border-primary/50 focus-visible:outline-2"
          >
            <span className="font-medium">{s.name}</span>
            <span className={`inline-flex items-center gap-1 text-xs ${t.cls}`}>
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              {t.label}
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </span>
          </a>
        );
      })}
    </section>
  );
}
```

- **Allowlist de domínios** (`Store.domain`) impede injeção de links arbitrários,
  encurtadores e phishing.
- **Afiliados sinalizados** (`rel="sponsored"`) — exigência de transparência e de
  SEO. A URL final/afiliada pode ser montada server-side (o autor nunca cola um
  link de afiliado cru — ele escolhe a loja).
- Preço aproximado pode ser um campo opcional do bloco ou sincronizado por
  integração (mesma estratégia de cache/cron do GitHub, se houver API de preço).

## 6.3 Bloco "Ficha de Device"

Embute a ficha técnica canônica (specs + scores de emulação) lendo do banco —
sem duplicar dados no artigo.

```tsx
// components/blocks/device-spec.tsx (async RSC)
import { getDeviceWithSpec } from '@/lib/devices';
export async function DeviceSpecBlock({ deviceId }: { deviceId: string }) {
  const device = await getDeviceWithSpec(deviceId);
  if (!device) return null;
  return <DeviceSpecCard device={device} />; // mesmo componente do catálogo
}
```

Como a ficha vem do `Device`, **editar o device** (ex.: corrigir bateria)
atualiza todos os artigos que o embutem — basta `revalidateTag('device:<id>')`.

## 6.4 Padrão comum dos blocos dinâmicos

| Aspecto | Regra |
|---|---|
| Origem do alvo | **ID de allowlist** (repo/loja/device), nunca URL livre do cliente |
| Execução do fetch | **Server-only**, com `AbortSignal.timeout` |
| Segredos | Token em env var no servidor (`GITHUB_TOKEN`) |
| Cache | `next: { revalidate, tags }` + materialização do último payload |
| Frescor | ISR + **cron** com `revalidateTag` + fallback ao cache |
| Falha | Degrada para cache/estado vazio com mensagem `role="status"` |
| Links externos | `rel="nofollow noopener noreferrer"`; afiliado → `sponsored` |
| A11y | `<section aria-label>`, `<time dateTime>`, ícones `aria-hidden` |

Esse padrão é extensível: novos blocos dinâmicos (ex.: "preço atual", "status de
um firmware", "compatibilidade de cartão SD") seguem o mesmo contrato —
allowlist + fetch server-side + cache/revalidação + degradação graciosa.
