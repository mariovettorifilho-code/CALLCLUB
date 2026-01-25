"""
CallClub - Backend API
Nova arquitetura global com sistema de planos (FREE/PREMIUM/VIP)
"""
from fastapi import FastAPI, APIRouter, HTTPException, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import Optional, List
import httpx
import uuid
import random
import string

# Importa schemas
from models.schemas import (
    PlanType, PLAN_LIMITS, COUNTRY_NATIONAL_CHAMPIONSHIP,
    UserLogin, UserUpdateCountry, PredictionCreate, AdminLogin,
    AdminAddUser, AdminUpdatePlan, ChampionshipCreate, LeagueCreate, LeagueJoin
)

# Importa serviços
from services.country_detector import detect_country_by_ip, get_supported_countries
from services.league_service import (
    create_league, join_league_by_code, leave_league, 
    delete_league, get_league_ranking, generate_invite_code
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="CallClub API", version="2.0.0")
api_router = APIRouter(prefix="/api")

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== CONFIGURAÇÃO ====================

ADMIN_PASSWORD = "callclub2026"

# Usuários autorizados com PIN (mantido para compatibilidade)
AUTHORIZED_USERS = {
    "Mario": "2412",
    "Marcos": "6969",
    "João": "3456",
    "Pedro": "4567",
    "Carlos": "1234",
    "Lucas": "6789",
    "Rafael": "7890",
    "Bruno": "8901",
    "Fernando": "9012",
    "Ricardo": "0123",
    "Paulo": "1111",
    "Anderson": "2222",
    "Gabriel": "3333",
    "Felipe": "4444",
    "Rodrigo": "5555",
    "Thiago": "6666",
    "Marcelo": "7777",
    "Diego": "8888",
    "Matheus": "9999",
    "Vinicius": "1010",
    "Gustavo": "2020",
    "Leonardo": "3030",
    "André": "4040",
    "Alexandre": "5050",
    "Renato": "6060",
    "Fabio": "7070",
}

# Campeonatos iniciais (para seed)
INITIAL_CHAMPIONSHIPS = {
    "brasileirao": {
        "championship_id": "brasileirao",
        "name": "Campeonato Brasileiro",
        "country": "BR",
        "api_id": "4351",
        "is_national": True,
        "season": "2026",
        "total_rounds": 38
    },
    "serie_a": {
        "championship_id": "serie_a",
        "name": "Serie A",
        "country": "IT",
        "api_id": "4332",
        "is_national": True,
        "season": "2024-2025",
        "total_rounds": 38
    },
    "la_liga": {
        "championship_id": "la_liga",
        "name": "La Liga",
        "country": "ES",
        "api_id": "4335",
        "is_national": True,
        "season": "2024-2025",
        "total_rounds": 38
    },
    "premier_league": {
        "championship_id": "premier_league",
        "name": "Premier League",
        "country": "EN",
        "api_id": "4328",
        "is_national": True,
        "season": "2024-2025",
        "total_rounds": 38
    },
    "bundesliga": {
        "championship_id": "bundesliga",
        "name": "Bundesliga",
        "country": "DE",
        "api_id": "4331",
        "is_national": True,
        "season": "2024-2025",
        "total_rounds": 34
    },
    "ligue_1": {
        "championship_id": "ligue_1",
        "name": "Ligue 1",
        "country": "FR",
        "api_id": "4334",
        "is_national": True,
        "season": "2024-2025",
        "total_rounds": 34
    },
    "libertadores": {
        "championship_id": "libertadores",
        "name": "Copa Libertadores",
        "country": "SA",  # South America
        "api_id": "4480",
        "is_national": False,
        "season": "2026",
        "total_rounds": 6  # Fase de grupos
    },
    "champions_league": {
        "championship_id": "champions_league",
        "name": "UEFA Champions League",
        "country": "EU",
        "api_id": "4480",
        "is_national": False,
        "season": "2024-2025",
        "total_rounds": 8
    }
}


# ==================== HEALTH CHECK ====================
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "2.0.0"}


# ==================== HELPER FUNCTIONS ====================
def calculate_points(prediction: dict, match: dict) -> int:
    """Calcula pontos: 3 pts (resultado) + 1 pt (gols mandante) + 1 pt (gols visitante)"""
    if not match.get('is_finished'):
        return 0
    
    points = 0
    home_real = match.get('home_score')
    away_real = match.get('away_score')
    home_pred = prediction.get('home_prediction')
    away_pred = prediction.get('away_prediction')
    
    if home_real is None or away_real is None:
        return 0
    
    # Resultado correto (V/E/D): 3 pontos
    real_result = 'H' if home_real > away_real else ('A' if away_real > home_real else 'D')
    pred_result = 'H' if home_pred > away_pred else ('A' if away_pred > home_pred else 'D')
    if real_result == pred_result:
        points += 3
    
    # Gols mandante: 1 ponto
    if home_real == home_pred:
        points += 1
    
    # Gols visitante: 1 ponto
    if away_real == away_pred:
        points += 1
    
    return points


def get_user_national_championship(country: str) -> str:
    """Retorna o campeonato nacional do país do usuário"""
    return COUNTRY_NATIONAL_CHAMPIONSHIP.get(country, "brasileirao")


async def check_user_can_access_championship(username: str, championship_id: str) -> bool:
    """Verifica se usuário pode acessar um campeonato"""
    user = await db.users.find_one({"username": username})
    if not user:
        return False
    
    plan = user.get("plan", "free")
    country = user.get("country", "BR")
    
    # Campeonato nacional sempre liberado
    national = get_user_national_championship(country)
    if championship_id == national:
        return True
    
    # Premium/VIP pode acessar extras
    if plan in ["premium", "vip"]:
        extras = user.get("extra_championships", [])
        if championship_id in extras:
            return True
        
        # Verifica ligas que participa
        joined = user.get("joined_leagues", [])
        for league_id in joined:
            league = await db.leagues.find_one({"league_id": league_id})
            if league and league.get("championship_id") == championship_id:
                return True
    
    return False


# ==================== AUTENTICAÇÃO ====================
@api_router.post("/auth/check-name")
async def check_name(data: UserLogin, request: Request):
    """Login por nome e PIN"""
    if data.username not in AUTHORIZED_USERS:
        raise HTTPException(status_code=403, detail="Nome não autorizado. Entre em contato com o administrador.")
    
    if AUTHORIZED_USERS[data.username] != data.pin:
        raise HTTPException(status_code=403, detail="PIN incorreto. Tente novamente.")
    
    user = await db.users.find_one({"username": data.username}, {"_id": 0})
    
    if user and user.get("is_banned"):
        raise HTTPException(status_code=403, detail="🚫 Sua conta foi suspensa.")
    
    # Detecta país por IP se for novo usuário
    client_ip = request.client.host if request.client else "127.0.0.1"
    detected_country = await detect_country_by_ip(client_ip)
    
    if not user:
        # Novo usuário - todos são PREMIUM (pioneiros beta)
        total_users = await db.users.count_documents({})
        pioneer_num = total_users + 1 if total_users < 100 else None
        
        user = {
            "username": data.username,
            "plan": "premium",  # Beta testers são premium
            "country": detected_country,
            "total_points": 0,
            "owned_leagues": [],
            "joined_leagues": [],
            "extra_championships": [],
            "achievements": ["pioneer", "beta_tester"] if pioneer_num else ["beta_tester"],
            "pioneer_number": pioneer_num,
            "is_banned": False,
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(user)
    
    # Remove _id antes de retornar
    user.pop("_id", None)
    
    return {
        "success": True, 
        "username": data.username,
        "user": user
    }


@api_router.post("/auth/update-country")
async def update_user_country(data: UserUpdateCountry):
    """Atualiza país do usuário manualmente"""
    supported = [c["code"] for c in get_supported_countries()]
    if data.country not in supported:
        raise HTTPException(status_code=400, detail="País não suportado")
    
    result = await db.users.update_one(
        {"username": data.username},
        {"$set": {"country": data.country}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Retorna campeonato nacional do novo país
    national = get_user_national_championship(data.country)
    
    return {
        "success": True,
        "country": data.country,
        "national_championship": national
    }


@api_router.get("/countries")
async def get_countries():
    """Lista países suportados"""
    return get_supported_countries()


# ==================== USUÁRIO ====================
@api_router.get("/user/{username}")
async def get_user_profile(username: str):
    """Retorna perfil completo do usuário"""
    user = await db.users.find_one({"username": username}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Busca campeonato nacional
    country = user.get("country", "BR")
    national_champ = get_user_national_championship(country)
    
    # Busca ligas
    joined_leagues = []
    for league_id in user.get("joined_leagues", []):
        league = await db.leagues.find_one({"league_id": league_id}, {"_id": 0})
        if league:
            joined_leagues.append(league)
    
    # Busca palpites recentes
    predictions = await db.predictions.find(
        {"username": username},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    # Enriquece palpites com dados das partidas
    enriched_predictions = []
    for pred in predictions:
        match = await db.matches.find_one({"match_id": pred["match_id"]}, {"_id": 0})
        if match:
            enriched_predictions.append({
                **pred,
                "home_team": match.get("home_team", "?"),
                "away_team": match.get("away_team", "?"),
                "home_score": match.get("home_score"),
                "away_score": match.get("away_score"),
                "is_finished": match.get("is_finished", False),
                "match_date": match.get("match_date")
            })
    
    # Calcula estatísticas
    preds_with_points = [p for p in predictions if p.get("points") is not None]
    total_points = sum(p.get("points", 0) for p in preds_with_points)
    perfect_scores = sum(1 for p in preds_with_points if p.get("points") == 5)
    
    # Limites do plano
    plan = user.get("plan", "free")
    plan_limits = PLAN_LIMITS.get(PlanType(plan), PLAN_LIMITS[PlanType.FREE])
    
    return {
        "user": user,
        "national_championship": national_champ,
        "joined_leagues": joined_leagues,
        "predictions": enriched_predictions,
        "statistics": {
            "total_points": total_points,
            "perfect_scores": perfect_scores,
            "games_played": len(preds_with_points)
        },
        "plan_info": {
            "plan": plan,
            "limits": plan_limits
        }
    }


@api_router.get("/user/{username}/accessible-championships")
async def get_user_accessible_championships(username: str):
    """Retorna campeonatos que o usuário pode acessar"""
    user = await db.users.find_one({"username": username}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    country = user.get("country", "BR")
    plan = user.get("plan", "free")
    national_id = get_user_national_championship(country)
    
    # Busca campeonato nacional
    accessible = []
    
    national = await db.championships.find_one({"championship_id": national_id}, {"_id": 0})
    if national:
        national["access_type"] = "national"
        accessible.append(national)
    
    # Premium/VIP: extras e ligas
    if plan in ["premium", "vip"]:
        # Campeonatos extras
        for champ_id in user.get("extra_championships", []):
            champ = await db.championships.find_one({"championship_id": champ_id}, {"_id": 0})
            if champ:
                champ["access_type"] = "extra"
                accessible.append(champ)
        
        # Campeonatos das ligas
        for league_id in user.get("joined_leagues", []):
            league = await db.leagues.find_one({"league_id": league_id}, {"_id": 0})
            if league:
                champ = await db.championships.find_one(
                    {"championship_id": league.get("championship_id")}, 
                    {"_id": 0}
                )
                if champ and champ not in accessible:
                    champ["access_type"] = "league"
                    champ["league_name"] = league.get("name")
                    accessible.append(champ)
    
    return accessible


# ==================== CAMPEONATOS ====================
@api_router.get("/championships")
async def get_championships():
    """Lista todos os campeonatos disponíveis no sistema"""
    championships = await db.championships.find(
        {"is_active": True}, 
        {"_id": 0}
    ).to_list(100)
    return championships


@api_router.get("/championships/{championship_id}")
async def get_championship(championship_id: str):
    """Detalhes de um campeonato específico"""
    champ = await db.championships.find_one(
        {"championship_id": championship_id},
        {"_id": 0}
    )
    if not champ:
        raise HTTPException(status_code=404, detail="Campeonato não encontrado")
    return champ


@api_router.get("/championships/country/{country}")
async def get_championships_by_country(country: str):
    """Lista campeonatos de um país específico"""
    championships = await db.championships.find(
        {"country": country, "is_active": True},
        {"_id": 0}
    ).to_list(100)
    return championships


# ==================== LIGAS ====================
@api_router.post("/leagues/create")
async def create_new_league(data: LeagueCreate):
    """Cria uma nova liga (requer premium)"""
    user = await db.users.find_one({"username": data.owner_username})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    plan = user.get("plan", "free")
    if plan == "free":
        raise HTTPException(status_code=403, detail="Usuários FREE não podem criar ligas. Faça upgrade para PREMIUM!")
    
    # Verifica limite de ligas
    owned = user.get("owned_leagues", [])
    limits = PLAN_LIMITS.get(PlanType(plan), PLAN_LIMITS[PlanType.FREE])
    max_leagues = limits.get("max_leagues_owned", 0)
    
    if max_leagues != -1 and len(owned) >= max_leagues:
        raise HTTPException(
            status_code=403, 
            detail=f"Limite de {max_leagues} ligas atingido para seu plano"
        )
    
    # Verifica se campeonato existe
    champ = await db.championships.find_one({"championship_id": data.championship_id})
    if not champ:
        raise HTTPException(status_code=404, detail="Campeonato não encontrado")
    
    league = await create_league(db, data.name, data.owner_username, data.championship_id)
    league.pop("_id", None)
    
    return {"success": True, "league": league}


@api_router.post("/leagues/join")
async def join_league(data: LeagueJoin):
    """Entra em uma liga pelo código de convite"""
    result = await join_league_by_code(db, data.username, data.invite_code)
    
    if not result:
        raise HTTPException(status_code=404, detail="Liga não encontrada ou código inválido")
    
    if result.get("error") == "already_member":
        raise HTTPException(status_code=400, detail="Você já é membro desta liga")
    
    if result.get("error") == "league_full":
        raise HTTPException(status_code=400, detail="Liga cheia")
    
    league = result.get("league", {})
    league.pop("_id", None)
    
    return {"success": True, "league": league}


@api_router.post("/leagues/{league_id}/leave")
async def leave_league_endpoint(league_id: str, username: str):
    """Sai de uma liga"""
    success = await leave_league(db, username, league_id)
    if not success:
        raise HTTPException(status_code=400, detail="Não foi possível sair da liga")
    return {"success": True}


@api_router.get("/leagues/{league_id}")
async def get_league(league_id: str):
    """Detalhes de uma liga"""
    league = await db.leagues.find_one({"league_id": league_id}, {"_id": 0})
    if not league:
        raise HTTPException(status_code=404, detail="Liga não encontrada")
    
    # Busca ranking da liga
    ranking = await get_league_ranking(db, league_id, league.get("championship_id"))
    
    return {"league": league, "ranking": ranking}


@api_router.get("/leagues/user/{username}")
async def get_user_leagues(username: str):
    """Lista ligas do usuário"""
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    joined_ids = user.get("joined_leagues", [])
    leagues = await db.leagues.find(
        {"league_id": {"$in": joined_ids}},
        {"_id": 0}
    ).to_list(100)
    
    return leagues


# ==================== PARTIDAS ====================
@api_router.get("/matches/next")
async def get_next_match(championship_id: str = "brasileirao"):
    """Retorna o próximo jogo não finalizado"""
    now_brasilia = datetime.now(timezone.utc) - timedelta(hours=3)
    now_str = now_brasilia.strftime("%Y-%m-%dT%H:%M:%S")
    
    next_match = await db.matches.find_one(
        {
            "championship_id": championship_id,
            "is_finished": False,
            "match_date": {"$gt": now_str}
        },
        {"_id": 0},
        sort=[("match_date", 1)]
    )
    
    if not next_match:
        next_match = await db.matches.find_one(
            {"championship_id": championship_id, "is_finished": False},
            {"_id": 0},
            sort=[("match_date", 1)]
        )
    
    return next_match


@api_router.get("/matches/{round_number}")
async def get_matches(round_number: int, championship_id: str = "brasileirao"):
    """Retorna jogos de uma rodada"""
    matches = await db.matches.find(
        {"round_number": round_number, "championship_id": championship_id},
        {"_id": 0}
    ).sort("match_date", 1).to_list(100)
    return matches


@api_router.get("/matches/popular-predictions/batch")
async def get_popular_predictions_batch(match_ids: str):
    """Retorna palpites mais votados para múltiplos jogos"""
    ids_list = match_ids.split(",")
    
    pipeline = [
        {"$match": {"match_id": {"$in": ids_list}}},
        {"$group": {
            "_id": {
                "match_id": "$match_id",
                "home": "$home_prediction", 
                "away": "$away_prediction"
            },
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id.match_id": 1, "count": -1}}
    ]
    
    results = await db.predictions.aggregate(pipeline).to_list(1000)
    
    popular_by_match = {}
    for r in results:
        mid = r["_id"]["match_id"]
        if mid not in popular_by_match:
            popular_by_match[mid] = {
                "home_prediction": r["_id"]["home"],
                "away_prediction": r["_id"]["away"],
                "count": r["count"]
            }
    
    return popular_by_match


# ==================== RODADAS ====================
@api_router.get("/rounds/current")
async def get_current_round(championship_id: str = "brasileirao"):
    """Retorna a rodada atual"""
    next_unfinished = await db.matches.find_one(
        {"championship_id": championship_id, "is_finished": False},
        sort=[("round_number", 1), ("match_date", 1)]
    )
    
    if next_unfinished:
        current_round = next_unfinished.get("round_number", 1)
    else:
        last_match = await db.matches.find_one(
            {"championship_id": championship_id},
            sort=[("round_number", -1)]
        )
        current_round = last_match.get("round_number", 1) if last_match else 1
    
    return {
        "championship_id": championship_id,
        "round_number": current_round
    }


@api_router.get("/rounds/all")
async def get_all_rounds(championship_id: str = "brasileirao"):
    """Retorna todas as rodadas"""
    champ = await db.championships.find_one({"championship_id": championship_id})
    total_rounds = champ.get("total_rounds", 38) if champ else 38
    
    current_data = await get_current_round(championship_id)
    current = current_data.get("round_number", 1)
    
    rounds = []
    for rn in range(1, total_rounds + 1):
        rounds.append({
            "championship_id": championship_id,
            "round_number": rn,
            "is_current": rn == current
        })
    
    return rounds


# ==================== PALPITES ====================
@api_router.post("/predictions")
async def create_prediction(pred: PredictionCreate):
    """Salva um palpite"""
    if pred.username not in AUTHORIZED_USERS:
        raise HTTPException(status_code=403, detail="Usuário não autorizado")
    
    # Verifica se já existe
    existing = await db.predictions.find_one({
        "username": pred.username,
        "match_id": pred.match_id
    })
    
    if existing:
        await db.predictions.update_one(
            {"username": pred.username, "match_id": pred.match_id},
            {"$set": {
                "home_prediction": pred.home_prediction,
                "away_prediction": pred.away_prediction,
                "championship_id": pred.championship_id,
                "league_id": pred.league_id
            }}
        )
    else:
        await db.predictions.insert_one({
            "username": pred.username,
            "match_id": pred.match_id,
            "championship_id": pred.championship_id,
            "league_id": pred.league_id,
            "round_number": pred.round_number,
            "home_prediction": pred.home_prediction,
            "away_prediction": pred.away_prediction,
            "points": None,
            "created_at": datetime.now(timezone.utc)
        })
    
    return {"success": True}


@api_router.get("/predictions/{username}")
async def get_user_predictions(username: str, round_number: int, championship_id: str = "brasileirao"):
    """Retorna palpites do usuário"""
    predictions = await db.predictions.find({
        "username": username,
        "round_number": round_number,
        "championship_id": championship_id
    }, {"_id": 0}).to_list(100)
    return predictions


# ==================== RANKINGS ====================
@api_router.get("/ranking/detailed/{championship_id}")
async def get_detailed_ranking(championship_id: str):
    """Ranking detalhado por campeonato"""
    champ = await db.championships.find_one({"championship_id": championship_id})
    total_rounds = champ.get("total_rounds", 38) if champ else 38
    
    # Rodada atual
    current_data = await get_current_round(championship_id)
    current_round = current_data.get("round_number", 1)
    
    # Busca palpites do campeonato
    predictions = await db.predictions.find(
        {"championship_id": championship_id},
        {"_id": 0}
    ).to_list(10000)
    
    # Busca partidas finalizadas
    matches = await db.matches.find(
        {"championship_id": championship_id},
        {"_id": 0}
    ).to_list(1000)
    matches_dict = {m['match_id']: m for m in matches}
    
    # Busca info dos usuários
    users = await db.users.find({}, {"_id": 0, "username": 1, "plan": 1, "pioneer_number": 1}).to_list(1000)
    user_info = {u['username']: u for u in users}
    
    # Calcula estatísticas por usuário
    user_stats = {}
    for pred in predictions:
        username = pred['username']
        match = matches_dict.get(pred['match_id'], {})
        
        if username not in user_stats:
            user_stats[username] = {
                "username": username,
                "total_points": 0,
                "correct_results": 0,
                "correct_home_goals": 0,
                "correct_away_goals": 0,
                "exact_scores": 0,
                "total_predictions": 0,
                "plan": user_info.get(username, {}).get('plan', 'free'),
                "pioneer_number": user_info.get(username, {}).get('pioneer_number')
            }
        
        if match.get('is_finished') and pred.get('points') is not None:
            user_stats[username]['total_predictions'] += 1
            points = pred.get('points', 0)
            user_stats[username]['total_points'] += points
            
            home_pred = pred.get('home_prediction')
            away_pred = pred.get('away_prediction')
            home_score = match.get('home_score')
            away_score = match.get('away_score')
            
            if home_score is not None and away_score is not None:
                pred_result = 'home' if home_pred > away_pred else ('away' if away_pred > home_pred else 'draw')
                actual_result = 'home' if home_score > away_score else ('away' if away_score > home_score else 'draw')
                
                if pred_result == actual_result:
                    user_stats[username]['correct_results'] += 1
                if home_pred == home_score:
                    user_stats[username]['correct_home_goals'] += 1
                if away_pred == away_score:
                    user_stats[username]['correct_away_goals'] += 1
                if home_pred == home_score and away_pred == away_score:
                    user_stats[username]['exact_scores'] += 1
    
    # Calcula aproveitamento
    for stats in user_stats.values():
        if stats['total_predictions'] > 0:
            max_possible = stats['total_predictions'] * 5
            stats['efficiency'] = round((stats['total_points'] / max_possible) * 100, 1)
        else:
            stats['efficiency'] = 0
    
    # Ordena ranking
    ranking = sorted(
        user_stats.values(),
        key=lambda x: (x['total_points'], x['exact_scores'], x['correct_results']),
        reverse=True
    )
    
    for i, user in enumerate(ranking):
        user['position'] = i + 1
    
    return {
        "championship_id": championship_id,
        "current_round": current_round,
        "total_rounds": total_rounds,
        "ranking": ranking
    }


@api_router.get("/ranking/round/{round_number}")
async def get_round_ranking(round_number: int, championship_id: str = "brasileirao"):
    """Ranking de uma rodada específica"""
    predictions = await db.predictions.find({
        "round_number": round_number,
        "championship_id": championship_id
    }, {"_id": 0}).to_list(1000)
    
    user_points = {}
    for pred in predictions:
        username = pred['username']
        points = pred.get('points') or 0
        if username not in user_points:
            user_points[username] = {"username": username, "points": 0, "perfect_count": 0}
        user_points[username]['points'] += points
        if points == 5:
            user_points[username]['perfect_count'] += 1
    
    ranking = sorted(user_points.values(), key=lambda x: x['points'], reverse=True)
    return ranking


@api_router.get("/ranking/league/{league_id}")
async def get_league_ranking_endpoint(league_id: str):
    """Ranking de uma liga específica"""
    league = await db.leagues.find_one({"league_id": league_id}, {"_id": 0})
    if not league:
        raise HTTPException(status_code=404, detail="Liga não encontrada")
    
    ranking = await get_league_ranking(db, league_id, league.get("championship_id"))
    
    return {
        "league": league,
        "ranking": ranking
    }


# ==================== ADMIN ====================
@api_router.post("/admin/login")
async def admin_login(data: AdminLogin):
    """Login do admin"""
    if data.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Senha incorreta")
    return {"success": True}


@api_router.get("/admin/users")
async def admin_get_users(password: str):
    """Lista todos os usuários"""
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    
    for user in users:
        user["pin"] = AUTHORIZED_USERS.get(user.get("username"), "N/A")
    
    return users


@api_router.get("/admin/stats")
async def admin_get_stats(password: str):
    """Estatísticas gerais"""
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    total_users = await db.users.count_documents({})
    premium_users = await db.users.count_documents({"plan": "premium"})
    vip_users = await db.users.count_documents({"plan": "vip"})
    free_users = await db.users.count_documents({"plan": "free"})
    total_predictions = await db.predictions.count_documents({})
    total_matches = await db.matches.count_documents({})
    total_leagues = await db.leagues.count_documents({})
    total_championships = await db.championships.count_documents({})
    
    return {
        "total_users": total_users,
        "premium_users": premium_users,
        "vip_users": vip_users,
        "free_users": free_users,
        "total_predictions": total_predictions,
        "total_matches": total_matches,
        "total_leagues": total_leagues,
        "total_championships": total_championships
    }


@api_router.post("/admin/add-user")
async def admin_add_user(data: AdminAddUser):
    """Adiciona novo usuário"""
    if data.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    if data.username in AUTHORIZED_USERS:
        raise HTTPException(status_code=400, detail="Usuário já existe")
    
    AUTHORIZED_USERS[data.username] = data.pin
    
    total = await db.users.count_documents({})
    pioneer = total + 1 if total < 100 else None
    
    await db.users.insert_one({
        "username": data.username,
        "plan": data.plan,
        "country": data.country,
        "total_points": 0,
        "owned_leagues": [],
        "joined_leagues": [],
        "extra_championships": [],
        "achievements": ["pioneer"] if pioneer else [],
        "pioneer_number": pioneer,
        "is_banned": False,
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"success": True, "pioneer_number": pioneer}


@api_router.post("/admin/update-plan")
async def admin_update_plan(data: AdminUpdatePlan):
    """Atualiza plano de um usuário"""
    if data.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    result = await db.users.update_one(
        {"username": data.username},
        {"$set": {"plan": data.plan}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Log
    await db.security_logs.insert_one({
        "type": "plan_updated",
        "username": data.username,
        "new_plan": data.plan,
        "timestamp": datetime.now(timezone.utc)
    })
    
    return {"success": True}


@api_router.post("/admin/add-championship")
async def admin_add_championship(data: AdminAddChampionship):
    """Adiciona novo campeonato"""
    if data.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    champ = data.championship
    
    existing = await db.championships.find_one({"championship_id": champ.championship_id})
    if existing:
        raise HTTPException(status_code=400, detail="Campeonato já existe")
    
    await db.championships.insert_one({
        "championship_id": champ.championship_id,
        "name": champ.name,
        "country": champ.country,
        "api_id": champ.api_id,
        "is_national": champ.is_national,
        "season": champ.season,
        "total_rounds": champ.total_rounds,
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"success": True}


@api_router.get("/admin/championships")
async def admin_get_championships(password: str):
    """Lista campeonatos para admin"""
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    championships = await db.championships.find({}, {"_id": 0}).to_list(100)
    return championships


@api_router.get("/admin/leagues")
async def admin_get_leagues(password: str):
    """Lista ligas para admin"""
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    leagues = await db.leagues.find({}, {"_id": 0}).to_list(1000)
    return leagues


@api_router.get("/admin/security-logs")
async def admin_get_security_logs(password: str):
    """Lista logs de segurança"""
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    logs = await db.security_logs.find({}, {"_id": 0}).sort("timestamp", -1).to_list(100)
    return logs


# ==================== SYNC & MAINTENANCE ====================
@api_router.get("/admin/init-championships")
async def init_championships(password: str):
    """Inicializa campeonatos no banco"""
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    created = 0
    for champ_id, champ_data in INITIAL_CHAMPIONSHIPS.items():
        existing = await db.championships.find_one({"championship_id": champ_id})
        if not existing:
            await db.championships.insert_one({
                **champ_data,
                "is_active": True,
                "created_at": datetime.now(timezone.utc)
            })
            created += 1
    
    return {"success": True, "championships_created": created}


@api_router.get("/admin/force-populate")
async def force_populate_matches(password: str, championship_id: str = "brasileirao"):
    """Popula partidas de um campeonato da API"""
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    champ = await db.championships.find_one({"championship_id": championship_id})
    if not champ:
        raise HTTPException(status_code=404, detail="Campeonato não encontrado")
    
    api_id = champ.get("api_id")
    season = champ.get("season", "2026")
    total_rounds = champ.get("total_rounds", 38)
    
    results = {"matches_created": 0, "matches_updated": 0, "errors": []}
    
    async with httpx.AsyncClient(timeout=120.0) as http_client:
        for round_num in range(1, total_rounds + 1):
            try:
                url = f"https://www.thesportsdb.com/api/v1/json/3/eventsround.php?id={api_id}&r={round_num}&s={season}"
                response = await http_client.get(url)
                data = response.json()
                
                if data and data.get("events"):
                    for event in data["events"]:
                        match_id = str(event["idEvent"])
                        
                        home_score = None
                        away_score = None
                        is_finished = False
                        
                        if event.get("intHomeScore") not in [None, ""]:
                            try:
                                home_score = int(event["intHomeScore"])
                                away_score = int(event.get("intAwayScore") or 0)
                                is_finished = True
                            except:
                                pass
                        
                        # Converte horário UTC para Brasília
                        match_date_str = event.get("dateEvent", "")
                        match_time_str = event.get("strTime", "00:00:00")
                        if match_time_str and match_date_str:
                            try:
                                utc_dt = datetime.strptime(f"{match_date_str} {match_time_str[:8]}", "%Y-%m-%d %H:%M:%S")
                                brasilia_dt = utc_dt - timedelta(hours=3)
                                match_date_str = brasilia_dt.strftime("%Y-%m-%dT%H:%M:%S")
                            except:
                                match_date_str = f"{match_date_str}T{match_time_str[:5]}:00"
                        
                        match_data = {
                            "match_id": match_id,
                            "championship_id": championship_id,
                            "round_number": round_num,
                            "home_team": event.get("strHomeTeam", ""),
                            "away_team": event.get("strAwayTeam", ""),
                            "home_badge": event.get("strHomeTeamBadge", ""),
                            "away_badge": event.get("strAwayTeamBadge", ""),
                            "match_date": match_date_str,
                            "home_score": home_score,
                            "away_score": away_score,
                            "is_finished": is_finished,
                            "venue": event.get("strVenue", "")
                        }
                        
                        result = await db.matches.update_one(
                            {"match_id": match_id},
                            {"$set": match_data},
                            upsert=True
                        )
                        
                        if result.upserted_id:
                            results["matches_created"] += 1
                        elif result.modified_count > 0:
                            results["matches_updated"] += 1
                            
            except Exception as e:
                results["errors"].append(f"R{round_num}: {str(e)}")
    
    return {"success": True, "results": results}


@api_router.post("/admin/sync-results")
async def sync_results():
    """Sincroniza resultados e recalcula pontos"""
    championships = await db.championships.find({"is_active": True}, {"_id": 0}).to_list(100)
    
    updated_matches = 0
    
    async with httpx.AsyncClient(timeout=60.0) as http_client:
        for champ in championships:
            api_id = champ.get("api_id")
            season = champ.get("season", "2026")
            total_rounds = champ.get("total_rounds", 38)
            champ_id = champ.get("championship_id")
            
            for round_num in range(1, total_rounds + 1):
                try:
                    url = f"https://www.thesportsdb.com/api/v1/json/3/eventsround.php?id={api_id}&r={round_num}&s={season}"
                    response = await http_client.get(url)
                    data = response.json()
                    
                    if data and data.get("events"):
                        for event in data["events"]:
                            match_id = str(event["idEvent"])
                            
                            home_score_raw = event.get("intHomeScore")
                            away_score_raw = event.get("intAwayScore")
                            
                            if home_score_raw not in [None, ""] and away_score_raw not in [None, ""]:
                                try:
                                    home_score = int(home_score_raw)
                                    away_score = int(away_score_raw)
                                    
                                    result = await db.matches.update_one(
                                        {"match_id": match_id},
                                        {"$set": {
                                            "home_score": home_score,
                                            "away_score": away_score,
                                            "is_finished": True
                                        }}
                                    )
                                    if result.modified_count > 0:
                                        updated_matches += 1
                                except:
                                    pass
                except Exception as e:
                    logger.error(f"Erro sync {champ_id} R{round_num}: {e}")
    
    # Recalcula pontos
    users_updated = await recalculate_all_points()
    
    return {"success": True, "matches_updated": updated_matches, "users_recalculated": users_updated}


@api_router.post("/admin/recalculate-points")
async def admin_recalculate():
    """Força recálculo de pontos"""
    count = await recalculate_all_points()
    return {"success": True, "users_updated": count}


async def recalculate_all_points():
    """Recalcula pontos de todos os usuários"""
    finished_matches = await db.matches.find({"is_finished": True}, {"_id": 0}).to_list(10000)
    matches_dict = {m['match_id']: m for m in finished_matches}
    
    all_predictions = await db.predictions.find({}).to_list(100000)
    
    user_stats = {}
    
    for pred in all_predictions:
        username = pred['username']
        match_id = pred['match_id']
        
        if username not in user_stats:
            user_stats[username] = {'total_points': 0}
        
        if match_id in matches_dict:
            match = matches_dict[match_id]
            points = calculate_points(pred, match)
            
            await db.predictions.update_one(
                {"_id": pred["_id"]},
                {"$set": {"points": points}}
            )
            
            user_stats[username]['total_points'] += points
    
    for username, stats in user_stats.items():
        await db.users.update_one(
            {"username": username},
            {"$set": {"total_points": stats['total_points']}},
            upsert=True
        )
    
    return len(user_stats)


@api_router.get("/admin/migrate-users-to-premium")
async def migrate_users_to_premium(password: str):
    """Migra todos os usuários existentes para PREMIUM (pioneiros beta)"""
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    result = await db.users.update_many(
        {},
        {
            "$set": {"plan": "premium"},
            "$addToSet": {"achievements": "beta_tester"}
        }
    )
    
    return {"success": True, "users_updated": result.modified_count}


@api_router.get("/admin/migrate-championship-field")
async def migrate_championship_field(password: str):
    """Migra campo 'championship' para 'championship_id' nos matches e predictions"""
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    # Migra matches
    matches_updated = 0
    async for match in db.matches.find({"championship": {"$exists": True}}):
        old_champ = match.get("championship")
        await db.matches.update_one(
            {"_id": match["_id"]},
            {
                "$set": {"championship_id": old_champ},
                "$unset": {"championship": ""}
            }
        )
        matches_updated += 1
    
    # Migra predictions
    preds_updated = 0
    async for pred in db.predictions.find({"championship": {"$exists": True}}):
        old_champ = pred.get("championship")
        await db.predictions.update_one(
            {"_id": pred["_id"]},
            {
                "$set": {"championship_id": old_champ},
                "$unset": {"championship": ""}
            }
        )
        preds_updated += 1
    
    return {
        "success": True, 
        "matches_updated": matches_updated,
        "predictions_updated": preds_updated
    }


@api_router.get("/admin/remove-carioca")
async def remove_carioca_data(password: str):
    """Remove todos os dados do Campeonato Carioca"""
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    # Remove matches
    matches_result = await db.matches.delete_many({
        "$or": [
            {"championship": "carioca"},
            {"championship_id": "carioca"}
        ]
    })
    
    # Remove predictions
    preds_result = await db.predictions.delete_many({
        "$or": [
            {"championship": "carioca"},
            {"championship_id": "carioca"}
        ]
    })
    
    # Remove rounds
    rounds_result = await db.rounds.delete_many({
        "$or": [
            {"championship": "carioca"},
            {"championship_id": "carioca"}
        ]
    })
    
    # Remove campeonato
    champ_result = await db.championships.delete_many({"championship_id": "carioca"})
    
    return {
        "success": True,
        "matches_deleted": matches_result.deleted_count,
        "predictions_deleted": preds_result.deleted_count,
        "rounds_deleted": rounds_result.deleted_count,
        "championship_deleted": champ_result.deleted_count
    }


# ==================== COMPATIBILIDADE ====================
# Endpoints mantidos para compatibilidade com frontend antigo

@api_router.get("/premium/status/{username}")
async def get_premium_status(username: str):
    """Verifica status premium (compatibilidade)"""
    user = await db.users.find_one({"username": username}, {"_id": 0})
    if not user:
        return {"username": username, "is_premium": False, "plan": "free"}
    
    plan = user.get("plan", "free")
    return {
        "username": username,
        "is_premium": plan in ["premium", "vip"],
        "plan": plan
    }


# ==================== CORS ====================
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registra router
app.include_router(api_router)


# ==================== STARTUP ====================
@app.on_event("startup")
async def startup_event():
    """Inicialização da aplicação"""
    logger.info("🚀 CallClub API v2.0.0 iniciando...")
    
    # Garante índices
    await db.users.create_index("username", unique=True)
    await db.matches.create_index("match_id", unique=True)
    await db.championships.create_index("championship_id", unique=True)
    await db.leagues.create_index("league_id", unique=True)
    await db.leagues.create_index("invite_code", unique=True)
    
    # Conta campeonatos
    champ_count = await db.championships.count_documents({})
    if champ_count == 0:
        logger.info("📊 Inicializando campeonatos...")
        for champ_id, champ_data in INITIAL_CHAMPIONSHIPS.items():
            await db.championships.update_one(
                {"championship_id": champ_id},
                {"$setOnInsert": {**champ_data, "is_active": True, "created_at": datetime.now(timezone.utc)}},
                upsert=True
            )
    
    logger.info("✅ CallClub API pronta!")
