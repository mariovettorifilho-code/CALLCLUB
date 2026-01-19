import httpx
import os
from datetime import datetime, timezone
from typing import List, Dict, Optional

class APIFootballService:
    """
    Serviço para integração com API-Football
    Documentação: https://www.api-football.com/documentation-v3
    """
    
    def __init__(self):
        self.api_key = os.getenv("API_FOOTBALL_KEY", "")
        self.base_url = "https://v3.football.api-sports.io"
        self.headers = {
            "x-rapidapi-key": self.api_key,
            "x-rapidapi-host": "v3.football.api-sports.io"
        }
    
    async def get_league_id(self, league_name: str, country: str = "Brazil", season: int = 2026) -> Optional[int]:
        """
        Busca o ID da liga pelo nome
        
        Para Carioca 2026, você pode usar:
        - Nome: "Carioca - 1" ou "Campeonato Carioca"
        - País: Brazil
        - Season: 2026
        """
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/leagues",
                    headers=self.headers,
                    params={
                        "name": league_name,
                        "country": country,
                        "season": season
                    }
                )
                data = response.json()
                
                if data.get("results", 0) > 0:
                    league_id = data["response"][0]["league"]["id"]
                    print(f"✅ Liga encontrada: {league_name} - ID: {league_id}")
                    return league_id
                else:
                    print(f"❌ Liga não encontrada: {league_name}")
                    return None
            except Exception as e:
                print(f"Erro ao buscar liga: {e}")
                return None
    
    async def get_fixtures(self, league_id: int, season: int = 2026) -> List[Dict]:
        """
        Busca todos os jogos de uma liga/temporada
        
        Retorna: Lista de jogos com todas as informações
        """
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/fixtures",
                    headers=self.headers,
                    params={
                        "league": league_id,
                        "season": season
                    },
                    timeout=30.0
                )
                data = response.json()
                
                if data.get("results", 0) > 0:
                    fixtures = data["response"]
                    print(f"✅ {len(fixtures)} jogos encontrados")
                    return fixtures
                else:
                    print("❌ Nenhum jogo encontrado")
                    return []
            except Exception as e:
                print(f"Erro ao buscar jogos: {e}")
                return []
    
    async def get_fixture_by_id(self, fixture_id: int) -> Optional[Dict]:
        """
        Busca um jogo específico pelo ID (para atualizar resultado)
        """
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/fixtures",
                    headers=self.headers,
                    params={"id": fixture_id},
                    timeout=10.0
                )
                data = response.json()
                
                if data.get("results", 0) > 0:
                    return data["response"][0]
                return None
            except Exception as e:
                print(f"Erro ao buscar jogo {fixture_id}: {e}")
                return None
    
    def parse_fixture(self, fixture: Dict) -> Dict:
        """
        Converte dados da API-Football para formato do CallClub
        """
        fixture_data = fixture["fixture"]
        teams = fixture["teams"]
        goals = fixture["goals"]
        league = fixture["league"]
        
        return {
            "match_id": str(fixture_data["id"]),
            "round_number": self._extract_round_number(league.get("round", "")),
            "home_team": teams["home"]["name"],
            "away_team": teams["away"]["name"],
            "home_score": goals["home"],
            "away_score": goals["away"],
            "match_date": datetime.fromisoformat(fixture_data["date"].replace("Z", "+00:00")),
            "is_finished": fixture_data["status"]["short"] == "FT",
            "api_fixture_id": fixture_data["id"]  # Guarda o ID original da API
        }
    
    def _extract_round_number(self, round_str: str) -> int:
        """
        Extrai número da rodada de strings como:
        - "Regular Season - 1"
        - "1st Round"
        - "Rodada 5"
        """
        import re
        match = re.search(r'\d+', round_str)
        if match:
            return int(match.group())
        return 1
    
    async def sync_league_fixtures(self, league_id: int, season: int = 2026):
        """
        Sincroniza todos os jogos de uma liga
        Retorna lista de jogos no formato CallClub
        """
        fixtures = await self.get_fixtures(league_id, season)
        parsed_fixtures = []
        
        for fixture in fixtures:
            try:
                parsed = self.parse_fixture(fixture)
                parsed_fixtures.append(parsed)
            except Exception as e:
                print(f"Erro ao processar jogo: {e}")
                continue
        
        return parsed_fixtures


# Função auxiliar para uso fácil
async def sync_carioca_2026():
    """
    Sincroniza Campeonato Carioca 2026
    
    IMPORTANTE: Substitua LEAGUE_ID pelo ID correto após buscar na API
    """
    service = APIFootballService()
    
    # Primeiro, descobre o ID da liga
    league_id = await service.get_league_id("Carioca", "Brazil", 2026)
    
    if not league_id:
        print("⚠️  Tentando IDs comuns do Carioca...")
        # IDs comuns do Carioca (pode variar por ano)
        possible_ids = [526, 527, 528]  # Testar esses
        
        for test_id in possible_ids:
            fixtures = await service.get_fixtures(test_id, 2026)
            if fixtures:
                league_id = test_id
                print(f"✅ Encontrado! League ID: {league_id}")
                break
    
    if league_id:
        print(f"Sincronizando Campeonato Carioca 2026 (ID: {league_id})...")
        matches = await service.sync_league_fixtures(league_id, 2026)
        return matches
    else:
        print("❌ Não foi possível encontrar o Campeonato Carioca 2026")
        return []
