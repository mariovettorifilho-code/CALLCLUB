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
    # Carioca 2026 começou em 11/01/2026
    # Vamos usar datas reais baseadas no calendário atual
    base_date = datetime(2026, 1, 19, 16, 0, tzinfo=timezone.utc)  # 19/01/2026 às 16h (horário comum no Carioca)
    
    rounds_data = []
    match_id = 1
    
    for round_num in range(1, 4):
        # Data da rodada (cada rodada é no final de semana)
        # Rodada 1: 19/01 (domingo)
        # Rodada 2: 26/01 (domingo)
        # Rodada 3: 02/02 (domingo)
        round_date = base_date + timedelta(days=(round_num - 1) * 7)
        
        # Cria rodada
        round_doc = {
            "round_number": round_num,
            "is_current": round_num == 1,
            "deadline": round_date
        }
        await db.rounds.insert_one(round_doc)
        
        # Cria 6 jogos por rodada (combinações diferentes)
        # Jogos acontecem em sábado e domingo
        matches = []
        
        if round_num == 1:
            # Rodada 1 - Clássicos (19/01/2026 - Domingo)
            saturday = round_date - timedelta(days=1)  # 18/01 (sábado)
            matches = [
                ("Flamengo", "Vasco", saturday.replace(hour=16, minute=0)),  # Sábado 16h
                ("Fluminense", "Botafogo", saturday.replace(hour=18, minute=30)),  # Sábado 18h30
                ("Nova Iguaçu", "Bangu", round_date.replace(hour=11, minute=0)),  # Domingo 11h
                ("Madureira", "Boavista", round_date.replace(hour=16, minute=0)),  # Domingo 16h
                ("Portuguesa", "Volta Redonda", round_date.replace(hour=18, minute=30)),  # Domingo 18h30
                ("Sampaio Corrêa", "Audax", round_date.replace(hour=20, minute=0))  # Domingo 20h
            ]
        elif round_num == 2:
            # Rodada 2 (26/01/2026 - Domingo)
            saturday = round_date - timedelta(days=1)
            matches = [
                ("Botafogo", "Vasco", saturday.replace(hour=16, minute=30)),
                ("Flamengo", "Fluminense", saturday.replace(hour=19, minute=0)),
                ("Bangu", "Madureira", round_date.replace(hour=11, minute=0)),
                ("Boavista", "Nova Iguaçu", round_date.replace(hour=15, minute=0)),
                ("Volta Redonda", "Portuguesa", round_date.replace(hour=17, minute=0)),
                ("Audax", "Sampaio Corrêa", round_date.replace(hour=19, minute=30))
            ]
        else:
            # Rodada 3 (02/02/2026 - Domingo)
            saturday = round_date - timedelta(days=1)
            matches = [
                ("Vasco", "Fluminense", saturday.replace(hour=16, minute=0)),
                ("Botafogo", "Flamengo", saturday.replace(hour=18, minute=30)),
                ("Nova Iguaçu", "Portuguesa", round_date.replace(hour=11, minute=0)),
                ("Madureira", "Volta Redonda", round_date.replace(hour=16, minute=0)),
                ("Bangu", "Boavista", round_date.replace(hour=18, minute=0)),
                ("Audax", "Sampaio Corrêa", round_date.replace(hour=20, minute=0))
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
