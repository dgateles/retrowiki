# 19 — Fórum

Estudo de design da feature **Fórum**, inspirada no **Invision Community (IPB)** —
a mesma referência visual que já guiou o resto do sistema. O objetivo é dar à
comunidade um espaço de **discussão livre** (dúvidas, ajuda, off-topic, feedback),
complementando o conteúdo curado (guias/blog) que passa por revisão. Este doc é o
**plano**: modelo de dados, rotas, permissões, moderação, notificações,
gamificação, SEO e LGPD, faseado em MVP → evoluções. Nada aqui foi implementado
ainda.

> Adaptar o IPB, **não copiar**: reusamos o substrato que já existe (editor rich,
> reações, denúncias polimórficas, avisos, conquistas, notificações, follow) e
> criamos só o que falta (tópicos/posts e ACL por fórum).

## 19.1 Por que um sistema novo (e não estender comentários)

Os comentários hoje são **planos** (sem `parentId`), **presos a artigos**
(`comments.articleId` obrigatório) e sem alvo polimórfico. Um fórum precisa de
tópicos com muitos posts, contadores, fixação, tranca, melhor-resposta e ACL por
fórum. Duas opções foram consideradas:

| Opção | Prós | Contras | Decisão |
|---|---|---|---|
| **A. Tabelas dedicadas** (`forum_*`) | Não desestabiliza os comentários de artigo; modelo limpo; espelha o IPB (tipos de conteúdo separados) | Mais tabelas | **Escolhida** |
| B. Generalizar `comments` (add `parentId` + alvo polimórfico) | Reuso máximo | Mexe no caminho de comentários já em produção; migração arriscada | Descartada |

Decisão: **tabelas dedicadas**, **reusando** editor/reações/denúncias/avisos/
conquistas/notificações. O IPB também separa Forums de Comments — é o padrão certo.

## 19.2 Modelo de dados

Segue as convenções do projeto (`src/db/schema.ts`): PK `bigint` via `pk()`, FKs
como colunas `bigint` **sem constraint** (integridade na aplicação), snake_case,
`createdAt()`/`updatedAt()`, índices no 3º argumento, enums via `mysqlEnum`, corpo
rich como `text` (JSON string validado por `RichDocSchema`, igual a `comments`).

**Hierarquia:** `Categoria → Fórum (→ sub-fórum) → Tópico → Post`.

| Tabela | Colunas-chave |
|---|---|
| `forum_categories` | `title`, `description`, `sortOrder`, `visible` — cabeçalhos de agrupamento (como as categorias do IPB). |
| `forums` | `categoryId`, `parentId` (nullable, 1 nível de sub-fórum), `title`, `slug` (unique), `description`, `icon`, `sortOrder`, `visible`, `locked` (bool), **`minReadRole`/`minPostRole`** (enum de papel — ACL por fórum), + denormalizados `topicsCount`, `postsCount`, `lastPostId`, `lastPostAt`, `lastPosterId`. |
| `forum_topics` | `forumId`, `authorId`, `title`, `slug` (unique), `status` enum `[open, locked, archived, hidden, pending]`, `pinned` (bool sticky), `isQuestion` (bool, modo Q&A opcional), `bestPostId` (nullable, resposta marcada), `views`, `postsCount` (nº de respostas), `firstPostId`, `lastPostId`, `lastPostAt`, `lastPosterId`, `deletedAt` (soft/LGPD). Idx: `(forumId, status, lastPostAt)`, `slug` unique, `authorId`. |
| `forum_posts` | `topicId`, `authorId`, **`body` text** (rich JSON string), `status` enum `[visible, hidden, flagged]`, `isFirst` (bool, post de abertura), `editedAt`, `editedById`, `deletedAt`. Idx: `(topicId, createdAt)`, `authorId`. |
| `forum_post_reactions` | `userId`, `postId`, `reactionId` (nullable), `value`. Unique `(user, post)`. Reusa a tabela de config `reactions` (mesmo set de reações do resto do site). |
| `forum_topic_follows` | `(userId, topicId)` — observar um tópico (padrão do `articleFollows`). |
| `forum_follows` | `(userId, forumId)` — observar um fórum inteiro (Fase 2). |

Contadores denormalizados (`postsCount`, `lastPost*`) são atualizados na criação/
remoção de post — mesma estratégia de `articles.votesUp`. Slug de tópico:
`slugify(title)` com sufixo de unicidade global (helper `uniqueSlug`, como páginas).

Migração: `drizzle-kit generate` → próximo número **`0044_*`** (o último é `0043`).

## 19.3 Permissões (ACL por fórum)

Reusa o mapa de papéis `member(0) < contributor(1) < moderator(2) < admin(3)`
(`auth-helpers.ts`) e `requireUser()` (revalida papel/suspensão/`sessionVersion` no
banco). **Novo padrão**: gate por fórum via `minReadRole`/`minPostRole` na tabela
`forums` — o único ACL por-recurso do sistema até então (comparado ao limiar de
papel). Moderador/admin sempre passam.

| Ação | Visitante | Membro | Colaborador | Moderador | Admin |
|---|:--:|:--:|:--:|:--:|:--:|
| Ler fórum público | ✅ | ✅ | ✅ | ✅ | ✅ |
| Criar tópico / responder | — | ✅¹ | ✅¹ | ✅ | ✅ |
| Reagir | — | ✅ | ✅ | ✅ | ✅ |
| Marcar melhor resposta | — | autor do tópico | autor | ✅ | ✅ |
| Fixar / trancar / mover / ocultar | — | — | — | ✅ | ✅ |

¹ Respeitando `postingGate()`/`isContentModerated()` (avisos), captcha e rate-limit.
Flags novas em `rolePermissions` (JSON): `canModerateForum`, `canPinTopic`,
`canLockTopic` — defaults em código, override no admin (padrão já usado).

## 19.4 Moderação

Reusa a infra polimórfica existente:

- **Denúncias:** `contentReports` já tem `targetType` enum — **adicionar**
  `forum_topic` e `forum_post`. A fila (`getReportQueue`/`resolveReports`) e o
  auto-hide por limiar já são polimórficos; só estender o enricher (título/link).
- **Ações de mod:** trancar, fixar, mover, **fundir/dividir** (Fase 2), ocultar,
  excluir tópicos e posts — cada uma registrada em `auditLog` (`forum_*`).
- **Avisos:** `postingGate()` bloqueia posts de usuário restrito; `isContentModerated()`
  faz novos posts entrarem como `flagged` (mesma regra dos comentários).
- **Filtros de ban:** email/ip/nome já são globais — valem no fórum sem mudança.
- **UI:** a fila em `/moderacao` ganha os itens de fórum (mesmo componente).

## 19.5 Notificações

Novos tipos (roteados em `src/lib/notification-text.ts` → `describeNotification`):

| Tipo | Quando | Link |
|---|---|---|
| `forum.reply` | Responderam seu tópico ou um que você segue | `…/[topic]#post-{id}` |
| `forum.quote` | Citaram você (Fase 2) | idem |
| `forum.mention` | `@menção` (Fase 2) | idem |
| `forum.best_answer` | Seu post foi marcado como melhor resposta | idem |
| `forum.topic_moved` / `forum.locked` | Ação de moderação no seu tópico | tópico |

Helper novo `forum-url.ts` (`forumHref`, `topicHref`, `postHref`) com âncora
`#post-{id}` (espelha `#comentario-{id}`). O **digest** (`cron/notification-digest`)
já agrega qualquer `type` — nada a mudar lá. Preferências por tipo via
`notificationPrefs` (in-app/email), como hoje.

## 19.6 Gamificação (postbit estilo IPB)

Novos gatilhos em `src/lib/achievements.ts` (`TRIGGERS` + branch em `actionCount()`):

- `forum.topic.created` — recompensa o **autor**.
- `forum.reply.posted` — recompensa **autor** + **autor do tópico** (target).
- `forum.best_answer` — recompensa o **autor do post** marcado (bônus por ajudar).
- `reaction.given` — já existente; passa a cobrir reações em post de fórum.

`runTrigger(...)` é disparado nos sites de criação de post/tópico e no marcar-
melhor-resposta. O **postbit** (cartão lateral do autor em cada post) reusa
avatar + **rank** + reputação + contagem de posts + cor do papel — é exatamente o
"estilo post de fórum" já desejado no `15-gaps-pendentes.md`.

## 19.7 Rotas e UI (`src/app/(main)/forum/…`)

| Rota | Conteúdo |
|---|---|
| `/forum` | Índice: categorias → fóruns com contadores + último post. |
| `/forum/[forum]` | Lista de tópicos (paginada `?page`, fixados primeiro, depois `lastPostAt`), botão "Novo tópico". |
| `/forum/[forum]/novo` | Criar tópico (editor rich + captcha + regras de spam). |
| `/forum/[forum]/[topic]` | Tópico: posts paginados, postbit, reações, marcar-resposta, seguir, ações de mod, caixa de resposta inline. |
| `/admin/forum` | CRUD de categorias/fóruns (título, slug, ordem, visibilidade, gates de papel, tranca). |

Reusos diretos: `RichEditor` (TipTap) + `RichDocSchema`, `<Pager>`, componentes de
reação, `commentDocFromBody` (legado/plain-text), padrões de `loading.tsx`. Âncora
de post `#post-{id}` com highlighter (espelha `comment-highlighter`).

## 19.8 SEO / GEO

- **JSON-LD:** `DiscussionForumPosting` por tópico (com os posts como comentários);
  **`QAPage`** quando `isQuestion` (com `acceptedAnswer` = `bestPost`). `BreadcrumbList`
  Fórum › Categoria › Fórum › Tópico. Builders novos em `src/lib/seo/builders.ts`.
- **Sitemap:** incluir tópicos `visible` (não `hidden`/`pending`) em `src/app/sitemap.ts`.
- **RSS:** `/forum/feed.xml` (tópicos recentes) + por-fórum (Fase 2), via `feed.ts`.
- **Metadata:** título do tópico + excerpt, canonical (com paginação), OG image.
- **llms.txt:** citar o fórum. Busca (`searchAll`) ganha escopo `forum` (texto do
  tópico + corpo dos posts).

## 19.9 LGPD e anti-spam

- **Purga/anonimização:** na exclusão de conta (`deletedAt`/rotina de purga), os
  posts de fórum são **anonimizados** (autor → placeholder "usuário removido"),
  preservando a integridade da thread — mesma política dos comentários. Incluir
  `forum_posts`/`forum_topics` na rotina.
- **Anti-spam:** captcha no primeiro post/novo tópico (reusa `/api/captcha`, ação
  `comment` ou nova `forum`), rate-limit em criar tópico/post (`checkRateLimit`),
  perguntas anti-spam para novos membros, `postingGate` para usuários advertidos.

## 19.10 Fila / próximos passos (faseamento)

**Fase 1 — MVP** (fórum funcional de ponta a ponta):
- [ ] Schema `forum_categories/forums/forum_topics/forum_posts/forum_post_reactions/forum_topic_follows` + migração `0044`.
- [ ] Índice, lista de tópicos e view de tópico (leitura) com `<Pager>` e postbit.
- [ ] Criar tópico + responder (editor rich) com captcha, rate-limit e `postingGate`.
- [ ] Reações em post; seguir tópico; contadores denormalizados.
- [ ] Notificações `forum.reply` (+ follow) e roteamento em `notification-text.ts`.
- [ ] Moderação básica: trancar/fixar/ocultar/excluir + denúncias (`targetType` novos) + auditLog.
- [ ] ACL por papel (`minReadRole`/`minPostRole`); admin CRUD de categorias/fóruns.
- [ ] Gatilhos de conquista (`forum.topic.created`, `forum.reply.posted`).
- [ ] SEO base: metadata, breadcrumb + `DiscussionForumPosting`, sitemap, busca (escopo `forum`).
- [ ] LGPD: anonimização de posts na purga.

**Fase 2 — Q&A e produtividade:**
- [ ] Modo pergunta: marcar **melhor resposta** + `QAPage`/`acceptedAnswer`; badge/quest "resolvedor".
- [ ] Mover/fundir/dividir tópicos; seguir fórum inteiro + digest por fórum.
- [ ] `@menções`, citar-para-responder, RSS por fórum, "Recently browsing"/online.

**Fase 3 — avançado:**
- [ ] Enquetes no tópico; tags; matriz de permissão por-fórum×papel no admin.
- [ ] Tópicos em alta/hot; rascunho de post; histórico de edição.

**Decisões em aberto (a validar antes da Fase 1):**
1. Slug de tópico global vs. por-fórum (proposto: **global**, mais simples nas rotas).
2. Reações: tabela dedicada `forum_post_reactions` vs. generalizar `commentReactions`
   (proposto: **dedicada**, para não tocar no caminho de comentários).
3. Escopo do MVP: liberar para todos os papéis logados ou começar restrito a
   `contributor+` enquanto amadurece a moderação.
