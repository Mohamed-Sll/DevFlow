# DevFlow — plano de implementação

Este ficheiro acompanha as melhorias da aplicação web local-first. O estado reflete apenas trabalho confirmado no repositório; não implica que um fluxo tenha sido validado visualmente sem o abrir.

## Decisões de escopo

- **Confirmado:** a aplicação web é o produto principal e guarda os dados localmente no IndexedDB do browser.
- **Confirmado:** investimentos permanecem separados do fluxo de caixa operacional.
- **Confirmado:** não adicionar contas, sincronização cloud ou funcionalidades de equipa sem decisão explícita.
- **Confirmado:** a aplicação desktop Python/Supabase é um produto separado; não será alterada neste plano.
- **Confirmado:** cópias JSON e ficheiros exportados são responsabilidade do utilizador. Os testes não devem substituir nem alterar dados reais.
- **Confirmado:** manter o trabalho local já existente e não fazer commit, push, merge ou deploy.

## Fase 0 — Contexto e preservação

**Objetivo:** compreender a versão atual e distinguir o trabalho já presente de novas alterações.

| Tarefa | Estado |
|---|---|
| Ler README, DESIGN_SYSTEM e documentação de arquitetura e dados | Concluída |
| Registar branch e diff preexistente antes de editar | Concluída |
| Confirmar fluxos e problemas no código antes de os tratar como tarefas | Concluída |

**Critério de conclusão:** cada melhoria implementada está ligada a evidência no código e o diff anterior permanece preservado.

**Verificações:** `git status`, inspeção dos ficheiros e documentação.

**Risco/limite:** a aplicação só ficou acessível pelo endereço da rede local do computador; a validação visual foi feita nessa instância de desenvolvimento.

## Fase 1 — Integridade de dados e cálculos

**Objetivo:** evitar que entradas inválidas ou estados financeiros misturados corrompam os registos e totais.

| Tarefa | Estado |
|---|---|
| Aplicar na criação de projetos a validação não negativa já aplicada na edição; validar limites e números finitos também no serviço | Concluída |
| Rejeitar metas negativas de investimento e validar datas/vencimentos nas mutações de finanças | Concluída |
| Impedir que registar/remover uma receita transforme o estado de entrega do projeto em estado de pagamento ou apague estados como `em_andamento`/`concluido`; preservar compatibilidade | Concluída |
| Manter o saldo operacional separado de aportes e movimentos de investimento | Concluída |
| Acrescentar testes de regressão para validações e transições de estado | Concluída |

**Áreas prováveis:** `web/src/lib/data/index.ts`, tipos e páginas de projetos/finanças/investimentos.

**Critérios:** valores inválidos são recusados na camada de dados; receber/remover pagamento não apaga o estado operacional do projeto; totais continuam coerentes com os registos.

**Risco/decisão:** o modelo atual usa `projetos.status` tanto para pagamento (`pago`, `pago_parcial`) como para execução (`em_andamento`, `concluido`). Será preservada a compatibilidade sem migração destrutiva; uma separação completa exige decisão de produto e migração explícita.

## Fase 2 — Edição, remoção e recuperação de registos

**Objetivo:** permitir corrigir erros do dia a dia sem perder dados relacionados.

| Tarefa | Estado |
|---|---|
| Mapear edição e exclusão existentes para projetos, receitas, gastos, investimentos, movimentos e sessões | Concluída |
| Fechar lacunas de edição em gastos, receitas, ativos e movimentos de investimento, com validação nas funções de dados | Concluída |
| Adicionar edição de sessões do timer e testar transações de atualização financeira com IndexedDB | Por fazer |

**Critérios:** registos editáveis relevantes podem ser corrigidos; exclusões mantêm consistência e comunicam claramente o impacto.

## Fase 3 — Recorrências

**Objetivo:** mostrar compromissos recorrentes de forma compreensível, sem registar cobranças fictícias.

| Tarefa | Estado |
|---|---|
| Corrigir o indicador de compromisso recorrente: mostrar contagem, sem somar históricos como previsão mensal | Concluída |
| Distinguir previsão de despesa efetivamente registada; não gerar ocorrências automaticamente sem regra já definida | Concluída — interface e README explicam que não há lançamentos automáticos |
| Testar vencimentos, virada de mês e dias de vencimento inexistentes (ex.: dia 31 em fevereiro) | Concluída — datas com dia 31 são ajustadas ao último dia válido, incluindo anos bissextos |

**Risco/decisão:** o esquema atual guarda a recorrência na própria despesa e não define modelo de série/ocorrências. Geração automática de lançamentos permanece fora do escopo sem decisão explícita.

## Fase 4 — Cópias de segurança e restauro

**Objetivo:** proteger os dados locais e evitar restaurar ficheiros incompletos ou incoerentes.

| Tarefa | Estado |
|---|---|
| Validar tipos, datas, montantes, campos necessários e relações entre tabelas antes de substituir os dados locais | Concluída |
| Garantir que um restauro inválido não altera nenhuma tabela (validação prévia; escrita em transação integral) | Concluída; teste de integração da transação ainda pendente |
| Testar cópias válidas, datas/valores inválidos, IDs repetidos e referências órfãs | Concluída |
| Confirmar que a interface explica a substituição e pede confirmação antes do restauro | Concluída — diálogo de confirmação preexistente foi preservado |

**Áreas prováveis:** `web/src/lib/data/backup.ts`, `web/src/pages/config-page.tsx`.

## Fase 5 — Exportações e importação de ficheiros

**Objetivo:** fazer os dados locais úteis fora da aplicação e identificar claramente o conteúdo exportado.

| Tarefa | Estado |
|---|---|
| Conferir CSV para Excel (acentos, separadores, decimais e proteção contra fórmulas) | Concluída — testes automatizados cobrem BOM, separadores locais e texto de fórmula |
| Conferir folhas XLSX, valores numéricos e consistência com filtros/períodos selecionados | Concluída — o teste abre o ficheiro gerado e confirma folhas e separação patrimonial |
| Completar Excel/PDF com sessões e abas de investimentos separadas do saldo operacional | Concluída; ficheiros gerados não foram abertos visualmente nesta sessão |
| Avaliar importação CSV/XLSX com pré-visualização/validação | Concluída — não foi adicionada: backup JSON já cobre recuperação integral, e não se confirmou fluxo concreto de importação tabular |
| Acrescentar testes para conteúdo exportado e valores perigosos | Concluída — CSV, PDF e conteúdo/abas XLSX têm verificações automatizadas |

**Nota:** já há alterações locais de exportação; serão auditadas e preservadas antes de qualquer ajuste.

## Fase 6 — Offline e armazenamento local

**Objetivo:** garantir que a aplicação abre sem rede depois de instalada/carregada e deixa claro onde os dados residem.

| Tarefa | Estado |
|---|---|
| Verificar instalação/atualização do service worker, precache do shell/assets, fallback e limpeza de caches antigos | Em curso — código revisto e sintaxe validada; teste real offline pendente |
| Corrigir cache offline e remoção das versões antigas | Concluída no código; falta confirmar offline em origem segura de produção |
| Rever comportamento de IndexedDB indisponível/cheio e mensagens de erro | Em curso — camada de armazenamento inspecionada; falta simular quota/indisponibilidade no browser |
| Confirmar que rotas de dados/exportações não são cacheadas | Concluída por inspeção: só GET same-origin de assets são elegíveis |

**Área provável:** `web/public/sw.js`, `web/src/lib/browser-storage.ts`, inicialização da aplicação.

## Fase 7 — Mobile, acessibilidade e experiência

**Objetivo:** manter os fluxos essenciais utilizáveis em ecrãs pequenos e com teclado/leitor de ecrã.

| Tarefa | Estado |
|---|---|
| Rever dashboard, projetos, finanças, investimentos, timer e definições em larguras pequenas | Em curso — todas as páginas principais abertas em desktop; definições e lançamentos financeiros conferidos em 360 px nos temas escuro e claro |
| Substituir tabelas impraticáveis por apresentação responsiva sem perder campos nem ações | Por fazer |
| Rever foco, nomes acessíveis, contraste, mensagens de erro e estados vazios/carregamento | Em curso — estados vazios e nomes dos controlos conferidos nas páginas principais; falta percorrer formulários completos com teclado/leitor de ecrã |
| Verificar navegação por teclado e redução de movimento | Por fazer |

**Critério:** fluxos principais funcionam em 360/390 px, tablet e desktop sem controlos cortados nem scroll horizontal da página.

## Fase 8 — Testes, desempenho e manutenção

**Objetivo:** validar os fluxos e manter o código/documentação alinhados com o produto web real.

| Tarefa | Estado |
|---|---|
| Criar/ajustar testes de regressão para cálculos, backup, CSV, PDF, XLSX e recorrências | Concluída — 103 testes automatizados; testes de transações CRUD com IndexedDB ainda pendentes |
| Rever carregamentos repetidos e atualizações demasiado frequentes sem sacrificar reatividade dos dados | Por fazer |
| Corrigir o atalho de navegação `g` seguido de tecla e ignorar campos editáveis | Concluída por inspeção e lint/typecheck; teste automatizado do hook pendente |
| Atualizar arquitetura, armazenamento, recorrências, timer, exportações e limitações na documentação | Concluída |
| Executar testes, lint, typecheck e build; registar resultados e limitações | Em curso — 103 testes, lint e typecheck passaram; build padrão falha porque falta o binding opcional Lightning CSS nesta instalação do Windows |
| Abrir e verificar visualmente os fluxos reais acessíveis | Em curso — dashboard, projetos, finanças, investimentos, timer e definições abertos; 360 px validado em definições e lançamentos financeiros. Tablet, restantes rotas em mobile e comportamento offline ainda sem confirmação visual |

**Critério final:** documentação descreve a aplicação real; verificações são executadas e reportadas sem declarar como visualmente verificado o que não foi aberto.

## Registo de execução

| Data | Fase | Resultado |
|---|---|---|
| 2026-11-25 | Fase 0 | Documentação, camada de dados, backup, service worker e exportações inspecionados; branch atual `chore/portfolio-review`; alterações preexistentes preservadas. |
| 2026-11-25 | Fases 1–8 | Validações financeiras, edição de gastos/receitas/investimentos/movimentos, taxa horária guardada por sessão, validação de restauro, relatórios ampliados, service worker versionado, atalho de navegação e documentação atualizados. 103 testes, lint, typecheck e build sem minificação passaram. |
| 2026-11-25 | Validação visual | Browser abriu dashboard, projetos, finanças, investimentos, timer e definições. Em 360 px, definições e lançamentos financeiros cabem na largura sem overflow da página; o seletor de secções rola horizontalmente dentro da própria barra. Tema claro e escuro foram conferidos nas definições. Não se criaram nem alteraram registos. |
| 2026-11-25 | Verificações pendentes | O build normal continua dependente do binding opcional Lightning CSS, ausente em `node_modules`; a tentativa de reparar a instalação não concluiu por indisponibilidade do registry nesta sessão. Falta teste offline em HTTPS/origem segura, tablet, restantes rotas em 360/390 px, leitor de ecrã/quota IndexedDB e transações IndexedDB automatizadas. |
