# Lição Aprendida #05

## Título
Variação de Posição com Lógica Temporal Invertida

---

## Contexto
- **Funcionalidade afetada:** Indicador de variação de posição na classificação (↑↓)
- **Área:** Backend - Cálculo de ranking
- **Momento do surgimento:** Feature implementada mas nunca funcionou corretamente

---

## Problema Identificado
A variação de posição (subiu/desceu/manteve) nunca era exibida porque:
1. A posição era salva DEPOIS do recálculo de pontos
2. Isso fazia com que `previous_position` sempre fosse igual à `current_position`
3. Resultado: `position_change` sempre = 0

---

## Causa Raiz

### Técnica
- Ordem de operações incorreta na função `recalculate_all_points()`:
  ```python
  # ERRADO (como estava):
  1. Recalcular pontos
  2. Calcular nova posição
  3. Salvar posição como "anterior"  # <- Já é a nova!
  
  # CORRETO (como deveria ser):
  1. Salvar posição ATUAL como "anterior"
  2. Recalcular pontos
  3. Calcular nova posição
  4. Comparar com anterior
  ```

### Arquitetural
- Lógica de "snapshot antes de mudança" não foi considerada no design
- Ausência de padrão de auditoria/histórico para dados que mudam

### De Processo
- Feature foi implementada sem caso de teste que validasse o comportamento
- Não foi feito teste manual end-to-end após implementação

---

## Por que não foi identificado antes

### Suposição feita
- "Salvar a posição" significava salvar para comparação futura
- O momento de salvar não foi questionado

### Onde a análise falhou
- Não foi desenhado o fluxo temporal da feature
- Não foi criado teste que simulasse: estado A → mudança → estado B

### O que não foi questionado
- "Em que momento EXATO a posição anterior deve ser capturada?"
- "A implementação foi testada com dados reais?"

---

## Impacto

### Técnico
- Feature 100% inoperante
- Código existe mas não produz resultado visível

### Operacional
- Tempo gasto implementando feature que não funciona
- Debug necessário para identificar problema lógico (não de código)

### Produto/usuário
- Expectativa criada (UI mostra espaço para variação) mas não entregue
- Comparação desfavorável com concorrentes que têm essa feature

---

## Solução Aplicada
1. Ordem corrigida: salvar posições ANTES de recalcular
2. Lógica movida para início da função `recalculate_all_points()`
3. Agregação MongoDB para calcular ranking atual antes de modificar

---

## Melhoria Estrutural Recomendada
1. **Padrão de Snapshot:** Para qualquer dado que precisa de histórico, criar função `save_snapshot_before_change()`
2. **Event Sourcing (futuro):** Considerar armazenar eventos de mudança ao invés de apenas estado atual
3. **Histórico de posições:** Tabela separada `position_history` com timestamps
4. **Testes de fluxo temporal:** Para features que dependem de "antes vs depois", criar testes específicos

---

## Ação Preventiva
- [ ] Para features com componente temporal, desenhar diagrama de sequência ANTES de implementar
- [ ] Criar teste automatizado que valide: "dado estado A, após ação X, estado deve ser B"
- [ ] Review de PR deve questionar: "A ordem das operações está correta?"
- [ ] Documentar invariantes: "Posição anterior deve ser capturada ANTES de recálculo"

---

## Status
**Corrigida** - Lógica corrigida, mas histórico de posições ainda não existe

