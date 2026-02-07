# Lição Aprendida #08

## Título
Ausência de Fallback para Falhas de API Externa

---

## Contexto
- **Funcionalidade afetada:** Sincronização de partidas e resultados
- **Área:** Resiliência - Tratamento de falhas
- **Momento do surgimento:** Desde a concepção do projeto

---

## Problema Identificado
Quando a API externa (TheSportsDB) falha ou está lenta:
1. O sistema simplesmente ignora o erro (`try/except` com `pass`)
2. Nenhum dado é retornado
3. Usuário vê tela vazia ou erro genérico
4. Não há tentativa de buscar dado de fonte alternativa

Código atual:
```python
try:
    response = await http_client.get(url)
    # processa dados
except Exception as e:
    pass  # Ignora silenciosamente
```

---

## Causa Raiz

### Técnica
- Tratamento de erro genérico e silencioso
- Ausência de fallback para MongoDB (dados já salvos anteriormente)
- Sem retry automático em caso de falha temporária
- Sem circuit breaker para evitar chamadas a API com problema

### Arquitetural
- Arquitetura não considerou cenários de falha
- Única fonte de dados (TheSportsDB), sem redundância
- Sem separação entre "dados fresh" e "dados stale mas aceitáveis"

### De Processo
- Caminho feliz foi o único testado
- Não foi feita análise de "e se a API falhar?"
- Resiliência não foi requisito explícito

---

## Por que não foi identificado antes

### Suposição feita
- "TheSportsDB é confiável e sempre funciona"
- "Se falhar, é temporário e o admin pode tentar de novo"

### Onde a análise falhou
- Não foi considerado que falhas podem ocorrer durante jogos ao vivo
- Não foi pensado na experiência do usuário durante falha

### O que não foi questionado
- "Qual o SLA da API externa?"
- "O que o usuário vê quando a API falha?"
- "Temos dados salvos que poderiam ser usados como fallback?"

---

## Impacto

### Técnico
- Erros silenciosos dificultam diagnóstico
- Sistema parece "quebrado" quando API externa tem problema
- Dados potencialmente disponíveis no MongoDB não são usados

### Operacional
- Admin precisa ficar monitorando e tentando manualmente
- Sem alertas sobre falhas de integração

### Produto/usuário
- Usuário vê dados desatualizados ou nenhum dado
- Percepção de produto instável/não confiável

---

## Solução Aplicada
Ainda não aplicada.

---

## Melhoria Estrutural Recomendada

### Estratégia de Fallback em Cascata
```
1. Tentar Cache em memória (TTL válido?)
   ↓ falhou
2. Tentar API primária (API-Football)
   ↓ falhou
3. Tentar API secundária (TheSportsDB)
   ↓ falhou
4. Tentar MongoDB (dados antigos)
   ↓ falhou
5. Retornar erro significativo ao usuário
```

### Implementação Proposta
```python
async def get_matches(self, championship_id: str) -> List[Dict]:
    # 1. Cache
    cached = self.cache.get(f"matches_{championship_id}")
    if cached:
        logger.info("Retornando do CACHE")
        return cached
    
    # 2. API Primária
    try:
        matches = await self.api_football.get_matches(championship_id)
        self.cache.set(f"matches_{championship_id}", matches)
        await self.db.matches.insert_many(matches)  # Salva para fallback
        return matches
    except Exception as e:
        logger.warning(f"API-Football falhou: {e}")
    
    # 3. API Secundária
    try:
        matches = await self.thesportsdb.get_matches(championship_id)
        return matches
    except Exception as e:
        logger.warning(f"TheSportsDB falhou: {e}")
    
    # 4. MongoDB (fallback final)
    try:
        matches = await self.db.matches.find({"championship_id": championship_id}).to_list(None)
        logger.info("Retornando do MongoDB (FALLBACK)")
        return matches
    except Exception as e:
        logger.error(f"Todas as fontes falharam: {e}")
    
    # 5. Erro significativo
    raise HTTPException(
        status_code=503,
        detail="Serviço temporariamente indisponível. Dados estão sendo atualizados."
    )
```

---

## Ação Preventiva
- [ ] Toda integração externa DEVE ter fallback definido
- [ ] Erros nunca devem ser silenciosos (`pass`)
- [ ] Implementar logging estruturado para falhas
- [ ] Definir mensagens de erro amigáveis para cada cenário
- [ ] Testes de resiliência: simular falhas de API

---

## Status
**Aguardando Implementação** - Planejado para Fase 1

