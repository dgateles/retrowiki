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

STATUS: implementado (TipTap) e em uso nos guias novos. Toolbar completa
(blocos, listas, código, Box, Spoiler, citação, régua, tabela, imagem por URL,
negrito/itálico/sublinhado/tachado/código inline, tamanho de fonte, cor,
destaque, alinhamento, sub/sobrescrito, link, emoji, limpar formatação),
validação por allowlist e renderizador seguro. Pendências desta feature:
anexos por upload (dependem do armazenamento de mídia) e a aba de ícones
(FontAwesome). A imagem por URL cobre o caso de imagem por enquanto.

Direção visual e de recursos (das referências enviadas):

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

STATUS: implementado. O corpo do comentário agora é rico (editor com toolbar
reduzida: lista, spoiler, negrito, itálico, sublinhado, cor, destaque, emoji),
validado pela mesma allowlist dos guias e renderizado com segurança (formato
antigo de texto puro ainda suportado). Entregue: avatar do autor no comentário e
no formulário, editar e excluir pelo próprio autor (excluir também por
moderador), responder com citação (insere o comentário citado num blockquote
"X atrás, @autor disse:" e foca o editor), seguir o tópico (tabela
`article_follows`) com notificação aos seguidores a cada nova resposta, e
"Ocultar" para a equipe. Ao responder, o usuário citado é notificado
(`comment.quote`). Anexos por arrastar-e-soltar e respostas aninhadas em árvore
foram dispensados pelo dono do projeto: a resposta linear com citação e a
notificação ao citado atendem.

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

Gerenciamento de membros (detalhado a partir do AdminCP do IPB):

- **Lista de membros.** STATUS: entregue (versão base: lista com busca, papel,
  confiável, suspender). Faltam, da referência: colunas avatar / nome / e-mail /
  data de entrada / grupo(papel) / rank (com pontos, ex. "Novato 5 pts) / último
  IP; toolbar com Filtrar, Ordenar, Direção, Busca e engrenagem de colunas; ações
  por linha ao passar o mouse (Ver, Marcar como spammer, Excluir), sem permitir
  excluir/sinalizar a própria conta; e os botões do topo: Importar lista,
  Baixar/Exportar lista, Forçar troca de senha, Criar novo membro.
- **Criar novo membro (modal).** Campos: Nome de exibição, "Definir senha?"
  (toggle; se off, envia e-mail de confirmação para o usuário definir), E-mail,
  Grupo/papel, grupos secundários (não se aplica: usamos papel único), idioma e
  tema (no nosso caso, sem idioma/tema por enquanto). Salvar.
- **Tela de membro (Member View).** Página de detalhe de um membro no admin,
  `/admin/membros/{id}`. Adaptar os cartões da referência ao nosso modelo:
  - **Cabeçalho**: capa, avatar, nome de exibição, e-mail, "Entrou há X". Editar
    capa, avatar, nome e e-mail (avatar/capa dependem do upload BunnyCDN).
  - **Account Actions** (dropdown): entrar como o usuário (impersonar; alto
    risco, avaliar depois), excluir conta, baixar dados pessoais (LGPD), editar
    preferências, editar senha.
  - **Estatísticas do topo**: posts (com Definir manualmente / Recontar) e nível
    de reputação (Definir manualmente / Recontar / Remover reputação dada /
    recebida).
  - **Estatísticas de conteúdo**: contagem por tipo (no nosso caso: guias e
    comentários; sem Blogs/Events/Downloads/Gallery/Commerce do IPB).
  - **Ranks**: rank atual + barra de progresso + "Ajustar pontos" (definir
    reputação manualmente). Já temos `ranks.ts` e `reputation`.
  - **Badges**: badges do usuário + "Gerenciar" (conceder/remover). Já temos.
  - **Grupos**: papel primário + editar (reusar a troca de papel já feita).
  - **Dispositivos e IPs**: IP de registro, último IP, fuso, lista de
    dispositivos. Depende de registrar sessões (user-agent + IP), que ainda não
    existe.
  - **Cota de anexos / Messenger**: não se aplica (sem mensageria; cota de mídia
    fica para o upload BunnyCDN).
  - **Avisos e restrições**: pontos de aviso, restrições, "Marcar como spammer"
    e "Banir". Depende do sistema de avisos (warnings) e de banimento.
  - **Dados de perfil**: Sobre, informações pessoais, sobre mim (a bio editável
    do detalhamento de perfil).
  - **Atividade recente da conta** (dropdown: mudanças importantes, assinatura de
    lista, aceite de termos, toda a atividade): feed por usuário a partir do
    `audit_log` (ações sobre o usuário e dele) + eventos de conta.
- **Papéis e permissões (Grupos, detalhado a partir do AdminCP do IPB).** No IPB
  são "Grupos" com permissões editáveis; aqui são os papéis (member, contributor,
  moderator, admin). Hoje os papéis são checados em código; o alvo é um sistema
  de permissões por papel, editável, com lista e formulário em abas. Adaptar (o
  que não se aplica: Forums, Polls, Blogs/Downloads/Gallery, Messenger, Clubs,
  Quests).
  - **Lista de grupos/papéis.** Tabela com Nome do grupo e Nº de membros;
    ordenar/buscar; ações por linha (Editar, Permissões, Copiar, Baixar lista de
    membros) e "Criar novo grupo". Para nós, papéis são fixos no conjunto, mas a
    tela de contagem por papel + capacidades é o equivalente útil.
  - **Formulário em abas** (adaptado, sem Blog/Downloads/Gallery):
    - **Configurações do grupo**: nome, ícone/cor (formatação), e o controle de
      acesso: pode acessar o site, pode acessar quando offline, permitir trocar
      nome de exibição, limite de busca (flood), privacidade (login anônimo,
      aparecer em filtros, pode ser ignorado, postar anônimo) — manter só o que
      faz sentido no nosso cenário.
    - **Conteúdo**: anexos (liga ao Bunny); edição (editar próprio conteúdo +
      janela de tempo, editar em silêncio); exclusão (ocultar/excluir próprio
      conteúdo); limite de itens por dia (nosso rate limit); moderação (reportar
      conteúdo, marcar como "Útil", **ignorar a fila de aprovação** = o nosso
      `trusted`, **exigir aprovação antes de publicar** = a fila de revisão,
      ignorar flood, ignorar filtros de palavra/link).
    - **Social**: editar perfil; limites de foto de perfil e capa (liga ao
      Bunny); ver histórico de nome; reações (máx. por dia, ver quem reagiu, ver
      quem achou útil); follows (ver informações de seguidores).
  - Permissões viram flags por papel, persistidas e checadas por um helper único
    (substituindo os checks espalhados em código). Item grande.
- **Ferramentas de IP e auditoria.** Consultar ações por usuário/IP usando o
  `audit_log`. Liga com Dispositivos e IPs acima.
- **Solicitações de exclusão (LGPD/PII).** Fluxo para o usuário pedir exclusão da
  conta e dos dados, e o admin processar; e o "baixar dados pessoais" do Account
  Actions.

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

## Painel de moderação dedicado (ModeratorCP, referência IPB)

Evolui o `/moderacao` atual (fila + métricas já entregues) para um painel de
controle de moderação completo, com barra lateral e cabeçalho de métricas.
Adaptado ao nosso cenário. Item ao final da fila.

Cabeçalho:

- **Métricas.** Denúncias ativas, fila de aprovação e atribuições abertas, com
  contadores. As duas primeiras já existem (fila pendente do `reviews`); as
  outras dependem dos sistemas de denúncia e atribuição.

Gerenciar conteúdo:

- **Conteúdo oculto.** Comentários e itens ocultados (status `hidden`), com
  opção de reverter.
- **Conteúdo apagado.** Itens removidos, para auditoria e restauração.
- **Conteúdo destacado.** Curadoria do que aparece em destaque.
- **Denúncias.** Fila de conteúdo reportado pela comunidade.
- **Fila de aprovação.** A fila de revisão de guias que já existe.
- **Atribuições.** Conteúdo encaminhado a um moderador específico.

Gerenciar membros:

- **Alertas.** Mensagens/alertas para membros, com criar e filtrar.
- **Ferramentas de IP.** Consulta por IP no `audit_log` e sessões.
- **Gestão de membros.** Busca, papéis e ações de moderação sobre usuários.
- **Avisos recentes.** Histórico de advertências (depende do sistema de
  warnings do painel de admin).

Ferramentas:

- **Anúncios.** Avisos no topo do site para todos.
- (Live Topics e afins do IPB não se aplicam ao nosso cenário.)

Acesso:

- **Atalhos no menu de usuário.** "ModeratorCP" (para moderadores e admins,
  leva ao `/moderacao`) e "AdminCP" (só admin, leva ao `/admin`), separando o
  painel de moderação do painel administrativo, como nas referências.

## Upload de imagens via BunnyCDN (storage)

Todo envio de imagem da plataforma passa a usar o BunnyCDN Storage, não mais URL
manual. Cobre: avatar e capa do perfil, imagens de device, imagens de artigo
(no editor rico, substituindo o "imagem por URL"), e anexos de comentário.

- **Storage Zone:** `https://br.storage.bunnycdn.com/retrowiki` (região BR).
- **API:** REST de Storage do Bunny. Upload `PUT {base}/{caminho}/{arquivo}`,
  leitura via Pull Zone (CDN), exclusão `DELETE`. Autenticação por header
  `AccessKey` com a chave da Storage Zone.
- **Segurança (regra do projeto):** a `AccessKey` é segredo, vai em variável de
  ambiente (`BUNNY_STORAGE_KEY`, `BUNNY_STORAGE_ZONE`, `BUNNY_PULL_ZONE`), nunca
  no código nem no cliente. O upload acontece no servidor (Server Action ou route
  handler): o cliente envia o arquivo para o nosso backend, que valida e repassa
  ao Bunny; a chave nunca chega ao navegador.
- **Validação antes de subir:** tipo permitido (jpeg, png, webp, gif), tamanho
  máximo, e reprocessamento (remoção de EXIF, redimensionamento/otimização)
  conforme o doc de segurança. Nome de arquivo gerado pelo servidor (sem confiar
  no nome do cliente), caminho por tipo (ex.: `avatars/`, `artigos/`,
  `devices/`, `comentarios/`).
- **No editor rico:** trocar o diálogo "imagem por URL" por upload (com
  arrastar-e-soltar), retornando a URL pública da Pull Zone para inserir no
  documento. Isso destrava os anexos de comentário e a imagem de artigo.
- **Substitui** o item "Upload de imagens" da seção Mídia acima (que ficava
  pendente por falta de armazenamento).

## Login com Google e avatar/capa

Reverte a decisão anterior de "só e-mail/senha": passa a permitir cadastro e
login com Google, e dá ao usuário controle sobre avatar e capa.

- **Login/cadastro com Google.** Adicionar o provider Google ao Auth.js
  (NextAuth). `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` em variável de
  ambiente. Criar a conta no primeiro login (handle gerado, papel `member`),
  preservando o fluxo de e-mail/senha existente.
- **Vinculação de contas (cuidado de segurança).** Se o e-mail do Google já
  existe como conta de e-mail/senha, não vincular automaticamente sem prova de
  posse. Como o Google entrega o e-mail verificado, vincular só quando o e-mail
  vier verificado pelo Google; caso contrário, pedir confirmação. Evitar
  account takeover por e-mail não verificado.
- **Avatar.**
  - Logado com Google: oferecer usar a foto do Google (a `picture` do perfil).
  - Permitir trocar por **link** (URL de imagem) ou por **upload** (BunnyCDN, ver
    seção acima).
- **Capa.** Permitir **upload** (BunnyCDN) ou **link**. Hoje a capa é um
  gradiente.
- **Sanitização de links de imagem (anti-imagem falsa/exploit).** Quando o
  usuário informar um link em vez de upload:
  - Aceitar só esquema `https` (e `http`), bloquear `javascript:`, `data:` e
    afins. Validar a URL antes de salvar.
  - Não confiar na extensão: buscar a imagem no servidor e checar o
    `Content-Type` real (apenas tipos de imagem permitidos) e o tamanho.
  - **Mitigar SSRF:** ao buscar a URL no servidor, bloquear IPs privados/loopback
    e redirecionamentos para eles, e limitar tempo/tamanho.
  - **Abordagem mais segura (recomendada):** re-hospedar a imagem do link no
    BunnyCDN após reprocessar (re-encode + remover EXIF), servindo sempre pela
    Pull Zone. Isso neutraliza payloads embutidos e hotlink malicioso, e dá um
    domínio confiável para a CSP. Guardar a URL final do nosso CDN, não a do
    usuário.
  - Reforçar a CSP de `img-src` para o domínio do nosso CDN quando re-hospedar.

## HTML e Markdown na autoria de guias

Além do editor rico, permitir escrever guias e tutoriais em HTML e em Markdown.
Os três modos produzem o mesmo conteúdo seguro no fim.

- **Modos de autoria.** Seletor no editor: Editor rico (atual), Markdown, HTML.
  Mantém o rascunho/revisão e o fluxo de moderação iguais.
- **Pipeline único e seguro (reaproveitar o que existe).** HTML ou Markdown não
  são renderizados como string. São convertidos para a **mesma árvore de blocos
  do editor rico** (doc do TipTap/ProseMirror), passando pela allowlist do
  `RichDocSchema` e pelo renderizador seguro (sem `dangerouslySetInnerHTML` de
  conteúdo do usuário). Assim, qualquer modo herda a segurança já validada.
  - Markdown: parser confiável (ex.: markdown-it/remark) → HTML → doc TipTap
    (`generateJSON`) → validação pela allowlist.
  - HTML: `generateJSON` do TipTap a partir do HTML, descartando tudo que não
    estiver na allowlist (nós/marcas/atributos conhecidos).
- **Sanitização do HTML (impedir scripts e exploits).** Remover `script`,
  `style`, `iframe`, `object`, handlers `on*`, e URLs `javascript:`/`data:`.
  Nada de CSS arbitrário; cores/tamanhos restritos ao conjunto fixo já definido.
  A allowlist do schema é a fonte da verdade (o que não está nela é descartado).
- **Imagens só do Bunny.** `img` só é aceita se a origem for o nosso Pull Zone
  (BunnyCDN). Imagens de outros domínios são rejeitadas ou re-hospedadas no Bunny
  (ver as seções de upload e de sanitização de links acima). Sem hotlink externo.
- **Saída.** Continua sendo a árvore de blocos segura salva na revisão, idêntica
  à do editor rico; a busca (`searchText`) e a renderização não mudam.

## Construtor visual de páginas estilo Elementor (admin)

Permitir ao admin montar páginas próprias (ex.: "Sobre", "Regras", "Contato",
landing pages) num **construtor visual de arrastar-e-soltar, no espírito do
Elementor do WordPress**. Só o **conteúdo** é editado: header e footer do site
continuam fixos, vindos do layout. Evolui a ideia de páginas HTML para edição
visual de verdade.

- **Só admin.** Criar, editar e despublicar páginas; ação protegida por papel
  `admin`, com `audit_log`.
- **Edição visual (Elementor-like).**
  - Estrutura em **seções → colunas → widgets**, com arrastar-e-soltar para
    reordenar e mover, e layout responsivo (controles por dispositivo:
    desktop/tablet/mobile).
  - **Widgets** de catálogo fechado: título, texto rico, imagem (Bunny),
    botão/CTA, divisor, espaçador, colunas, lista de ícones, acordeão, citação,
    cartão, embed de vídeo (allowlist de provedores), galeria, HTML/Markdown
    (passando pela sanitização). Sem widget de código/script arbitrário.
  - Edição inline com pré-visualização ao vivo e painel de propriedades por
    widget (espaçamento, alinhamento, cor do conjunto fixo, etc.).
  - **Templates/blocos reutilizáveis**: salvar uma seção como bloco e reusar em
    outras páginas (liga ao "template blocks" da seção do painel admin).
- **Modelo de dados.** A página é uma **árvore estruturada** (seções/colunas/
  widgets) serializada em JSON, não HTML cru. Tabela de páginas: `slug`,
  `título`, `layout` (a árvore), `status` (rascunho/publicada), `mostrar no
  menu`, ordem, datas. Rota dentro do layout principal, ex.: `/p/{slug}`.
- **Segurança (mesma allowlist).** Toda a árvore passa por validação de
  allowlist no servidor antes de salvar e é renderizada via JSX, sem
  `dangerouslySetInnerHTML` de conteúdo do usuário. Sem scripts, sem CSS
  arbitrário (só os tokens/escalas fixos), URLs sanitizadas, e **imagens só do
  Bunny**. O widget de HTML/Markdown reusa o pipeline do item anterior.
- **Link no header (opcional).** Campo "mostrar no menu" + ordem para a página
  aparecer na navegação do header. Sem marcar, existe só pela URL.
- **SEO.** Título e meta description por página; opção de `noindex`.
- **Nota de esforço.** É um item grande (editor de layout drag-and-drop +
  catálogo de widgets + responsividade + render seguro). Dá para entregar em
  fases: começar com seções/colunas + um punhado de widgets essenciais (título,
  texto, imagem, botão, divisor) e ir ampliando.

## [CRÍTICO] Overhaul de UX do painel de administração

O dono do projeto avaliou que o AdminCP do IPB (das referências) é bem mais
organizado e robusto do que o admin implementado hoje, e quer elevar o nosso a
esse nível. Item CRÍTICO ao final da fila. As pendências de detalhamento das
seções (membros, grupos/permissões, conquistas, moderação) devem ser sanadas
junto com este overhaul.

Direção (do AdminCP do IPB, adaptado ao nosso cenário):

- **Navegação em dois níveis.** Barra de áreas à esquerda (ex.: System,
  Community, Members, Pages, Statistics, Customization — adaptar) e, dentro de
  cada área, um submenu agrupado por seções com títulos (ex.: em Members:
  MEMBERS, ACHIEVEMENTS, MEMBER SETTINGS, CONTENT MODERATION, STAFF, BULK MAIL).
  Hoje temos só uma barra simples (Visão geral, Consoles, Membros, Gamificação).
- **Busca global do admin** ("Buscar configurações, membros, etc.") e atalhos no
  topo (Visitar site, links rápidos, notificações, menu da conta).
- **Padrões de tela consistentes.**
  - Listas/tabelas com cabeçalho fixo, ordenar/filtrar/buscar, engrenagem de
    colunas, paginação, e ações por linha ao passar o mouse (com tooltips).
  - Formulários longos em **abas**, com seções tituladas, campos rotulados à
    esquerda, toggles padronizados, e barra de ação fixa (Salvar) no rodapé.
  - Telas de detalhe (ex.: Member View) em grade de cartões consistente.
- **Robustez.** Estados vazios, loading e erro claros; confirmação em ações
  destrutivas; feedback (toasts) padronizado; responsividade.
- **Acessibilidade** mantida (foco, nomes acessíveis, navegação por teclado nas
  tabelas e abas), e a regra de BEM/sem inline Tailwind preservada.
- **Escopo.** Refatorar o shell do admin (layout, navegação, componentes de
  lista/tabela/abas/cartão reutilizáveis) e migrar as telas existentes
  (Consoles, Membros, Member View, Gamificação) para o novo padrão, deixando a
  base pronta para as próximas seções (grupos/permissões, moderação, estatísticas
  e bulk mail).
