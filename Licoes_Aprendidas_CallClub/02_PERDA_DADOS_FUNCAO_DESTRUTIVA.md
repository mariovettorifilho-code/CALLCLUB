# Lição Aprendida #02

## Título
Perda de Dados por Função Destrutiva Sem Escopo Definido

---

## Contexto
- **Funcionalidade afetada:** Botão "Zerar Estatísticas" no Painel Admin
- **Área:** Backend - Gerenciamento de Dados
- **Momento do surgimento:** Durante implementação de funcionalidade para limpar dados do campeonato Carioca que havia sido removido

---

## Problema Identificado
O endpoint `reset-user-stats` foi implementado para deletar TODOS os palpites de TODOS os usuários globalmente, sem opção de escopo (individual, por campeonato, etc.).

Quando o cliente testou a funcionalidade no preview, todos os palpites das rodadas 1 e 2 foram perdidos permanentemente.

---

## Causa Raiz

### Técnica
- Função com comportamento destrutivo (`delete_many({})`) sem filtros
- Ausência de parâmetro de escopo (username, championship_id)
- Sem confirmação dupla ou soft-delete

### Arquitetural
- Operações destrutivas no mesmo nível de operações comuns
- Ausência de camada de proteção para dados críticos
- Sem backup automático antes de operações destrutivas

### De Processo
- Implementação focou no "o que fazer" sem considerar "o que proteger"
- Requisito do cliente era limpar dados específicos (Carioca), mas implementação foi genérica

---

## Por que não foi identificado antes

### Suposição feita
- Cliente usaria a funcionalidade apenas na produção, após validação
- Preview e produção seriam tratados com o mesmo cuidado

### Onde a análise falhou
- Não foi considerado que o preview continha dados reais/importantes para testes
- Não foi questionado: "E se o cliente clicar acidentalmente?"

### O que não foi questionado
- "Qual o escopo real da operação de limpeza?"
- "Deveria haver opção de limpeza individual vs. global?"
- "Existe forma de reverter a operação?"

---

## Impacto

### Técnico
- Dados de palpites perdidos permanentemente no preview
- Necessidade de reimportação/recriação manual dos dados

### Operacional
- Tempo gasto para restaurar dados da produção para o preview
- Necessidade de criar sincronização entre ambientes

### Produto/usuário
- Perda de dados de teste
- Frustração do cliente com retrabalho
- Perda de confiança na ferramenta administrativa

---

## Solução Aplicada
1. Endpoint modificado para aceitar parâmetro `username` (opcional)
2. Se `username` informado: limpa apenas dados daquele usuário
3. Se `username` não informado: requer DUAS confirmações no frontend
4. Dados restaurados da produção para o preview

---

## Melhoria Estrutural Recomendada
1. **Soft-delete por padrão:** Marcar registros como deletados ao invés de remover fisicamente
2. **Período de retenção:** Dados "deletados" ficam 30 dias antes de remoção física
3. **Backup automático:** Antes de operações destrutivas, criar snapshot
4. **Audit log:** Registrar quem executou operações destrutivas e quando
5. **Separar endpoints:** `/admin/reset-user/{username}` vs `/admin/reset-all` (com proteção extra)

---

## Ação Preventiva
- [ ] Operações destrutivas SEMPRE devem ter parâmetro de escopo
- [ ] Implementar soft-delete para entidades críticas (users, predictions)
- [ ] Adicionar campo `deleted_at` em vez de remoção física
- [ ] Confirmação dupla obrigatória para operações que afetam múltiplos registros
- [ ] Log de auditoria para todas as operações administrativas

---

## Status
**Corrigida** - Escopo individual implementado, mas soft-delete e backup automático ainda não implementados

