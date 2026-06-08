# 04 — Comunidade e Moderação

O diferencial da v2 é deixar a comunidade **propor** conteúdo (tutoriais, guias
de compra, soluções) sem abrir mão de **curadoria**. Nada vai ao ar sem aprovação
— exceto por uma regra explícita de confiança (autotrust).

## 4.1 Papéis e permissões (RBAC)

| Ação | Visitante | Membro | Colaborador | Moderador | Admin |
|---|:--:|:--:|:--:|:--:|:--:|
| Ler conteúdo publicado | ✅ | ✅ | ✅ | ✅ | ✅ |
| Comentar / votar / favoritar | — | ✅ | ✅ | ✅ | ✅ |
| Criar rascunho e **submeter** | — | ✅ | ✅ | ✅ | ✅ |
| Publicar **sem** revisão | — | — | ⚠️ autotrust | ✅ | ✅ |
| Revisar a fila (aprovar/rejeitar) | — | — | — | ✅ | ✅ |
| Editar/despublicar conteúdo de terceiros | — | — | — | ✅ | ✅ |
| Editar devices canônicos / categorias | — | — | — | ⚠️ limitado | ✅ |
| Gerenciar papéis, lojas, integrações | — | — | — | — | ✅ |

A checagem é central (ver [09 — Segurança](./09-seguranca.md)): toda Server Action
e rota protegida valida `session.user.role` **no servidor**, nunca confiando no
cliente.

```ts
// lib/auth.ts
export const can = {
  submit:  (u: User) => !!u && !u.banned,
  moderate:(u: User) => u?.role === 'MODERATOR' || u?.role === 'ADMIN',
  admin:   (u: User) => u?.role === 'ADMIN',
  publishDirectly: (u: User) =>
    u?.role === 'MODERATOR' || u?.role === 'ADMIN' || (u?.trusted === true),
};
```

## 4.2 Estados de um artigo

```
DRAFT ──submit──▶ PENDING ──approve──▶ PUBLISHED
  ▲                  │   │
  │            request │   │ reject
  └──CHANGES_REQUESTED◀┘   ▼
                       REJECTED

PUBLISHED ──nova edição──▶ (nova Revision PENDING)  // a versão no ar continua
PUBLISHED ──archive/despublicar──▶ ARCHIVED
```

- **Editar um artigo já publicado** cria uma **nova `Revision` PENDING**; a
  revisão publicada (`current`) permanece no ar até a nova ser aprovada. Sem
  "buraco" de conteúdo nem bypass de moderação.
- **CHANGES_REQUESTED** devolve ao autor com feedback (`Review.reason`).

## 4.3 Fluxo de contribuição (passo a passo)

1. **Membro** abre o editor (`/editor/novo`), escolhe tipo (tutorial, guia de
   compra…) e, opcionalmente, o device relacionado.
2. Monta o conteúdo com **blocos** (ver [05](./05-editor-e-componentes-dinamicos.md)).
   Salvar = `DRAFT` (privado do autor).
3. **Submeter** valida a árvore de blocos (Zod), cria `Revision` e marca
   `PENDING`, criando um `Review` na fila. Dispara notificação aos moderadores.
4. **Moderador** vê a fila (`/moderacao`), compara com a versão atual (diff),
   roda os checks automáticos e decide:
   - **Aprovar** → `PUBLISHED`, aponta `current` para a revisão, revalida
     (`revalidateTag('article:<id>')`), credita reputação ao autor, registra em
     `AuditLog`.
   - **Pedir ajustes** → `CHANGES_REQUESTED` com motivo.
   - **Rejeitar** → `REJECTED` com motivo.
5. **Autotrust:** se `publishDirectly(user)` for verdadeiro, a etapa 3 já publica,
   mas mesmo assim grava `Review` (decisão automática) e `AuditLog` — auditável e
   reversível.

## 4.4 Reputação e autotrust

Reputação é um inteiro derivado de eventos (não editável diretamente):

| Evento | Δ reputação |
|---|--:|
| Artigo aprovado | +20 |
| Artigo recebe voto positivo | +1 |
| Edição aprovada em artigo de terceiro | +10 |
| Artigo rejeitado por spam/abuso | −30 |
| Conteúdo despublicado por moderação | −15 |

- **`trusted = true`** (autotrust) é concedido por: reputação ≥ limiar (ex.: 200)
  **e** ≥ N artigos aprovados **e** zero strikes recentes — concedido por job, não
  manualmente, e revogável por moderador.
- Recalcular reputação é um **job** idempotente a partir do `AuditLog`/eventos
  (resiliente a reprocessamento).

## 4.5 Anti-abuso e qualidade

Aplicar defesa em camadas (detalhes técnicos em [09 — Segurança](./09-seguranca.md)):

- **Rate limiting** por usuário e IP em criação/submissão/comentário.
- **Verificações automáticas na submissão** (bloqueiam ou sinalizam para
  moderação manual):
  - Allowlist de domínios em links (lojas/externos) — bloqueia encurtadores e
    domínios não cadastrados.
  - Detecção de excesso de links/afiliados ("link farming").
  - Checagem de duplicidade (título/slug/conteúdo muito parecido com existente).
  - Mínimos de qualidade (tamanho, blocos vazios, imagens sem `alt`).
  - Antispam (honeypot + verificação tipo Turnstile no cadastro/submissão).
- **Denúncias** (`flag`) por usuários em artigos/comentários → entram na fila.
- **Soft-delete + AuditLog**: nada é apagado de forma irreversível por moderação;
  tudo é rastreável.
- **Créditos de autoria** preservados em cada revisão (quem escreveu o quê).

## 4.6 Notificações

- Para **moderadores**: nova submissão na fila (agrupada para evitar ruído).
- Para **autores**: aprovado / ajustes pedidos / rejeitado (com motivo).
- Implementadas como **jobs** (e-mail + in-app), nunca bloqueando a request do
  usuário.

## 4.7 Diretrizes da comunidade (conteúdo)

Documento público vinculado ao fluxo de submissão (o autor confirma no envio):

- Conteúdo original ou devidamente creditado; sem cópia de outros sites.
- Sem links de afiliado disfarçados — todo link de loja é explícito e passa pela
  allowlist; afiliados são sinalizados (`rel="sponsored nofollow"`).
- Sem pirataria/ROMs/BIOS protegidos (a wiki ensina configuração, não distribui
  conteúdo ilegal).
- Acessibilidade mínima: imagens com `alt`, títulos em hierarquia (o editor
  ajuda a cumprir — ver [07](./07-semantica-e-acessibilidade.md)).
