from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==================== USUÁRIOS AUTORIZADOS COM PIN ====================
# 📌 AQUI VOCÊ EDITA OS USUÁRIOS E PINS
# Formato: "Nome": "PIN de 4 dígitos"

AUTHORIZED_USERS = {
    "Mario": "2412",
    "Marcos": "6969",
    "João": "3456",
    "Pedro": "4567",
    "Carlos": "5678",
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
    # ⬇️ ADICIONE MAIS USUÁRIOS AQUI NO FORMATO: "Nome": "PIN" ⬇️
    
}

# ==================== CHAVES PREMIUM (BRASILEIRÃO) ====================
# 📌 AQUI VOCÊ EDITA AS CHAVES PREMIUM
# Formato: "NOME-CLUB-XXXX": "Nome" (a chave aponta para o dono)
# A chave SÓ funciona para o usuário correspondente

PREMIUM_KEYS = {
    "MARIO-CLUB-7X2K": "Mario",
    "MARCOS-CLUB-9M4P": "Marcos",
    # ⬇️ ADICIONE MAIS CHAVES PREMIUM AQUI ⬇️
}

# Usuários que já ativaram premium (preenchido automaticamente)
# Armazenado no banco de dados

# Senha do painel admin
ADMIN_PASSWORD = "callclub2026"

# ==================== CAMPEONATOS ====================
CHAMPIONSHIPS = {
    "carioca": {
        "id": "5688",
        "name": "Campeonato Carioca",
        "season": "2026",
        "total_rounds": 6
    },
    "brasileirao": {
        "id": "4351",
        "name": "Campeonato Brasileiro",
        "season": "2026",
        "total_rounds": 38
    }
}

# ==================== MODELS ====================
class User(BaseModel):
    username: str
    total_points: int = 0
    perfect_streak: int = 0  # Sequência de acertos perfeitos (5 pts)
    max_perfect_streak: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Match(BaseModel):
    model_config = ConfigDict(extra="ignore")
    match_id: str
    championship: str = "carioca"  # carioca ou brasileirao
    round_number: int
    home_team: str
    away_team: str
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    match_date: datetime
    is_finished: bool = False

class Prediction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    username: str
    match_id: str
    championship: str = "carioca"
    round_number: int
    home_prediction: int
    away_prediction: int
    points: Optional[int] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Round(BaseModel):
    championship: str = "carioca"
    round_number: int
    is_current: bool = True
    deadline: datetime

class NameCheck(BaseModel):
    username: str
    pin: str

class PredictionCreate(BaseModel):
    username: str
    match_id: str
    championship: str = "carioca"
    round_number: int
    home_prediction: int
    away_prediction: int

class PremiumKeyActivation(BaseModel):
    username: str
    key: str

class AdminLogin(BaseModel):
    password: str

# ==================== HELPER FUNCTIONS ====================
def calculate_points(prediction: dict, match: dict) -> int:
    """Calcula pontos: 3 pts (resultado) + 1 pt (gols mandante) + 1 pt (gols visitante)"""
    if not match.get('is_finished'):
        return 0
    
    points = 0
    home_real = match['home_score']
    away_real = match['away_score']
    home_pred = prediction['home_prediction']
    away_pred = prediction['away_prediction']
    
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

# ==================== ROUTES ====================

# ========== CAMPEONATOS ==========
@api_router.get("/championships")
async def get_championships():
    """Retorna lista de campeonatos disponíveis"""
    return [
        {"id": "carioca", "name": "Campeonato Carioca 2026", "premium": False},
        {"id": "brasileirao", "name": "Campeonato Brasileiro 2026", "premium": True}
    ]

# ========== SISTEMA PREMIUM ==========
@api_router.get("/premium/status/{username}")
async def get_premium_status(username: str):
    """Verifica se usuário é premium"""
    user = await db.users.find_one({"username": username}, {"_id": 0})
    is_premium = user.get("is_premium", False) if user else False
    return {"username": username, "is_premium": is_premium}

@api_router.post("/premium/activate")
async def activate_premium(data: PremiumKeyActivation):
    """Ativa chave premium para usuário"""
    key = data.key.upper().strip()
    username = data.username
    
    # Verifica se a chave existe
    if key not in PREMIUM_KEYS:
        # Loga tentativa de chave inválida
        await db.security_logs.insert_one({
            "type": "invalid_key",
            "username": username,
            "attempted_key": key,
            "timestamp": datetime.now(timezone.utc)
        })
        raise HTTPException(status_code=403, detail="Chave inválida. Verifique e tente novamente.")
    
    # Verifica se a chave pertence ao usuário correto
    key_owner = PREMIUM_KEYS[key]
    if key_owner != username:
        # ALERTA DE SEGURANÇA: Tentativa de usar chave de outro!
        await db.security_logs.insert_one({
            "type": "stolen_key_attempt",
            "username": username,
            "attempted_key": key,
            "key_owner": key_owner,
            "timestamp": datetime.now(timezone.utc),
            "severity": "HIGH"
        })
        raise HTTPException(
            status_code=403, 
            detail=f"🚫 ACESSO NEGADO. Esta chave pertence a outro membro. Tentativa registrada."
        )
    
    # Ativa premium para o usuário
    await db.users.update_one(
        {"username": username},
        {"$set": {"is_premium": True, "premium_activated_at": datetime.now(timezone.utc)}},
        upsert=True
    )
    
    # Loga ativação bem-sucedida
    await db.security_logs.insert_one({
        "type": "premium_activated",
        "username": username,
        "key": key,
        "timestamp": datetime.now(timezone.utc)
    })
    
    return {"success": True, "message": "🎉 Premium ativado com sucesso! Bem-vindo ao Brasileirão!"}

# ========== PAINEL ADMIN ==========
@api_router.post("/admin/login")
async def admin_login(data: AdminLogin):
    """Verifica senha do admin"""
    if data.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Senha incorreta")
    return {"success": True}

@api_router.get("/admin/users")
async def admin_get_users(password: str):
    """Lista todos os usuários (requer senha admin)"""
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    
    # Adiciona info de chave premium para cada usuário
    for user in users:
        username = user.get("username")
        # Procura se tem chave
        user_key = None
        for key, owner in PREMIUM_KEYS.items():
            if owner == username:
                user_key = key
                break
        user["premium_key"] = user_key
    
    return users

@api_router.get("/admin/security-logs")
async def admin_get_security_logs(password: str):
    """Lista logs de segurança (requer senha admin)"""
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    logs = await db.security_logs.find({}, {"_id": 0}).sort("timestamp", -1).to_list(100)
    return logs

@api_router.post("/admin/ban-user")
async def admin_ban_user(password: str, username: str):
    """Bane um usuário (requer senha admin)"""
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    await db.users.update_one(
        {"username": username},
        {"$set": {"is_banned": True, "banned_at": datetime.now(timezone.utc)}}
    )
    
    await db.security_logs.insert_one({
        "type": "user_banned",
        "username": username,
        "timestamp": datetime.now(timezone.utc)
    })
    
    return {"success": True, "message": f"Usuário {username} banido com sucesso"}

@api_router.post("/admin/unban-user")
async def admin_unban_user(password: str, username: str):
    """Remove ban de um usuário (requer senha admin)"""
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    await db.users.update_one(
        {"username": username},
        {"$set": {"is_banned": False}}
    )
    
    return {"success": True, "message": f"Ban removido de {username}"}

# ========== AUTENTICAÇÃO ==========
@api_router.post("/auth/check-name")
async def check_name(data: NameCheck):
    """Verifica se o nome e PIN estão corretos"""
    # Verifica se usuário existe
    if data.username not in AUTHORIZED_USERS:
        raise HTTPException(status_code=403, detail="Nome não autorizado. Entre em contato com o administrador.")
    
    # Verifica se PIN está correto
    if AUTHORIZED_USERS[data.username] != data.pin:
        raise HTTPException(status_code=403, detail="PIN incorreto. Tente novamente.")
    
    # Verifica se usuário está banido
    user = await db.users.find_one({"username": data.username}, {"_id": 0})
    if user and user.get("is_banned"):
        raise HTTPException(status_code=403, detail="🚫 Sua conta foi suspensa. Entre em contato com o administrador.")
    
    # Cria usuário se não existir no banco
    if not user:
        new_user = User(username=data.username)
        await db.users.insert_one(new_user.model_dump())
    
    return {"success": True, "username": data.username}

@api_router.get("/rounds/current")
async def get_current_round(championship: str = "carioca"):
    """Retorna a rodada atual de um campeonato"""
    current_round = await db.rounds.find_one(
        {"is_current": True, "championship": championship}, 
        {"_id": 0}
    )
    if not current_round:
        # Busca primeira rodada do campeonato
        first_round = await db.rounds.find_one(
            {"championship": championship},
            {"_id": 0},
            sort=[("round_number", 1)]
        )
        if first_round:
            return first_round
        # Cria rodada 1 se não existir
        new_round = Round(
            championship=championship,
            round_number=1, 
            is_current=True,
            deadline=datetime.now(timezone.utc)
        )
        await db.rounds.insert_one(new_round.model_dump())
        return new_round.model_dump()
    return current_round

@api_router.get("/rounds/all")
async def get_all_rounds(championship: str = "carioca"):
    """Retorna todas as rodadas de um campeonato"""
    rounds = await db.rounds.find(
        {"championship": championship}, 
        {"_id": 0}
    ).sort("round_number", 1).to_list(100)
    return rounds

@api_router.get("/matches/next")
async def get_next_match(championship: str = "carioca"):
    """Retorna o próximo jogo não finalizado"""
    now = datetime.now(timezone.utc)
    
    # Busca o próximo jogo que ainda não começou
    next_match = await db.matches.find_one(
        {
            "championship": championship,
            "is_finished": False,
            "match_date": {"$gt": now}
        },
        {"_id": 0},
        sort=[("match_date", 1)]
    )
    
    if not next_match:
        # Se não encontrar, busca qualquer jogo não finalizado
        next_match = await db.matches.find_one(
            {"championship": championship, "is_finished": False},
            {"_id": 0},
            sort=[("match_date", 1)]
        )
    
    return next_match


@api_router.get("/matches/{round_number}")
async def get_matches(round_number: int, championship: str = "carioca"):
    """Retorna os jogos de uma rodada"""
    matches = await db.matches.find(
        {"round_number": round_number, "championship": championship}, 
        {"_id": 0}
    ).to_list(100)
    return matches


@api_router.get("/matches/{match_id}/popular-prediction")
async def get_popular_prediction(match_id: str):
    """Retorna o palpite mais votado para um jogo"""
    pipeline = [
        {"$match": {"match_id": match_id}},
        {"$group": {
            "_id": {"home": "$home_prediction", "away": "$away_prediction"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}},
        {"$limit": 1}
    ]
    
    result = await db.predictions.aggregate(pipeline).to_list(1)
    
    if result:
        return {
            "home_prediction": result[0]["_id"]["home"],
            "away_prediction": result[0]["_id"]["away"],
            "count": result[0]["count"]
        }
    return None


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
    
    # Agrupa por match_id e pega o mais votado de cada
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


@api_router.post("/predictions")
async def create_prediction(pred: PredictionCreate):
    """Salva um palpite"""
    # Verifica se usuário é autorizado
    if pred.username not in AUTHORIZED_USERS:
        raise HTTPException(status_code=403, detail="Usuário não autorizado")
    
    # Verifica se já existe palpite para esse jogo
    existing = await db.predictions.find_one({
        "username": pred.username,
        "match_id": pred.match_id
    })
    
    if existing:
        # Atualiza palpite
        await db.predictions.update_one(
            {"username": pred.username, "match_id": pred.match_id},
            {"$set": {
                "home_prediction": pred.home_prediction,
                "away_prediction": pred.away_prediction,
                "championship": pred.championship
            }}
        )
    else:
        # Cria novo palpite
        new_pred = Prediction(**pred.model_dump())
        await db.predictions.insert_one(new_pred.model_dump())
    
    return {"success": True}

@api_router.get("/predictions/{username}")
async def get_user_predictions(username: str, round_number: int, championship: str = "carioca"):
    """Retorna os palpites de um usuário em uma rodada"""
    predictions = await db.predictions.find({
        "username": username,
        "round_number": round_number,
        "championship": championship
    }, {"_id": 0}).to_list(100)
    return predictions

@api_router.get("/ranking/round/{round_number}")
async def get_round_ranking(round_number: int, championship: str = "carioca"):
    """Retorna ranking da rodada"""
    # Busca todos os palpites da rodada
    predictions = await db.predictions.find({
        "round_number": round_number,
        "championship": championship
    }, {"_id": 0}).to_list(1000)
    
    # Agrupa por usuário e soma pontos
    user_points = {}
    for pred in predictions:
        username = pred['username']
        points = pred.get('points', 0)
        if username not in user_points:
            user_points[username] = {"username": username, "points": 0, "perfect_count": 0}
        user_points[username]['points'] += points
        if points == 5:
            user_points[username]['perfect_count'] += 1
    
    # Ordena por pontos
    ranking = sorted(user_points.values(), key=lambda x: x['points'], reverse=True)
    return ranking

@api_router.get("/ranking/general")
async def get_general_ranking():
    """Retorna ranking geral (todas as rodadas)"""
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    
    # Ordena por pontos totais, depois por sequência de acertos perfeitos
    ranking = sorted(
        users, 
        key=lambda x: (x.get('total_points', 0), x.get('max_perfect_streak', 0)), 
        reverse=True
    )
    return ranking

@api_router.get("/user/{username}")
async def get_user_profile(username: str):
    """Retorna perfil completo do usuário com estatísticas"""
    user = await db.users.find_one({"username": username}, {"_id": 0})
    if not user:
        # Cria usuário se não existir
        user = {"username": username, "total_points": 0, "max_perfect_streak": 0, "perfect_streak": 0}
    
    # Busca histórico de palpites
    predictions = await db.predictions.find({"username": username}, {"_id": 0}).to_list(1000)
    
    # Busca matches para enriquecer os palpites
    match_ids = [p['match_id'] for p in predictions]
    matches = await db.matches.find({"match_id": {"$in": match_ids}}, {"_id": 0}).to_list(1000)
    matches_dict = {m['match_id']: m for m in matches}
    
    # Enriquece palpites com dados dos jogos
    enriched_predictions = []
    for pred in predictions:
        match = matches_dict.get(pred['match_id'], {})
        enriched_predictions.append({
            **pred,
            "home_team": match.get("home_team", "?"),
            "away_team": match.get("away_team", "?"),
            "home_score": match.get("home_score"),
            "away_score": match.get("away_score"),
            "is_finished": match.get("is_finished", False),
            "match_date": match.get("match_date")
        })
    
    # Ordena por rodada (desc) e depois por data
    enriched_predictions.sort(key=lambda x: (-x.get('round_number', 0), x.get('match_date') or ''))
    
    # Calcula estatísticas
    total_predictions = len(predictions)
    predictions_with_points = [p for p in predictions if p.get('points') is not None]
    total_points_earned = sum(p.get('points', 0) for p in predictions_with_points)
    perfect_scores = sum(1 for p in predictions_with_points if p.get('points') == 5)
    correct_results = sum(1 for p in predictions_with_points if p.get('points', 0) >= 3)
    
    # Agrupa por rodada para estatísticas
    rounds_played = set(p.get('round_number') for p in predictions)
    points_by_round = {}
    for pred in predictions:
        rn = pred.get('round_number', 0)
        if rn not in points_by_round:
            points_by_round[rn] = 0
        points_by_round[rn] += pred.get('points', 0) or 0
    
    # Calcula posição no ranking
    all_users = await db.users.find({}, {"_id": 0}).to_list(1000)
    sorted_users = sorted(all_users, key=lambda x: (-x.get('total_points', 0), -x.get('max_perfect_streak', 0)))
    ranking_position = next((i + 1 for i, u in enumerate(sorted_users) if u['username'] == username), 0)
    total_users = len(sorted_users)
    
    return {
        "user": user,
        "total_predictions": total_predictions,
        "predictions": enriched_predictions,
        "statistics": {
            "total_points": total_points_earned,
            "perfect_scores": perfect_scores,
            "correct_results": correct_results,
            "games_played": len(predictions_with_points),
            "rounds_played": len(rounds_played),
            "points_by_round": points_by_round,
            "avg_points_per_game": round(total_points_earned / len(predictions_with_points), 2) if predictions_with_points else 0,
            "accuracy_rate": round(correct_results / len(predictions_with_points) * 100, 1) if predictions_with_points else 0
        },
        "ranking": {
            "position": ranking_position,
            "total_users": total_users
        }
    }

async def recalculate_all_points():
    """Recalcula pontos de TODOS os usuários baseado nos jogos finalizados"""
    
    # Busca todos os jogos finalizados
    finished_matches = await db.matches.find({"is_finished": True}, {"_id": 0}).to_list(1000)
    matches_dict = {m['match_id']: m for m in finished_matches}
    
    # Busca todos os palpites
    all_predictions = await db.predictions.find({}, {"_id": 0}).to_list(10000)
    
    # Calcula pontos para cada palpite
    user_stats = {}
    
    for pred in all_predictions:
        username = pred['username']
        match_id = pred['match_id']
        
        # Inicializa stats do usuário
        if username not in user_stats:
            user_stats[username] = {
                'total_points': 0,
                'predictions_by_round': {},
                'perfect_sequence': []
            }
        
        # Se o jogo terminou, calcula pontos
        if match_id in matches_dict:
            match = matches_dict[match_id]
            points = calculate_points(pred, match)
            
            # Atualiza palpite com pontos
            await db.predictions.update_one(
                {"username": username, "match_id": match_id},
                {"$set": {"points": points}}
            )
            
            user_stats[username]['total_points'] += points
            
            # Rastreia acertos perfeitos para calcular sequência
            round_num = pred.get('round_number', 1)
            if round_num not in user_stats[username]['predictions_by_round']:
                user_stats[username]['predictions_by_round'][round_num] = []
            user_stats[username]['predictions_by_round'][round_num].append(points)
    
    # Calcula sequência máxima de acertos perfeitos para cada usuário
    for username, stats in user_stats.items():
        max_streak = 0
        current_streak = 0
        
        # Ordena por rodada e calcula streak
        for round_num in sorted(stats['predictions_by_round'].keys()):
            for points in stats['predictions_by_round'][round_num]:
                if points == 5:
                    current_streak += 1
                    max_streak = max(max_streak, current_streak)
                else:
                    current_streak = 0
        
        # Atualiza usuário no banco
        await db.users.update_one(
            {"username": username},
            {"$set": {
                "total_points": stats['total_points'],
                "max_perfect_streak": max_streak
            }},
            upsert=True
        )
    
    return len(user_stats)


@api_router.post("/admin/sync-results")
async def sync_results_from_api():
    """Sincroniza resultados da API TheSportsDB e recalcula pontos"""
    
    LEAGUE_ID = "5688"
    SEASON = "2026"
    API_KEY = "3"
    
    updated_matches = 0
    
    async with httpx.AsyncClient() as client:
        # Busca cada rodada
        for round_num in range(1, 7):
            url = f"https://www.thesportsdb.com/api/v1/json/{API_KEY}/eventsround.php"
            params = {"id": LEAGUE_ID, "r": round_num, "s": SEASON}
            
            try:
                response = await client.get(url, params=params, timeout=15.0)
                data = response.json()
                
                if data and "events" in data and data["events"]:
                    for event in data["events"]:
                        match_id = event["idEvent"]
                        status = event.get("strStatus", "")
                        
                        # Se o jogo terminou
                        if status in ["FT", "Match Finished", "Finished"]:
                            home_score = event.get("intHomeScore")
                            away_score = event.get("intAwayScore")
                            
                            if home_score is not None and away_score is not None:
                                # Atualiza no banco
                                result = await db.matches.update_one(
                                    {"match_id": match_id},
                                    {"$set": {
                                        "home_score": int(home_score),
                                        "away_score": int(away_score),
                                        "is_finished": True
                                    }}
                                )
                                if result.modified_count > 0:
                                    updated_matches += 1
            except Exception as e:
                logging.error(f"Erro ao buscar rodada {round_num}: {e}")
    
    # Recalcula pontos de todos os usuários
    users_updated = await recalculate_all_points()
    
    return {
        "success": True, 
        "matches_updated": updated_matches,
        "users_recalculated": users_updated
    }


@api_router.post("/admin/recalculate-points")
async def admin_recalculate_points():
    """Força recálculo de pontos de todos os usuários"""
    users_updated = await recalculate_all_points()
    return {"success": True, "users_updated": users_updated}


@api_router.post("/admin/update-results")
async def update_match_results(match_id: str, home_score: int, away_score: int):
    """Atualiza resultado de um jogo específico e recalcula pontos"""
    # Atualiza jogo
    await db.matches.update_one(
        {"match_id": match_id},
        {"$set": {
            "home_score": home_score,
            "away_score": away_score,
            "is_finished": True
        }}
    )
    
    # Recalcula pontos de todos os usuários
    users_updated = await recalculate_all_points()
    
    return {"success": True, "users_recalculated": users_updated}

# ==================== SEED DATA ====================
@api_router.post("/admin/seed-data")
async def seed_initial_data():
    """Cria dados de exemplo para testar"""
    # Limpa dados existentes
    await db.matches.delete_many({})
    await db.rounds.delete_many({})
    
    # Cria rodada 1
    round_1 = Round(
        round_number=1,
        is_current=True,
        deadline=datetime.now(timezone.utc)
    )
    await db.rounds.insert_one(round_1.model_dump())
    
    # Cria jogos de exemplo
    sample_matches = [
        Match(match_id="1", round_number=1, home_team="Flamengo", away_team="Vasco", match_date=datetime.now(timezone.utc)),
        Match(match_id="2", round_number=1, home_team="Palmeiras", away_team="Corinthians", match_date=datetime.now(timezone.utc)),
        Match(match_id="3", round_number=1, home_team="São Paulo", away_team="Santos", match_date=datetime.now(timezone.utc)),
        Match(match_id="4", round_number=1, home_team="Grêmio", away_team="Internacional", match_date=datetime.now(timezone.utc)),
        Match(match_id="5", round_number=1, home_team="Atlético-MG", away_team="Cruzeiro", match_date=datetime.now(timezone.utc)),
    ]
    
    for match in sample_matches:
        await db.matches.insert_one(match.model_dump())
    
    return {"success": True, "message": "Dados iniciais criados!"}

@api_router.get("/")
async def root():
    return {"message": "Welcome to CallClub API! 🔥"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
