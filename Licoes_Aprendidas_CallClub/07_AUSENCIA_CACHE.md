# Lição Aprendida #07

## Título
Ausência de Cache para APIs Externas

---

## Contexto
- **Funcionalidade afetada:** Todas as operações que dependem de dados externos (partidas, placares)
- **Área:** Performance - Integração com APIs
- **Momento do surgimento:** Desde a concepção do projeto

---

## Problema Identificado
Toda requisição que precisa de dados de partidas faz chamada direta à API externa (TheSportsDB), sem nenhum cache:
- Mesmo dado é buscado múltiplas vezes
- Latência alta para o usuário final
- Risco de atingir rate limit da API
- Vulnerabilidade: se API cair, sistema para

---

## Causa Raiz

### Técnica
- Nenhuma camada de cache implementada (nem em memória, nem Redis)
- Cada endpoint faz query direta à API ou ao banco
- Sem distinção entre "dados que mudam frequentemente" e "dados estáveis"

### Arquitetural
- Arquitetura não previu camada de caching
- Sem análise de padrões de acesso (quais dados são mais requisitados)
- Acoplamento direto entre endpoints e fonte de dados

### De Processo
- Cache foi considerado "otimização prematura"
- Não foi medida a latência nem a frequência de chamadas
- Foco em funcionalidade, não em performance

---

## Por que não foi identificado antes

### Suposição feita
- "TheSportsDB é rápida o suficiente"
- "Não temos tantos usuários ainda para precisar de cache"

### Onde a análise falhou
- Não foi considerado o custo de cada chamada externa
- Não foi questionada a experiência do usuário com latência alta

### O que não foi questionado
- "Qual a latência média das chamadas à API externa?"
- "Quantas vezes o mesmo dado é buscado por dia?"
- "O que acontece se a API externa ficar lenta ou cair?"

---

## Impacto

### Técnico
- Latência desnecessária em cada requisição
- Desperdício de quota de API (mesmo dado buscado múltiplas vezes)
- Sistema vulnerável a falhas da API externa

### Operacional
- Sem visibilidade de quantas chamadas são feitas
- Risco de bloqueio por rate limiting

### Produto/usuário
- Páginas lentas para carregar
- Possível indisponibilidade se API externa falhar

---

## Solução Aplicada
Ainda não aplicada.

---

## Melhoria Estrutural Recomendada

### Cache em Memória (Mínimo Viável)
```python
class MemoryCache:
    def __init__(self):
        self.cache = {}
    
    def get(self, key: str) -> Optional[Any]:
        item = self.cache.get(key)
        if item and datetime.utcnow() < item["expiry"]:
            return item["value"]
        return None
    
    def set(self, key: str, value: Any, ttl_seconds: int = 600):
        self.cache[key] = {
            "value": value,
            "expiry": datetime.utcnow() + timedelta(seconds=ttl_seconds)
        }
```

### TTLs Recomendados
| Tipo de Dado | TTL | Justificativa |
|--------------|-----|---------------|
| Lista de partidas | 10 min | Muda raramente |
| Placar de jogo ao vivo | 1 min | Precisa ser fresco |
| Placar de jogo finalizado | 24h | Não muda mais |
| Classificação | 5 min | Depende de recálculo |

### Arquitetura com Cache
```
Request → Cache Hit? → Sim → Retorna do cache
                ↓ Não
          API Externa
                ↓
          Salva no cache
                ↓
          Retorna dado
```

---

## Ação Preventiva
- [ ] Todo dado externo DEVE passar por camada de cache
- [ ] Definir TTL apropriado para cada tipo de dado
- [ ] Implementar métricas de cache (hit rate, miss rate)
- [ ] Monitorar latência de APIs externas
- [ ] Ter fallback definido para falha de API

---

## Status
**Aguardando Implementação** - Planejado para Fase 1

