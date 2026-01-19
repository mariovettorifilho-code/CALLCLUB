"""
Sincroniza Campeonato Carioca 2026 com TheSportsDB (100% GRÁTIS)
Usando endpoint eventsround.php para buscar TODAS as rodadas
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

# Configurações
LEAGUE_ID = "5688"  # Campeonato Carioca
SEASON = "2026"
API_KEY = "3"  # API Key pública
TOTAL_ROUNDS = 6  # Total de rodadas da Taça Guanabara


async def fetch_round_events(round_number: int) -> list:
    """Busca todos os jogos de uma rodada específica"""
    url = f"https://www.thesportsdb.com/api/v1/json/{API_KEY}/eventsround.php"
    params = {"id": LEAGUE_ID, "r": round_number, "s": SEASON}
    
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


def parse_event(event: dict) -> dict:
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
        "round_number": round_number,
        "home_team": event.get("strHomeTeam", ""),
        "away_team": event.get("strAwayTeam", ""),
        "home_score": home_score,
        "away_score": away_score,
        "match_date": match_date,
        "is_finished": is_finished,
        "event_id": event["idEvent"],
        "venue": event.get("strVenue", "")
    }


async def sync_carioca_thesportsdb():
    """Sincroniza Carioca 2026 com TheSportsDB - TODAS as rodadas"""
    
    print("🏆 CALLCLUB - SINCRONIZANDO CARIOCA 2026 (TheSportsDB)\n")
    print(f"📡 Buscando {TOTAL_ROUNDS} rodadas...\n")
    
    all_matches = []
    rounds_data = {}
    
    # Busca cada rodada individualmente
    for round_num in range(1, TOTAL_ROUNDS + 1):
        print(f"  Buscando Rodada {round_num}...", end=" ")
        events = await fetch_round_events(round_num)
        
        if events:
            print(f"✅ {len(events)} jogos")
            rounds_data[round_num] = []
            
            for event in events:
                try:
                    parsed = parse_event(event)
                    all_matches.append(parsed)
                    rounds_data[round_num].append(parsed)
                except Exception as e:
                    print(f"    ⚠️ Erro ao processar evento: {e}")
        else:
            print("❌ Nenhum jogo")
    
    if not all_matches:
        print("\n❌ Nenhum jogo encontrado em nenhuma rodada!")
        return
    
    print(f"\n✅ Total: {len(all_matches)} jogos em {len(rounds_data)} rodadas\n")
    
    # Limpa dados antigos
    print("🗑️  Limpando dados antigos...")
    await db.matches.delete_many({})
    await db.rounds.delete_many({})
    
    # Salva no banco
    print("💾 Salvando no MongoDB...\n")
    
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
            "round_number": round_num,
            "is_current": is_current,
            "deadline": first_match_date
        }
        await db.rounds.insert_one(round_doc)
        
        # Salva jogos
        for match in round_matches:
            await db.matches.insert_one(match)
        
        # Status da rodada
        finished_count = sum(1 for m in round_matches if m["is_finished"])
        status_emoji = "✅" if finished_count == len(round_matches) else "⏳"
        current_label = " (ATUAL)" if is_current else ""
        
        print(f"   {status_emoji} Rodada {round_num}{current_label}: {len(round_matches)} jogos ({finished_count} finalizados)")
        
        # Mostra alguns jogos
        for match in round_matches[:3]:
            home = match['home_team']
            away = match['away_team']
            date = match['match_date'].strftime("%d/%m %H:%M")
            
            if match['is_finished']:
                result = f"{match['home_score']} x {match['away_score']}"
                print(f"      ✓ {home} {result} {away} - {date}")
            else:
                print(f"      • {home} vs {away} - {date}")
        
        if len(round_matches) > 3:
            print(f"      ... e mais {len(round_matches) - 3} jogos")
        print()
    
    print(f"🎉 SINCRONIZAÇÃO COMPLETA!")
    print(f"   - {len(all_matches)} jogos salvos")
    print(f"   - {len(rounds_data)} rodadas criadas")
    print(f"\n🔥 CallClub atualizado com dados REAIS do Carioca 2026!")


if __name__ == "__main__":
    asyncio.run(sync_carioca_thesportsdb())
