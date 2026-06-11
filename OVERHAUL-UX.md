# Overhaul completo de UX/UI do projeto

## Requisitos obrigatórios

Antes de iniciar, carregue obrigatoriamente as seguintes skills e use-as:

/acessibilidade  
/ux-team-of-one  
/ui-design  
/shadcn  
/tailwind-patterns  
/tailwind-v4-shadcn  
/html5  
/frontend-design  
/mobile-design  
/bem  
/frontend-dev-guidelines  
/seo-audit  
/seo-fundamentals

## Objetivo

Realizar um overhaul completo de UX/UI em todo o projeto, revisando telas, fluxos, componentes, estados visuais, responsividade, acessibilidade e consistência visual.

O sistema deve passar a utilizar ShadCN como base visual e comportamental em todo o projeto, substituindo ou refatorando componentes antigos, inconsistentes ou improvisados.

Os formulários devem ser robustos e bem organizados assim como apresentado no IPB (parte admin) como referencia.

## Escopo principal

Revisar completamente o design do projeto e implementar uma experiência visual moderna, consistente, responsiva e profissional.

A revisão deve contemplar:

- Layouts gerais
- Navegação
- Menus
- Sidebar
- Header
- Cards
- Formulários
- Inputs
- Selects
- Botões
- Tabelas
- Modais
- Drawers
- Popovers
- Tooltips
- Toasts
- Alertas
- Confirmações
- Páginas vazias
- Estados de erro
- Estados de carregamento
- Estados de sucesso
- Feedbacks visuais
- Espaçamentos
- Tipografia
- Bordas
- Sombras
- Ícones
- Responsividade
- Experiência mobile

## Uso obrigatório do ShadCN

Todo o projeto deve seguir a linguagem visual e estrutural do ShadCN.

Sempre que existir um componente equivalente no ShadCN, ele deve ser utilizado como base.

Componentes customizados só devem ser criados quando realmente necessário, mantendo o mesmo padrão visual, estrutural e comportamental do ShadCN.

Todos os elementos devem manter consistência em:

- Espaçamentos
- Fontes
- Tamanhos
- Pesos tipográficos
- Bordas
- Radius
- Cores
- Estados de hover
- Estados de foco
- Estados disabled
- Ações principais e secundárias
- Comportamento de modais
- Comportamento de tabelas
- Notificações
- Popups
- Toasts
- Feedbacks de formulário

Nada deve parecer deslocado, improvisado ou visualmente incompatível com o restante do sistema.

## Direção visual

A UI deve ser moderna, limpa, elegante e com acabamento profissional.

O projeto deve priorizar uma experiência visual agradável, com boa hierarquia, bons contrastes, microinterações suaves e componentes bem posicionados.

A acessibilidade deve ser respeitada, mas não deve comprometer a qualidade visual do produto. O foco de acessibilidade deve ser nível A ou AA, mantendo o equilíbrio entre usabilidade, beleza e experiência premium.

Evite uma interface excessivamente simples, genérica ou sem personalidade. O visual importa muito neste projeto.

## Mobile first e experiência responsiva

A experiência mobile deve ser tratada como parte essencial do produto.

O sistema precisa ser fácil de navegar e utilizar em telas menores, buscando uma experiência próxima de um aplicativo nativo.

No mobile, revisar especialmente:

- Navegação principal
- Sidebar ou menu inferior
- Header compacto
- Tabelas responsivas
- Formulários
- Botões de ação
- Modais adaptados para drawer quando fizer sentido
- Espaçamentos reduzidos sem comprometer leitura
- Áreas clicáveis confortáveis
- Fluxos com poucos passos
- Feedbacks visuais claros
- Evitar excesso de rolagem horizontal
- Evitar componentes difíceis de tocar

Sempre que possível, adaptar padrões desktop para padrões mais naturais no mobile.

## Consistência de UX

Padronizar todos os fluxos de interação do sistema.

Ações semelhantes devem ter comportamentos semelhantes.

Exemplos:

- Botões primários devem representar a ação principal da tela
- Botões destrutivos devem ter padrão visual e confirmação adequada
- Modais devem seguir o mesmo padrão de título, descrição, ações e fechamento
- Toasts devem ter linguagem, duração e estilo consistentes
- Tabelas devem ter filtros, busca, paginação e ações padronizadas
- Formulários devem ter mensagens de erro claras e consistentes
- Estados vazios devem orientar o usuário sobre o próximo passo
- Estados de loading devem evitar sensação de travamento

## Acessibilidade

Aplicar boas práticas de acessibilidade sem prejudicar a qualidade visual da interface.

Garantir:

- HTML semântico
- Hierarquia correta de headings
- Labels adequadas em formulários
- Estados de foco visíveis e elegantes
- Navegação por teclado nos principais fluxos
- Contraste adequado para nível A ou AA
- Textos de apoio quando necessário
- Botões com nomes acessíveis
- Ícones decorativos tratados corretamente
- Modais, popovers e drawers com comportamento acessível
- Evitar dependência exclusiva de cor para comunicar estado

## SEO e HTML

Revisar a estrutura HTML das páginas públicas e telas relevantes.

Aplicar boas práticas de:

- HTML5 semântico
- Titles adequados
- Meta descriptions quando aplicável
- Headings organizados
- Estrutura de conteúdo clara
- Links descritivos
- Imagens com alt quando necessário
- Performance visual
- Conteúdo rastreável em páginas públicas

## Tailwind e organização visual

Utilizar Tailwind de forma consistente, evitando classes aleatórias e repetitivas sem padrão.

Criar ou reaproveitar padrões para:

- Containers
- Grids
- Cards
- Seções
- Espaçamentos
- Tipografia
- Estados visuais
- Responsividade
- Dark mode, caso exista ou seja previsto

Evitar duplicação excessiva de estilos e componentes.

## Testes

Executar teste visual em TODA página que for alterada, revisar minuciosamente as interações antes de fechar a revisão;

## Resultado esperado

Ao final do overhaul, o projeto deve apresentar:

- UI consistente em todas as telas
- Experiência moderna e profissional
- Componentes baseados em ShadCN
- Mobile bem resolvido
- Fluxos mais claros
- Melhor hierarquia visual
- Melhor usabilidade
- Acessibilidade nível A ou AA
- HTML e SEO revisados onde aplicável
- Código frontend mais organizado
- Menos inconsistência visual entre páginas
- Experiência geral mais próxima de um produto finalizado e premium

## Restrições

Não implementar soluções visuais improvisadas.

Não misturar padrões visuais diferentes.

Não criar componentes customizados quando o ShadCN já oferecer uma boa base.

Não comprometer a experiência visual com uma acessibilidade excessivamente rígida.

Não deixar telas mobile apenas como uma versão encolhida do desktop.

Não alterar regras de negócio sem necessidade.

Não remover funcionalidades existentes sem justificar tecnicamente.

## Critério de aceite

O overhaul será considerado concluído quando:

- Todas as telas principais tiverem sido revisadas
- Todos os componentes visuais estiverem padronizados
- O ShadCN estiver sendo usado como base em todo o projeto
- A experiência desktop estiver visualmente consistente
- A experiência mobile estiver fluida e próxima de app nativo
- Estados de loading, erro, sucesso e vazio estiverem tratados
- Modais, tabelas, formulários e notificações estiverem padronizados
- Acessibilidade mínima A ou AA estiver respeitada
- A estrutura HTML e SEO das páginas relevantes estiver revisada
- Não houver elementos destoando visualmente do restante do sistema