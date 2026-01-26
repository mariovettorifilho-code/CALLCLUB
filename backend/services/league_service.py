# CallClub - Serviço de gerenciamento de ligas

import random
import string
from datetime import datetime, timezone
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase


def generate_invite_code() -> str:
    """Gera código de convite único de 6 caracteres"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))


async def create_league(
    db: AsyncIOMotorDatabase,
    name: str,
    owner_username: str,
    championship_id: str
) -> dict:
    """Cria uma nova liga"""
    import uuid
    
    league_id = str(uuid.uuid4())[:8]
    invite_code = generate_invite_code()
    
    # Garante código único
    while await db.leagues.find_one({"invite_code": invite_code}):
        invite_code = generate_invite_code()
    
    league = {
        "league_id": league_id,
        "name": name,
        "owner_username": owner_username,
        "invite_code": invite_code,
        "championship_id": championship_id,
        "members": [owner_username],  # Dono já é membro
        "max_members": 100,
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.leagues.insert_one(league)
    
    # Adiciona liga ao usuário
    await db.users.update_one(
        {"username": owner_username},
        {
            "$addToSet": {
                "owned_leagues": league_id,
                "joined_leagues": league_id
            }
        }
    )
    
    return league


async def join_league_by_code(
    db: AsyncIOMotorDatabase,
    username: str,
    invite_code: str
) -> Optional[dict]:
    """Entra em uma liga pelo código de convite"""
    league = await db.leagues.find_one({"invite_code": invite_code.upper()})
    
    if not league:
        return None
    
    if not league.get("is_active"):
        return None
    
    if username in league.get("members", []):
        return {"error": "already_member", "league": league}
    
    if len(league.get("members", [])) >= league.get("max_members", 100):
        return {"error": "league_full"}
    
    # Adiciona membro
    await db.leagues.update_one(
        {"league_id": league["league_id"]},
        {"$addToSet": {"members": username}}
    )
    
    # Atualiza usuário
    await db.users.update_one(
        {"username": username},
        {"$addToSet": {"joined_leagues": league["league_id"]}}
    )
    
    league["members"].append(username)
    return {"success": True, "league": league}


async def leave_league(
    db: AsyncIOMotorDatabase,
    username: str,
    league_id: str
) -> bool:
    """Sai de uma liga"""
    league = await db.leagues.find_one({"league_id": league_id})
    
    if not league:
        return False
    
    # Dono não pode sair
    if league["owner_username"] == username:
        return False
    
    await db.leagues.update_one(
        {"league_id": league_id},
        {"$pull": {"members": username}}
    )
    
    await db.users.update_one(
        {"username": username},
        {"$pull": {"joined_leagues": league_id}}
    )
    
    return True


async def delete_league(
    db: AsyncIOMotorDatabase,
    league_id: str,
    owner_username: str
) -> bool:
    """Deleta uma liga (apenas o dono pode)"""
    league = await db.leagues.find_one({
        "league_id": league_id,
        "owner_username": owner_username
    })
    
    if not league:
        return False
    
    # Remove liga de todos os membros
    for member in league.get("members", []):
        await db.users.update_one(
            {"username": member},
            {"$pull": {"joined_leagues": league_id}}
        )
    
    # Remove das ligas criadas do dono
    await db.users.update_one(
        {"username": owner_username},
        {"$pull": {"owned_leagues": league_id}}
    )
    
    # Remove a liga
    await db.leagues.delete_one({"league_id": league_id})
    
    return True


async def get_league_ranking(
    db: AsyncIOMotorDatabase,
    league_id: str,
    championship_id: str
) -> list:
    """Calcula ranking de uma liga específica com estatísticas detalhadas"""
    league = await db.leagues.find_one({"league_id": league_id})
    
    if not league:
        return []
    
    members = league.get("members", [])
    
    # Busca todas as partidas finalizadas do campeonato
    matches = await db.matches.find(
        {"championship_id": championship_id, "is_finished": True},
        {"_id": 0}
    ).to_list(1000)
    matches_dict = {m['match_id']: m for m in matches}
    
    # Busca todos os palpites dos membros
    predictions = await db.predictions.find(
        {
            "username": {"$in": members},
            "championship_id": championship_id
        },
        {"_id": 0}
    ).to_list(10000)
    
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
                "total_predictions": 0
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
    
    # Adiciona membros sem palpites
    for member in members:
        if member not in user_stats:
            user_stats[member] = {
                "username": member,
                "total_points": 0,
                "correct_results": 0,
                "correct_home_goals": 0,
                "correct_away_goals": 0,
                "exact_scores": 0,
                "total_predictions": 0
            }
    
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
    
    return ranking
