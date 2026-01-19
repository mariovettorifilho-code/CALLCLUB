"""
Script para sincronizar Campeonato Carioca 2026 com CallClub

COMO USAR:
1. Adicione sua API key no .env: API_FOOTBALL_KEY=sua_key_aqui
2. Execute: python sync_carioca.py

Isso vai:
- Buscar todos os jogos do Carioca 2026
- Criar rodadas automaticamente
- Salvar tudo no MongoDB
- Atualizar resultados dos jogos já finalizados
"""

import asyncio
import sys
import os
from pathlib import Path

# Adiciona o diretório backend ao path
sys.path.append(str(Path(__file__).parent))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from api_football import sync_carioca_2026
from datetime import datetime, timezone

load_dotenv()

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


async def sync_all():
    """Sincroniza tudo"""
    
    print("🏆 CALLCLUB - SINCRONIZAÇÃO CAMPEONATO CARIOCA 2026\n")
    
    # 1. Busca jogos da API-Football
    print("📡 Buscando jogos do Carioca 2026 na API-Football...")
    matches = await sync_carioca_2026()
    
    if not matches:
        print("❌ Nenhum jogo encontrado. Verifique:")
        print("   - API key está correta no .env")
        print("   - Campeonato Carioca 2026 existe na API-Football")
        return
    
    print(f"✅ {len(matches)} jogos encontrados!\n")
    
    # 2. Organiza por rodada
    rounds = {}
    for match in matches:
        round_num = match["round_number"]
        if round_num not in rounds:
            rounds[round_num] = []
        rounds[round_num].append(match)
    
    print(f"📊 Total de rodadas: {len(rounds)}\n")
    
    # 3. Salva no banco
    print("💾 Salvando no MongoDB...")
    
    # Limpa dados antigos do Carioca
    await db.matches.delete_many({})
    await db.rounds.delete_many({})
    
    # Cria rodadas
    for round_num in sorted(rounds.keys()):
        round_matches = rounds[round_num]
        
        # Data da primeira partida da rodada
        first_match_date = min(m["match_date"] for m in round_matches)
        
        # Cria rodada
        round_doc = {
            "round_number": round_num,
            "is_current": round_num == 1,  # Primeira rodada é a atual
            "deadline": first_match_date
        }
        await db.rounds.insert_one(round_doc)
        
        # Salva jogos
        for match in round_matches:
            await db.matches.insert_one(match)
        
        status = "✅ Finalizada" if any(m["is_finished"] for m in round_matches) else "⏳ Aguardando"
        print(f"   Rodada {round_num}: {len(round_matches)} jogos - {status}")
    
    print(f"\n✅ SINCRONIZAÇÃO COMPLETA!")
    print(f"   - {len(matches)} jogos salvos")
    print(f"   - {len(rounds)} rodadas criadas")
    print(f"\n🎯 Seus amigos já podem fazer palpites!")
    
    # Mostra próximos jogos
    now = datetime.now(timezone.utc)
    upcoming = [m for m in matches if m["match_date"] > now and not m["is_finished"]]
    
    if upcoming:
        upcoming_sorted = sorted(upcoming, key=lambda x: x["match_date"])[:5]
        print(f"\n📅 Próximos jogos:")
        for match in upcoming_sorted:
            date_str = match["match_date"].strftime("%d/%m %H:%M")
            print(f"   - {date_str}: {match['home_team']} vs {match['away_team']}")


async def update_results():
    """Atualiza resultados dos jogos já realizados"""
    print("🔄 Atualizando resultados...\n")
    
    from api_football import APIFootballService
    service = APIFootballService()
    
    # Busca jogos não finalizados
    pending_matches = await db.matches.find({"is_finished": False}).to_list(100)
    
    if not pending_matches:
        print("✅ Todos os jogos já estão atualizados!")
        return
    
    print(f"📊 {len(pending_matches)} jogos para verificar...")
    
    updated = 0
    for match in pending_matches:
        fixture_id = match.get("api_fixture_id")
        if not fixture_id:
            continue
        
        # Busca jogo atualizado na API
        fixture = await service.get_fixture_by_id(fixture_id)
        
        if fixture and fixture["fixture"]["status"]["short"] == "FT":
            # Jogo finalizado! Atualiza no banco
            goals = fixture["goals"]
            
            await db.matches.update_one(
                {"match_id": match["match_id"]},
                {"$set": {
                    "home_score": goals["home"],
                    "away_score": goals["away"],
                    "is_finished": True
                }}
            )
            
            print(f"   ✅ {match['home_team']} {goals['home']} x {goals['away']} {match['away_team']}")
            updated += 1
    
    if updated > 0:
        print(f"\n🎉 {updated} jogos atualizados!")
        
        # Importa função de recalcular pontos
        from server import calculate_points
        
        # Recalcula pontos de todos os palpites
        predictions = await db.predictions.find({}).to_list(1000)
        
        for pred in predictions:
            match = await db.matches.find_one({"match_id": pred["match_id"]})
            if match and match.get("is_finished"):
                points = calculate_points(pred, match)
                await db.predictions.update_one(
                    {"username": pred["username"], "match_id": pred["match_id"]},
                    {"$set": {"points": points}}
                )
        
        print("✅ Pontuações recalculadas!")
    else:
        print("ℹ️  Nenhum jogo novo finalizado")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "update":
        # Modo: só atualiza resultados
        asyncio.run(update_results())
    else:
        # Modo: sincronização completa
        asyncio.run(sync_all())
