"""
Cria dados de exemplo do Campeonato Carioca 2026
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def seed_carioca_2026():
    print("🏆 Criando dados do Campeonato Carioca 2026...\n")
    
    # Limpa dados antigos
    await db.matches.delete_many({})
    await db.rounds.delete_many({})
    await db.predictions.delete_many({})
    await db.users.delete_many({})
    
    # Times do Carioca 2026
    teams = {
        "grupo_a": ["Flamengo", "Botafogo", "Nova Iguaçu", "Madureira"],
        "grupo_b": ["Fluminense", "Vasco", "Bangu", "Volta Redonda"],
        "grupo_c": ["Boavista", "Portuguesa", "Sampaio Corrêa", "Audax"]
    }
    
    all_teams = [team for group in teams.values() for team in group]
    
    # Cria 3 rodadas de exemplo
    now = datetime.now(timezone.utc)
    
    rounds_data = []
    match_id = 1
    
    for round_num in range(1, 4):
        # Data da rodada (cada rodada é 4 dias depois)
        round_date = now + timedelta(days=(round_num - 1) * 4)
        
        # Cria rodada
        round_doc = {
            "round_number": round_num,
            "is_current": round_num == 1,
            "deadline": round_date
        }
        await db.rounds.insert_one(round_doc)
        
        # Cria 6 jogos por rodada (combinações diferentes)
        matches = []
        
        if round_num == 1:
            # Rodada 1 - Clássicos
            matches = [
                ("Flamengo", "Vasco", round_date),
                ("Fluminense", "Botafogo", round_date + timedelta(hours=2)),
                ("Nova Iguaçu", "Bangu", round_date + timedelta(hours=4)),
                ("Madureira", "Boavista", round_date + timedelta(days=1)),
                ("Portuguesa", "Volta Redonda", round_date + timedelta(days=1, hours=2)),
                ("Sampaio Corrêa", "Audax", round_date + timedelta(days=1, hours=4))
            ]
        elif round_num == 2:
            # Rodada 2
            matches = [
                ("Botafogo", "Vasco", round_date),
                ("Flamengo", "Fluminense", round_date + timedelta(hours=2)),
                ("Bangu", "Madureira", round_date + timedelta(hours=4)),
                ("Boavista", "Nova Iguaçu", round_date + timedelta(days=1)),
                ("Volta Redonda", "Portuguesa", round_date + timedelta(days=1, hours=2)),
                ("Audax", "Sampaio Corrêa", round_date + timedelta(days=1, hours=4))
            ]
        else:
            # Rodada 3
            matches = [
                ("Vasco", "Fluminense", round_date),
                ("Botafogo", "Flamengo", round_date + timedelta(hours=2)),
                ("Nova Iguaçu", "Portuguesa", round_date + timedelta(hours=4)),
                ("Madureira", "Volta Redonda", round_date + timedelta(days=1)),
                ("Bangu", "Boavista", round_date + timedelta(days=1, hours=2)),
                ("Audax", "Sampaio Corrêa", round_date + timedelta(days=1, hours=4))
            ]
        
        for home, away, match_date in matches:
            match_doc = {
                "match_id": str(match_id),
                "round_number": round_num,
                "home_team": home,
                "away_team": away,
                "home_score": None,
                "away_score": None,
                "match_date": match_date,
                "is_finished": False
            }
            await db.matches.insert_one(match_doc)
            match_id += 1
        
        print(f"✅ Rodada {round_num}: {len(matches)} jogos criados")
    
    print(f"\n🎉 CARIOCA 2026 CRIADO COM SUCESSO!")
    print(f"   - 3 rodadas")
    print(f"   - 18 jogos")
    print(f"   - 12 times do Rio de Janeiro")
    print(f"\n🔥 Seus amigos já podem palpitar!")

if __name__ == "__main__":
    asyncio.run(seed_carioca_2026())
