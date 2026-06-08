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
  O alvo é um WYSIWYG completo no estilo IPB, com barra de ferramentas e edição
  fluida, ainda produzindo a árvore de blocos segura. Especificação detalhada na
  seção "Editor rico WYSIWYG (referência IPB)". É a mudança de maior porte da
  camada de autoria.

## Interface desejada (referências Invision/IPB)

O usuário indicou templates de fórum (Invision Community) como direção visual.
Adaptar ao cenário do RetroWiki, sem copiar literal.

- **Visualização de guia/tutorial estilo post de fórum.** Cabeçalho com título,
  botões Compartilhar e Seguir; cartão do autor (avatar, nome, selo de papel,
  data); corpo do conteúdo num cartão destacado; rodapé com reações e contagem
  ("Fulano e mais 4" + total). Onde o template mostra "Recently Browsing",
  ficam os comentários. Trilha de navegação no topo e no rodapé.
- **Perfil de usuário rico.** Capa (cover), avatar sobreposto, nome e papel,
  "Entrou em" e "Visto por último", botão "Ver conteúdo". Coluna lateral com
  rank atual, troféu de "dias no topo", badges recentes, estatísticas (posts,
  soluções, reputação, seguidores), métodos de contato e informações do perfil.
  Coluna principal com abas (Atividade, Sobre, Imagens) e feed de atividade.
- **Sistema de pontos e ranks.** Ranks progressivos (ex.: Novato 1/13 a Grão
  Mestre 13/13), pontos até o próximo rank, reputação, badges/conquistas e
  "dias no topo". Já existe `reputation` em `users`; falta a tabela de ranks,
  badges, o cálculo de pontos e a exibição (perfil, menu de usuário, cartão do
  autor no guia).
- **Configurações de conta em seções.** Página de Settings com navegação lateral
  (Visão geral, E-mail, Senha, Segurança e privacidade, Dispositivos recentes,
  Nome de exibição, Preferências de conteúdo) e painel à direita com linhas
  (valor atual + botão Alterar). Substitui a página de conta atual.
- **Busca em overlay.** Ao acionar, abrir um painel com campo grande "Buscar…",
  botão Buscar e filtros (escopo, título/corpo, criado, atualizado). Complementa
  o combobox inline já existente.
- **Notificações em dropdown.** Painel com cabeçalho "Notificações" + botão de
  configurações, prompt de push do navegador, estado vazio e rodapé "Ver todas".
  Substitui o link direto do sino por um dropdown.
- **Compartilhar conteúdo.** Popover com URL copiável e botões de redes
  (Bluesky, X, Facebook, LinkedIn, Reddit, Pinterest) e "Mais opções".

## Editor rico WYSIWYG (referência IPB)

Substituir o editor por blocos atual por um WYSIWYG completo, no estilo do
Invision Community. É a mudança de maior porte da autoria. Direção visual e de
recursos (das referências enviadas):

Barra de ferramentas, da esquerda para a direita:

- **Estilo de bloco (¶).** Dropdown: Parágrafo, Título 1 a 6.
- **Inserir (+).** Dropdown: lista ordenada, lista com marcadores, bloco de
  código, Box (cartão destacado), Spoiler (oculta/revela), citação (quote),
  régua horizontal, tabela.
- **Negrito, Itálico, Sublinhado.**
- **Tamanho de fonte (Tt).** Dropdown: 80%, 90%, 100% (padrão), 125%, 150%,
  175%, 200%.
- **Cor do texto (A).** Dropdown com amostras: Padrão, Suave, Forte, Vermelho,
  Laranja, Amarelo, Verde, Azul, Índigo, Violeta.
- **Link.** Popover com campos Texto e URL (validar URL, `rel` seguro).
- **Emoji e ícones.** Picker com abas Emojis e Ícones, busca, categorias
  (emojis nativos; ícones de uma fonte como FontAwesome).
- **Limpar formatação (Tx).**
- **Mais (…).** Overflow: código inline, tachado, subscrito, sobrescrito,
  família de fonte, alinhamento (esquerda, centro, direita, justificado),
  cor de destaque (highlight: sem destaque, vermelho, laranja, amarelo, verde,
  azul, etc.).

Implicações de arquitetura:

- O modelo de conteúdo atual guarda parágrafos como texto puro. Um editor rico
  exige **rich text inline** (marcas: negrito, itálico, sublinhado, tachado,
  sub/sobrescrito, código inline, cor, destaque, tamanho, link) dentro dos
  parágrafos e títulos. Será preciso evoluir o schema de blocos para um modelo
  de nós inline com allowlist, mantendo a renderização sem `dangerouslySetInnerHTML`
  de conteúdo do usuário.
- Novos blocos: Box, Spoiler, régua horizontal, citação. Reaproveitar os
  existentes (heading, listas, código, tabela, imagem).
- Base sugerida: TipTap/ProseMirror (esquema controlado), serializando para a
  árvore de blocos segura em vez de HTML livre. Toda marca e atributo deve
  passar por allowlist no servidor antes de salvar.
- Segurança (regra do projeto): sanitizar no servidor, proibir scripts, estilos
  arbitrários e URLs `javascript:`; cores e tamanhos restritos ao conjunto fixo
  acima; emojis e ícones de catálogo fechado.
- Acessibilidade: toolbar operável por teclado (padrão APG toolbar), nomes
  acessíveis nos botões, foco visível, e os popovers (link, emoji) sem armadilha
  de foco.

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
- **Formulário de resposta rico (referência IPB).** A caixa de resposta usa o
  editor rico (depende do WYSIWYG no backlog), com avatar do autor, anexos por
  arrastar-e-soltar (com limite de tamanho), alternância "Seguir tópico"
  (notificações de novas respostas) e, para a equipe, "Ocultar", além do botão
  "Enviar resposta". O corpo do comentário deixa de ser texto puro e passa a
  guardar a árvore de blocos segura, como os guias.

## Operação
- **Agendar o cron.** O endpoint `/api/cron/sync-github` existe e é protegido por
  `CRON_SECRET`. Falta configurar o agendamento no Coolify (ou um disparador
  externo) para chamá-lo periodicamente.
- **CSP completa.** Os headers de segurança estão no `next.config.ts`, mas a
  Content-Security-Policy detalhada do doc 09 ainda não foi aplicada.

## Painel de administração completo (referência IPB)

Expandir o `/admin` atual (que hoje só tem o CRUD de consoles) para um painel de
administração no estilo Invision Community, adaptado ao nosso cenário (sem
Commerce, Clubs, Messenger nem CAPTCHA de terceiros; com nossos papéis,
RetroGuard e os ranks já existentes). Navegação em dois níveis: barra de áreas à
esquerda e submenu por área. Item adicionado ao final da fila.

Gerenciamento de membros:

- **Lista de membros.** Tabela com avatar, nome de exibição, e-mail, data de
  entrada, papel, rank (pontos) e último IP. Busca, filtros e ordenação.
  Ações: criar membro, forçar troca de senha, exportar e importar lista.
- **Papéis e permissões.** No IPB são "grupos"; aqui são os papéis
  (member, contributor, moderator, admin). Tela para promover/rebaixar, ver a
  contagem por papel e editar o que cada papel pode fazer.
- **Ferramentas de IP e auditoria.** Consultar ações por usuário/IP usando o
  `audit_log` já existente.
- **Solicitações de exclusão (LGPD/PII).** Fluxo para o usuário pedir exclusão
  da conta e dos dados, e o admin processar.

Gamificação (conquistas):

- **Regras.** Ações que concedem pontos e badges (comentário publicado,
  primeiro comentário, guia aprovado, reação recebida, login recorrente, etc.),
  com pontos configuráveis. Alimenta a reputação que já move os ranks.
- **Ranks.** Hoje os 13 níveis estão fixos em `src/lib/ranks.ts`. Tornar
  editáveis (nome, ícone, limiar de pontos) via tabela e tela de admin.
- **Badges.** Catálogo de conquistas com ícone, critério e concessão automática
  (por regra) ou manual (por moderador). Precisa de tabela de badges e de
  badges-por-usuário.
- **Configurações.** Ativar/desativar a gamificação, marcar badge como "raro"
  abaixo de X% dos membros, limpar o log de atividade após N dias, excluir
  papéis, limitar pontos manuais por dia. Botão de recalcular conquistas.

Configurações de membros:

- **Campos de perfil.** Campos extras editáveis (bio, localização, links),
  com grupos de campos e controle de quem vê.
- **Reputação e reações.** Configurar se está ativa, papéis excluídos, reagir ao
  próprio conteúdo, limiar para destacar conteúdo, exibir total no perfil,
  e o conjunto de reações. Abas: configurações, reações, ranking (leaderboard),
  níveis de reputação.
- **Notificações.** Tipos de notificação (conquistas, conteúdo seguido,
  moderação, menções, perfil) com edição por tipo. Conecta com a
  `notification_prefs` já existente.
- **Banimentos.** Filtros de banimento por e-mail, IP ou termo, com motivo.

Moderação de conteúdo:

- **Denúncias.** Membros denunciam conteúdo; fila para a equipe. Configurar
  motivos, obrigatoriedade de mensagem e moderação automática por número de
  denúncias.
- **Prevenção de spam.** Tela de configuração do RetroGuard (dificuldade do
  proof-of-work, honeypot) em vez dos CAPTCHAs de terceiros do IPB.
- **Avisos (warnings).** Sistema de advertências ao usuário com níveis e
  consequências.
- **Atribuições.** Encaminhar conteúdo a um moderador específico.

Equipe:

- **Moderadores e administradores.** Listas da equipe com escopo de permissão.
- **Diretório da equipe.** Página pública de quem modera a comunidade.

Gerenciamento de páginas e conteúdo:

- **Guias/artigos.** Gerenciar todos os artigos (qualquer status), com workflows
  de revisão, categorias e campos. Complementa a fila de moderação atual.
- **Páginas estáticas, blocos e templates.** Construtor de páginas com blocos
  reutilizáveis (template blocks) e templates, como no Page Builder do IPB.
- **Mídia.** Biblioteca de imagens (depende do upload de mídia, já no backlog).
- **Bases de dados.** Tipos de conteúdo personalizados (custom databases).

E-mail em massa:

- **Bulk mail.** Envio segmentado para grupos de membros via Resend, respeitando
  as supressões (`email_suppressions`) e o opt-out.

Estatísticas:

- **Painel de métricas.** Crescimento de membros, conteúdo publicado, reações e
  atividade, alimentando as decisões de moderação e curadoria.

## Perfil de usuário (detalhamento)

Estende o perfil rico já entregue (capa, avatar, cartão de rank, estatísticas).
Elementos adicionais da referência IPB, adaptados. Item ao final da fila.

Cabeçalho:

- **Editar perfil (dropdown).** Para o dono do perfil: editar foto, enviar capa,
  editar perfil, configurações da conta. Depende do upload de mídia (avatar e
  capa), hoje só temos a capa em gradiente e o avatar com iniciais.
- **Presença.** "Entrou em", "Visto por último" e "Agora" (o que está vendo),
  com indicador de online. Precisa registrar `lastSeenAt` e a atividade atual.
- **Ver minha atividade.** Botão que abre o feed de atividade do usuário.

Barra lateral:

- **Pontos de advertência.** Cartão com o total de warnings e restrições ativas
  (depende do sistema de avisos do painel de admin).
- **Rank.** Já existe.
- **E-mail.** Visível só para a equipe ("Only staff can see email addresses").
- **Posts.** Contagem de publicações, com link para a atividade.
- **Reputação.** Total com rótulo (Neutra, Boa, etc.).
- **Seguidores.** Contagem e ações de seguir/deixar de seguir. Precisa de tabela
  de follows entre usuários.
- **Visitantes recentes do perfil.** Quem visitou o perfil (opcional, com
  opt-out). Precisa registrar visitas.

Coluna principal:

- **Feed de atividade.** Linha do tempo do usuário (entrou na comunidade,
  publicou guia, comentou, reagiu, ganhou badge). Depende do log de atividade
  da gamificação.

## Configurações de conta (detalhamento)

Estende a página de configurações em seções já entregue (visão geral, nome,
senha, e-mail, segurança). Elementos adicionais da referência IPB, adaptados.
Item ao final da fila.

- **Editar perfil (modal "Sobre mim").** Modal com o campo "Sobre mim" usando o
  editor rico (depende do WYSIWYG no backlog) e anexos com arrastar-e-soltar e
  limite de tamanho. Salva no perfil. Hoje o perfil não tem bio editável.
- **Reautenticação para áreas sensíveis.** Antes de abrir Segurança e
  privacidade (ou trocar e-mail/senha), pedir a senha de novo, com link
  "Esqueci a senha". Sessão de reautenticação curta.
- **Privacidade.**
  - **Status online.** Alternar entre visível e oculto. Quando visível, outros
    veem que o usuário está online e o que está vendo. Depende do registro de
    presença (`lastSeenAt`) e de uma flag de privacidade.
  - **Solicitar dados (PII).** Botão para o usuário pedir uma cópia de todos os
    dados pessoais armazenados (export LGPD). Conecta com as solicitações de
    PII do painel de admin.
- **Dispositivos recentes.** Lista de dispositivos/sessões usados para entrar
  nos últimos 90 dias, com navegador, localização aproximada por IP e "último
  acesso", e ação de desabilitar login automático/encerrar sessão. Precisa
  registrar sessões com user-agent e IP.
- **Preferências de conteúdo.** Seção para preferências de exibição e de
  notificação por tipo, ligada à `notification_prefs`.
