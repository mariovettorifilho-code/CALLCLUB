# Lição Aprendida #09

## Título
Ausência de Testes Automatizados

---

## Contexto
- **Funcionalidade afetada:** Todo o sistema
- **Área:** Qualidade - Garantia de software
- **Momento do surgimento:** Desde o início do projeto

---

## Problema Identificado
O projeto não possui nenhum teste automatizado:
- Zero testes unitários
- Zero testes de integração
- Zero testes end-to-end
- Pasta `/tests` não existe

Consequências observadas:
1. Bug do AUTHORIZED_USERS passou para produção e afetou múltiplos endpoints
2. Função de zerar estatísticas deletou dados inesperadamente
3. Variação de posição foi implementada mas nunca funcionou
4. Cada mudança requer teste manual extensivo

---

## Causa Raiz

### Técnica
- Nenhum framework de teste configurado (pytest, jest)
- Código não foi escrito pensando em testabilidade
- Dependências hardcoded impedem mocking

### Arquitetural
- Código monolítico dificulta testes isolados
- Ausência de injeção de dependências
- Acoplamento entre camadas

### De Processo
- Testes não foram incluídos na estimativa de tarefas
- "Testar manualmente" foi considerado suficiente
- Sem critério de cobertura mínima

---

## Por que não foi identificado antes

### Suposição feita
- "O código é simples, não precisa de testes"
- "Teste manual é suficiente para o tamanho do projeto"

### Onde a análise falhou
- Não foi calculado o custo de bugs em produção
- Não foi considerado o tempo gasto debugando problemas

### O que não foi questionado
- "Quanto tempo gastamos corrigindo bugs que testes teriam pego?"
- "Qual a confiança que temos ao fazer uma mudança?"

---

## Impacto

### Técnico
- Bugs chegam à produção
- Regressões frequentes (corrigir X quebra Y)
- Medo de refatorar código existente

### Operacional
- Cada deploy é arriscado
- Tempo significativo gasto em teste manual
- Debug reativo ao invés de prevenção

### Produto/usuário
- Experiência inconsistente
- Funcionalidades que "param de funcionar" sem motivo aparente
- Perda de confiança no produto

---

## Solução Aplicada
Ainda não aplicada.

---

## Melhoria Estrutural Recomendada

### Estrutura de Testes Proposta
```
/app/backend/tests/
├── conftest.py              # Fixtures compartilhadas
├── unit/
│   ├── test_auth_service.py
│   ├── test_match_service.py
│   ├── test_ranking_service.py
│   └── test_prediction_service.py
├── integration/
│   ├── test_auth_api.py
│   ├── test_matches_api.py
│   └── test_predictions_api.py
└── e2e/
    ├── test_user_flow.py     # Login → Palpite → Ver ranking
    └── test_admin_flow.py    # Login admin → Sync → Ver resultados
```

### Testes Mínimos Obrigatórios
| Cenário | Teste |
|---------|-------|
| AUTHORIZED_USERS | Criar usuário via API → Fazer login → Deve funcionar |
| Zerar estatísticas | Zerar usuário A → Palpites de B devem permanecer |
| Variação de posição | Posição antes = 3, após ganhar pontos = 1, variação = +2 |
| Cálculo de pontos | Palpite 2x1, Resultado 2x1 = 5 pontos |

### Métricas de Qualidade
- Cobertura mínima: 70% para serviços
- Cobertura mínima: 50% para rotas
- Zero bugs críticos devem passar sem teste que cubra

---

## Ação Preventiva
- [ ] Configurar pytest no projeto
- [ ] Toda nova feature DEVE incluir testes
- [ ] CI deve rodar testes antes de permitir merge
- [ ] Bugs corrigidos devem gerar teste de regressão
- [ ] Code review deve verificar existência de testes

---

## Status
**Aguardando Implementação** - Planejado para Fase 2

