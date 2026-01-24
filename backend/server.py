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

# ==================== HEALTH CHECK ENDPOINT ====================
@app.get("/health")
async def health_check():
    """Health check endpoint for Kubernetes"""
    return {"status": "healthy"}

# ==================== USUÁRIOS AUTORIZADOS COM PIN ====================
# 📌 AQUI VOCÊ EDITA OS USUÁRIOS E PINS
# Formato: "Nome": "PIN de 4 dígitos"

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
    # ⬇️ ADICIONE MAIS USUÁRIOS AQUI NO FORMATO: "Nome": "PIN" ⬇️
    
}

# ==================== CHAVES PREMIUM (BRASILEIRÃO) ====================
# 📌 AQUI VOCÊ EDITA AS CHAVES PREMIUM
# Formato: "NOME-CLUB-XXXX": "Nome" (a chave aponta para o dono)
# A chave SÓ funciona para o usuário correspondente

PREMIUM_KEYS = {
    "MARIO-CLUB-7X2K": "Mario",
    "MARCOS-CLUB-9M4P": "Marcos",
    "CARLOS-CLUB-4321": "Carlos",
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
    
    # Adiciona info de chave premium e PIN para cada usuário
    for user in users:
        username = user.get("username")
        # Procura se tem chave
        user_key = None
        for key, owner in PREMIUM_KEYS.items():
            if owner == username:
                user_key = key
                break
        user["premium_key"] = user_key
        # Adiciona PIN
        user["pin"] = AUTHORIZED_USERS.get(username, "N/A")
    
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

# ========== NOVOS ENDPOINTS ADMIN ==========

class AddUserRequest(BaseModel):
    password: str
    username: str
    pin: str

class UpdatePinRequest(BaseModel):
    password: str
    username: str
    new_pin: str

class TogglePremiumRequest(BaseModel):
    password: str
    username: str
    is_premium: bool

class GenerateKeyRequest(BaseModel):
    password: str
    username: str

@api_router.post("/admin/add-user")
async def admin_add_user(data: AddUserRequest):
    """Adiciona novo usuário (requer senha admin)"""
    if data.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    # Verifica se já existe
    if data.username in AUTHORIZED_USERS:
        raise HTTPException(status_code=400, detail="Usuário já existe")
    
    # Adiciona na whitelist (em memória - para persistir, editar server.py)
    AUTHORIZED_USERS[data.username] = data.pin
    
    # Conta usuários para definir número de pioneiro
    user_count = await db.users.count_documents({})
    pioneer_num = user_count + 1 if user_count < 100 else None
    
    # Cria no banco
    await db.users.insert_one({
        "username": data.username,
        "total_points": 0,
        "is_premium": False,
        "is_banned": False,
        "achievements": ["pioneer"] if pioneer_num else [],
        "pioneer_number": pioneer_num,
        "created_at": datetime.now(timezone.utc)
    })
    
    await db.security_logs.insert_one({
        "type": "user_added",
        "username": data.username,
        "added_by": "admin",
        "timestamp": datetime.now(timezone.utc)
    })
    
    return {"success": True, "message": f"Usuário {data.username} adicionado!", "pioneer_number": pioneer_num}

@api_router.post("/admin/update-pin")
async def admin_update_pin(data: UpdatePinRequest):
    """Atualiza PIN de um usuário (requer senha admin)"""
    if data.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    if data.username not in AUTHORIZED_USERS:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Atualiza em memória
    AUTHORIZED_USERS[data.username] = data.new_pin
    
    await db.security_logs.insert_one({
        "type": "pin_updated",
        "username": data.username,
        "updated_by": "admin",
        "timestamp": datetime.now(timezone.utc)
    })
    
    return {"success": True, "message": f"PIN de {data.username} atualizado!"}

@api_router.post("/admin/toggle-premium")
async def admin_toggle_premium(data: TogglePremiumRequest):
    """Ativa/desativa premium de um usuário (requer senha admin)"""
    if data.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    update_data = {"is_premium": data.is_premium}
    
    if data.is_premium:
        update_data["premium_activated_at"] = datetime.now(timezone.utc)
        # Adiciona conquista de premium
        await db.users.update_one(
            {"username": data.username},
            {"$addToSet": {"achievements": "premium"}}
        )
    else:
        update_data["premium_key"] = None
        # Remove conquista de premium
        await db.users.update_one(
            {"username": data.username},
            {"$pull": {"achievements": "premium"}}
        )
    
    await db.users.update_one(
        {"username": data.username},
        {"$set": update_data}
    )
    
    action = "ativado" if data.is_premium else "desativado"
    await db.security_logs.insert_one({
        "type": f"premium_{action}",
        "username": data.username,
        "updated_by": "admin",
        "timestamp": datetime.now(timezone.utc)
    })
    
    return {"success": True, "message": f"Premium {action} para {data.username}!"}

@api_router.post("/admin/generate-key")
async def admin_generate_key(data: GenerateKeyRequest):
    """Gera nova chave premium para usuário (requer senha admin)"""
    if data.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    import random
    import string
    
    # Gera chave única no formato NOME-CLUB-XXXX
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    new_key = f"{data.username.upper()}-CLUB-{suffix}"
    
    # Adiciona na lista de chaves (em memória)
    PREMIUM_KEYS[new_key] = data.username
    
    await db.security_logs.insert_one({
        "type": "key_generated",
        "username": data.username,
        "key": new_key,
        "generated_by": "admin",
        "timestamp": datetime.now(timezone.utc)
    })
    
    return {"success": True, "key": new_key, "message": f"Chave gerada: {new_key}"}

@api_router.delete("/admin/remove-user")
async def admin_remove_user(password: str, username: str):
    """Remove um usuário completamente (requer senha admin)"""
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    # Remove da whitelist
    if username in AUTHORIZED_USERS:
        del AUTHORIZED_USERS[username]
    
    # Remove chaves premium associadas
    keys_to_remove = [k for k, v in PREMIUM_KEYS.items() if v == username]
    for key in keys_to_remove:
        del PREMIUM_KEYS[key]
    
    # Remove do banco
    await db.users.delete_one({"username": username})
    await db.predictions.delete_many({"username": username})
    
    await db.security_logs.insert_one({
        "type": "user_removed",
        "username": username,
        "removed_by": "admin",
        "timestamp": datetime.now(timezone.utc)
    })
    
    return {"success": True, "message": f"Usuário {username} removido completamente"}

@api_router.get("/admin/stats")
async def admin_get_stats(password: str):
    """Retorna estatísticas gerais (requer senha admin)"""
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    total_users = await db.users.count_documents({})
    premium_users = await db.users.count_documents({"is_premium": True})
    banned_users = await db.users.count_documents({"is_banned": True})
    total_predictions = await db.predictions.count_documents({})
    total_matches = await db.matches.count_documents({})
    finished_matches = await db.matches.count_documents({"status": "finished"})
    
    # Alertas de segurança
    security_alerts = await db.security_logs.count_documents({"type": "stolen_key_attempt"})
    
    return {
        "total_users": total_users,
        "premium_users": premium_users,
        "banned_users": banned_users,
        "total_predictions": total_predictions,
        "total_matches": total_matches,
        "finished_matches": finished_matches,
        "security_alerts": security_alerts
    }

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
        # Conta quantos usuários existem para definir número de pioneiro
        total_users = await db.users.count_documents({})
        pioneer_number = total_users + 1 if total_users < 100 else None
        
        new_user = User(username=data.username)
        user_data = new_user.model_dump()
        user_data["pioneer_number"] = pioneer_number
        user_data["first_login"] = datetime.now(timezone.utc)
        
        await db.users.insert_one(user_data)
    
    return {"success": True, "username": data.username}

@api_router.get("/rounds/current")
async def get_current_round(championship: str = "carioca"):
    """Retorna a rodada atual de um campeonato baseado nos jogos não finalizados"""
    # Busca a primeira rodada que tem jogo não finalizado (essa é a rodada atual)
    next_unfinished = await db.matches.find_one(
        {"championship": championship, "is_finished": False},
        sort=[("round_number", 1), ("match_date", 1)]
    )
    
    if next_unfinished:
        current_round_num = next_unfinished.get("round_number", 1)
    else:
        # Se todos os jogos estão finalizados, pega a última rodada
        last_match = await db.matches.find_one(
            {"championship": championship},
            sort=[("round_number", -1)]
        )
        current_round_num = last_match.get("round_number", 1) if last_match else 1
    
    # Atualiza as rodadas no banco
    await db.rounds.update_many(
        {"championship": championship},
        {"$set": {"is_current": False}}
    )
    await db.rounds.update_one(
        {"championship": championship, "round_number": current_round_num},
        {"$set": {"is_current": True}},
        upsert=True
    )
    
    return {
        "championship": championship,
        "round_number": current_round_num,
        "is_current": True
    }

@api_router.get("/rounds/all")
async def get_all_rounds(championship: str = "carioca"):
    """Retorna todas as rodadas de um campeonato"""
    # Define total de rodadas por campeonato
    total_rounds_map = {"carioca": 6, "brasileirao": 38}
    total_rounds = total_rounds_map.get(championship, 38)
    
    # Busca rodadas existentes
    rounds = await db.rounds.find(
        {"championship": championship}, 
        {"_id": 0}
    ).sort("round_number", 1).to_list(100)
    
    existing_rounds = {r['round_number'] for r in rounds}
    
    # Busca a rodada atual
    current_round_data = await get_current_round(championship)
    current_round_num = current_round_data.get("round_number", 1)
    
    # Cria rodadas faltantes
    for rn in range(1, total_rounds + 1):
        if rn not in existing_rounds:
            await db.rounds.insert_one({
                "championship": championship,
                "round_number": rn,
                "is_current": rn == current_round_num
            })
    
    # Busca novamente com todas as rodadas
    rounds = await db.rounds.find(
        {"championship": championship}, 
        {"_id": 0}
    ).sort("round_number", 1).to_list(100)
    
    # Atualiza is_current
    for r in rounds:
        r['is_current'] = r['round_number'] == current_round_num
    
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
    
    # Busca info de premium de todos os usuários
    users = await db.users.find({}, {"_id": 0, "username": 1, "is_premium": 1}).to_list(1000)
    user_premium = {u['username']: u.get('is_premium', False) for u in users}
    
    # Agrupa por usuário e soma pontos
    user_points = {}
    for pred in predictions:
        username = pred['username']
        points = pred.get('points') or 0  # Garante que None vira 0
        if username not in user_points:
            user_points[username] = {
                "username": username, 
                "points": 0, 
                "perfect_count": 0,
                "is_premium": user_premium.get(username, False)
            }
        user_points[username]['points'] += points
        if points == 5:
            user_points[username]['perfect_count'] += 1
    
    # Ordena por pontos
    ranking = sorted(user_points.values(), key=lambda x: x['points'], reverse=True)
    return ranking

@api_router.get("/ranking/detailed/{championship}")
async def get_detailed_ranking(championship: str):
    """Retorna ranking detalhado com todas as estatísticas por campeonato"""
    
    # Define total de rodadas por campeonato (fixo)
    total_rounds_map = {"carioca": 6, "brasileirao": 38}
    total_rounds = total_rounds_map.get(championship, 38)
    
    # Busca a rodada atual do campeonato
    current_round_match = await db.matches.find_one(
        {"championship": championship, "is_finished": False},
        sort=[("round_number", 1)]
    )
    current_round = current_round_match.get("round_number", 1) if current_round_match else 1
    
    # Busca todos os palpites do campeonato
    predictions = await db.predictions.find(
        {"championship": championship},
        {"_id": 0}
    ).to_list(10000)
    
    # Busca todas as partidas para calcular estatísticas detalhadas
    matches = await db.matches.find(
        {"championship": championship},
        {"_id": 0}
    ).to_list(1000)
    matches_dict = {m['match_id']: m for m in matches}
    
    # Busca info de premium e pioneiro de todos os usuários
    users = await db.users.find({}, {"_id": 0, "username": 1, "is_premium": 1, "pioneer_number": 1}).to_list(1000)
    user_info = {u['username']: u for u in users}
    
    # Agrupa estatísticas por usuário
    user_stats = {}
    for pred in predictions:
        username = pred['username']
        match = matches_dict.get(pred['match_id'], {})
        
        if username not in user_stats:
            user_stats[username] = {
                "username": username,
                "total_points": 0,
                "correct_results": 0,  # Acertos de resultado (V/E/D)
                "correct_home_goals": 0,  # Acertos gols mandante
                "correct_away_goals": 0,  # Acertos gols visitante
                "exact_scores": 0,  # Placares exatos
                "total_predictions": 0,  # Apenas jogos realizados
                "is_premium": user_info.get(username, {}).get('is_premium', False),
                "pioneer_number": user_info.get(username, {}).get('pioneer_number')
            }
        
        # Só conta palpites e estatísticas de jogos JÁ REALIZADOS (finalizados)
        if match.get('is_finished'):
            user_stats[username]['total_predictions'] += 1
            
            if pred.get('points') is not None:
                points = pred.get('points') or 0
                user_stats[username]['total_points'] += points
                
                home_pred = pred.get('home_prediction')
                away_pred = pred.get('away_prediction')
                home_score = match.get('home_score')
                away_score = match.get('away_score')
                
                if home_score is not None and away_score is not None:
                    # Verifica acerto de resultado (V/E/D)
                    pred_result = 'home' if home_pred > away_pred else ('away' if away_pred > home_pred else 'draw')
                    actual_result = 'home' if home_score > away_score else ('away' if away_score > home_score else 'draw')
                    if pred_result == actual_result:
                        user_stats[username]['correct_results'] += 1
                    
                    # Verifica acerto de gols do mandante
                    if home_pred == home_score:
                        user_stats[username]['correct_home_goals'] += 1
                    
                    # Verifica acerto de gols do visitante
                    if away_pred == away_score:
                        user_stats[username]['correct_away_goals'] += 1
                    
                    # Verifica placar exato
                    if home_pred == home_score and away_pred == away_score:
                        user_stats[username]['exact_scores'] += 1
    
    # Calcula aproveitamento para cada usuário
    for username, stats in user_stats.items():
        if stats['total_predictions'] > 0:
            max_possible = stats['total_predictions'] * 5  # 5 pontos máximo por jogo
            stats['efficiency'] = round((stats['total_points'] / max_possible) * 100, 1) if max_possible > 0 else 0
        else:
            stats['efficiency'] = 0
    
    # Ordena por pontos totais, depois por placares exatos (1º desempate), depois por acertos de resultado (2º desempate)
    ranking = sorted(
        user_stats.values(), 
        key=lambda x: (x['total_points'], x['exact_scores'], x['correct_results']), 
        reverse=True
    )
    
    # Adiciona posição
    for i, user in enumerate(ranking):
        user['position'] = i + 1
    
    return {
        "championship": championship,
        "current_round": current_round,
        "total_rounds": total_rounds,
        "ranking": ranking
    }

@api_router.get("/ranking/general")
async def get_general_ranking():
    """Retorna ranking geral (todas as rodadas)"""
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    
    # Ordena por pontos totais, depois por total de placares exatos
    ranking = sorted(
        users, 
        key=lambda x: (x.get('total_points', 0), x.get('exact_scores', 0), x.get('correct_results', 0)), 
        reverse=True
    )
    return ranking

@api_router.get("/ranking/user-position/{username}")
async def get_user_ranking_position(username: str, championship: str = "carioca"):
    """Retorna a posição do usuário em um campeonato específico"""
    ranking_data = await get_detailed_ranking(championship)
    
    for player in ranking_data.get("ranking", []):
        if player.get("username") == username:
            return {
                "championship": championship,
                "position": player.get("position"),
                "total_points": player.get("total_points", 0),
                "exact_scores": player.get("exact_scores", 0),
                "correct_results": player.get("correct_results", 0)
            }
    
    return {
        "championship": championship,
        "position": None,
        "total_points": 0,
        "exact_scores": 0,
        "correct_results": 0
    }

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
        # Usa o championship do palpite, ou pega do match se não existir
        champ = pred.get('championship') or match.get('championship', 'carioca')
        enriched_predictions.append({
            **pred,
            "championship": champ,  # Garante que sempre tem o championship
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
    
    API_KEY = "3"
    SEASON = "2026"
    
    championships = [
        {"id": "5688", "name": "carioca", "rounds": 6},
        {"id": "4351", "name": "brasileirao", "rounds": 38}
    ]
    
    updated_matches = 0
    
    async with httpx.AsyncClient(timeout=60.0) as http_client:
        for champ in championships:
            for round_num in range(1, champ["rounds"] + 1):
                url = f"https://www.thesportsdb.com/api/v1/json/{API_KEY}/eventsround.php?id={champ['id']}&r={round_num}&s={SEASON}"
                
                try:
                    response = await http_client.get(url)
                    data = response.json()
                    
                    if data and "events" in data and data["events"]:
                        for event in data["events"]:
                            match_id = str(event["idEvent"])
                            
                            # Verifica se tem placar
                            home_score_raw = event.get("intHomeScore")
                            away_score_raw = event.get("intAwayScore")
                            
                            if home_score_raw not in [None, ""] and away_score_raw not in [None, ""]:
                                try:
                                    home_score = int(home_score_raw)
                                    away_score = int(away_score_raw)
                                    
                                    # Atualiza no banco
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
                                except (ValueError, TypeError):
                                    pass
                except Exception as e:
                    logging.error(f"Erro ao buscar {champ['name']} rodada {round_num}: {e}")
    
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

@api_router.get("/admin/init-production")
async def init_production_database(password: str):
    """Inicializa o banco de produção com jogos e usuários"""
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    import httpx
    import logging
    
    results = {
        "users_created": 0,
        "matches_created": 0,
        "rounds_created": 0,
        "errors": []
    }
    
    # 1. Criar usuários autorizados
    for username, pin in AUTHORIZED_USERS.items():
        existing = await db.users.find_one({"username": username})
        if not existing:
            is_premium = any(owner == username for owner in PREMIUM_KEYS.values())
            premium_key = next((k for k, v in PREMIUM_KEYS.items() if v == username), None)
            user_count = await db.users.count_documents({})
            pioneer_num = user_count + 1 if user_count < 100 else None
            
            await db.users.insert_one({
                "username": username,
                "total_points": 0,
                "is_premium": is_premium,
                "premium_key": premium_key,
                "is_banned": False,
                "achievements": ["pioneer"] if pioneer_num else [],
                "pioneer_number": pioneer_num
            })
            results["users_created"] += 1
    
    # 2. Criar rodadas primeiro
    for champ, total_rounds in [("carioca", 6), ("brasileirao", 38)]:
        for rn in range(1, total_rounds + 1):
            existing = await db.rounds.find_one({"championship": champ, "round_number": rn})
            if not existing:
                await db.rounds.insert_one({
                    "championship": champ,
                    "round_number": rn,
                    "is_current": rn == 1
                })
                results["rounds_created"] += 1
    
    # 3. Sincronizar jogos
    API_KEY = "3"
    SEASON = "2026"
    
    championships = [
        {"id": "5688", "name": "carioca", "rounds": 6},
        {"id": "4351", "name": "brasileirao", "rounds": 38}
    ]
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            for champ in championships:
                for round_num in range(1, champ["rounds"] + 1):
                    try:
                        url = f"https://www.thesportsdb.com/api/v1/json/{API_KEY}/eventsround.php?id={champ['id']}&r={round_num}&s={SEASON}"
                        response = await client.get(url)
                        data = response.json()
                        
                        if data and data.get("events"):
                            for event in data["events"]:
                                match_id = str(event["idEvent"])
                                
                                existing = await db.matches.find_one({"match_id": match_id})
                                if not existing:
                                    home_score = None
                                    away_score = None
                                    is_finished = False
                                    
                                    if event.get("intHomeScore") is not None and event.get("intHomeScore") != "":
                                        try:
                                            home_score = int(event["intHomeScore"])
                                            away_score = int(event["intAwayScore"]) if event.get("intAwayScore") else 0
                                            is_finished = True
                                        except:
                                            pass
                                    
                                    match_data = {
                                        "match_id": match_id,
                                        "round_number": round_num,
                                        "home_team": event.get("strHomeTeam", ""),
                                        "away_team": event.get("strAwayTeam", ""),
                                        "home_badge": event.get("strHomeTeamBadge", ""),
                                        "away_badge": event.get("strAwayTeamBadge", ""),
                                        "match_date": event.get("dateEvent", ""),
                                        "match_time": event.get("strTime", ""),
                                        "status": event.get("strStatus", ""),
                                        "home_score": home_score,
                                        "away_score": away_score,
                                        "is_finished": is_finished,
                                        "championship": champ["name"],
                                        "league_id": champ["id"]
                                    }
                                    await db.matches.insert_one(match_data)
                                    results["matches_created"] += 1
                    except Exception as e:
                        results["errors"].append(f"{champ['name']} R{round_num}: {str(e)}")
    except Exception as e:
        results["errors"].append(f"HTTP Error: {str(e)}")
    
    return {"success": True, "results": results}

@api_router.get("/admin/debug-matches")
async def debug_matches(password: str):
    """Debug endpoint para verificar como os matches estão salvos no banco"""
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    # Conta por championship
    carioca_count = await db.matches.count_documents({"championship": "carioca"})
    brasileirao_count = await db.matches.count_documents({"championship": "brasileirao"})
    
    # Pega 3 amostras de cada
    carioca_samples = await db.matches.find({"championship": "carioca"}, {"_id": 0}).limit(3).to_list(3)
    brasileirao_samples = await db.matches.find({"championship": "brasileirao"}, {"_id": 0}).limit(3).to_list(3)
    
    # Busca sem filtro de championship
    all_samples = await db.matches.find({}, {"_id": 0}).limit(5).to_list(5)
    
    # Pega valores únicos de championship
    pipeline = [{"$group": {"_id": "$championship", "count": {"$sum": 1}}}]
    championships = await db.matches.aggregate(pipeline).to_list(10)
    
    # Pega valores únicos de round_number pra carioca
    pipeline2 = [
        {"$match": {"championship": "carioca"}},
        {"$group": {"_id": "$round_number", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    rounds = await db.matches.aggregate(pipeline2).to_list(50)
    
    # DEBUG: Verificar palpites
    total_predictions = await db.predictions.count_documents({})
    predictions_carioca = await db.predictions.count_documents({"championship": "carioca"})
    predictions_brasileirao = await db.predictions.count_documents({"championship": "brasileirao"})
    predictions_sem_championship = await db.predictions.count_documents({"championship": {"$exists": False}})
    predictions_samples = await db.predictions.find({}, {"_id": 0}).limit(5).to_list(5)
    
    return {
        "total_matches": await db.matches.count_documents({}),
        "carioca_count": carioca_count,
        "brasileirao_count": brasileirao_count,
        "championships_breakdown": championships,
        "carioca_rounds": rounds,
        "carioca_samples": carioca_samples,
        "brasileirao_samples": brasileirao_samples,
        "all_samples": all_samples,
        "predictions_debug": {
            "total": total_predictions,
            "carioca": predictions_carioca,
            "brasileirao": predictions_brasileirao,
            "sem_championship": predictions_sem_championship,
            "samples": predictions_samples
        }
    }

@api_router.get("/admin/force-populate")
async def force_populate_matches(password: str):
    """Força a população de partidas buscando da API do TheSportsDB"""
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    import httpx
    
    results = {"matches_created": 0, "errors": [], "matches_updated": 0}
    API_KEY = "3"
    SEASON = "2026"
    
    championships = [
        {"id": "5688", "name": "carioca", "rounds": 6},
        {"id": "4351", "name": "brasileirao", "rounds": 38}
    ]
    
    async with httpx.AsyncClient(timeout=120.0) as http_client:
        for champ in championships:
            for round_num in range(1, champ["rounds"] + 1):
                try:
                    url = f"https://www.thesportsdb.com/api/v1/json/{API_KEY}/eventsround.php?id={champ['id']}&r={round_num}&s={SEASON}"
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
                            
                            match_date_str = event.get("dateEvent", "")
                            match_time_str = event.get("strTime", "00:00:00")
                            if match_time_str:
                                match_date_str = f"{match_date_str}T{match_time_str[:5]}:00"
                            
                            match_data = {
                                "match_id": match_id,
                                "round_number": round_num,
                                "home_team": event.get("strHomeTeam", ""),
                                "away_team": event.get("strAwayTeam", ""),
                                "home_badge": event.get("strHomeTeamBadge", ""),
                                "away_badge": event.get("strAwayTeamBadge", ""),
                                "match_date": match_date_str,
                                "home_score": home_score,
                                "away_score": away_score,
                                "is_finished": is_finished,
                                "championship": champ["name"],
                                "event_id": match_id,
                                "venue": event.get("strVenue", "")
                            }
                            
                            # Usa upsert para criar ou atualizar
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
                    results["errors"].append(f"{champ['name']} R{round_num}: {str(e)}")
    
    # Também cria as rodadas se não existirem
    for champ_key, total_rounds in [("carioca", 6), ("brasileirao", 38)]:
        for rn in range(1, total_rounds + 1):
            await db.rounds.update_one(
                {"championship": champ_key, "round_number": rn},
                {"$setOnInsert": {"is_current": rn == 1}},
                upsert=True
            )
    
    return {
        "success": True,
        "results": results,
        "total_matches_now": await db.matches.count_documents({})
    }

@api_router.get("/admin/fix-predictions-championship")
async def fix_predictions_championship(password: str):
    """Corrige palpites que estão sem o campo championship"""
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    # Busca todos os palpites sem championship
    predictions_without_champ = await db.predictions.find(
        {"championship": {"$exists": False}}
    ).to_list(10000)
    
    # Busca os matches para descobrir o championship
    match_ids = list(set([p['match_id'] for p in predictions_without_champ]))
    matches = await db.matches.find(
        {"match_id": {"$in": match_ids}},
        {"_id": 0, "match_id": 1, "championship": 1}
    ).to_list(1000)
    matches_dict = {m['match_id']: m.get('championship', 'carioca') for m in matches}
    
    fixed_count = 0
    for pred in predictions_without_champ:
        championship = matches_dict.get(pred['match_id'], 'carioca')
        await db.predictions.update_one(
            {"_id": pred['_id']},
            {"$set": {"championship": championship}}
        )
        fixed_count += 1
    
    return {
        "success": True,
        "predictions_fixed": fixed_count
    }

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
