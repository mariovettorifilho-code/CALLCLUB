"""
Sincroniza Campeonatos com TheSportsDB (100% GRÁTIS)
Suporta: Campeonato Carioca e Brasileirão
"""

import asyncio
import sys
import os
from pathlib import Path

sys.path.append(str(Path(__file__).parent))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime, timezone
import httpx

load_dotenv()

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Configurações dos campeonatos
CHAMPIONSHIPS = {
    "carioca": {
        "league_id": "5688",
        "name": "Campeonato Carioca",
        "season": "2026",
        "total_rounds": 11  # Taça Guanabara (6) + Taça Rio (5) aproximadamente
    },
    "brasileirao": {
        "league_id": "4351",
        "name": "Campeonato Brasileiro",
        "season": "2026",
        "total_rounds": 38
    }
}

API_KEY = "3"  # API Key pública


async def fetch_round_events(league_id: str, season: str, round_number: int) -> list:
    """Busca todos os jogos de uma rodada específica"""
    url = f"https://www.thesportsdb.com/api/v1/json/{API_KEY}/eventsround.php"
    params = {"id": league_id, "r": round_number, "s": season}
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, timeout=15.0)
            data = response.json()
            
            if data and "events" in data and data["events"]:
                return data["events"]
            return []
        except Exception as e:
            print(f"  ❌ Erro ao buscar rodada {round_number}: {e}")
            return []


def parse_event(event: dict, championship: str) -> dict:
    """Converte evento TheSportsDB para formato CallClub"""
    
    # Extrai data/hora do jogo
    date_str = event.get("dateEvent", "")
    time_str = event.get("strTime", "00:00:00")
    
    # Combina data e hora
    datetime_str = f"{date_str} {time_str}"
    try:
        match_date = datetime.strptime(datetime_str, "%Y-%m-%d %H:%M:%S")
        match_date = match_date.replace(tzinfo=timezone.utc)
    except:
        match_date = datetime.now(timezone.utc)
    
    # Extrai placares (se jogo finalizado)
    home_score = event.get("intHomeScore")
    away_score = event.get("intAwayScore")
    
    # Converte para int se não for None
    if home_score is not None:
        home_score = int(home_score)
    if away_score is not None:
        away_score = int(away_score)
    
    # Verifica se jogo está finalizado
    status = event.get("strStatus", "")
    is_finished = status in ["FT", "Match Finished", "Finished"]
    
    # Extrai número da rodada
    round_str = event.get("intRound", "1")
    try:
        round_number = int(round_str)
    except:
        round_number = 1
    
    return {
        "match_id": event["idEvent"],
        "championship": championship,
        "round_number": round_number,
        "home_team": event.get("strHomeTeam", ""),
        "away_team": event.get("strAwayTeam", ""),
        "home_badge": event.get("strHomeTeamBadge", ""),
        "away_badge": event.get("strAwayTeamBadge", ""),
        "home_score": home_score,
        "away_score": away_score,
        "match_date": match_date,
        "is_finished": is_finished,
        "event_id": event["idEvent"],
        "venue": event.get("strVenue", "")
    }


async def sync_championship(championship_key: str):
    """Sincroniza um campeonato específico"""
    
    config = CHAMPIONSHIPS.get(championship_key)
    if not config:
        print(f"❌ Campeonato '{championship_key}' não encontrado")
        return
    
    print(f"\n🏆 SINCRONIZANDO: {config['name']} {config['season']}")
    print(f"📡 Buscando até {config['total_rounds']} rodadas...\n")
    
    all_matches = []
    rounds_data = {}
    
    # Busca cada rodada individualmente
    for round_num in range(1, config['total_rounds'] + 1):
        print(f"  Rodada {round_num}...", end=" ")
        events = await fetch_round_events(config['league_id'], config['season'], round_num)
        
        if events:
            print(f"✅ {len(events)} jogos")
            rounds_data[round_num] = []
            
            for event in events:
                try:
                    parsed = parse_event(event, championship_key)
                    all_matches.append(parsed)
                    rounds_data[round_num].append(parsed)
                except Exception as e:
                    print(f"    ⚠️ Erro ao processar evento: {e}")
        else:
            print("- (sem jogos)")
    
    if not all_matches:
        print(f"\n❌ Nenhum jogo encontrado para {config['name']}!")
        return
    
    print(f"\n✅ Total: {len(all_matches)} jogos em {len(rounds_data)} rodadas")
    
    # Remove dados antigos deste campeonato
    print(f"\n🗑️  Removendo dados antigos de {config['name']}...")
    await db.matches.delete_many({"championship": championship_key})
    await db.rounds.delete_many({"championship": championship_key})
    
    # Salva no banco
    print("💾 Salvando no MongoDB...")
    
    current_round_set = False
    
    for round_num in sorted(rounds_data.keys()):
        round_matches = rounds_data[round_num]
        
        if not round_matches:
            continue
        
        # Pega a data do primeiro jogo da rodada
        first_match_date = min(m["match_date"] for m in round_matches)
        
        # Define qual é a rodada atual (primeira com jogos não finalizados)
        has_unfinished = any(not m["is_finished"] for m in round_matches)
        is_current = has_unfinished and not current_round_set
        
        if is_current:
            current_round_set = True
        
        # Cria rodada
        round_doc = {
            "championship": championship_key,
            "round_number": round_num,
            "is_current": is_current,
            "deadline": first_match_date
        }
        await db.rounds.insert_one(round_doc)
        
        # Salva jogos
        for match in round_matches:
            await db.matches.insert_one(match)
    
    print(f"🎉 {config['name']} sincronizado com sucesso!")
    return len(all_matches)


async def sync_all():
    """Sincroniza todos os campeonatos"""
    
    print("=" * 60)
    print("🏆 CALLCLUB - SINCRONIZAÇÃO DE CAMPEONATOS")
    print("=" * 60)
    
    total_matches = 0
    
    for champ_key in CHAMPIONSHIPS.keys():
        count = await sync_championship(champ_key)
        if count:
            total_matches += count
    
    print("\n" + "=" * 60)
    print(f"✅ SINCRONIZAÇÃO COMPLETA!")
    print(f"📊 Total geral: {total_matches} jogos")
    print("=" * 60)


if __name__ == "__main__":
    # Permite sincronizar um campeonato específico ou todos
    if len(sys.argv) > 1:
        champ = sys.argv[1].lower()
        if champ in CHAMPIONSHIPS:
            asyncio.run(sync_championship(champ))
        else:
            print(f"Uso: python sync_thesportsdb.py [carioca|brasileirao]")
            print(f"Sem argumentos: sincroniza todos")
    else:
        asyncio.run(sync_all())
