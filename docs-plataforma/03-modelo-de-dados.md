# 03 — Modelo de Dados

A fonte da verdade é o **PostgreSQL**. Abaixo o schema em Prisma (referência —
pode ser traduzido para Drizzle). Três grupos: **Catálogo** (devices/specs),
**Conteúdo** (artigos como árvore de blocos + revisões/moderação) e
**Comunidade** (usuários, papéis, votos, comentários).

## 3.1 Catálogo — Device e Specs

O modelo espelha os campos observados no retrocatalog (ver README), mas como
colunas tipadas + uma área `extra` JSONB para campos raros.

```prisma
model Device {
  id            String   @id @default(cuid())
  slug          String   @unique          // ex.: "retroid-pocket-5"
  name          String                     // "Retroid Pocket 5"
  manufacturer  String                     // "Retroid"
  releaseYear   Int?
  priceUsd      Int?                       // preço aproximado em USD
  formFactor    FormFactor
  // ficha técnica normalizada
  spec          DeviceSpec?
  emulation     EmulationScore[]
  // taxonomia
  categories    Category[]  @relation("DeviceCategories")
  // mídia
  images        DeviceImage[]
  // editorial
  rating        Float?     @default(0)      // 0..1 (curadoria/medições)
  status        PublishStatus @default(PUBLISHED)
  // relacionamentos de conteúdo
  articles      Article[]                   // tutoriais/guias ligados ao device
  similar       Device[]   @relation("SimilarDevices")
  similarOf     Device[]   @relation("SimilarDevices")
  extra         Json?                       // campos raros sem coluna dedicada
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([manufacturer])
  @@index([formFactor])
}

model DeviceSpec {
  id            String  @id @default(cuid())
  device        Device  @relation(fields: [deviceId], references: [id], onDelete: Cascade)
  deviceId      String  @unique
  // SoC
  chip          String?
  cpu           String?
  gpu           String?
  ramGb         Float?
  ramType       String?
  storage       String?
  architecture  String?
  // tela
  screenSize    Float?    // polegadas
  resolution    String?   // "1920x1080"
  aspectRatio   String?   // "16:9"
  refreshHz     Int?
  panelType     String?   // "AMOLED" | "IPS"
  // energia/ergonomia
  batteryMah    Int?
  cooling       Boolean?
  vibration     Boolean?
  os            String?   // "Android 13" / "Linux"
  // conectividade
  wifi          Boolean?
  bluetooth     Boolean?
  btVersion     String?
  videoOut      Boolean?
  audioJack     Boolean?
  usbC          Boolean?
  sdCard        Boolean?
  // controles
  analogs       Boolean?
  hallEffect    Boolean?
  analogTriggers Boolean?
  l1r1          Boolean?
  l2r2          Boolean?
  l3r3          Boolean?
  touchScreen   Boolean?
  gyroscope     Boolean?
}

// score de emulação por sistema (0..100) — alimenta a ficha e a comparação
model EmulationScore {
  id        String @id @default(cuid())
  device    Device @relation(fields: [deviceId], references: [id], onDelete: Cascade)
  deviceId  String
  system    String  // "ps2", "snes", "gamecube"...
  score     Int     // 0..100
  @@unique([deviceId, system])
}

enum FormFactor { VERTICAL HORIZONTAL CLAMSHELL OTHER }
```

### Categorias (Staff Pick, Powerfull, Android…)

```prisma
model Category {
  id       String   @id @default(cuid())
  slug     String   @unique         // "staff-pick", "android", "powerfull"
  label    String                    // "Staff Pick"
  kind     CategoryKind             // rating | power | size | os | form
  devices  Device[] @relation("DeviceCategories")
}
enum CategoryKind { RATING POWER SIZE OS FORM GENERIC }
```

### Imagens do device

```prisma
model DeviceImage {
  id        String  @id @default(cuid())
  device    Device  @relation(fields: [deviceId], references: [id], onDelete: Cascade)
  deviceId  String
  url       String                 // chave no object storage
  kind      ImageKind  @default(FRONT)
  alt       String                 // texto alternativo (obrigatório — a11y)
  credit    String?                // autoria ("by")
  order     Int        @default(0)
}
enum ImageKind { FRONT ARTICLE GALLERY }
```

> **Observação de migração:** as imagens já baixadas em `public/consoles/` e os
> dados de `ConsoleOverview` em cada `index.mdx` mapeiam diretamente para
> `Device`/`DeviceSpec`/`EmulationScore`/`DeviceImage`. Ver
> [11 — Migração](./11-migracao-e-roadmap.md).

## 3.2 Conteúdo — Artigos como árvore de blocos

Um **Article** (tutorial, guia de compra, troubleshooting) tem uma **revisão
publicada** e um histórico de revisões. O corpo é uma **árvore de blocos** em
JSONB validada por Zod (ver [05](./05-editor-e-componentes-dinamicos.md)).

```prisma
model Article {
  id           String     @id @default(cuid())
  slug         String     @unique
  type         ArticleType
  title        String
  summary      String?                       // usado em listas e <meta description>
  device       Device?    @relation(fields: [deviceId], references: [id])
  deviceId     String?
  author       User       @relation("Authored", fields: [authorId], references: [id])
  authorId     String
  status       ArticleStatus @default(DRAFT)
  // ponteiro para a revisão atualmente publicada
  current      Revision?  @relation("CurrentRevision", fields: [currentId], references: [id])
  currentId    String?    @unique
  revisions    Revision[] @relation("ArticleRevisions")
  votesUp      Int        @default(0)
  publishedAt  DateTime?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@index([type, status])
  @@index([deviceId])
}

model Revision {
  id           String   @id @default(cuid())
  article      Article  @relation("ArticleRevisions", fields: [articleId], references: [id], onDelete: Cascade)
  articleId    String
  body         Json     // árvore de blocos (BlockTreeSchema)
  editor       User     @relation(fields: [editorId], references: [id])
  editorId     String
  note         String?  // changelog da revisão
  // moderação desta revisão específica
  review       Review?
  createdAt    DateTime @default(now())

  currentOf    Article? @relation("CurrentRevision")
}

enum ArticleType   { TUTORIAL BUYING_GUIDE TROUBLESHOOTING FIRMWARE GENERAL }
enum ArticleStatus { DRAFT PENDING CHANGES_REQUESTED PUBLISHED REJECTED ARCHIVED }
```

### Referências de componentes dinâmicos

Blocos dinâmicos guardam **apenas a configuração** (não os dados ao vivo). Os
dados (releases, preço) são buscados no servidor e cacheados (ver [06](./06-componentes-dinamicos-detalhe.md)).
Para reaproveitar fora do JSON (ex.: revalidação por cron), referências
externas podem ser materializadas:

```prisma
// "uma loja confiável" cadastrada por admin — o bloco de loja referencia por id
model Store {
  id        String  @id @default(cuid())
  name      String
  domain    String  @unique          // allowlist de domínios (anti-SSRF/spam)
  trust     TrustLevel @default(CAUTION)
  affiliate Boolean   @default(false)
}
enum TrustLevel { VERIFIED TRUSTED CAUTION }

// repo do GitHub referenciado por blocos "Releases" — permite revalidação central
model GithubRepo {
  id         String   @id @default(cuid())
  owner      String
  repo       String
  lastSynced DateTime?
  cache      Json?    // último payload normalizado de releases
  @@unique([owner, repo])
}
```

## 3.3 Comunidade — Usuários, papéis, moderação, votos

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  handle        String   @unique          // @nome público
  displayName   String
  avatarUrl     String?
  role          Role     @default(MEMBER)
  reputation    Int      @default(0)       // ver 04 — Comunidade
  trusted       Boolean  @default(false)   // autotrust de submissões
  banned        Boolean  @default(false)
  articles      Article[] @relation("Authored")
  revisions     Revision[]
  reviews       Review[]  @relation("Reviewer")
  comments      Comment[]
  createdAt     DateTime  @default(now())
}

enum Role { MEMBER CONTRIBUTOR MODERATOR ADMIN }

// decisão de moderação sobre uma revisão
model Review {
  id          String   @id @default(cuid())
  revision    Revision @relation(fields: [revisionId], references: [id], onDelete: Cascade)
  revisionId  String   @unique
  reviewer    User?    @relation("Reviewer", fields: [reviewerId], references: [id])
  reviewerId  String?
  decision    ReviewDecision @default(PENDING)
  reason      String?  // feedback ao autor (em caso de ajustes/rejeição)
  createdAt   DateTime @default(now())
}
enum ReviewDecision { PENDING APPROVED CHANGES_REQUESTED REJECTED }

model Comment {
  id         String   @id @default(cuid())
  article    Article  @relation(fields: [articleId], references: [id], onDelete: Cascade)
  articleId  String
  author     User     @relation(fields: [authorId], references: [id])
  authorId   String
  body       String   // texto puro (sanitizado na exibição)
  status     CommentStatus @default(VISIBLE)
  createdAt  DateTime @default(now())
}
enum CommentStatus { VISIBLE HIDDEN FLAGGED }

model Vote {
  id        String @id @default(cuid())
  user      User   @relation(fields: [userId], references: [id])
  userId    String
  articleId String
  value     Int    // +1
  @@unique([userId, articleId])
}

// trilha de auditoria de ações sensíveis (moderação, mudança de papel)
model AuditLog {
  id        String   @id @default(cuid())
  actorId   String
  action    String   // "approve_article", "ban_user", "edit_device"...
  target    String   // id do alvo
  meta      Json?
  createdAt DateTime @default(now())
  @@index([actorId])
  @@index([target])
}

enum PublishStatus { DRAFT PUBLISHED ARCHIVED }
```

## 3.4 Por que esse desenho

- **Device separado de Article**: specs vivem uma vez e alimentam catálogo,
  comparador, busca e *embeds* dentro de artigos. Sem duplicação (o problema do
  MDX atual).
- **Revision + current pointer**: histórico completo, diff, reversão e
  **moderação por revisão** (cada edição de um artigo publicado volta para a
  fila, sem derrubar a versão no ar).
- **Review separado**: a fila de moderação é só `Review where decision=PENDING`.
- **Store/GithubRepo como entidades**: além de allowlist de segurança, permitem
  **revalidação central** por cron (atualizar releases/preços sem editar artigos).
- **AuditLog**: ações de moderação/admin são rastreáveis (requisito de segurança).

## 3.5 Índices e busca

- FTS sobre `Article.title`, `Article.summary` e um campo derivado `searchText`
  (texto plano extraído da árvore de blocos na publicação).
- Índices em `Device(manufacturer, formFactor)` e `EmulationScore(system, score)`
  para os filtros do catálogo. Detalhes em [10 — Busca e Performance](./10-busca-e-performance.md).
