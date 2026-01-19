"""
Sincroniza Campeonato Carioca 2026 com TheSportsDB (100% GRÁTIS)
"""

import asyncio
import sys
import os
from pathlib import Path

sys.path.append(str(Path(__file__).parent))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from thesportsdb import TheSportsDBService
from datetime import datetime, timezone

load_dotenv()

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


async def sync_carioca_thesportsdb():
    """Sincroniza Carioca 2026 com TheSportsDB"""
    
    print("🏆 CALLCLUB - SINCRONIZANDO CARIOCA 2026 (TheSportsDB)\n")
    
    # Inicializa serviço
    service = TheSportsDBService()
    
    # Busca todos os jogos
    print("📡 Buscando jogos do Carioca 2026...")
    matches = await service.sync_carioca_2026()
    
    if not matches:
        print("❌ Nenhum jogo encontrado")
        return
    
    print(f"✅ {len(matches)} jogos encontrados!\n")
    
    # Organiza por rodada
    rounds = {}
    for match in matches:
        round_num = match["round_number"]
        if round_num not in rounds:
            rounds[round_num] = []
        rounds[round_num].append(match)
    
    print(f"📊 Total de rodadas: {len(rounds)}")
    print(f"   Rodadas: {sorted(rounds.keys())}\n")
    
    # Limpa dados antigos
    print("🗑️  Limpando dados antigos...")
    await db.matches.delete_many({})
    await db.rounds.delete_many({})
    
    # Salva no banco
    print("💾 Salvando no MongoDB...\n")
    
    for round_num in sorted(rounds.keys()):
        round_matches = rounds[round_num]
        
        # Pega a data do primeiro jogo da rodada
        first_match_date = min(m["match_date"] for m in round_matches)
        
        # Define qual é a rodada atual
        now = datetime.now(timezone.utc)
        is_current = False
        
        # Rodada atual é a primeira que ainda não terminou
        has_unfinished = any(not m["is_finished"] for m in round_matches)
        current_round = await db.rounds.find_one({"is_current": True})
        
        if has_unfinished and not current_round:
            is_current = True
        
        # Se não tem nenhuma atual ainda, pega a última rodada disponível
        if round_num == max(rounds.keys()) and not current_round:
            is_current = True
        
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
    print(f"   - {len(matches)} jogos salvos")
    print(f"   - {len(rounds)} rodadas criadas")
    print(f"\n🔥 CallClub atualizado com dados REAIS do Carioca 2026!")


if __name__ == "__main__":
    asyncio.run(sync_carioca_thesportsdb())
