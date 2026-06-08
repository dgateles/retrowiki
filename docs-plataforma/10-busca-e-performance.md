# 10 — Busca e Performance

## 10.1 Busca e filtros (como o retrocatalog)

O retrocatalog filtra/ordena sobre um dataset embarcado no cliente. Com banco,
fazemos **filtragem no servidor** (escala melhor, indexável, paginável).

### Catálogo — filtros estruturados

Filtros equivalentes aos do retrocatalog, resolvidos por query no banco:

- **Por fabricante, formato, SO** (`Device.manufacturer/formFactor`, `os`).
- **Por categoria** (`Staff Pick`, `Powerfull`, `Android`…) via `Category`.
- **Por capacidade de emulação** (`EmulationScore.system >= score`) — ex.: "roda
  PS2 bem" = `ps2 >= 75`.
- **Por faixa de preço, tela, conectividade** (colunas de `DeviceSpec`).
- **Ordenação**: `rating` desc (staff picks), preço, ano.

```ts
// leitura no servidor (RSC), paginada
const devices = await db.device.findMany({
  where: {
    formFactor: filters.form ?? undefined,
    categories: filters.category ? { some: { slug: filters.category } } : undefined,
    emulation: filters.minPs2 ? { some: { system: 'ps2', score: { gte: filters.minPs2 } } } : undefined,
    spec: filters.wifi ? { wifi: true } : undefined,
  },
  orderBy: { rating: 'desc' },
  take: 24,
  skip: (page - 1) * 24,
  include: { spec: true, images: { where: { kind: 'FRONT' }, take: 1 } },
});
```

A UI de filtros é uma ilha cliente que só altera a querystring; a página é RSC e
relê do servidor (cacheável). Resultado anunciado por `role="status"` (a11y).

### Busca textual

- **MVP — Postgres FTS**: coluna `searchText` (texto plano extraído da árvore de
  blocos na publicação) + `tsvector`/`GIN`. Cobre títulos, resumos e corpo de
  artigos + nomes de devices.

```sql
ALTER TABLE "Article" ADD COLUMN search tsvector
  GENERATED ALWAYS AS (to_tsvector('portuguese', coalesce(title,'') || ' ' || coalesce("searchText",''))) STORED;
CREATE INDEX article_search_idx ON "Article" USING GIN (search);
```

- **Escala — Meilisearch/Typesense**: índice dedicado com tolerância a digitação,
  facetas (= filtros) e ranking. Sincronizado por job na publicação/edição. Migrar
  quando o volume/qualidade exigir.

### Autocomplete

Combobox (padrão APG — ver [07](./07-semantica-e-acessibilidade.md)) consultando
um endpoint leve (`/api/suggest?q=`) com cache curto e rate limit.

## 10.2 Performance

| Alvo | Técnica |
|---|---|
| Páginas públicas rápidas e indexáveis | **RSC + ISR**; HTML semântico no servidor |
| Frescor sem custo por request | **Revalidação por tags** (`device:*`, `article:*`, `gh:*`) |
| Imagens | `next/image` (AVIF/WebP, `sizes`, lazy), storage/CDN, dimensões fixas (evita CLS), `alt` |
| JS no cliente | Minimizar ilhas cliente; editor e filtros são as maiores — carregar sob demanda (code-split) |
| Listas longas (catálogo) | Paginação/`load more`; evitar buscar tudo de uma vez |
| Blocos dinâmicos | Cache + cron (ver [06](./06-componentes-dinamicos-detalhe.md)); nunca bloquear render no fetch externo (timeout + fallback) |
| Fontes | `next/font` (self-host, `font-display: swap`) |
| Core Web Vitals | LCP via imagem do hero priorizada; CLS via dimensões reservadas; INP via ilhas pequenas |

### Cache: invalidação por evento

```ts
// ao publicar/editar
revalidateTag(`article:${id}`);
// ao corrigir um device (reflete em catálogo + embeds em artigos)
revalidateTag(`device:${id}`);
// cron de integrações
revalidateTag(`gh:${owner}/${repo}`);
```

## 10.3 SEO

- URLs limpas (`/consoles/<slug>`, `/guias/<slug>`), `sitemap.xml` gerado do banco
  (todos os devices e artigos publicados), `robots.txt`.
- `<title>`/meta description por página (do `Article.summary`/device).
- **JSON-LD**: `Product`/`Review` para devices, `HowTo` para tutoriais,
  `Article` para guias, `BreadcrumbList`.
- OpenGraph dinâmico (imagem do device/artigo).
- `llms.txt`/exportação em texto (a árvore de blocos converte facilmente para
  Markdown/texto, reaproveitando o que a v1 já faz).
