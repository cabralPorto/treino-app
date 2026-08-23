# Changelog

Todas as mudanças relevantes deste projeto são documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

## [0.5.0-beta] - 2026-08-22

### Alterado
- Plano padrão (o que aparece na primeira instalação, antes de qualquer edição) agora vem em branco: 7 dias da semana (Segunda a Domingo, incluindo Domingo pela primeira vez), cada um com um único exercício placeholder "Exercício · 3x12" para o usuário substituir. Antes vinha pré-carregado com um plano de treino real de exemplo.
- Adicionada cor própria para o card de Domingo.

## [0.4.0-beta] - 2026-08-22

### Alterado
- Cabeçalho redesenhado: emblema com ícone, rótulo "Seu plano" acima do título, divisor fino e os botões da barra de ferramentas viram chips com ícone (Exportar/Importar/Imprimir/Instalar app). Removidos a tagline e o aviso genérico "toque duas vezes em qualquer texto" — o hint de objetivo continua ativando a edição por duplo clique.
- Lista de exercícios padronizada em todos os dias: cada seção ganha um título com linha fina ao lado, e os itens de qualquer seção com mais de um exercício recebem numeração (1, 2, 3...). Seções com um único item (ex.: Aquecimento) não são numeradas.

## [0.3.0-beta] - 2026-08-22

### Corrigido
- "+ Adicionar exercício" aparecia uma vez por seção (Aquecimento/Exercícios/Cardio); agora aparece uma única vez, no fim da lista completa de cada dia.

### Removido
- Removido o registro de carga (kg) por exercício: sem mais campo de peso, histórico de sessões ou aviso de backup atrelado a esses dados. O plano volta a ser só dias, exercícios e repetições.

## [0.2.0-beta] - 2026-08-22

### Alterado
- Interface reformulada com cara de app mobile: dias da semana viram um acordeão (só um aberto por vez, todos recolhidos ao carregar).
- Removido o modo global "Editar/Salvar/Cancelar". Título, objetivo, nome do dia e nome/reps de cada exercício agora são editados direto na linha, com duplo clique, e salvam automaticamente ao sair do campo (Enter confirma, Esc cancela).
- "+ Adicionar exercício" passa a ficar sempre visível no fim de cada lista, em vez de escondido atrás do modo de edição.
- Botão de excluir exercício modernizado: quadrado pequeno, cantos arredondados, cor suave, ícone de lixeira — só aparece durante a edição da linha.
- Campo de carga (kg) padronizado visualmente com os demais campos.
- Impressão continua mostrando todos os dias expandidos, independente do que está aberto na tela.

## [0.1.0-beta] - 2026-08-22

### Adicionado
- Primeira versão beta pública do Plano de Treino.
- PWA instalável (manifest + service worker com cache do app shell).
- Plano de treino semanal editável (dias, seções, exercícios).
- Registro de carga (kg) por exercício, com upsert por dia e histórico das últimas sessões.
- Exportar/Importar plano em JSON, com upgrade automático de arquivos no formato antigo.
- Cabeçalho genérico (título e objetivo neutros, editáveis por qualquer usuário).
- Modo claro/escuro automático (`prefers-color-scheme`).
- Botão nativo de instalação (evento `beforeinstallprompt`).
- Aviso de backup quando faz tempo que não há uma exportação.
- Content Security Policy restritiva; validação de tamanho e limites sãos no import de JSON; tratamento de falha ao salvar no `localStorage`.
- Páginas de Privacidade e Termos de Uso.
- Testes automatizados (`node --test`) para a lógica de dados, e CI no GitHub Actions.
