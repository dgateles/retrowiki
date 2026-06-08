# 15 — Gaps pendentes

Registro do que ainda falta na plataforma, para resolver depois. O núcleo está
funcional: catálogo, comparador, busca, conteúdo comunitário com editor de
blocos, moderação, comentários, votos, notificações, perfis, SEO e o cron dos
componentes dinâmicos.

## Estruturais prioritários (próximos)
- **Painéis de usuário, moderador e admin.** Hoje as ações de moderação e conta
  estão espalhadas em páginas soltas. Falta um painel por papel: o usuário com
  seus rascunhos, comentários e notificações; o moderador com a fila e métricas;
  o admin com gestão de devices, usuários, papéis, lojas e integrações.
- **CRUD de consoles (admin).** Não há tela para cadastrar um console novo nem
  editar os existentes. O modelo de dados suporta tudo (specs, emulação,
  categorias, imagens), mas falta o formulário de admin e a action segura.
- **Editor de conteúdo rico.** O editor atual é por blocos com campos simples.
  O alvo é uma experiência mais próxima de WordPress ou de fóruns (IPB, XenForo),
  com barra de ferramentas e edição fluida, ainda produzindo a árvore de blocos
  segura. É a mudança de maior porte da camada de autoria.

## Conteúdo e lojas
- **Registro de lojas e guias de compra.** O bloco `store-links` existe e
  referencia lojas por id, mas não há lojas cadastradas nem uma tela de admin
  para gerenciá-las. Os guias de compra antigos foram deixados de fora da
  migração porque dependem de links de afiliado reais. Falta: uma tela de admin
  de lojas, o seed de lojas, e a migração ou reescrita dos guias de compra.
- **Edição de artigos já publicados.** Hoje só rascunhos são editáveis. O fluxo
  descrito nos docs (editar publicado gera uma nova revisão pendente sem derrubar
  a versão no ar) ainda não foi implementado.

## Notificações
- **Preferências por canal e tipo.** A tabela `notification_prefs` existe, mas não
  há tela para o usuário configurar in-app por e-mail, nem o modo de resumo.
- **E-mail de resumo diário.** Falta o job que agrega notificações pendentes e
  envia um único e-mail por dia para quem optar.

## Conta e autenticação
- **Troca de e-mail.** Os tokens de `email_change` existem em `tokens.ts`, mas não
  há tela nem action para iniciar a troca e confirmar o novo e-mail.
- **Verificação de e-mail obrigatória.** Hoje o login e a submissão não exigem
  e-mail confirmado. Definir onde passar a exigir (provavelmente na submissão de
  conteúdo).
- **Perfil editável e avatar.** O perfil é só leitura. Falta editar nome de
  exibição e enviar avatar.

## Mídia
- **Upload de imagens.** Imagens de device e de artigo são por URL. Falta o fluxo
  de upload com validação, reprocessamento (remoção de EXIF, redimensionamento) e
  armazenamento, conforme o doc de segurança.

## Busca e descoberta
- **Ranking de busca.** A busca usa `LIKE` simples. Migrar para FULLTEXT do MySQL
  ou um índice dedicado (Meilisearch/Typesense) quando o volume justificar.
- **Autocomplete.** O combobox de sugestões no cabeçalho ainda não existe.

## Internacionalização
- **i18n.** A plataforma é só pt-BR. O template (dtbvault) usa next-intl; adotar
  o mesmo padrão quando for internacionalizar.

## SEO e social
- **Imagens OpenGraph dinâmicas.** Falta gerar a imagem OG por device e por
  artigo.

## Comentários
- **Edição e remoção pelo autor, respostas aninhadas.** Hoje o comentário é
  simples (criar e, para moderador, ocultar). Falta editar, apagar e responder.

## Operação
- **Agendar o cron.** O endpoint `/api/cron/sync-github` existe e é protegido por
  `CRON_SECRET`. Falta configurar o agendamento no Coolify (ou um disparador
  externo) para chamá-lo periodicamente.
- **CSP completa.** Os headers de segurança estão no `next.config.ts`, mas a
  Content-Security-Policy detalhada do doc 09 ainda não foi aplicada.
