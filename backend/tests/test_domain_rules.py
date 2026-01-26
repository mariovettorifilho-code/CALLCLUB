"""
Test Domain Rules: LIGAS ≠ CAMPEONATOS
- Tela de Palpites mostra APENAS campeonatos oficiais
- Ligas aparecem APENAS na Classificação
- Dropdown de criar liga mostra APENAS campeonatos oficiais
- Nomes com ano (2026)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestOfficialChampionshipsEndpoint:
    """Test /api/user/{username}/official-championships endpoint"""
    
    def test_official_championships_returns_only_official(self):
        """Official championships endpoint should return ONLY is_official=True"""
        response = requests.get(f"{BASE_URL}/api/user/Mario/official-championships")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Verify all returned championships are official (no leagues)
        for champ in data:
            assert 'league_name' not in champ or champ.get('league_name') is None, \
                f"League found in official championships: {champ.get('name')}"
            assert champ.get('access_type') in ['national', 'extra'], \
                f"Invalid access_type: {champ.get('access_type')}"
    
    def test_official_championships_has_year_in_name(self):
        """All official championships should have year (2026) in name"""
        response = requests.get(f"{BASE_URL}/api/user/Mario/official-championships")
        assert response.status_code == 200
        
        data = response.json()
        for champ in data:
            assert '2026' in champ.get('name', ''), \
                f"Championship without year: {champ.get('name')}"
    
    def test_official_championships_for_premium_user(self):
        """Premium user should see national + extra championships (no leagues)"""
        response = requests.get(f"{BASE_URL}/api/user/Mario/official-championships")
        assert response.status_code == 200
        
        data = response.json()
        # Mario is premium, should have at least national championship
        assert len(data) >= 1
        
        # Check that brasileirao is present
        champ_ids = [c.get('championship_id') for c in data]
        assert 'brasileirao' in champ_ids


class TestAccessibleChampionshipsEndpoint:
    """Test /api/user/{username}/accessible-championships endpoint"""
    
    def test_accessible_championships_includes_leagues(self):
        """Accessible championships should include leagues for premium users"""
        response = requests.get(f"{BASE_URL}/api/user/Mario/accessible-championships")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Mario owns 2 leagues, should see them
        league_entries = [c for c in data if c.get('access_type') == 'league']
        assert len(league_entries) >= 2, \
            f"Expected at least 2 leagues, got {len(league_entries)}"
    
    def test_accessible_championships_has_league_names(self):
        """League entries should have league_name field"""
        response = requests.get(f"{BASE_URL}/api/user/Mario/accessible-championships")
        assert response.status_code == 200
        
        data = response.json()
        league_entries = [c for c in data if c.get('access_type') == 'league']
        
        for league in league_entries:
            assert 'league_name' in league, "League entry missing league_name"
            assert league.get('league_name') is not None
    
    def test_accessible_championships_for_marcos(self):
        """Marcos should see leagues he's a member of"""
        response = requests.get(f"{BASE_URL}/api/user/Marcos/accessible-championships")
        assert response.status_code == 200
        
        data = response.json()
        league_entries = [c for c in data if c.get('access_type') == 'league']
        
        # Marcos is member of multiple leagues
        assert len(league_entries) >= 2


class TestChampionshipsHaveYear:
    """Test that all championships have year (2026) in name"""
    
    def test_all_championships_have_year(self):
        """All championships in database should have year in name"""
        response = requests.get(f"{BASE_URL}/api/championships")
        assert response.status_code == 200
        
        data = response.json()
        for champ in data:
            assert '2026' in champ.get('name', ''), \
                f"Championship without year: {champ.get('name')}"
    
    def test_championships_are_official(self):
        """All championships should have is_official=True"""
        response = requests.get(f"{BASE_URL}/api/championships")
        assert response.status_code == 200
        
        data = response.json()
        for champ in data:
            assert champ.get('is_official') == True, \
                f"Championship not official: {champ.get('name')}"


class TestLeaguesPointToBrasileirao:
    """Test that leagues point to brasileirao championship"""
    
    def test_liga_dos_crias_points_to_brasileirao(self):
        """Liga dos Crias should point to brasileirao"""
        response = requests.get(f"{BASE_URL}/api/leagues/user/Mario")
        assert response.status_code == 200
        
        data = response.json()
        liga_dos_crias = next((l for l in data if l.get('name') == 'Liga dos Crias'), None)
        
        assert liga_dos_crias is not None, "Liga dos Crias not found"
        assert liga_dos_crias.get('championship_id') == 'brasileirao', \
            f"Liga dos Crias points to {liga_dos_crias.get('championship_id')}, expected brasileirao"
    
    def test_os_boleiros_points_to_brasileirao(self):
        """Os Boleiros should point to brasileirao"""
        response = requests.get(f"{BASE_URL}/api/leagues/user/Mario")
        assert response.status_code == 200
        
        data = response.json()
        os_boleiros = next((l for l in data if l.get('name') == 'Os Boleiros'), None)
        
        assert os_boleiros is not None, "Os Boleiros not found"
        assert os_boleiros.get('championship_id') == 'brasileirao', \
            f"Os Boleiros points to {os_boleiros.get('championship_id')}, expected brasileirao"


class TestPredictionsWork:
    """Test that predictions work with official championship"""
    
    def test_get_predictions_for_brasileirao(self):
        """Should be able to get predictions for brasileirao"""
        response = requests.get(
            f"{BASE_URL}/api/predictions/Mario",
            params={"round_number": 1, "championship_id": "brasileirao"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_matches_for_brasileirao(self):
        """Should be able to get matches for brasileirao"""
        response = requests.get(
            f"{BASE_URL}/api/matches/1",
            params={"championship_id": "brasileirao"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1


class TestRankingEndpoints:
    """Test ranking endpoints work correctly"""
    
    def test_detailed_ranking_for_brasileirao(self):
        """Should get detailed ranking for brasileirao"""
        response = requests.get(f"{BASE_URL}/api/ranking/detailed/brasileirao")
        assert response.status_code == 200
        
        data = response.json()
        assert 'ranking' in data
        assert 'current_round' in data
        assert 'total_rounds' in data
    
    def test_league_ranking(self):
        """Should get ranking for a specific league"""
        # First get Mario's leagues
        leagues_response = requests.get(f"{BASE_URL}/api/leagues/user/Mario")
        assert leagues_response.status_code == 200
        
        leagues = leagues_response.json()
        if leagues:
            league_id = leagues[0].get('league_id')
            
            response = requests.get(f"{BASE_URL}/api/ranking/league/{league_id}")
            assert response.status_code == 200
            
            data = response.json()
            assert 'league' in data
            assert 'ranking' in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
