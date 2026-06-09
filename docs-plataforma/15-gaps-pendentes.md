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
    (substituindo os checks espalhados em código). Item grande. STATUS: a tela
    de Grupos (lista de papéis + formulário de permissões em abas, persistido em
    `role_permissions`) já foi entregue; falta o enforcement das flags.
- **Promoção de grupos (auto-promoção por critérios, detalhado do AdminCP).**
  Regras que movem o membro de papel automaticamente quando ele atende a
  critérios. Lista de regras (ordem importa: a última regra cujo critério bate é
  a aplicada) + "Criar nova". Cada regra:
  - **Detalhes**: nome (obrigatório), ativada (toggle).
  - **Filtros (critérios)** adaptados ao nosso cenário: pontos de conquista /
    reputação (qualquer / comparação >=, <=, entre), filtrar por badge(s),
    filtrar por rank, banido/suspenso (qualquer/sim/não), contagem de conteúdo
    (guias + comentários), papel atual (em quais papéis a regra se aplica),
    entrou (qualquer / entre datas / há mais de X dias / há menos de X dias),
    último post e última visita (mesmo padrão; dependem de registrar
    presença/`lastSeenAt`), marcado como spammer (qualquer/sim/não). NÃO se
    aplica: assinatura de bulk mail, "expert da comunidade", membro do dia,
    sobre mim, referrals, blog/events/quests/courses/gallery, doações.
  - **Ações**: mover para o papel (não mudar / [papel]). Grupos secundários
    (adicionar/remover) NÃO se aplica (papel único).
  - **Execução**: avaliar as regras periodicamente (cron) e/ou em eventos
    (ao ganhar reputação/badge, ao publicar). Respeitar a flag "ignorar
    promoção" do papel (das configurações de grupo).
- **Ferramentas de IP (detalhado do AdminCP).** Tela forense por IP. Depende de
  uma infra que ainda não existe: **registrar os IPs** por login/ação. Hoje só
  guardamos um hash de IP em `article_views` (views únicas) e o `audit_log` não
  grava IP. Pré-requisito: uma tabela de eventos de IP (ou colunas de IP nos
  registros relevantes) com user-agent e timestamp, e enriquecimento de
  geolocalização (provedor externo).
  - **Busca por IP** (com curinga `*`, ex.: `127.0.*`): lista os membros/eventos
    que usaram aquele IP.
  - **Busca por membro** (autocomplete por nome): lista todos os IPs que o membro
    usou. Tabela: IP, localização estimada (geo), nº de usos, primeiro uso,
    último uso; ordenar/buscar; ação "Ver usos".
  - **Detalhe do IP**: "Informações associadas ao IP" — contadores por tipo de
    evento ligados àquele IP (logins de admin, logs de admin, logins de
    dispositivo, histórico do membro, registros, logs de defesa de spam, posts,
    etc.) e a geolocalização. Adaptar ao nosso conjunto de eventos (sem
    Blogs/Events/Downloads/Commerce do IPB).
  - **Privacidade/LGPD (crítico).** IP é dado pessoal. Definir retenção (expurgo
    após N dias), acesso só por admin, e o uso no fluxo de exclusão de dados
    (PII). Considerar guardar IP truncado/anonimizado fora do necessário para
    moderação. Liga com Dispositivos & IPs do Member View e com as solicitações
    de exclusão (LGPD).
- **Solicitações de exclusão (LGPD/PII).** Fluxo para o usuário pedir exclusão da
  conta e dos dados, e o admin processar; e o "baixar dados pessoais" do Account
  Actions.

Gamificação (conquistas):

- **Regras (motor When/Then, detalhado do AdminCP).** Hoje a concessão de pontos
  e badges é fixa em `evaluateBadges`. O alvo é um motor configurável de regras,
  no estilo do IPB: cada regra é "Quando [gatilho] (e [condições]) Então
  [recompensas por destinatário]". Disparam toda vez que o gatilho acontece.
  - **Lista de regras.** Cada linha mostra o gatilho em texto natural (ex.:
    "Comentário publicado", "Comentário publicado é o 1º/10º/500º do usuário",
    "Item de conteúdo seguido", "Reação dada"), a recompensa (X pontos + badge
    opcional) e o destinatário ("para quem publicou", "para quem foi seguido",
    "para quem recebeu a reação"). Ações por linha: Editar, Copiar, Excluir,
    Pausar. Botões: Exportar, Importar, Criar nova.
  - **Editor (Quando / Então).**
    - **Quando (gatilho).** Lista adaptada ao que temos: comentário publicado,
      guia/conteúdo publicado, item de conteúdo seguido, membro seguido (se
      houver follow de usuário), reação/voto dado, conteúdo destacado por
      reputação, login do dia, perfil completado. NÃO se aplica: cursos,
      downloads, clubs, doações, produtos, eventos/RSVP, polls, reviews, blog.
    - **Condições (opcionais, em E).** Marco/milestone: "é o Nº tal" (1º, 10º,
      500º). Local: "é um [comentário de guia/console/...]". (Filtros de fórum/
      categoria do IPB viram, no nosso caso, filtro por console/seção, se fizer
      sentido.) Condição de quest: não se aplica.
    - **Então (recompensas).** Um bloco por destinatário possível do gatilho
      (ex.: "para quem publicou": X pontos + badge; "para quem recebeu a
      reação": X pontos + badge). Pontos alimentam a reputação que move os ranks.
  - **Persistência e execução.** Tabela de regras (gatilho, condições JSON,
    recompensas JSON, ativa/pausada, ordem) + tabela de progresso por usuário
    para os milestones (contagem de comentários, etc.). Um despachante único é
    chamado nos eventos (publicar comentário/guia, seguir, reagir, login) e
    avalia as regras do gatilho. Substitui o `evaluateBadges` fixo, reusando o
    catálogo de badges e o award já existentes. Export/Import em JSON.
  - **Nota de esforço.** Item grande (motor de regras + editor visual +
    progresso por usuário). Dá para entregar em fases: começar com os gatilhos
    que já disparamos hoje (comentário, guia, reação, login) e os milestones
    simples, depois ampliar gatilhos e condições.
- **Ranks (detalhado do AdminCP).** Hoje os 13 níveis estão fixos em
  `src/lib/ranks.ts`. Tornar editáveis via tabela `ranks` + tela de admin.
  - **Lista**: ícone, nome, nº de membros no rank, limiar de pontos; busca;
    ações por linha Editar/Copiar/Excluir; Exportar/Importar/Criar nova.
  - **Editor**: Título (obrigatório), Nº de pontos (obrigatório), "Criar imagem
    custom" (toggle) + upload de imagem (liga ao Bunny; por enquanto, ícone do
    conjunto lucide como hoje). Ranks são alcançados por pontos (reputação); o
    texto remete às Regras de conquista para os critérios.
  - Migrar `rankForReputation`/`rankTiers` para ler da tabela (com os 13 atuais
    como seed), mantendo a API usada no perfil e no Member View.
- **Badges (detalhado do AdminCP).** Catálogo de conquistas, decoplado das
  regras: cria-se a badge (metadados) e ela fica disponível para ser atribuída
  numa Regra de conquista (automática) ou concedida manualmente. Já temos a
  tabela `badges` + `user_badges`.
  - **Lista**: ícone (com nº de marco sobreposto, quando aplicável), nome, nº de
    membros; busca; ações por linha Editar/Copiar/Excluir; Exportar/Importar/
    Criar nova.
  - **Editor**: Nome (obrigatório), imagem custom (upload; por enquanto ícone
    lucide), "Concedível manualmente" (toggle: pode ser dada por moderador ao
    reconhecer conteúdo ou pelo AdminCP).
  - Tornar o catálogo totalmente editável: `ensureCatalog` passa a semear só uma
    vez (tabela vazia), para que edições/exclusões do admin persistam. Badges
    novas aparecem automaticamente no seletor das Regras.
- **Configurações (detalhado do AdminCP).** Página de configurações da
  gamificação, gravada numa tabela genérica `app_settings` (chave/valor JSON).
  - **Ativado**: quando off, badges/ranks não são exibidos e as Regras não
    processam. Aplica no `runTrigger` (não processa) e, idealmente, na exibição.
  - **Badge "rara"**: marcar como rara se conquistada por menos de X% dos
    membros (ou nunca). Display.
  - **Excluir papéis**: membros nesses papéis não ganham pontos/badges/ranks.
    Aplica no `runTrigger` (pula ator/alvo com papel excluído).
  - **Reconstruir conquistas**: recalcula tudo (já temos `recalcAllBadges`).
  - NÃO se aplica por ora: "limpar log de atividade após N dias" (não temos um
    log de pontos por ação; os marcos são contados dos dados e as badges são
    idempotentes) e "limitar pontos manuais por conteúdo reconhecido por dia"
    (não há o recurso de pontuar conteúdo reconhecido). Anotar para o futuro.
- **Quests (missões, detalhado do AdminCP).** Missão = conjunto de tarefas; cada
  tarefa se liga a uma Regra de conquista (completar a ação da regra completa a
  tarefa). Ao completar a missão, concede a recompensa (badge). Constrói sobre o
  motor de Regras já feito.
  - **Lista**: reordenar, título, ativada/desativada, ações (adicionar tarefa,
    editar, excluir, ver participantes), criar nova.
  - **Editor da missão**: título, descrição, imagem de capa (Bunny), datas
    (entre X e Y), público-alvo (papéis ou todos), permitir opt-out, método de
    pontuação (todas as tarefas / mínimo de pontos), exigir aprovação, regras
    retroativas (marcar tarefas já cumpridas), tipo de recompensa (badge/outro).
  - **Tarefa**: título, descrição, link opcional, tipo (usar regra existente /
    escanear QR code), regra associada.
  - **Participantes**: tabela membro/status/progresso + adicionar manualmente.
  - STATUS (fase 1 entregue): tabelas `quests`/`quest_tasks`/
    `quest_task_completions`/`quest_completions`; CRUD de missão e tarefas
    (ligadas a regras); conclusão automática (tarefa completa quando a regra
    dispara no `runTrigger`; missão completa → badge); página pública `/missoes`
    com progresso. FASE 2 (pendente): QR code, exigir aprovação, pontuação por
    mínimo de pontos, participantes manuais, datas, público-alvo por papel,
    opt-out, regras retroativas, imagem de capa.

Configurações de membros:

- **Campos de perfil.** STATUS: entregue (aba **Campos de perfil** de
  `/admin/perfis`). Grupos + campos customizados (tipos: texto, texto longo,
  editor, URL, número, data, seleção, opção única, múltipla escolha, sim/não,
  cor), com obrigatoriedade, tamanho máx., regex, visibilidade (não exibir /
  equipe / equipe e o próprio / todos), "membro pode editar", "mostrar no
  cadastro" e flag de dado pessoal. Membro preenche em `/conta?secao=perfil`;
  exibido em `/u/[handle]` respeitando a visibilidade. Tabelas
  `profile_field_groups` / `profile_fields` / `profile_field_values`. Também
  entregue a aba **Configurações** (tamanho do nome de exibição, ligado ao
  `updateDisplayNameAction`).
  O **"mostrar no cadastro"** está ligado: os campos marcados aparecem no
  formulário de cadastro (`/auth/cadastrar`), são validados antes de criar a
  conta e salvos no novo usuário.
  FALTA (adiado): aba **Conclusão de perfil** (etapas pós-cadastro) e aba
  **Galeria de fotos**. N/A no RetroWiki (sem a feature-base): assinaturas,
  aniversários, prune de conversas, ignorar membros, formatação de grupo.
- **Reputação e reações.** STATUS: entregue (`/admin/reputacao`, 4 abas).
  **Configurações**: ativa, papéis excluídos, reagir ao próprio conteúdo, mostrar
  reputação no perfil (gate verificado), limiar de destaque, modo de exibição.
  **Reações**: tipos configuráveis (nome, emoji, peso +1/0/-1, ativa) com CRUD e
  auto-seed (Curtir/Valeu/Top/Haha/Uau); o voto único "Útil" virou um **seletor
  multi-reação** nos guias (`votes.reaction_id`); reação positiva concede
  reputação pela regra `reaction.given` (preserva badges/quests/rank-up), neutra
  é só sentimento, negativa subtrai 1. **Leaderboard**: página pública
  `/leaderboard` (destaques de hoje por reputação recebida no fuso configurado,
  guias em alta, top membros) + aba de config (ativo, grupos excluídos, fuso).
  **Níveis de reputação**: tabela `reputation_levels` + CRUD + rótulo no perfil
  ao lado do total (distinto dos Ranks, aceita faixas negativas). Tudo verificado
  no navegador.
- **Notificações.** STATUS: entregue (`/admin/notificacoes`). Categorias do
  RetroWiki (Conquistas, Respostas e menções, Moderação do seu conteúdo) mapeando
  os tipos granulares (badge/rank/quest/promoção, comment.reply/quote,
  article.approved/rejected/changes). Por categoria: "membro pode editar" +
  default por canal (sino e e-mail: ligado/desligado/desabilitado). O
  `createNotification` agora respeita o gate (default do admin + preferência do
  membro) — inclusive as notificações de comentário e moderação foram roteadas
  por ele. Botão **redefinir todos os membros** (apaga `notification_prefs`).
  Página do membro em `/conta?secao=notificacoes`. Verificado: badge concedida
  com a categoria desabilitada não notifica; reabilitada, notifica; preferência
  do membro suprime para ele. **Push N/A** (sem app). **E-mail** é só
  configuração: o envio de e-mail de notificação/digest segue adiado (cron já
  preparado em outro item).
- **Banimentos.** STATUS: entregue (`/admin/banimentos`). Filtros por **e-mail,
  IP ou nome de usuário**, com conteúdo aceitando curinga `*` e motivo (tabela
  `ban_filters`). Admin adiciona/remove pelo dialog. Enforcement no **cadastro**
  (e-mail + IP + nome) e no **login** (e-mail + IP, no `authorize`), via
  `isBanned`/`checkBan` com match por curinga. Verificado: filtro `*@dominio`
  bloqueia o cadastro ("Cadastro não permitido.", conta não criada); e-mail fora
  do filtro cadastra normal.

Moderação de conteúdo:

- **Denúncias.** STATUS: entregue (`/admin/denuncias`). Membros denunciam guias
  e comentários (botão "Denunciar" → motivo + mensagem); fila para a equipe com
  resolver **Remover conteúdo** (oculta: artigo→archived, comentário→hidden) ou
  **Arquivar**; tipos de denúncia configuráveis (`report_types`, seed
  Ofensivo/Spam/Off-topic) com textos de e-mail ao autor por decisão (enviados
  via Resend, tags {name}/{reason}); configurações: mensagem obrigatória, ativar
  moderação automática + limiar de denunciantes únicos para ocultar. O autor
  recebe notificação no sino ao resolver. Tabelas `report_types` /
  `content_reports`. Verificado: denunciar → auto-ocultar (limiar) → fila →
  resolver → autor notificado.
  ADIADO/N-A: regras de auto-moderação por critério de autor (lista estilo
  Promoções, reaproveita o motor de critérios), e denúncia por convidado
  (RetroWiki exige login).
- **Prevenção de spam.** STATUS: entregue (`/admin/spam`, 3 abas adaptadas).
  **RetroGuard:** dificuldade do proof-of-work configurável (ligada ao
  `/api/captcha`, verificado ao vivo) + ações ao marcar spammer. **Pergunta &
  Resposta:** CRUD de perguntas (`spam_questions`); se houver perguntas, uma é
  exibida e exigida no cadastro (verificado: resposta errada bloqueia, certa
  cadastra). **Geolocalização:** regras por país (`geo_rules`, sinalizar=criar
  suspenso ou bloquear) aplicadas no cadastro via `countryCodeForIp`. **Marcar
  como spammer:** botão no Member View aplica as ações configuradas (suspender,
  ocultar conteúdo do autor, banir e-mail). N-A no RetroWiki: CAPTCHAs de
  terceiros (Turnstile/reCAPTCHA/hCaptcha — substituídos pelo RetroGuard),
  Spam Defense externo (StopForumSpam-like) + logs + whitelist, e "Delete Guest
  Content" (sem conteúdo de convidado).
- **Avisos (warnings).** STATUS: entregue (`/admin/avisos`, 3 abas). **Motivos**
  (`warning_reasons`, seed Spam/Linguagem/Abusivo/Off-topic) com pontos, expiração
  opcional, dedução de reputação e nota padrão. **Ações** (`warning_actions`):
  ao atingir N pontos ativos, restringe postagem e/ou bane (por horas ou
  indefinido). **Configurações:** ativar, grupos que não podem ser advertidos,
  membros veem os próprios, exigir confirmação. Ferramenta **Advertir** no Member
  View (registra `user_warnings`, deduz reputação, aplica a ação). Enforcement:
  `users.posting_restricted_until` bloqueia comentar e submeter guia; ban →
  `is_suspended`. Verificado: advertência de 3 pts disparou a ação (restrição
  indefinida) e o membro restrito foi bloqueado ao comentar. ADIADO: "moderate
  content" (forçar revisão), confirmação obrigatória (must-acknowledge) e a
  página do membro ver os próprios avisos (hoje só no Member View do admin).
- **Atribuições.** STATUS: entregue (`/admin/atribuicoes`, 3 abas). **Equipes**
  de moderação (`mod_teams`/`mod_team_members`) com CRUD (nome + moderadores).
  **Atribuir** um guia a um moderador ou equipe pelo botão na página do guia
  (mod-only); a fila lista as abertas, com fechar. **Configurações:** ativar +
  fechar automaticamente após N dias (armazenado; o job de auto-fechar fica para
  o cron). Tabela `assignments`. Verificado: criar equipe, atribuir guia à
  equipe, listar e fechar. N-A (específico de fórum do IPB): "time to first
  reply", aplicar a todos os fóruns, atribuir tópicos (RetroWiki atribui guias).

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
