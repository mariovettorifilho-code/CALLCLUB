# Lição Aprendida #03

## Título
Ausência de Atualização Automática de Resultados

---

## Contexto
- **Funcionalidade afetada:** Sincronização de placares e resultados de partidas
- **Área:** Arquitetura - Integração com APIs externas
- **Momento do surgimento:** Desde a concepção do projeto. Sistema foi desenhado para operação manual.

---

## Problema Identificado
O sistema depende 100% de ação manual do administrador para:
1. Buscar novos placares da API externa
2. Recalcular pontos dos usuários
3. Atualizar classificações

Não existe job agendado, cron, ou qualquer mecanismo de atualização automática.

---

## Causa Raiz

### Técnica
- Ausência de APScheduler ou similar para jobs em background
- Endpoints de sincronização existem apenas como ações manuais
- Sem health check para verificar se dados estão desatualizados

### Arquitetural
- Arquitetura síncrona e orientada a requisições
- Sem camada de processamento em background
- Sem separação entre "dados sob demanda" e "dados que precisam estar frescos"

### De Processo
- Projeto iniciou como MVP focado em funcionalidades básicas
- Automação foi considerada "melhoria futura" e nunca priorizada
- Requisitos não explicitaram necessidade de atualização automática

---

## Por que não foi identificado antes

### Suposição feita
- Administrador estaria disponível para clicar nos botões quando necessário
- Frequência de atualizações seria baixa (apenas quando jogos terminam)

### Onde a análise falhou
- Não foi considerada a experiência do usuário final que espera dados em tempo real
- Não foi questionada a escalabilidade: "E quando houver 10 campeonatos simultâneos?"

### O que não foi questionado
- "Qual a expectativa de freshness dos dados para o usuário?"
- "É aceitável que classificações fiquem desatualizadas por horas?"
- "Quantos cliques manuais serão necessários por dia/semana?"

---

## Impacto

### Técnico
- Dados frequentemente desatualizados
- Classificação não reflete realidade após jogos
- Variação de posição nunca funciona (depende de recálculo)

### Operacional
- Administrador precisa lembrar de atualizar manualmente
- Risco de esquecimento durante horários de jogos
- Carga operacional constante e repetitiva

### Produto/usuário
- Usuários veem dados antigos
- Palpites corretos não são refletidos na classificação
- Percepção de produto "quebrado" ou "lento"
- Comparação desfavorável com concorrentes (GE, Cartola)

---

## Solução Aplicada
Ainda não aplicada.

---

## Melhoria Estrutural Recomendada
1. **Implementar APScheduler** com job de sincronização a cada 15 minutos
2. **Cache em memória** (TTL 10 min) para reduzir chamadas à API
3. **Fallback automático** para MongoDB quando API falhar
4. **Fila de processamento** para recálculo de pontos (evitar timeout)
5. **Health check endpoint** que indica se dados estão frescos

### Arquitetura Proposta
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ APScheduler │────▶│ SyncService │────▶│ API-Football│
│  (15 min)   │     │             │     └──────┬──────┘
└─────────────┘     │             │            │
                    │             │◀───────────┘
                    │             │
                    │             │────▶ Cache (10 min TTL)
                    │             │────▶ MongoDB (fallback)
                    │             │────▶ Recalcular pontos
                    └─────────────┘
```

---

## Ação Preventiva
- [ ] Todo sistema com dados externos deve ter estratégia de atualização definida na arquitetura
- [ ] Documentar SLA de freshness para cada tipo de dado
- [ ] Implementar métrica: "tempo desde última sincronização"
- [ ] Alerta quando dados estiverem desatualizados além do threshold

---

## Status
**Aguardando Implementação** - Depende de API Key (RapidAPI) para API-Football

