# Lição Aprendida #01

## Título
Autenticação Hardcoded em Múltiplos Endpoints

---

## Contexto
- **Funcionalidade afetada:** Sistema de autenticação e autorização de usuários
- **Área:** Backend - Autenticação
- **Momento do surgimento:** Desde a criação inicial do projeto. O problema foi herdado da arquitetura original e se propagou para múltiplos endpoints sem revisão.

---

## Problema Identificado
Lista `AUTHORIZED_USERS` com usuários e PINs hardcoded no código Python foi utilizada em múltiplos lugares:
1. Endpoint de login (`/auth/check-name`)
2. Endpoint de criar palpites (`/predictions`)
3. Endpoint de listar usuários no admin (`/admin/users`)

Usuários criados pelo Painel Admin eram salvos no MongoDB, mas a validação continuava consultando a lista hardcoded, causando bloqueio de acesso.

---

## Causa Raiz

### Técnica
- Validação de usuário duplicada: uma no código (hardcoded) e outra no banco (MongoDB)
- Ausência de função centralizada de validação de usuário

### Arquitetural
- Inexistência de camada de serviço de autenticação
- Código de validação copiado/colado em múltiplos endpoints sem abstração

### De Processo
- Correções pontuais sem análise de impacto sistêmico
- Ausência de busca global por padrões problemáticos após identificação inicial

---

## Por que não foi identificado antes

### Suposição feita
- Ao corrigir o endpoint de login, assumiu-se que era o único local com a validação hardcoded

### Onde a análise falhou
- Não foi executado `grep -rn "AUTHORIZED_USERS"` para identificar TODAS as ocorrências
- Correção foi reativa (apenas no endpoint reportado) ao invés de sistêmica

### O que não foi questionado
- "Existem outros endpoints que validam usuários?"
- "Existe uma função centralizada de autenticação?"

---

## Impacto

### Técnico
- Inconsistência entre dados do banco e validação do código
- Necessidade de múltiplas correções para o mesmo problema

### Operacional
- Retrabalho: problema corrigido 2 vezes (login, depois palpites)
- Consumo adicional de créditos do cliente

### Produto/usuário
- Usuários criados pelo Admin não conseguiam fazer login
- Usuários não conseguiam fazer palpites
- Frustração e perda de confiança no sistema

---

## Solução Aplicada
1. Lista `AUTHORIZED_USERS` removida completamente do código
2. Todos os endpoints agora consultam exclusivamente o MongoDB
3. Verificação via `grep -rn "AUTHORIZED_USERS"` confirma remoção total

---

## Melhoria Estrutural Recomendada
1. Criar `AuthService` centralizado com método único `validate_user(username)`
2. Todos os endpoints devem usar este serviço, nunca validação direta
3. Implementar middleware de autenticação no FastAPI
4. Criar testes automatizados que validem autenticação com usuários do banco

---

## Ação Preventiva
- [ ] Checklist obrigatório antes de deploy: `grep -rn "hardcoded\|AUTHORIZED" /app/backend/`
- [ ] Code review deve verificar se novas validações usam serviço centralizado
- [ ] Teste de integração: criar usuário via Admin → fazer login → fazer palpite

---

## Status
**Corrigida** - Lista removida, mas melhoria estrutural (AuthService) ainda não implementada

