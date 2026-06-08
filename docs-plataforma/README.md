# Plataforma RetroWiki Community — Documentação de Arquitetura

> Guia para reconstruir a RetroWiki **do zero**, substituindo o Fumadocs por uma
> plataforma própria, orientada à comunidade, no estilo do
> [retrocatalog.com](https://retrocatalog.com/) — com catálogo de consoles rico em
> dados, submissão de tutoriais e guias pela comunidade (mediante aprovação) e
> componentes dinâmicos (links do GitHub auto-atualizáveis, links de loja) que o
> próprio autor insere no momento da criação.

Esta documentação descreve **o que construir e por quê**, com decisões de stack,
modelo de dados, fluxos de moderação, o editor de autoria e os requisitos
transversais de **semântica HTML5**, **acessibilidade (WCAG 2.2 AA)**,
**design system (Tailwind v4 + shadcn/ui)** e **segurança**.

## Índice

| # | Documento | Conteúdo |
|---|-----------|----------|
| 00 | **README** (este arquivo) | Visão geral, sumário do estudo do retrocatalog, mapa da documentação |
| 01 | [Visão e Objetivos](./01-visao-e-objetivos.md) | Por que sair do Fumadocs, público-alvo, princípios, escopo do MVP |
| 02 | [Arquitetura](./02-arquitetura.md) | Stack, camadas, estratégia de renderização (RSC/ISR), diagrama |
| 03 | [Modelo de Dados](./03-modelo-de-dados.md) | Schema (devices, specs, guias, usuários, submissões, revisões) |
| 04 | [Comunidade e Moderação](./04-comunidade-e-moderacao.md) | Papéis, fluxo de contribuição, fila de revisão, anti-abuso, reputação |
| 05 | [Editor e Componentes Dinâmicos](./05-editor-e-componentes-dinamicos.md) | Editor de blocos, paleta de componentes, render seguro de MDX |
| 06 | [Componentes Dinâmicos em Detalhe](./06-componentes-dinamicos-detalhe.md) | GitHub Releases, links de loja, embeds de device: fetch, cache, SSRF |
| 07 | [Semântica e Acessibilidade](./07-semantica-e-acessibilidade.md) | HTML5 semântico, WCAG 2.2 AA, padrões ARIA, testes axe |
| 08 | [Design System](./08-design-system.md) | Tailwind v4 (CSS-first), shadcn/ui (4-step), dark mode, tokens |
| 09 | [Segurança](./09-seguranca.md) | Auth, RBAC, sanitização, SSRF, rate limit, CSP, uploads, secrets |
| 10 | [Busca e Performance](./10-busca-e-performance.md) | Filtros tipo retrocatalog, FTS/Meilisearch, ISR, imagens |
| 11 | [Migração e Roadmap](./11-migracao-e-roadmap.md) | Migrar `content/*.mdx` → DB, fases de entrega, MVP → v1 |
| 12 | [Autenticação e E-mails (Resend)](./12-autenticacao-e-emails.md) | Cadastro, verificação, login, reset de senha, troca de e-mail, magic link — tudo via Resend |
| 13 | [Notificações](./13-notificacoes.md) | Canais in-app + e-mail, tipos de evento, preferências, digest, descadastro |
| 14 | [Captcha Proprietário (RetroGuard)](./14-captcha-proprietario.md) | Defesa própria anti-bot: PoW invisível + sinais + nonce assinado + step-up acessível |

## Sumário do estudo do retrocatalog.com

O retrocatalog é uma aplicação **Next.js (App Router)** renderizada via React
Server Components (o payload do catálogo chega como streaming `self.__next_f`).
Características que importam para o nosso projeto:

- **Catálogo estruturado** de 240+ handhelds. Cada device é um objeto rico com
  ~80 campos: `chip`, `cpu`, `gpu`, `ram`, `storage`, `battery`, `screenSize`,
  `resolution`, `refreshRate`, `aspectRatio`, `formFactor`, `operatingSystem`,
  conectividade (`wifi`, `bluetooth`, `videoOut`…), controles (`analogs`,
  `hallEffectSticks`, `l2r2`…), e **scores numéricos de emulação por sistema**
  (`gb`, `snes`, `ps2`, `gamecube`, `n64`, `3ds`, `switch`… de 0 a 100).
- **Ratings e categorização**: cada device tem `rating` (0–1), `categories`
  (ex.: `Staff Pick`, `Powerfull`, `Horizontal`, `Android`), `powerCategory`,
  `priceCategory`, `sizeCategory` e listas de `similar` (devices parecidos).
- **Imagens** servidas por um endpoint estável: `/images/<image-id>`, com ids
  como `retro-handheld_front_<slug>` e `retro-handheld_article_<slug>_N` e
  metadados de autoria (`by`).
- **Guias externos** referenciados por device (`guides[]` com `label`, `link`,
  `author`) — hoje apontando para retrogamecorps etc.
- **Filtros e ordenação** via querystring (`?sorting=highestRated&filters={...}`),
  resolvidos majoritariamente no cliente sobre o dataset embarcado.

**O que vamos fazer diferente:** trocar o dataset embarcado/estático por um
**banco relacional** com API, adicionar **contribuição da comunidade com
moderação**, transformar os "guias externos" em **conteúdo nativo** (tutoriais e
guias de compra escritos na própria plataforma) e oferecer **componentes
dinâmicos** que o autor insere no editor — incluindo blocos que se mantêm
atualizados sozinhos (releases do GitHub) e blocos de loja com afiliados.

## Estado atual (v1, Fumadocs) — ponto de partida

A RetroWiki hoje é um site **Fumadocs** (Next.js 16, MDX baseado em arquivos em
`content/<console>/*.mdx`). Já existem componentes que provam o conceito dos
"blocos dinâmicos" e que servem de referência para a v2:

- `FirmwareList` — recebe `owner`/`repo` e lista releases do GitHub (a versão da
  v2 deve buscar e **revalidar** automaticamente).
- `BuyingGuide` — lojas e acessórios com `trustLevel`, badges e links de afiliado.
- `ConsoleOverview` — ficha técnica completa do device (espelha o modelo de dados
  do retrocatalog).

A v2 promove esses componentes de "MDX escrito por mantenedor" para **blocos de
primeira classe inseríveis por qualquer autor** no editor, com dados vindos do
banco e de integrações server-side seguras.

> **Skills aplicadas nesta documentação:** `html5`, `acessibilidade` (WCAG 2.2 /
> WAI-ARIA), `tailwind-patterns`, `tailwind-v4-shadcn` e `cc-skill-security-review`.
