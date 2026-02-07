# Lição Aprendida #04

## Título
Estatísticas do Perfil Calculadas de Subset Incorreto

---

## Contexto
- **Funcionalidade afetada:** Página de Perfil do usuário - estatísticas
- **Área:** Backend - Endpoint `/user/{username}`
- **Momento do surgimento:** Identificado quando cliente reportou estatísticas zeradas na página de perfil

---

## Problema Identificado
Múltiplos campos de estatísticas mostravam valor zero ou incorreto:
- "Resultados Certos": 0 (deveria mostrar quantidade)
- "Média por Jogo": 0 (deveria calcular total_pontos / jogos)
- "Rodadas disputadas": 0 (deveria contar rodadas únicas)
- "Posição na Classificação": #- (deveria mostrar posição real)

---

## Causa Raiz

### Técnica
1. **Estatísticas calculadas de subset limitado:** Endpoint buscava apenas últimos 50 palpites, mas calculava estatísticas sobre esse subset
2. **Posição buscada no TOP 5:** Função `getUserRank()` procurava usuário apenas nos 5 primeiros, não no ranking completo
3. **Campos não calculados:** Endpoint não retornava `correct_results`, `avg_points_per_game`, `rounds_played`

### Arquitetural
- Ausência de serviço dedicado para cálculo de estatísticas
- Lógica de estatísticas misturada com lógica de apresentação
- Sem cache de estatísticas calculadas

### De Processo
- Endpoint foi criado para "mostrar dados básicos" e expandido incrementalmente
- Novos campos adicionados no frontend sem correspondente no backend

---

## Por que não foi identificado antes

### Suposição feita
- Os 50 últimos palpites seriam representativos do total
- Usuário logado estaria sempre no TOP 5

### Onde a análise falhou
- Não foi testado com usuário que tem mais de 50 palpites
- Não foi testado com usuário fora do TOP 5

### O que não foi questionado
- "O frontend espera quais campos exatamente?"
- "As estatísticas devem ser sobre todos os palpites ou apenas recentes?"

---

## Impacto

### Técnico
- Dados inconsistentes entre frontend e backend
- Cálculos duplicados (alguns no backend, alguns no frontend)

### Operacional
- Debug demorado para identificar que o problema era o tamanho do subset

### Produto/usuário
- Usuário vê estatísticas zeradas/incorretas
- Percepção de bug no produto
- Desconfiança nos dados apresentados

---

## Solução Aplicada
1. Endpoint agora busca TODOS os palpites para cálculo de estatísticas
2. Novos campos adicionados: `correct_results`, `avg_points_per_game`, `accuracy_rate`, `rounds_played`, `points_by_round`
3. Posição calculada no ranking COMPLETO antes de filtrar TOP 5
4. Estado `userPosition` separado de `topPlayers`

---

## Melhoria Estrutural Recomendada
1. **Criar StatisticsService:** Serviço dedicado para cálculos estatísticos
2. **Pré-calcular estatísticas:** Atualizar ao final de cada jogo, não sob demanda
3. **Armazenar estatísticas:** Campo `statistics` no documento do usuário
4. **Contrato de API documentado:** Definir claramente quais campos são retornados
5. **Testes de integração:** Validar que todos os campos esperados pelo frontend existem

---

## Ação Preventiva
- [ ] Definir contrato de API (OpenAPI/Swagger) antes de implementar endpoints
- [ ] Frontend e backend devem validar contra o mesmo schema
- [ ] Testes devem cobrir cenários de edge case (muitos dados, poucos dados, zero dados)
- [ ] Code review deve verificar: "O cálculo considera TODOS os dados necessários?"

---

## Status
**Corrigida** - Endpoint atualizado, mas StatisticsService ainda não existe

