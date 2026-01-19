import httpx
from datetime import datetime, timezone
from typing import List, Dict, Optional

class TheSportsDBService:
    """
    Integração com TheSportsDB - 100% GRATUITA
    API Key pública: "3"
    """
    
    def __init__(self):
        self.api_key = "3"  # API key pública
        self.base_url = "https://www.thesportsdb.com/api/v1/json"
    
    async def get_carioca_2026_events(self) -> List[Dict]:
        """Busca todos os eventos do Carioca 2026"""
        league_id = "5688"  # ID do Carioca
        season = "2026"
        
        async with httpx.AsyncClient() as client:
            try:
                url = f"{self.base_url}/{self.api_key}/eventsseason.php"
                params = {"id": league_id, "s": season}
                
                response = await client.get(url, params=params, timeout=15.0)
                data = response.json()
                
                if data and "events" in data and data["events"]:
                    print(f"✅ {len(data['events'])} jogos encontrados!")
                    return data["events"]
                else:
                    print("❌ Nenhum jogo encontrado")
                    return []
                    
            except Exception as e:
                print(f"Erro ao buscar jogos: {e}")
                return []
    
    async def get_event_details(self, event_id: str) -> Optional[Dict]:
        """Busca detalhes de um jogo específico"""
        async with httpx.AsyncClient() as client:
            try:
                url = f"{self.base_url}/{self.api_key}/lookupevent.php"
                params = {"id": event_id}
                
                response = await client.get(url, params=params, timeout=10.0)
                data = response.json()
                
                if data and "events" in data and data["events"]:
                    return data["events"][0]
                return None
                    
            except Exception as e:
                print(f"Erro ao buscar jogo {event_id}: {e}")
                return None
    
    def parse_event(self, event: Dict) -> Dict:
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
            "event_id": event["idEvent"]
        }
    
    async def sync_carioca_2026(self):
        """Sincroniza todos os jogos do Carioca 2026"""
        events = await self.get_carioca_2026_events()
        parsed_events = []
        
        for event in events:
            try:
                parsed = self.parse_event(event)
                parsed_events.append(parsed)
            except Exception as e:
                print(f"Erro ao processar evento: {e}")
                continue
        
        return parsed_events
