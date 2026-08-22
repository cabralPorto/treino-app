# Changelog

Todas as mudanças relevantes deste projeto são documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

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
