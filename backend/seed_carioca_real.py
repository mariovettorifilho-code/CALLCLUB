"""
Cria rodadas REAIS do Campeonato Carioca 2026
Baseado na tabela atual - estamos na RODADA 3
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

async def seed_carioca_real_2026():
    print("🏆 Criando RODADAS REAIS do Campeonato Carioca 2026...\n")
    
    # Limpa dados antigos
    await db.matches.delete_many({})
    await db.rounds.delete_many({})
    await db.predictions.delete_many({})
    await db.users.delete_many({})
    
    # Times REAIS do Carioca 2026
    # Grupo A: Bangu, Fluminense, Portuguesa-RJ, Sampaio Corrêa-RJ, Vasco, Volta Redonda
    # Grupo B: Boavista, Botafogo, Flamengo, Madureira, Maricá, Nova Iguaçu
    
    # Datas reais baseadas no calendário
    # Rodada 3: 21-22 de janeiro (quarta/quinta)
    # Rodada 4: 25-26 de janeiro (sábado/domingo)
    # Rodada 5: 29-30 de janeiro (quarta/quinta)  
    # Rodada 6: 01-02 de fevereiro (sábado/domingo)
    
    match_id = 1
    
    # RODADA 3 (21-22/01/2026) - JOGOS CRUZADOS Grupo B x Grupo A
    print("Criando Rodada 3 (21-22 de janeiro)...")
    round_3_date = datetime(2026, 1, 21, 19, 30, tzinfo=timezone.utc)  # Quarta 19h30
    
    await db.rounds.insert_one({
        "round_number": 3,
        "is_current": True,  # Rodada atual!
        "deadline": round_3_date
    })
    
    rodada_3 = [
        ("Maricá", "Bangu", round_3_date.replace(hour=17, minute=0)),  # 21/01 17h
        ("Botafogo", "Volta Redonda", round_3_date.replace(hour=19, minute=30)),  # 21/01 19h30
        ("Flamengo", "Vasco", round_3_date.replace(day=22, hour=0, minute=30)),  # 22/01 00h30 (madrugada)
        ("Madureira", "Sampaio Corrêa-RJ", round_3_date.replace(day=22, hour=15, minute=0)),  # 22/01 15h
        ("Nova Iguaçu", "Fluminense", round_3_date.replace(day=22, hour=19, minute=0)),  # 22/01 19h
        ("Boavista", "Portuguesa-RJ", round_3_date.replace(day=22, hour=21, minute=0))  # 22/01 21h
    ]
    
    for home, away, match_date in rodada_3:
        await db.matches.insert_one({
            "match_id": str(match_id),
            "round_number": 3,
            "home_team": home,
            "away_team": away,
            "home_score": None,
            "away_score": None,
            "match_date": match_date,
            "is_finished": False
        })
        match_id += 1
    
    print(f"✅ Rodada 3: {len(rodada_3)} jogos criados")
    
    # RODADA 4 (25-26/01/2026) - JOGOS CRUZADOS
    print("Criando Rodada 4 (25-26 de janeiro)...")
    round_4_date = datetime(2026, 1, 25, 16, 0, tzinfo=timezone.utc)  # Sábado 16h
    
    await db.rounds.insert_one({
        "round_number": 4,
        "is_current": False,
        "deadline": round_4_date
    })
    
    rodada_4 = [
        ("Bangu", "Boavista", round_4_date.replace(hour=16, minute=0)),  # 25/01 16h
        ("Volta Redonda", "Nova Iguaçu", round_4_date.replace(hour=18, minute=30)),  # 25/01 18h30
        ("Vasco", "Madureira", round_4_date.replace(day=26, hour=11, minute=0)),  # 26/01 11h
        ("Sampaio Corrêa-RJ", "Botafogo", round_4_date.replace(day=26, hour=16, minute=0)),  # 26/01 16h
        ("Fluminense", "Flamengo", round_4_date.replace(day=26, hour=18, minute=30)),  # 26/01 18h30
        ("Portuguesa-RJ", "Maricá", round_4_date.replace(day=26, hour=20, minute=0))  # 26/01 20h
    ]
    
    for home, away, match_date in rodada_4:
        await db.matches.insert_one({
            "match_id": str(match_id),
            "round_number": 4,
            "home_team": home,
            "away_team": away,
            "home_score": None,
            "away_score": None,
            "match_date": match_date,
            "is_finished": False
        })
        match_id += 1
    
    print(f"✅ Rodada 4: {len(rodada_4)} jogos criados")
    
    # RODADA 5 (29-30/01/2026)
    print("Criando Rodada 5 (29-30 de janeiro)...")
    round_5_date = datetime(2026, 1, 29, 19, 0, tzinfo=timezone.utc)  # Quarta 19h
    
    await db.rounds.insert_one({
        "round_number": 5,
        "is_current": False,
        "deadline": round_5_date
    })
    
    rodada_5 = [
        ("Boavista", "Vasco", round_5_date.replace(hour=17, minute=0)),  # 29/01 17h
        ("Nova Iguaçu", "Portuguesa-RJ", round_5_date.replace(hour=19, minute=30)),  # 29/01 19h30
        ("Madureira", "Fluminense", round_5_date.replace(day=30, hour=15, minute=0)),  # 30/01 15h
        ("Botafogo", "Bangu", round_5_date.replace(day=30, hour=18, minute=0)),  # 30/01 18h
        ("Flamengo", "Sampaio Corrêa-RJ", round_5_date.replace(day=30, hour=20, minute=0)),  # 30/01 20h
        ("Maricá", "Volta Redonda", round_5_date.replace(day=30, hour=21, minute=30))  # 30/01 21h30
    ]
    
    for home, away, match_date in rodada_5:
        await db.matches.insert_one({
            "match_id": str(match_id),
            "round_number": 5,
            "home_team": home,
            "away_team": away,
            "home_score": None,
            "away_score": None,
            "match_date": match_date,
            "is_finished": False
        })
        match_id += 1
    
    print(f"✅ Rodada 5: {len(rodada_5)} jogos criados")
    
    # RODADA 6 (01-02/02/2026) - ÚLTIMA DA TAÇA GUANABARA
    print("Criando Rodada 6 (01-02 de fevereiro) - Final da Taça Guanabara...")
    round_6_date = datetime(2026, 2, 1, 16, 0, tzinfo=timezone.utc)  # Sábado 16h
    
    await db.rounds.insert_one({
        "round_number": 6,
        "is_current": False,
        "deadline": round_6_date
    })
    
    rodada_6 = [
        ("Vasco", "Botafogo", round_6_date.replace(hour=16, minute=0)),  # 01/02 16h - CLÁSSICO!
        ("Fluminense", "Boavista", round_6_date.replace(hour=18, minute=30)),  # 01/02 18h30
        ("Sampaio Corrêa-RJ", "Maricá", round_6_date.replace(day=2, hour=11, minute=0)),  # 02/02 11h
        ("Bangu", "Nova Iguaçu", round_6_date.replace(day=2, hour=16, minute=0)),  # 02/02 16h
        ("Volta Redonda", "Madureira", round_6_date.replace(day=2, hour=18, minute=0)),  # 02/02 18h
        ("Portuguesa-RJ", "Flamengo", round_6_date.replace(day=2, hour=20, minute=0))  # 02/02 20h
    ]
    
    for home, away, match_date in rodada_6:
        await db.matches.insert_one({
            "match_id": str(match_id),
            "round_number": 6,
            "home_team": home,
            "away_team": away,
            "home_score": None,
            "away_score": None,
            "match_date": match_date,
            "is_finished": False
        })
        match_id += 1
    
    print(f"✅ Rodada 6: {len(rodada_6)} jogos criados")
    
    print(f"\n🎉 CARIOCA 2026 REAL CRIADO COM SUCESSO!")
    print(f"   - 4 rodadas (3, 4, 5, 6)")
    print(f"   - 24 jogos")
    print(f"   - Rodada ATUAL: 3 (21-22 de janeiro)")
    print(f"   - Times reais dos Grupos A e B")
    print(f"\n🔥 Seus amigos já podem palpitar na rodada 3!")
    print(f"\n⚠️  DICA: Com API key da API-Football, você sincroniza com horários 100% reais!")

if __name__ == "__main__":
    asyncio.run(seed_carioca_real_2026())
