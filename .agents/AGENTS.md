# Workspace Rules for MeuSalao

## Mandatory Approval for Modifications (Aprovação Obrigatória)
- O agente NUNCA deve aplicar alterações de código, editar/criar arquivos ou executar comandos modificadores sem antes apresentar a proposta detalhada no chat e aguardar a aprovação explícita do usuário (ex: "aprovo", "pode aplicar", "ok").
- Antes de qualquer alteração, explique o que será modificado e pare a execução para aguardar a resposta do usuário.
- Mesmo que o sistema sinalize auto-aprovação de artefatos ou planos, ignore a auto-aprovação e sempre solicite e aguarde o consentimento explícito do usuário antes de tocar nos arquivos.

## Automatic Git Commits & Deploy
- Realize commits automáticos com mensagens descritivas em português ou convenção Conventional Commits (ex: `feat: ...`, `fix: ...`, `refactor: ...`) sempre que uma funcionalidade, ajuste ou correção for concluída e validada.
- Após o commit, execute o `git push origin main` para acionar o deploy automático na Vercel.
