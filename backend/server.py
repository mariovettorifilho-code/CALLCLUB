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

# ==================== WHITELIST ====================
# Lista dos 70 amigos autorizados (comece com 10, depois adiciona os outros)
AUTHORIZED_USERS = [
    "Mario", "Marcos", "João", "Pedro", "Carlos", "Lucas", 
    "Rafael", "Bruno", "Fernando", "Ricardo", "Paulo",
    # Adicione os outros 60 nomes aqui quando tiver todos
]

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
    round_number: int
    home_prediction: int
    away_prediction: int
    points: Optional[int] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Round(BaseModel):
    round_number: int
    is_current: bool = True
    deadline: datetime

class NameCheck(BaseModel):
    username: str

class PredictionCreate(BaseModel):
    username: str
    match_id: str
    round_number: int
    home_prediction: int
    away_prediction: int

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
@api_router.post("/auth/check-name")
async def check_name(data: NameCheck):
    """Verifica se o nome está na whitelist"""
    if data.username not in AUTHORIZED_USERS:
        raise HTTPException(status_code=403, detail="Nome não autorizado. Entre em contato com o administrador.")
    
    # Cria usuário se não existir
    user = await db.users.find_one({"username": data.username}, {"_id": 0})
    if not user:
        new_user = User(username=data.username)
        await db.users.insert_one(new_user.model_dump())
    
    return {"success": True, "username": data.username}

@api_router.get("/rounds/current")
async def get_current_round():
    """Retorna a rodada atual"""
    current_round = await db.rounds.find_one({"is_current": True}, {"_id": 0})
    if not current_round:
        # Cria rodada 1 se não existir
        new_round = Round(
            round_number=1, 
            is_current=True,
            deadline=datetime.now(timezone.utc)
        )
        await db.rounds.insert_one(new_round.model_dump())
        return new_round.model_dump()
    return current_round

@api_router.get("/rounds/all")
async def get_all_rounds():
    """Retorna todas as rodadas"""
    rounds = await db.rounds.find({}, {"_id": 0}).sort("round_number", 1).to_list(100)
    return rounds

@api_router.get("/matches/{round_number}")
async def get_matches(round_number: int):
    """Retorna os jogos de uma rodada"""
    matches = await db.matches.find({"round_number": round_number}, {"_id": 0}).to_list(100)
    return matches

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
                "away_prediction": pred.away_prediction
            }}
        )
    else:
        # Cria novo palpite
        new_pred = Prediction(**pred.model_dump())
        await db.predictions.insert_one(new_pred.model_dump())
    
    return {"success": True}

@api_router.get("/predictions/{username}")
async def get_user_predictions(username: str, round_number: int):
    """Retorna os palpites de um usuário em uma rodada"""
    predictions = await db.predictions.find({
        "username": username,
        "round_number": round_number
    }, {"_id": 0}).to_list(100)
    return predictions

@api_router.get("/ranking/round/{round_number}")
async def get_round_ranking(round_number: int):
    """Retorna ranking da rodada"""
    # Busca todos os palpites da rodada
    predictions = await db.predictions.find({"round_number": round_number}, {"_id": 0}).to_list(1000)
    
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
    """Retorna perfil do usuário"""
    user = await db.users.find_one({"username": username}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Busca histórico de palpites
    predictions = await db.predictions.find({"username": username}, {"_id": 0}).to_list(1000)
    
    return {
        "user": user,
        "total_predictions": len(predictions),
        "predictions": predictions
    }

@api_router.post("/admin/update-results")
async def update_match_results(match_id: str, home_score: int, away_score: int):
    """Atualiza resultado do jogo e recalcula pontos"""
    # Atualiza jogo
    await db.matches.update_one(
        {"match_id": match_id},
        {"$set": {
            "home_score": home_score,
            "away_score": away_score,
            "is_finished": True
        }}
    )
    
    # Busca jogo atualizado
    match = await db.matches.find_one({"match_id": match_id}, {"_id": 0})
    
    # Busca todos os palpites desse jogo
    predictions = await db.predictions.find({"match_id": match_id}, {"_id": 0}).to_list(1000)
    
    # Recalcula pontos
    for pred in predictions:
        points = calculate_points(pred, match)
        await db.predictions.update_one(
            {"username": pred['username'], "match_id": match_id},
            {"$set": {"points": points}}
        )
        
        # Atualiza pontos totais do usuário
        user = await db.users.find_one({"username": pred['username']}, {"_id": 0})
        if user:
            new_total = user.get('total_points', 0) + points
            
            # Atualiza streak de acertos perfeitos
            if points == 5:
                new_streak = user.get('perfect_streak', 0) + 1
                new_max_streak = max(new_streak, user.get('max_perfect_streak', 0))
            else:
                new_streak = 0
                new_max_streak = user.get('max_perfect_streak', 0)
            
            await db.users.update_one(
                {"username": pred['username']},
                {"$set": {
                    "total_points": new_total,
                    "perfect_streak": new_streak,
                    "max_perfect_streak": new_max_streak
                }}
            )
    
    return {"success": True, "updated_predictions": len(predictions)}

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
