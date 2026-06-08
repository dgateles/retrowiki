# 11 — Migração e Roadmap

## 11.1 Migrar o conteúdo atual (Fumadocs → banco)

O conteúdo da v1 mapeia muito bem para o novo modelo. Estratégia incremental sem
perder o que já existe.

### Devices

Cada `content/<console>/index.mdx` usa `<ConsoleOverview>` com props que são
exatamente o `Device`/`DeviceSpec`/`EmulationScore`:

| Fonte v1 | Destino v2 |
|---|---|
| props `name`, `manufacturer`, `releaseYear`, `priceRange` | `Device` |
| objeto `screen/specs/connectivity/controls/ergonomics` | `DeviceSpec` |
| array `emulation[{system, level}]` | `EmulationScore` (level→score) |
| `pros/cons` | campos do `Device` (ou bloco no artigo de visão geral) |
| imagens em `public/consoles/*` | `DeviceImage` (upload p/ storage) |

Script de importação: ler os MDX (frontmatter + props do componente via AST),
montar registros e inserir via Prisma. As imagens já baixadas (`retrowiki_*.webp`,
`r36s.png`…) viram `DeviceImage` com `alt` gerado a partir do nome.

### Artigos (guias/tutoriais)

Cada `firmware.mdx`, `sd-card.mdx`, `troubleshooting.mdx`, `tutorials.mdx`,
`controles.mdx` etc. vira um `Article` + `Revision` publicada. O corpo MDX é
convertido para a **árvore de blocos**:

| MDX v1 | Bloco v2 |
|---|---|
| Headings, parágrafos, listas | `heading`, `paragraph`, `steps` |
| `<Alert>` | `callout` |
| `<Steps>` | `steps` |
| `<FirmwareList owner repo>` | `github-releases` |
| `<BuyingGuide stores>` | `store-links` (+ cadastrar `Store`) |
| `<ConsoleOverview>` (quando embutido) | `device-spec` |
| `<ButtonLayout>` | bloco de diagrama de controles |

Um conversor MDX→blocos roda no AST (remark): nós conhecidos viram blocos da
allowlist; nós desconhecidos são reportados para revisão manual (não inventar).
O autor original (mantenedor) fica creditado; status inicial `PUBLISHED`.

> Os `buying-guide.mdx.off` (desativados) **não** migram até terem links reais —
> coerente com a decisão anterior de mantê-los desativados.

## 11.2 Roadmap em fases

### Fase 0 — Fundações (semanas 1–2)
- Projeto Next.js (App Router) + Postgres + Prisma + Auth.js + Tailwind v4/shadcn
  (4-step) + tokens + dark mode.
- Schema do banco (cap. 03) + migrations.
- CSP/headers de segurança + rate limiter + helpers de RBAC.

### Fase 1 — Catálogo lendo do banco (semanas 3–4)
- Importar devices (script de migração) + imagens para storage.
- Páginas RSC: lista de catálogo com filtros + ficha do device (`DeviceSpecCard`).
- Busca básica (Postgres FTS) + sitemap/JSON-LD.
- **Gate de aceite:** axe sem violações; LCP/CLS ok; paridade visual com a v1.

### Fase 2 — Editor + blocos (semanas 5–7)
- Renderer de blocos (allowlist) + componentes: heading, paragraph, image, steps,
  callout, **github-releases**, **store-links**, **device-spec**.
- Editor (paleta + canvas + inspetor) com validação Zod compartilhada e
  pré-visualização ao vivo dos blocos dinâmicos.
- Cron de revalidação (GitHub) + tabelas `GithubRepo`/`Store` (allowlist).
- **Gate de aceite:** criar um tutorial completo só pelo editor; blocos dinâmicos
  atualizando; axe ok no editor (teclado + dialog).

### Fase 3 — Comunidade + moderação (semanas 8–10)
- Submissão → `PENDING` → fila de moderação (aprovar/ajustes/rejeitar) + diff.
- Papéis/RBAC completos, reputação, autotrust, AuditLog, notificações.
- Antiabuso (allowlist de domínios, antispam, dedupe, limites).
- Migrar os artigos da v1 (conversor MDX→blocos) creditando autores.
- **Gate de aceite:** revisão completa de segurança (checklist do cap. 09).

### Fase 4 — v1 público e além (semanas 11+)
- Comentários, votos, favoritos, comparador de devices, versionamento com
  histórico/diff visível, i18n.
- Migrar busca para Meilisearch/Typesense se necessário.
- Descontinuar o Fumadocs quando a paridade de conteúdo for atingida.

## 11.3 Coexistência durante a migração

- Rodar a v2 em paralelo (subdomínio/preview) lendo o mesmo conteúdo migrado.
- Redirecionar rotas da v1 (`/r36s/firmware`) para as equivalentes da v2
  (`/consoles/r36s` + artigo) com `301` para preservar SEO.
- Só aposentar o Fumadocs após paridade + validação de a11y/SEO/performance.

## 11.4 Critérios de "pronto" (Definition of Done) por entrega

Toda entrega de UI deve passar por:
1. **axe-core** sem violações (cap. 07).
2. Navegação só por teclado nos fluxos da entrega.
3. Contraste validado (claro/escuro), reflow 320px, zoom 200%.
4. Checklist de **segurança** aplicável (cap. 09) — em especial para qualquer
   coisa que toque conteúdo do usuário, integrações ou auth.
5. Testes de autorização (papel errado → 403) e de validação (entrada inválida →
   erro tratado).
