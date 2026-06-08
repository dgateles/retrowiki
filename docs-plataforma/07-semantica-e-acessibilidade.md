# 07 — Semântica HTML5 e Acessibilidade

Meta de conformidade: **WCAG 2.2 nível AA** (não opcional). Base: HTML Living
Standard (WHATWG) + WAI-ARIA 1.1 + APG. Princípios POUR: **P**erceptível,
**O**perável, **C**ompreensível, **R**obusto.

## 7.1 Semântica HTML5 — use o elemento certo

Server Components devem emitir **HTML semântico**, não `div` por toda parte.

| Região / conteúdo | Elemento | Papel ARIA implícito |
|---|---|---|
| Cabeçalho do site | `<header>` | `banner` |
| Navegação principal / switcher de consoles | `<nav aria-label="...">` | `navigation` |
| Conteúdo principal da página | `<main id="main">` | `main` |
| Card de device / artigo na lista | `<article>` | — |
| Seção nomeada (ficha, "onde comprar") | `<section aria-label>` | `region` |
| Barra lateral / "devices similares" | `<aside>` | `complementary` |
| Busca | `<search>` (novo) | `search` |
| Rodapé | `<footer>` | `contentinfo` |
| Ficha técnica (chave→valor) | `<dl><dt><dd>` | — |
| Passos numerados | `<ol><li>` | — |
| Hotkeys | `<kbd>` | — |
| Data de release | `<time dateTime="2024-11">` | — |
| Imagem com legenda | `<figure><figcaption>` | — |

**Hierarquia de títulos:** um `<h1>` por página (o título do artigo/device),
seções em `<h2>`, subseções em `<h3>` — sem pular níveis. O **editor** deve
impedir o autor de criar `h1` (reservado ao título) e de pular de `h2` para `h4`.

```html
<main id="main">
  <article>
    <h1>Retroid Pocket 5</h1>
    <section aria-labelledby="ficha">
      <h2 id="ficha">Ficha técnica</h2>
      <dl>
        <dt>Chip</dt><dd>Snapdragon 865</dd>
        <dt>Tela</dt><dd>AMOLED 5,5" — 1920×1080</dd>
      </dl>
    </section>
  </article>
</main>
```

## 7.2 Navegação por teclado e foco

- **Tudo operável por teclado** (SC 2.1.1). Use `<button>`/`<a>` nativos; só use
  `role`+`tabindex` quando não houver elemento nativo (Regra 1 do ARIA).
- **Foco visível** (SC 2.4.7) e não obscurecido (SC 2.4.11): nunca remover
  `outline` sem substituir. Padrão do projeto: `focus-visible:outline-2
  focus-visible:outline-offset-2 focus-visible:outline-ring`.
- **Skip link** no topo:

```html
<a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 ...">
  Pular para o conteúdo
</a>
```

- **Alvos de toque ≥ 24×24px** (SC 2.5.8) — relevante para os filtros e botões
  do catálogo no mobile.

## 7.3 Padrões ARIA das telas-chave (APG)

### Busca com autocomplete → padrão **Combobox**

```html
<search>
  <label for="q">Buscar consoles e guias</label>
  <input id="q" role="combobox" aria-expanded="false"
         aria-controls="q-list" aria-autocomplete="list" autocomplete="off">
  <ul id="q-list" role="listbox" aria-label="Sugestões">
    <li role="option" id="opt-1">Retroid Pocket 5</li>
  </ul>
</search>
```
Teclado: ↑/↓ navega opções, Enter seleciona, Esc fecha, foco permanece no input.

### Filtros do catálogo → grupos + status ao vivo

- Grupos de filtro em `<fieldset><legend>`; checkboxes nativos.
- Resultado anunciado por **live region**:
  `<div role="status" aria-live="polite">42 consoles encontrados</div>`
  (SC 4.1.3 Status Messages).

### Modal de submissão / login → padrão **Dialog**

Use `<dialog>` nativo (ou Radix `Dialog` do shadcn) com:
- `role="dialog"` + `aria-modal="true"` + `aria-labelledby`.
- **Focus trap** que mantém o foco dentro, **mas sempre permite fechar com Esc**
  (SC 2.1.2 — sem armadilha de teclado).
- Ao abrir: foca o primeiro campo; ao fechar: devolve o foco ao gatilho.

### Tabs da ficha (Visão geral / Emulação / Comentários) → padrão **Tabs**

`role="tablist"` / `tab` (`aria-selected`, `aria-controls`) / `tabpanel`
(`aria-labelledby`); ←/→ alterna tabs.

### Comparador / specs → **table** com cabeçalhos

`<table>` com `<caption>`, `<th scope="col">`/`<th scope="row">` — não usar grid
de `div` para dados tabulares.

## 7.4 Formulários (editor, login, cadastro)

- Todo campo com `<label for>` associado (não placeholder como rótulo).
- `autocomplete` correto (`email`, `username`, `new-password`) — SC 1.3.5.
- Erros com `aria-describedby` + `role="alert"`:

```html
<label for="title">Título do tutorial</label>
<input id="title" required aria-describedby="title-hint title-err" maxlength="140">
<span id="title-hint">Entre 8 e 140 caracteres.</span>
<span id="title-err" role="alert" aria-live="assertive"></span>
```

- **Mensagens de erro com sugestão** (SC 3.3.3): "Título muito curto — use ao
  menos 8 caracteres", não apenas "inválido".
- **Autenticação acessível** (SC 3.3.8): não exigir resolver puzzles cognitivos;
  permitir colar senha e usar gerenciadores; preferir OAuth/magic-link.

## 7.5 Imagens e mídia

- `alt` **obrigatório** em toda imagem de conteúdo (o schema do bloco `image`
  exige; SC 1.1.1). Imagens decorativas: `alt=""`.
- Imagens de device do catálogo: `alt` descritivo ("Retroid Pocket 5, frente").
- Capturas em tutoriais devem ter `alt` que descreva a ação, não "screenshot".

## 7.6 Contraste e tema (inclui glassmorphism)

- Texto normal **4.5:1**, texto grande **3:1**, componentes de UI/foco **3:1**
  (SC 1.4.3 / 1.4.11).
- Se usar vidro/blur/transparência: garantir **fundo sólido de fallback** ou
  opacidade suficiente para o contraste valer no **pior caso** de fundo. Tokens de
  cor definidos para passar nos dois temas (ver [08 — Design System](./08-design-system.md)).
- **Reflow** sem scroll horizontal a 320px (SC 1.4.10) e **zoom 200%** sem perda
  de conteúdo — catálogo em grid responsivo/container queries.

## 7.7 Idioma e i18n

- `<html lang="pt-BR">`; trechos em outro idioma com `lang` (SC 3.1.2), ex.:
  nomes de firmware ou termos em inglês quando necessário.

## 7.8 Validação obrigatória com axe

**Toda página/componente novo é validado com axe-core antes de concluir.** Não é
opcional.

```bash
npm i -D @axe-core/cli
# rode contra a página renderizada (servidor de dev ou build estático)
npx axe http://localhost:3000/consoles/retroid-pocket-5
npx axe http://localhost:3000/editor/novo
```

Fluxo de teste mínimo por entrega:
1. axe (ou Lighthouse a11y) sem violações.
2. Navegação só com teclado (Tab/Shift+Tab/Enter/Esc/setas) nos fluxos: buscar,
   filtrar, abrir ficha, abrir editor, submeter.
3. Leitor de tela (NVDA/VoiceOver) nas telas-chave.
4. Contraste no claro e no escuro.
5. Reflow a 320px e zoom 200%.

> Se a instalação do axe falhar (rede/permissão), **peça ao usuário para instalar
> manualmente e aguarde** — não pule a validação.
