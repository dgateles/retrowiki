# Crons / Tarefas agendadas

A plataforma expõe três endpoints de cron, todos **`POST`** e protegidos pelo
header `Authorization: Bearer $CRON_SECRET`. Sem o segredo correto, respondem
`401`. Defina `CRON_SECRET` no ambiente (gere com `openssl rand -hex 32`) e use
o mesmo valor nas tarefas agendadas.

| Endpoint | O que faz | Frequência sugerida |
|---|---|---|
| `POST /api/cron/maintenance` | Purga de IPs por LGPD (365 d), poda do log de auditoria, auto-fechamento de atribuições vencidas | **1×/dia** (ex.: `0 4 * * *`) |
| `POST /api/cron/notification-digest` | Envia o resumo de notificações por e-mail (Resend), respeitando opt-out e `notifications.emailed_at` | **~15 min** (`*/15 * * * *`) |
| `POST /api/cron/sync-github` | Atualiza o cache de releases dos repositórios da allowlist (fallback dos blocos github-releases) | **1×/h** (`0 * * * *`) |

`$APP_URL` é a URL pública da aplicação (no `.env`, `APP_URL`).

## Comando base

```bash
curl -fsS -X POST "$APP_URL/api/cron/maintenance" \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Como agendar no Coolify

No Coolify, em **Scheduled Tasks** do recurso da aplicação (ou um container
utilitário com `curl`), crie uma tarefa por endpoint:

1. **Manutenção diária**
   - Frequency: `0 4 * * *`
   - Command:
     ```bash
     curl -fsS -X POST "$APP_URL/api/cron/maintenance" -H "Authorization: Bearer $CRON_SECRET"
     ```
2. **Digest de notificações**
   - Frequency: `*/15 * * * *`
   - Command:
     ```bash
     curl -fsS -X POST "$APP_URL/api/cron/notification-digest" -H "Authorization: Bearer $CRON_SECRET"
     ```
3. **Sync de releases do GitHub**
   - Frequency: `0 * * * *`
   - Command:
     ```bash
     curl -fsS -X POST "$APP_URL/api/cron/sync-github" -H "Authorization: Bearer $CRON_SECRET"
     ```

`$APP_URL` e `$CRON_SECRET` devem estar disponíveis como variáveis de ambiente
na tarefa (o Coolify injeta as env vars do recurso). Se preferir, substitua
pelos valores literais no comando.

## Verificação

Uma resposta `200` com corpo JSON indica sucesso; `401` indica segredo
ausente/errado. Os efeitos (e-mails enviados, registros podados) podem ser
conferidos nos logs da aplicação e no painel admin.
