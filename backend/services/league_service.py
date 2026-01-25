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
    """Calcula ranking de uma liga específica"""
    league = await db.leagues.find_one({"league_id": league_id})
    
    if not league:
        return []
    
    members = league.get("members", [])
    
    # Busca palpites dos membros para esse campeonato
    pipeline = [
        {
            "$match": {
                "username": {"$in": members},
                "championship_id": championship_id,
                "points": {"$ne": None}
            }
        },
        {
            "$group": {
                "_id": "$username",
                "total_points": {"$sum": "$points"},
                "exact_scores": {"$sum": {"$cond": [{"$eq": ["$points", 5]}, 1, 0]}},
                "total_predictions": {"$sum": 1}
            }
        },
        {"$sort": {"total_points": -1, "exact_scores": -1}}
    ]
    
    results = await db.predictions.aggregate(pipeline).to_list(1000)
    
    # Adiciona membros sem palpites
    members_with_points = {r["_id"] for r in results}
    for member in members:
        if member not in members_with_points:
            results.append({
                "_id": member,
                "total_points": 0,
                "exact_scores": 0,
                "total_predictions": 0
            })
    
    # Formata resultado
    ranking = []
    for i, r in enumerate(sorted(results, key=lambda x: (-x["total_points"], -x["exact_scores"]))):
        ranking.append({
            "position": i + 1,
            "username": r["_id"],
            "total_points": r["total_points"],
            "exact_scores": r["exact_scores"],
            "total_predictions": r["total_predictions"]
        })
    
    return ranking
