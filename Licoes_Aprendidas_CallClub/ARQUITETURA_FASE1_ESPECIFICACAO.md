# Especificação Técnica - Fase 1: Migração de Infraestrutura de Dados

## CallClub - Documento de Arquitetura para Execução

**Versão:** 1.0  
**Data:** 07/02/2026  
**Status:** Aprovado para execução  
**Requer:** RAPIDAPI_KEY (API-Football)

---

## 1. Contexto e Objetivo

### Situação Atual
- API externa: TheSportsDB (gratuita, sem SLA)
- Atualização: Manual (admin clica em botão)
- Cache: Inexistente
- Fallback: Inexistente
- Jobs: Inexistente

### Objetivo da Fase 1
Implementar infraestrutura robusta de dados com:
- Atualização automática a cada 15 minutos
- Cache em memória com TTL
- Fallback automático para MongoDB
- Logging estruturado
- Migração para API-Football (RapidAPI)

---

## 2. Arquitetura Alvo

```
┌─────────────────────────────────────────────────────────────────┐
│                         CALLCLUB V2                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌──────────────────────────────────────┐  │
│  │   React     │────▶│           FastAPI Backend            │  │
│  │  Frontend   │     │                                      │  │
│  └─────────────┘     │  ┌─────────────────────────────────┐ │  │
│                      │  │         API Routes              │ │  │
│                      │  │  (auth, matches, predictions,   │ │  │
│                      │  │   rankings, admin, leagues)     │ │  │
│                      │  └──────────────┬──────────────────┘ │  │
│                      │                 │                    │  │
│                      │  ┌──────────────▼──────────────────┐ │  │
│                      │  │        SyncService              │ │  │
│                      │  │  (orquestra sincronização)      │ │  │
│                      │  └──────────────┬──────────────────┘ │  │
│                      │                 │                    │  │
│                      └─────────────────┼────────────────────┘  │
│                                        │                       │
│  ┌─────────────────────────────────────┼─────────────────────┐ │
│  │                                     │                     │ │
│  │  ┌──────────────┐    ┌──────────────▼──────────────────┐  │ │
│  │  │ APScheduler  │───▶│       FootballDataService       │  │ │
│  │  │  (15 min)    │    │                                 │  │ │
│  │  └──────────────┘    │  1. Verificar Cache             │  │ │
│  │                      │  2. Chamar API-Football         │  │ │
│  │                      │  3. Fallback: TheSportsDB       │  │ │
│  │                      │  4. Fallback: MongoDB           │  │ │
│  │                      │  5. Atualizar Cache             │  │ │
│  │                      │  6. Salvar MongoDB              │  │ │
│  │                      └──────────────┬──────────────────┘  │ │
│  │                                     │                     │ │
│  │  ┌──────────────────────────────────┼──────────────────┐  │ │
│  │  │                                  │                  │  │ │
│  │  │  ┌───────────┐  ┌───────────┐  ┌▼───────────────┐  │  │ │
│  │  │  │  Cache    │  │ MongoDB   │  │  APIs Externas │  │  │ │
│  │  │  │ (memória) │  │ (dados)   │  │                │  │  │ │
│  │  │  │ TTL:10min │  │ fallback  │  │ ┌───────────┐  │  │  │ │
│  │  │  └───────────┘  └───────────┘  │ │API-Football│  │  │  │ │
│  │  │                                │ │ (primária) │  │  │  │ │
│  │  │                                │ └───────────┘  │  │  │ │
│  │  │                                │ ┌───────────┐  │  │  │ │
│  │  │                                │ │TheSportsDB│  │  │  │ │
│  │  │                                │ │(secundária)│  │  │  │ │
│  │  │                                │ └───────────┘  │  │  │ │
│  │  │                                └────────────────┘  │  │ │
│  │  │              CAMADA DE DADOS                       │  │ │
│  │  └────────────────────────────────────────────────────┘  │ │
│  │                    SERVICES LAYER                        │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. Componentes a Implementar

### 3.1 Cache Service

**Arquivo:** `/app/backend/services/cache_service.py`

```python
from datetime import datetime, timedelta
from typing import Any, Optional
import logging

logger = logging.getLogger("callclub")

class MemoryCache:
    """Cache em memória com TTL configurável"""
    
    def __init__(self):
        self._cache = {}
        self._stats = {"hits": 0, "misses": 0}
    
    def get(self, key: str) -> Optional[Any]:
        """Retorna valor se existir e não expirado"""
        item = self._cache.get(key)
        if item and datetime.utcnow() < item["expiry"]:
            self._stats["hits"] += 1
            logger.debug(f"Cache HIT: {key}")
            return item["value"]
        self._stats["misses"] += 1
        logger.debug(f"Cache MISS: {key}")
        return None
    
    def set(self, key: str, value: Any, ttl_seconds: int = 600):
        """Armazena valor com TTL (padrão 10 minutos)"""
        self._cache[key] = {
            "value": value,
            "expiry": datetime.utcnow() + timedelta(seconds=ttl_seconds),
            "created_at": datetime.utcnow()
        }
        logger.debug(f"Cache SET: {key} (TTL: {ttl_seconds}s)")
    
    def invalidate(self, key: str):
        """Remove item do cache"""
        if key in self._cache:
            del self._cache[key]
            logger.debug(f"Cache INVALIDATE: {key}")
    
    def clear(self):
        """Limpa todo o cache"""
        self._cache.clear()
        logger.info("Cache CLEARED")
    
    def get_stats(self) -> dict:
        """Retorna estatísticas do cache"""
        total = self._stats["hits"] + self._stats["misses"]
        hit_rate = (self._stats["hits"] / total * 100) if total > 0 else 0
        return {
            **self._stats,
            "total_requests": total,
            "hit_rate": f"{hit_rate:.1f}%",
            "items_cached": len(self._cache)
        }

# Instância global
cache = MemoryCache()
```

### 3.2 API-Football Client

**Arquivo:** `/app/backend/external/api_football.py`

```python
import httpx
import logging
from typing import List, Dict, Optional
from datetime import datetime

logger = logging.getLogger("callclub")

class APIFootballClient:
    """Cliente para API-Football via RapidAPI"""
    
    BASE_URL = "https://api-football-v1.p.rapidapi.com/v3"
    
    # Mapeamento de campeonatos CallClub → API-Football league IDs
    LEAGUE_MAPPING = {
        "brasileirao": 71,      # Brasileirão Série A
        "premier_league": 39,   # Premier League
        "la_liga": 140,         # La Liga
        "serie_a": 135,         # Serie A Italia
        "bundesliga": 78,       # Bundesliga
        "ligue_1": 61,          # Ligue 1
    }
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {
            "X-RapidAPI-Key": api_key,
            "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com"
        }
    
    async def get_fixtures(self, championship_id: str, round_number: int = None, season: int = None) -> List[Dict]:
        """Busca partidas de um campeonato"""
        league_id = self.LEAGUE_MAPPING.get(championship_id)
        if not league_id:
            logger.warning(f"Campeonato não mapeado: {championship_id}")
            return []
        
        if season is None:
            season = datetime.now().year
        
        params = {
            "league": league_id,
            "season": season
        }
        
        if round_number:
            params["round"] = f"Regular Season - {round_number}"
        
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.get(
                    f"{self.BASE_URL}/fixtures",
                    headers=self.headers,
                    params=params
                )
                response.raise_for_status()
                data = response.json()
                
                fixtures = data.get("response", [])
                logger.info(f"API-Football: {len(fixtures)} partidas obtidas para {championship_id}")
                
                return self._transform_fixtures(fixtures, championship_id)
                
        except httpx.HTTPStatusError as e:
            logger.error(f"API-Football HTTP error: {e.response.status_code}")
            raise
        except Exception as e:
            logger.error(f"API-Football error: {str(e)}")
            raise
    
    async def get_live_scores(self, championship_id: str) -> List[Dict]:
        """Busca placares ao vivo"""
        league_id = self.LEAGUE_MAPPING.get(championship_id)
        if not league_id:
            return []
        
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.get(
                    f"{self.BASE_URL}/fixtures",
                    headers=self.headers,
                    params={"league": league_id, "live": "all"}
                )
                response.raise_for_status()
                data = response.json()
                
                return self._transform_fixtures(data.get("response", []), championship_id)
                
        except Exception as e:
            logger.error(f"API-Football live scores error: {str(e)}")
            raise
    
    def _transform_fixtures(self, fixtures: List[Dict], championship_id: str) -> List[Dict]:
        """Transforma resposta da API para formato CallClub"""
        transformed = []
        
        for fixture in fixtures:
            try:
                match_data = {
                    "match_id": str(fixture["fixture"]["id"]),
                    "championship_id": championship_id,
                    "home_team": fixture["teams"]["home"]["name"],
                    "away_team": fixture["teams"]["away"]["name"],
                    "home_score": fixture["goals"]["home"],
                    "away_score": fixture["goals"]["away"],
                    "match_date": fixture["fixture"]["date"],
                    "venue": fixture["fixture"].get("venue", {}).get("name", ""),
                    "status": fixture["fixture"]["status"]["short"],
                    "is_finished": fixture["fixture"]["status"]["short"] == "FT",
                    "round_number": self._extract_round(fixture["league"].get("round", "")),
                    "api_source": "api_football"
                }
                transformed.append(match_data)
            except KeyError as e:
                logger.warning(f"Erro ao transformar fixture: {e}")
                continue
        
        return transformed
    
    def _extract_round(self, round_str: str) -> int:
        """Extrai número da rodada de string como 'Regular Season - 5'"""
        try:
            if "Regular Season - " in round_str:
                return int(round_str.replace("Regular Season - ", ""))
            return int(round_str) if round_str.isdigit() else 1
        except:
            return 1
```

### 3.3 TheSportsDB Client (Fallback)

**Arquivo:** `/app/backend/external/thesportsdb.py`

```python
import httpx
import logging
from typing import List, Dict

logger = logging.getLogger("callclub")

class TheSportsDBClient:
    """Cliente para TheSportsDB (fallback)"""
    
    BASE_URL = "https://www.thesportsdb.com/api/v1/json/3"
    
    # Mapeamento de campeonatos
    LEAGUE_MAPPING = {
        "brasileirao": "4351",
        "premier_league": "4328",
        "la_liga": "4335",
        "serie_a": "4332",
        "bundesliga": "4331",
        "ligue_1": "4334",
    }
    
    async def get_fixtures(self, championship_id: str, round_number: int, season: str = None) -> List[Dict]:
        """Busca partidas de uma rodada"""
        api_id = self.LEAGUE_MAPPING.get(championship_id)
        if not api_id:
            logger.warning(f"Campeonato não mapeado (TheSportsDB): {championship_id}")
            return []
        
        if season is None:
            from datetime import datetime
            year = datetime.now().year
            season = f"{year}-{year+1}" if championship_id != "brasileirao" else str(year)
        
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.get(
                    f"{self.BASE_URL}/eventsround.php",
                    params={"id": api_id, "r": round_number, "s": season}
                )
                response.raise_for_status()
                data = response.json()
                
                events = data.get("events") or []
                logger.info(f"TheSportsDB: {len(events)} partidas obtidas para {championship_id} rodada {round_number}")
                
                return self._transform_events(events, championship_id)
                
        except Exception as e:
            logger.error(f"TheSportsDB error: {str(e)}")
            raise
    
    def _transform_events(self, events: List[Dict], championship_id: str) -> List[Dict]:
        """Transforma resposta para formato CallClub"""
        transformed = []
        
        for event in events:
            try:
                home_score = event.get("intHomeScore")
                away_score = event.get("intAwayScore")
                
                match_data = {
                    "match_id": str(event["idEvent"]),
                    "championship_id": championship_id,
                    "home_team": event["strHomeTeam"],
                    "away_team": event["strAwayTeam"],
                    "home_score": int(home_score) if home_score is not None else None,
                    "away_score": int(away_score) if away_score is not None else None,
                    "match_date": f"{event['dateEvent']}T{event.get('strTime', '00:00:00')}",
                    "venue": event.get("strVenue", ""),
                    "status": event.get("strStatus", ""),
                    "is_finished": home_score is not None and away_score is not None,
                    "round_number": int(event.get("intRound", 1)),
                    "api_source": "thesportsdb"
                }
                transformed.append(match_data)
            except (KeyError, ValueError) as e:
                logger.warning(f"Erro ao transformar event: {e}")
                continue
        
        return transformed
```

### 3.4 Football Data Service (Orquestrador)

**Arquivo:** `/app/backend/services/football_data_service.py`

```python
import logging
from typing import List, Dict, Optional
from datetime import datetime

from external.api_football import APIFootballClient
from external.thesportsdb import TheSportsDBClient
from services.cache_service import cache

logger = logging.getLogger("callclub")

class FootballDataService:
    """
    Serviço orquestrador para dados de futebol.
    Implementa estratégia de fallback em cascata:
    1. Cache em memória
    2. API-Football (primária)
    3. TheSportsDB (secundária)
    4. MongoDB (fallback final)
    """
    
    def __init__(self, db, api_football_key: str = None):
        self.db = db
        self.api_football = APIFootballClient(api_football_key) if api_football_key else None
        self.thesportsdb = TheSportsDBClient()
    
    async def get_matches(
        self,
        championship_id: str,
        round_number: int = None,
        force_refresh: bool = False
    ) -> List[Dict]:
        """
        Obtém partidas com estratégia de fallback.
        
        Args:
            championship_id: ID do campeonato
            round_number: Número da rodada (opcional)
            force_refresh: Ignorar cache e buscar dados frescos
        
        Returns:
            Lista de partidas no formato CallClub
        """
        cache_key = f"matches_{championship_id}_{round_number or 'all'}"
        
        # 1. Verificar Cache
        if not force_refresh:
            cached = cache.get(cache_key)
            if cached:
                logger.info(f"[{championship_id}] Retornando do CACHE")
                return cached
        
        matches = []
        source = None
        
        # 2. Tentar API-Football (primária)
        if self.api_football:
            try:
                matches = await self.api_football.get_fixtures(championship_id, round_number)
                source = "api_football"
                logger.info(f"[{championship_id}] Dados obtidos da API-Football")
            except Exception as e:
                logger.warning(f"[{championship_id}] API-Football falhou: {e}")
        
        # 3. Fallback: TheSportsDB
        if not matches:
            try:
                if round_number:
                    matches = await self.thesportsdb.get_fixtures(championship_id, round_number)
                source = "thesportsdb"
                logger.info(f"[{championship_id}] Fallback para TheSportsDB")
            except Exception as e:
                logger.warning(f"[{championship_id}] TheSportsDB falhou: {e}")
        
        # 4. Fallback final: MongoDB
        if not matches:
            try:
                query = {"championship_id": championship_id}
                if round_number:
                    query["round_number"] = round_number
                
                cursor = self.db.matches.find(query, {"_id": 0})
                matches = await cursor.to_list(length=1000)
                source = "mongodb"
                logger.info(f"[{championship_id}] Fallback para MongoDB ({len(matches)} partidas)")
            except Exception as e:
                logger.error(f"[{championship_id}] MongoDB falhou: {e}")
                return []
        
        # 5. Atualizar Cache e MongoDB
        if matches and source != "mongodb":
            # Atualizar cache (TTL 10 minutos)
            cache.set(cache_key, matches, ttl_seconds=600)
            
            # Persistir no MongoDB para fallback futuro
            await self._persist_matches(matches)
        
        return matches
    
    async def get_live_scores(self, championship_id: str) -> List[Dict]:
        """Obtém placares ao vivo (cache curto: 1 minuto)"""
        cache_key = f"live_{championship_id}"
        
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        if self.api_football:
            try:
                matches = await self.api_football.get_live_scores(championship_id)
                cache.set(cache_key, matches, ttl_seconds=60)  # TTL curto para live
                return matches
            except Exception as e:
                logger.error(f"Erro ao buscar placares ao vivo: {e}")
        
        return []
    
    async def sync_results(self, championship_id: str) -> Dict:
        """
        Sincroniza resultados e recalcula pontos.
        Chamado pelo job agendado.
        """
        logger.info(f"[{championship_id}] Iniciando sincronização de resultados")
        
        # 1. Salvar posições ANTES de atualizar (para variação de posição)
        await self._save_current_positions(championship_id)
        
        # 2. Buscar dados atualizados
        matches = await self.get_matches(championship_id, force_refresh=True)
        
        # 3. Atualizar partidas finalizadas e calcular pontos
        updated_count = 0
        for match in matches:
            if match.get("is_finished"):
                result = await self.db.matches.update_one(
                    {"match_id": match["match_id"]},
                    {"$set": match},
                    upsert=True
                )
                if result.modified_count > 0:
                    updated_count += 1
                    await self._recalculate_points_for_match(match)
        
        logger.info(f"[{championship_id}] Sincronização concluída: {updated_count} partidas atualizadas")
        
        return {
            "championship_id": championship_id,
            "matches_synced": len(matches),
            "matches_updated": updated_count,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def _persist_matches(self, matches: List[Dict]):
        """Persiste partidas no MongoDB"""
        for match in matches:
            await self.db.matches.update_one(
                {"match_id": match["match_id"]},
                {"$set": match},
                upsert=True
            )
    
    async def _save_current_positions(self, championship_id: str):
        """Salva posições atuais antes de recalcular"""
        pipeline = [
            {"$match": {"championship_id": championship_id, "points": {"$ne": None}}},
            {"$group": {"_id": "$username", "total": {"$sum": "$points"}}},
            {"$sort": {"total": -1}}
        ]
        
        cursor = self.db.predictions.aggregate(pipeline)
        ranking = await cursor.to_list(length=1000)
        
        for position, user in enumerate(ranking, 1):
            await self.db.users.update_one(
                {"username": user["_id"]},
                {"$set": {f"previous_positions.{championship_id}": position}}
            )
    
    async def _recalculate_points_for_match(self, match: Dict):
        """Recalcula pontos dos palpites para uma partida"""
        predictions = await self.db.predictions.find(
            {"match_id": match["match_id"]}
        ).to_list(length=1000)
        
        for pred in predictions:
            points = self._calculate_points(pred, match)
            await self.db.predictions.update_one(
                {"_id": pred["_id"]},
                {"$set": {"points": points}}
            )
    
    def _calculate_points(self, prediction: Dict, match: Dict) -> int:
        """Calcula pontos de um palpite"""
        if not match.get("is_finished"):
            return None
        
        home_pred = prediction.get("home_prediction")
        away_pred = prediction.get("away_prediction")
        home_score = match.get("home_score")
        away_score = match.get("away_score")
        
        if None in [home_pred, away_pred, home_score, away_score]:
            return None
        
        # Placar exato: 5 pontos
        if home_pred == home_score and away_pred == away_score:
            return 5
        
        # Resultado correto: 3 pontos
        pred_result = "home" if home_pred > away_pred else ("away" if away_pred > home_pred else "draw")
        actual_result = "home" if home_score > away_score else ("away" if away_score > home_score else "draw")
        
        if pred_result == actual_result:
            return 3
        
        return 0
```

### 3.5 Scheduler Service (APScheduler)

**Arquivo:** `/app/backend/jobs/scheduler.py`

```python
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime

logger = logging.getLogger("callclub")

class SchedulerService:
    """Gerenciador de jobs agendados"""
    
    def __init__(self, football_service):
        self.scheduler = AsyncIOScheduler()
        self.football_service = football_service
        self._setup_jobs()
    
    def _setup_jobs(self):
        """Configura jobs agendados"""
        
        # Job de sincronização a cada 15 minutos
        self.scheduler.add_job(
            self._sync_all_championships,
            trigger=IntervalTrigger(minutes=15),
            id="sync_championships",
            name="Sincronização de Campeonatos",
            replace_existing=True
        )
        
        logger.info("Jobs agendados configurados")
    
    async def _sync_all_championships(self):
        """Sincroniza todos os campeonatos ativos"""
        logger.info("=== INÍCIO: Job de sincronização automática ===")
        
        try:
            # Buscar campeonatos ativos
            championships = await self.football_service.db.championships.find(
                {"is_active": True},
                {"_id": 0, "championship_id": 1}
            ).to_list(length=100)
            
            results = []
            for champ in championships:
                try:
                    result = await self.football_service.sync_results(champ["championship_id"])
                    results.append(result)
                except Exception as e:
                    logger.error(f"Erro ao sincronizar {champ['championship_id']}: {e}")
            
            logger.info(f"=== FIM: {len(results)} campeonatos sincronizados ===")
            
        except Exception as e:
            logger.error(f"Erro no job de sincronização: {e}")
    
    def start(self):
        """Inicia o scheduler"""
        if not self.scheduler.running:
            self.scheduler.start()
            logger.info("Scheduler iniciado")
    
    def stop(self):
        """Para o scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("Scheduler parado")
    
    def get_jobs_status(self) -> list:
        """Retorna status dos jobs"""
        jobs = []
        for job in self.scheduler.get_jobs():
            jobs.append({
                "id": job.id,
                "name": job.name,
                "next_run": job.next_run_time.isoformat() if job.next_run_time else None,
                "trigger": str(job.trigger)
            })
        return jobs
    
    async def run_sync_now(self, championship_id: str = None):
        """Executa sincronização imediatamente (manual)"""
        if championship_id:
            return await self.football_service.sync_results(championship_id)
        else:
            await self._sync_all_championships()
            return {"message": "Sincronização completa executada"}
```

### 3.6 Logging Configuration

**Arquivo:** `/app/backend/core/logging_config.py`

```python
import logging
import json
from datetime import datetime
from typing import Optional

class JSONFormatter(logging.Formatter):
    """Formatter para logs estruturados em JSON"""
    
    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        
        # Adicionar request_id se disponível
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        
        # Adicionar exception se houver
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        # Adicionar campos extras
        if hasattr(record, "extra_data"):
            log_data["data"] = record.extra_data
        
        return json.dumps(log_data)

def setup_logging(level: str = "INFO") -> logging.Logger:
    """Configura logging para o CallClub"""
    
    logger = logging.getLogger("callclub")
    logger.setLevel(getattr(logging, level.upper()))
    
    # Remover handlers existentes
    logger.handlers.clear()
    
    # Handler para console com JSON
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(JSONFormatter())
    logger.addHandler(console_handler)
    
    # Configurar loggers de bibliotecas externas
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("apscheduler").setLevel(logging.WARNING)
    
    return logger

def get_logger(name: str = "callclub") -> logging.Logger:
    """Obtém logger configurado"""
    return logging.getLogger(name)
```

---

## 4. Integração com server.py Existente

### 4.1 Inicialização (adicionar ao início do server.py)

```python
# Imports adicionais
from services.cache_service import cache
from services.football_data_service import FootballDataService
from jobs.scheduler import SchedulerService
from core.logging_config import setup_logging, get_logger
import os

# Configurar logging
setup_logging(level=os.environ.get("LOG_LEVEL", "INFO"))
logger = get_logger()

# Inicializar serviços (após conexão com DB)
api_football_key = os.environ.get("RAPIDAPI_KEY")
football_service = FootballDataService(db, api_football_key)
scheduler_service = SchedulerService(football_service)

# Iniciar scheduler no startup
@app.on_event("startup")
async def startup_event():
    scheduler_service.start()
    logger.info("CallClub iniciado com sucesso")

@app.on_event("shutdown")
async def shutdown_event():
    scheduler_service.stop()
    logger.info("CallClub encerrado")
```

### 4.2 Endpoints Admin Adicionais

```python
@api_router.post("/admin/sync-now")
async def admin_sync_now(password: str, championship_id: str = None):
    """Força sincronização imediata (manual)"""
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    result = await scheduler_service.run_sync_now(championship_id)
    return result

@api_router.get("/admin/scheduler-status")
async def admin_scheduler_status(password: str):
    """Retorna status dos jobs agendados"""
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    return {
        "jobs": scheduler_service.get_jobs_status(),
        "cache_stats": cache.get_stats()
    }

@api_router.post("/admin/cache-clear")
async def admin_cache_clear(password: str):
    """Limpa o cache"""
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    cache.clear()
    return {"message": "Cache limpo com sucesso"}
```

---

## 5. Variáveis de Ambiente

**Adicionar ao `/app/backend/.env`:**

```env
# API-Football (RapidAPI)
RAPIDAPI_KEY=sua_chave_aqui

# Configurações de sincronização
SYNC_INTERVAL_MINUTES=15
CACHE_TTL_SECONDS=600
LIVE_CACHE_TTL_SECONDS=60

# Logging
LOG_LEVEL=INFO
```

---

## 6. Dependências

**Adicionar ao `requirements.txt`:**

```
apscheduler>=3.10.0
```

---

## 7. Estrutura de Arquivos a Criar

```
/app/backend/
├── services/
│   ├── __init__.py
│   ├── cache_service.py          # Cache em memória
│   └── football_data_service.py  # Orquestrador
├── external/
│   ├── __init__.py
│   ├── api_football.py           # Cliente API-Football
│   └── thesportsdb.py            # Cliente TheSportsDB
├── jobs/
│   ├── __init__.py
│   └── scheduler.py              # APScheduler
├── core/
│   ├── __init__.py
│   └── logging_config.py         # Configuração de logs
└── server.py                     # Modificar para integrar
```

---

## 8. Checklist de Implementação

### Pré-requisitos
- [ ] RAPIDAPI_KEY obtida e validada
- [ ] Autorização do PO para início

### Fase 1A: Infraestrutura Base
- [ ] Criar pasta `/app/backend/services/`
- [ ] Criar pasta `/app/backend/external/`
- [ ] Criar pasta `/app/backend/jobs/`
- [ ] Criar pasta `/app/backend/core/`
- [ ] Criar arquivos `__init__.py` em cada pasta

### Fase 1B: Implementação de Serviços
- [ ] Implementar `cache_service.py`
- [ ] Implementar `logging_config.py`
- [ ] Implementar `api_football.py`
- [ ] Implementar `thesportsdb.py`
- [ ] Implementar `football_data_service.py`
- [ ] Implementar `scheduler.py`

### Fase 1C: Integração
- [ ] Adicionar variáveis ao `.env`
- [ ] Adicionar dependência APScheduler ao `requirements.txt`
- [ ] Integrar serviços ao `server.py`
- [ ] Adicionar endpoints admin

### Fase 1D: Validação
- [ ] Testar cache (hit/miss)
- [ ] Testar API-Football
- [ ] Testar fallback TheSportsDB
- [ ] Testar fallback MongoDB
- [ ] Testar job agendado
- [ ] Testar endpoints admin
- [ ] Validar logs estruturados

---

## 9. Critérios de Sucesso

| Critério | Métrica |
|----------|---------|
| Atualização automática | Job executa a cada 15 min |
| Cache funcionando | Hit rate > 50% após warm-up |
| Fallback funcionando | Sistema não quebra se API falhar |
| Logs estruturados | Todos os eventos importantes logados em JSON |
| Admin manual mantido | Botões existentes continuam funcionando |
| Zero regressão | Funcionalidades existentes não quebram |

---

## 10. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| API-Football rate limit | Média | Alto | Fallback para TheSportsDB |
| Cache memory leak | Baixa | Médio | TTL automático limpa itens |
| Job falha silenciosamente | Média | Alto | Logging robusto + alertas |
| Dados inconsistentes | Baixa | Alto | Validação antes de persistir |

---

**Documento pronto para próximo agente.**

**Requer antes de iniciar:**
1. RAPIDAPI_KEY válida
2. Autorização explícita do PO

