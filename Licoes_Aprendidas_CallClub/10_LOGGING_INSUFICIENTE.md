# Lição Aprendida #10

## Título
Logging Insuficiente para Diagnóstico

---

## Contexto
- **Funcionalidade afetada:** Monitoramento e debugging do sistema
- **Área:** Observabilidade - Logging
- **Momento do surgimento:** Desde o início do projeto

---

## Problema Identificado
O sistema possui logging básico e inconsistente:
- Alguns endpoints não logam nada
- Erros são capturados mas não logados (`except: pass`)
- Sem correlação entre logs (request ID)
- Sem níveis de log apropriados (tudo é `print` ou `logger.info`)
- Sem estrutura nos logs (texto livre, difícil de parsear)

Quando um problema ocorre:
1. Não há registro de o que aconteceu
2. Não há contexto de quando aconteceu
3. Não há como rastrear a sequência de eventos

---

## Causa Raiz

### Técnica
- Uso de `print()` ao invés de logger configurado
- `try/except` genéricos que engolem erros
- Sem middleware de logging para requests
- Sem formato estruturado (JSON) para logs

### Arquitetural
- Observabilidade não foi considerada na arquitetura
- Sem padrão definido para logging
- Sem centralização de logs

### De Processo
- Logs adicionados de forma ad-hoc durante debugging
- Sem revisão de "este log é útil?"
- Sem requisito de observabilidade

---

## Por que não foi identificado antes

### Suposição feita
- "Se der erro, vamos ver na hora"
- "O supervisor log é suficiente"

### Onde a análise falhou
- Não foi considerado debugging pós-facto
- Não foi pensado em monitoramento proativo

### O que não foi questionado
- "Como vamos saber se algo está errado antes do usuário reclamar?"
- "Como vamos investigar um problema que aconteceu ontem?"

---

## Impacto

### Técnico
- Debugging é "achismo" - não há dados
- Problemas intermitentes são impossíveis de investigar
- Sem métricas de saúde do sistema

### Operacional
- Tempo excessivo gasto tentando reproduzir problemas
- Resolução de incidentes é lenta e imprecisa

### Produto/usuário
- Problemas demoram a ser identificados
- Usuário reporta antes de detectarmos internamente

---

## Solução Aplicada
Ainda não aplicada.

---

## Melhoria Estrutural Recomendada

### Configuração de Logging Proposta
```python
# /app/backend/core/logging.py
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_data)

def setup_logging():
    logger = logging.getLogger("callclub")
    logger.setLevel(logging.INFO)
    
    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())
    logger.addHandler(handler)
    
    return logger
```

### Níveis de Log Apropriados
| Nível | Quando Usar | Exemplo |
|-------|-------------|---------|
| DEBUG | Detalhes de desenvolvimento | "Query MongoDB: {query}" |
| INFO | Eventos normais importantes | "Usuário {user} fez login" |
| WARNING | Algo inesperado mas não crítico | "API demorou 5s para responder" |
| ERROR | Falha que afeta funcionalidade | "Erro ao salvar palpite: {error}" |
| CRITICAL | Sistema comprometido | "Conexão com MongoDB perdida" |

### Middleware de Request Logging
```python
@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = str(uuid.uuid4())[:8]
    logger.info(f"[{request_id}] {request.method} {request.url.path}")
    
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    
    logger.info(f"[{request_id}] Completed in {duration:.2f}s - Status: {response.status_code}")
    return response
```

---

## Ação Preventiva
- [ ] Configurar logger estruturado (JSON)
- [ ] Middleware de logging para todas as requests
- [ ] Padrão: todo `except` deve logar o erro
- [ ] Request ID para correlacionar logs
- [ ] Revisão: "Este log ajuda a diagnosticar problemas?"

---

## Status
**Aguardando Implementação** - Planejado para Fase 1

