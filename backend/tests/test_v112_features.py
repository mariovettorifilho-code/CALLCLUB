"""
CallClub V1.1.2 - Feature Tests
Tests for: WhatsApp share button, Serie A games, Profile league filter
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://predictchamp-4.preview.emergentagent.com').rstrip('/')


class TestSerieAMatches:
    """Tests for Serie A matches (seeded data)"""
    
    def test_serie_a_matches_round_1(self):
        """GET /api/matches/1?championship_id=serie_a - Returns Serie A round 1 matches"""
        response = requests.get(f"{BASE_URL}/api/matches/1?championship_id=serie_a")
        assert response.status_code == 200
        
        matches = response.json()
        assert isinstance(matches, list)
        assert len(matches) == 5  # 5 matches per round
        
        # Verify match structure
        match = matches[0]
        assert 'match_id' in match
        assert 'home_team' in match
        assert 'away_team' in match
        assert 'championship_id' in match
        assert match['championship_id'] == 'serie_a'
        
        # Verify teams are Italian Serie A teams
        italian_teams = ['Inter', 'Milan', 'Juventus', 'Napoli', 'Roma', 'Lazio', 
                        'Atalanta', 'Fiorentina', 'Torino', 'Bologna']
        for m in matches:
            assert m['home_team'] in italian_teams, f"Unknown team: {m['home_team']}"
            assert m['away_team'] in italian_teams, f"Unknown team: {m['away_team']}"
    
    def test_serie_a_matches_round_2(self):
        """GET /api/matches/2?championship_id=serie_a - Returns Serie A round 2 matches"""
        response = requests.get(f"{BASE_URL}/api/matches/2?championship_id=serie_a")
        assert response.status_code == 200
        
        matches = response.json()
        assert isinstance(matches, list)
        assert len(matches) == 5
    
    def test_serie_a_rounds(self):
        """GET /api/rounds/all?championship_id=serie_a - Returns Serie A rounds"""
        response = requests.get(f"{BASE_URL}/api/rounds/all?championship_id=serie_a")
        assert response.status_code == 200
        
        rounds = response.json()
        assert isinstance(rounds, list)
        assert len(rounds) >= 5  # At least 5 rounds seeded


class TestOsBoleirosLeague:
    """Tests for Os Boleiros league (Serie A)"""
    
    def test_os_boleiros_ranking(self):
        """GET /api/leagues/57455f18 - Returns Os Boleiros ranking with data"""
        response = requests.get(f"{BASE_URL}/api/leagues/57455f18")
        assert response.status_code == 200
        
        data = response.json()
        assert 'league' in data
        assert 'ranking' in data
        
        # Verify league info
        league = data['league']
        assert league['name'] == 'Os Boleiros'
        assert league['championship_id'] == 'serie_a'
        assert 'Mario' in league['members']
        assert 'Marcos' in league['members']
        
        # Verify ranking has data
        ranking = data['ranking']
        assert len(ranking) >= 2  # Mario and Marcos
        
        # Verify ranking structure
        for entry in ranking:
            assert 'username' in entry
            assert 'total_points' in entry
            assert 'correct_results' in entry
            assert 'exact_scores' in entry
            assert 'total_predictions' in entry
            assert 'efficiency' in entry
    
    def test_os_boleiros_has_predictions(self):
        """Verify Mario and Marcos have predictions for Serie A"""
        # Check Mario's predictions for round 1
        mario_res = requests.get(f"{BASE_URL}/api/predictions/Mario?championship_id=serie_a&round_number=1")
        assert mario_res.status_code == 200
        mario_preds = mario_res.json()
        assert len(mario_preds) >= 5  # At least 5 predictions
        
        # Check Marcos's predictions for round 1
        marcos_res = requests.get(f"{BASE_URL}/api/predictions/Marcos?championship_id=serie_a&round_number=1")
        assert marcos_res.status_code == 200
        marcos_preds = marcos_res.json()
        assert len(marcos_preds) >= 5


class TestAccessibleChampionships:
    """Tests for accessible championships with league names"""
    
    def test_mario_accessible_championships(self):
        """GET /api/user/Mario/accessible-championships - Returns championships with league names"""
        response = requests.get(f"{BASE_URL}/api/user/Mario/accessible-championships")
        assert response.status_code == 200
        
        championships = response.json()
        assert isinstance(championships, list)
        
        # Find Serie A (Os Boleiros)
        serie_a_entries = [c for c in championships if c['championship_id'] == 'serie_a']
        assert len(serie_a_entries) >= 1
        
        # Verify league name is included
        os_boleiros = next((c for c in serie_a_entries if c.get('league_name') == 'Os Boleiros'), None)
        assert os_boleiros is not None, "Os Boleiros not found in accessible championships"
        assert os_boleiros['access_type'] == 'league'
        assert os_boleiros['league_id'] == '57455f18'
    
    def test_marcos_accessible_championships(self):
        """GET /api/user/Marcos/accessible-championships - Returns championships with league names"""
        response = requests.get(f"{BASE_URL}/api/user/Marcos/accessible-championships")
        assert response.status_code == 200
        
        championships = response.json()
        
        # Marcos should have access to:
        # 1. National (brasileirao)
        # 2. Liga dos Crias (brasileirao)
        # 3. Os Boleiros (serie_a)
        assert len(championships) >= 3
        
        # Verify Os Boleiros is included
        league_names = [c.get('league_name') for c in championships if c.get('league_name')]
        assert 'Os Boleiros' in league_names
        assert 'Liga dos Crias' in league_names


class TestWhatsAppShareURL:
    """Tests for WhatsApp share functionality (URL format verification)"""
    
    def test_league_has_invite_code(self):
        """Verify leagues have invite codes for WhatsApp sharing"""
        response = requests.get(f"{BASE_URL}/api/leagues/user/Mario")
        assert response.status_code == 200
        
        leagues = response.json()
        for league in leagues:
            assert 'invite_code' in league
            assert len(league['invite_code']) == 6  # 6 character code
            assert league['invite_code'].isupper()  # Uppercase
    
    def test_liga_dos_crias_invite_code(self):
        """Verify Liga dos Crias has correct invite code"""
        response = requests.get(f"{BASE_URL}/api/leagues/2087b6f7")
        assert response.status_code == 200
        
        data = response.json()
        assert data['league']['invite_code'] == '1RFA1C'
    
    def test_os_boleiros_invite_code(self):
        """Verify Os Boleiros has correct invite code"""
        response = requests.get(f"{BASE_URL}/api/leagues/57455f18")
        assert response.status_code == 200
        
        data = response.json()
        assert data['league']['invite_code'] == 'XTL7V5'
