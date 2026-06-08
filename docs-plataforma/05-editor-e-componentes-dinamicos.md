# 05 — Editor e Componentes Dinâmicos

Este é o coração da plataforma comunitária: **como o usuário cria conteúdo** e
**como ele insere os blocos dinâmicos** (releases do GitHub, links de loja, ficha
de device) sem tocar em código — de forma segura.

## 5.1 Conteúdo como árvore de blocos (não MDX livre)

Na v1, componentes como `FirmwareList` e `BuyingGuide` eram escritos à mão em
MDX. Renderizar MDX enviado por **qualquer usuário** seria compilar/avaliar código
de terceiros — superfície de ataque inaceitável (XSS, exfiltração, DoS).

A v2 representa o corpo do artigo como uma **árvore de blocos em JSON**:

```jsonc
{
  "version": 1,
  "blocks": [
    { "type": "heading", "level": 2, "text": "Instalando o firmware" },
    { "type": "paragraph", "text": "O RP5 já vem com Android..." },
    { "type": "github-releases", "owner": "ROCKNIX", "repo": "distribution", "limit": 3 },
    { "type": "steps", "items": [
      { "title": "Baixe a imagem", "text": "Use o release acima." },
      { "title": "Grave no SD", "text": "Balena Etcher." }
    ]},
    { "type": "store-links", "stores": ["store_goretroid", "store_aliexpress"] },
    { "type": "device-spec", "deviceId": "dev_rp5" },
    { "type": "callout", "variant": "warning", "text": "Não desligue durante a 1ª inicialização." }
  ]
}
```

Vantagens: **seguro** (só tipos da allowlist são aceitos e renderizados),
**versionável** (diff entre revisões), **gera o editor visual naturalmente**,
**indexável** (extraímos texto plano para busca) e **portável** (renderiza em RSC,
em e-mail, em `llms.txt`, etc.).

## 5.2 Schema da árvore (Zod) — a allowlist

A allowlist é a fronteira de confiança. Um bloco de tipo desconhecido é
**rejeitado na submissão** e nunca renderizado.

```ts
// lib/blocks/schema.ts
import { z } from 'zod';

const Heading = z.object({
  type: z.literal('heading'),
  level: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  text: z.string().min(1).max(160),
});

const Paragraph = z.object({
  type: z.literal('paragraph'),
  // texto com marcações inline limitadas (negrito/itálico/código/link)
  text: z.string().max(4000),
  marks: z.array(z.enum(['b', 'i', 'code', 'link'])).optional(),
});

const ImageBlock = z.object({
  type: z.literal('image'),
  url: z.string().url(),                 // deve apontar para nosso storage
  alt: z.string().min(1).max(300),       // OBRIGATÓRIO (a11y — SC 1.1.1)
  caption: z.string().max(300).optional(),
});

const Steps = z.object({
  type: z.literal('steps'),
  items: z.array(z.object({
    title: z.string().min(1).max(160),
    text: z.string().max(2000),
  })).min(1).max(30),
});

const Callout = z.object({
  type: z.literal('callout'),
  variant: z.enum(['info', 'success', 'warning', 'danger']),
  text: z.string().max(2000),
});

// ── BLOCOS DINÂMICOS ───────────────────────────────────────────
const GithubReleases = z.object({
  type: z.literal('github-releases'),
  owner: z.string().regex(/^[A-Za-z0-9-]{1,39}$/),
  repo: z.string().regex(/^[A-Za-z0-9._-]{1,100}$/),
  limit: z.number().int().min(1).max(5).default(3),
});

const StoreLinks = z.object({
  type: z.literal('store-links'),
  // referencia Stores cadastradas (allowlist) por id — não URL livre
  stores: z.array(z.string().regex(/^store_[a-z0-9]+$/)).min(1).max(12),
});

const DeviceSpec = z.object({
  type: z.literal('device-spec'),
  deviceId: z.string().regex(/^dev_[a-z0-9]+$/),
});

export const Block = z.discriminatedUnion('type', [
  Heading, Paragraph, ImageBlock, Steps, Callout,
  GithubReleases, StoreLinks, DeviceSpec,
]);

export const BlockTreeSchema = z.object({
  version: z.literal(1),
  blocks: z.array(Block).min(1).max(200),
});
export type BlockTree = z.infer<typeof BlockTreeSchema>;
```

> Note que blocos dinâmicos guardam **referências/IDs**, não dados ao vivo nem
> URLs livres. `store-links` referencia `Store` cadastradas (allowlist de
> domínios) e `github-releases` valida `owner`/`repo` por regex e ainda é checado
> contra a allowlist no servidor (ver [06](./06-componentes-dinamicos-detalhe.md)).

## 5.3 Registry e renderer seguro (servidor)

Um único mapa `tipo → componente`. Tipos fora do mapa **não renderizam**. Blocos
dinâmicos são **async Server Components** — buscam dados no servidor, com cache.

```tsx
// lib/blocks/registry.tsx
import { HeadingBlock } from '@/components/blocks/heading';
import { ParagraphBlock } from '@/components/blocks/paragraph';
import { ImageBlock } from '@/components/blocks/image';
import { StepsBlock } from '@/components/blocks/steps';
import { CalloutBlock } from '@/components/blocks/callout';
import { GithubReleasesBlock } from '@/components/blocks/github-releases';
import { StoreLinksBlock } from '@/components/blocks/store-links';
import { DeviceSpecBlock } from '@/components/blocks/device-spec';

export const registry = {
  heading: HeadingBlock,
  paragraph: ParagraphBlock,
  image: ImageBlock,
  steps: StepsBlock,
  callout: CalloutBlock,
  'github-releases': GithubReleasesBlock,
  'store-links': StoreLinksBlock,
  'device-spec': DeviceSpecBlock,
} as const;
```

```tsx
// lib/blocks/render.tsx  (Server Component)
import { BlockTreeSchema } from './schema';
import { registry } from './registry';

export function ArticleBody({ body }: { body: unknown }) {
  // validação defensiva também na leitura (conteúdo antigo/migrado)
  const parsed = BlockTreeSchema.safeParse(body);
  if (!parsed.success) return null;

  return (
    <>
      {parsed.data.blocks.map((block, i) => {
        const Component = registry[block.type];
        if (!Component) return null;          // tipo desconhecido = ignora
        // @ts-expect-error união discriminada → props específicas do bloco
        return <Component key={i} {...block} />;
      })}
    </>
  );
}
```

Nenhum bloco usa `dangerouslySetInnerHTML` com conteúdo do usuário. Texto inline
com marcações (`b/i/code/link`) é renderizado por um componente próprio que
escapa tudo e só aplica as marcas permitidas (ver [09 — Segurança](./09-seguranca.md)).

## 5.4 A experiência de autoria

O editor é uma **ilha cliente** (`/editor/[id]`) que produz exatamente a árvore
de blocos do schema. UX em três áreas:

```
┌───────────────┬──────────────────────────────┬──────────────┐
│  + Adicionar  │   Canvas (blocos arrastáveis) │  Inspetor    │
│  bloco        │                               │  (props do   │
│  ───────────  │  ┌──────────────────────────┐ │   bloco      │
│  Título       │  │ ## Instalando o firmware │ │   selecionado│
│  Parágrafo    │  ├──────────────────────────┤ │  ──────────  │
│  Imagem       │  │ [Bloco: GitHub Releases] │ │  owner: ____ │
│  Passos       │  │  ROCKNIX/distribution    │◀┼─ repo:  ____ │
│  Alerta       │  │  (pré-visualização ao    │ │  limit: 3    │
│  ───────────  │  │   vivo dos 3 últimos)    │ │              │
│  ▼ Dinâmicos  │  └──────────────────────────┘ │  [validação] │
│  • GitHub     │                               │              │
│  • Loja       │                               │              │
│  • Ficha      │                               │              │
└───────────────┴──────────────────────────────┴──────────────┘
```

- **Paleta** (esquerda): lista de blocos disponíveis, agrupando os **Dinâmicos**.
- **Canvas** (centro): blocos reordenáveis; cada bloco mostra **pré-visualização
  ao vivo** (inclusive os dinâmicos, buscando dados reais por uma rota de preview).
- **Inspetor** (direita): formulário das props do bloco selecionado, com
  validação em tempo real reaproveitando os **mesmos schemas Zod** do servidor.

### Como o autor insere um bloco dinâmico (ex.: GitHub Releases)

1. Clica em **+ → Dinâmicos → GitHub Releases**.
2. No inspetor, em vez de digitar `owner/repo` cru, usa um **autocomplete** que
   busca **somente** repositórios já cadastrados/aprovados (allowlist
   `GithubRepo`) — ex.: "ROCKNIX", "ArkOS", "muOS". (Admin pode adicionar novos
   repos à allowlist.)
3. O bloco renderiza imediatamente a **pré-visualização** com os releases reais
   (via rota de preview server-side, com cache).
4. Ao publicar, o bloco grava só `{ owner, repo, limit }`; os dados ficam sempre
   atualizados porque são buscados no servidor a cada render/ISR + cron.

O mesmo vale para **Loja** (escolhe entre `Store` cadastradas, define rótulo,
preço aproximado, badge) e **Ficha de Device** (escolhe o device do catálogo;
a ficha completa vem do banco).

### Salvar, autosave e submissão

```ts
// fluxo do cliente
saveDraft(tree)      // autosave debounced → grava DRAFT (privado)
validate(tree)       // Zod no cliente (feedback imediato)
submitForReview(id)  // Server Action: revalida no servidor, cria Revision PENDING
```

A validação do cliente é **conveniência**; a validação que importa é a do
**servidor** na Server Action (cliente nunca é fonte de verdade — ver [09](./09-seguranca.md)).

## 5.5 Por que essa abordagem casa com o pedido

- **"Componentes que se mantêm atualizados" (GitHub):** o bloco guarda só a
  referência; o dado é buscado server-side e revalidado (ISR + cron). O autor não
  precisa voltar para atualizar versões. Detalhe em [06](./06-componentes-dinamicos-detalhe.md).
- **"Componentes de links de loja":** `store-links` referencia lojas confiáveis
  cadastradas, com `trustLevel`, badges e sinalização de afiliado.
- **"Usar no momento da criação":** a paleta + inspetor permitem inserir e
  configurar esses blocos visualmente, com pré-visualização ao vivo, sem editar
  `.tsx`/`.mdx`.
- **Seguro para conteúdo comunitário:** allowlist de blocos + validação Zod +
  renderer fechado = nenhum HTML/JS arbitrário do usuário chega ao DOM.
