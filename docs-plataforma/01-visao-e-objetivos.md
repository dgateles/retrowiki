# 01 — Visão e Objetivos

## 1.1 Problema com o estado atual (Fumadocs)

O Fumadocs é excelente para documentação técnica mantida por poucas pessoas via
arquivos versionados no Git. Mas a RetroWiki está crescendo para algo que o
modelo "MDX em arquivos" não atende bem:

| Limitação do Fumadocs hoje | Necessidade da v2 |
|---|---|
| Conteúdo só editável por quem tem acesso ao repositório (Git/PR) | Qualquer usuário cadastrado deve poder **propor** tutoriais e guias |
| Dados do device espalhados como props MDX duplicadas em cada `index.mdx` | **Fonte única** de specs no banco, reaproveitada em catálogo, comparador, busca |
| Sem autenticação, perfis, reputação, comentários | Camada **comunitária** (contas, moderação, votos, créditos de autoria) |
| Componentes dinâmicos exigem editar `.tsx`/`.mdx` à mão | Autor insere **blocos** num editor visual, sem tocar em código |
| Busca limitada a conteúdo de arquivos | Busca/filtros estruturados como o retrocatalog (por chip, tela, emulação) |
| Publicação = commit | Publicação = **fluxo de aprovação** (rascunho → revisão → publicado) |

## 1.2 Visão

> Uma **wiki comunitária de handhelds retrô em português**, com um **catálogo de
> consoles rico em dados** (no nível do retrocatalog) e **conteúdo editorial
> escrito pela comunidade** — tutoriais, guias de compra, soluções de problemas —
> publicado sob **moderação**, usando **componentes dinâmicos** que se mantêm
> atualizados sozinhos.

## 1.3 Público-alvo e papéis

- **Visitante** — lê catálogo, guias e tutoriais; usa busca/filtros/comparador.
- **Membro** (cadastrado) — comenta, vota, favorita, **propõe** conteúdo.
- **Colaborador** — membro com histórico aprovado; submissões podem ter revisão
  mais leve (autotrust por reputação).
- **Moderador** — revisa a fila, aprova/rejeita/pede ajustes, edita, despublica.
- **Admin** — gerencia devices canônicos, papéis, integrações e configurações.

## 1.4 Princípios de produto

1. **Dados estruturados primeiro.** O device é uma entidade de banco, não props
   espalhadas em MDX. Tudo (catálogo, comparador, busca, embeds em artigos) lê a
   mesma fonte.
2. **Comunidade com curadoria.** Contribuir é fácil; publicar exige aprovação.
   Nada gerado por usuário vai ao ar sem passar por moderação (ou por uma regra
   de confiança explícita).
3. **Componentes, não HTML cru.** O autor monta conteúdo com **blocos** seguros e
   semânticos. Ele nunca injeta HTML/JS arbitrário (ver [09 — Segurança](./09-seguranca.md)).
4. **Dinâmico por padrão.** Blocos como "Releases do GitHub" e "Onde comprar"
   buscam dados ao vivo e **revalidam** — o conteúdo não "envelhece".
5. **Acessível e rápido.** WCAG 2.2 AA como linha de base (não opcional),
   renderização no servidor, imagens otimizadas.
6. **Português-BR como idioma primário**, arquitetura pronta para i18n.

## 1.5 Princípios de arquitetura

- **App Router + Server Components** para entregar HTML semântico já renderizado
  (bom para SEO e a11y), com ilhas de interatividade no cliente.
- **Banco relacional** (Postgres) como fonte da verdade; ORM tipado.
- **Integrações server-side** (GitHub, lojas) sempre no servidor, nunca expondo
  tokens nem permitindo o cliente escolher URLs arbitrárias (anti-SSRF).
- **Conteúdo do usuário como dado estruturado** (árvore de blocos em JSON),
  renderizado por um conjunto **fechado** de componentes — nunca `eval` de MDX
  de terceiros.
- **Cache em camadas** com revalidação (ISR/tags) para casar "dinâmico" com
  "rápido".

## 1.6 Escopo do MVP

**No MVP (v0.1):**

- Catálogo de devices (lista + ficha) lendo do banco — migração do conteúdo atual.
- Autenticação (e-mail/OAuth) e perfis.
- Editor de blocos com um conjunto inicial: Texto, Título, Imagem, Passos,
  Alerta, Tabela, **Bloco GitHub Releases**, **Bloco Loja/Onde Comprar**,
  **Bloco Ficha de Device**.
- Fluxo de submissão → fila de moderação → publicação.
- Busca básica + filtros por categoria/console.

**Pós-MVP (v1):**

- Comparador de devices, votos/reputação, comentários, versionamento de artigos
  com histórico/diff, scraping assistido de specs, i18n, notificações.

## 1.7 Não-objetivos

- Não recriar um editor "tipo Word" com HTML livre — o conteúdo é **estruturado**.
- Não permitir execução de código/scripts enviados por usuários.
- Não depender de um único provedor proprietário que impeça self-hosting.
