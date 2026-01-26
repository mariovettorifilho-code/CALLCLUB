"""
CallClub - Leagues API Tests
Tests for private leagues feature (V1.1)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://predictchamp-4.preview.emergentagent.com').rstrip('/')

class TestLeaguesAPI:
    """Tests for leagues endpoints"""
    
    def test_get_user_leagues_mario(self):
        """GET /api/leagues/user/Mario - Returns Mario's leagues"""
        response = requests.get(f"{BASE_URL}/api/leagues/user/Mario")
        assert response.status_code == 200
        
        leagues = response.json()
        assert isinstance(leagues, list)
        assert len(leagues) >= 2  # Mario owns 2 leagues
        
        # Verify league structure
        league_names = [l['name'] for l in leagues]
        assert 'Liga dos Crias' in league_names
        assert 'Os Boleiros' in league_names
    
    def test_get_user_leagues_marcos(self):
        """GET /api/leagues/user/Marcos - Returns Marcos's leagues"""
        response = requests.get(f"{BASE_URL}/api/leagues/user/Marcos")
        assert response.status_code == 200
        
        leagues = response.json()
        assert isinstance(leagues, list)
        assert len(leagues) >= 2  # Marcos is member of 2 leagues
    
    def test_get_league_details(self):
        """GET /api/leagues/{id} - Returns league details with ranking"""
        # First get Mario's leagues to get a valid league_id
        leagues_res = requests.get(f"{BASE_URL}/api/leagues/user/Mario")
        leagues = leagues_res.json()
        league_id = leagues[0]['league_id']
        
        response = requests.get(f"{BASE_URL}/api/leagues/{league_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert 'league' in data
        assert 'ranking' in data
        
        # Verify league structure
        league = data['league']
        assert 'league_id' in league
        assert 'name' in league
        assert 'owner_username' in league
        assert 'invite_code' in league
        assert 'championship_id' in league
        assert 'members' in league
        
        # Verify ranking structure
        ranking = data['ranking']
        assert isinstance(ranking, list)
        if len(ranking) > 0:
            assert 'position' in ranking[0]
            assert 'username' in ranking[0]
            assert 'total_points' in ranking[0]
    
    def test_get_league_not_found(self):
        """GET /api/leagues/{id} - Returns 404 for invalid league"""
        response = requests.get(f"{BASE_URL}/api/leagues/invalid-league-id")
        assert response.status_code == 404
    
    def test_create_league_limit_reached(self):
        """POST /api/leagues/create - Returns 403 when limit reached"""
        # Mario already has 2 leagues (limit for PREMIUM)
        response = requests.post(
            f"{BASE_URL}/api/leagues/create",
            json={
                "name": "Test Liga",
                "owner_username": "Mario",
                "championship_id": "brasileirao"
            }
        )
        assert response.status_code == 403
        assert "Limite" in response.json().get('detail', '')
    
    def test_join_league_invalid_code(self):
        """POST /api/leagues/join - Returns 404 for invalid code"""
        response = requests.post(
            f"{BASE_URL}/api/leagues/join",
            json={
                "username": "Pedro",
                "invite_code": "XXXXXX"
            }
        )
        assert response.status_code == 404
    
    def test_join_league_already_member(self):
        """POST /api/leagues/join - Returns 400 when already member"""
        response = requests.post(
            f"{BASE_URL}/api/leagues/join",
            json={
                "username": "Marcos",
                "invite_code": "1RFA1C"  # Liga dos Crias
            }
        )
        assert response.status_code == 400
        assert "já é membro" in response.json().get('detail', '')
    
    def test_join_league_success(self):
        """POST /api/leagues/join - Successfully joins a league"""
        # Use a user that's not in the league
        response = requests.post(
            f"{BASE_URL}/api/leagues/join",
            json={
                "username": "Carlos",
                "invite_code": "1RFA1C"  # Liga dos Crias
            }
        )
        # Either success (200) or already member (400)
        assert response.status_code in [200, 400]
        
        if response.status_code == 200:
            data = response.json()
            assert data.get('success') == True
            assert 'league' in data


class TestUserProfile:
    """Tests for user profile with leagues"""
    
    def test_user_profile_includes_leagues(self):
        """GET /api/user/Mario - Profile includes leagues info"""
        response = requests.get(f"{BASE_URL}/api/user/Mario")
        assert response.status_code == 200
        
        data = response.json()
        user = data['user']
        
        # Verify leagues fields
        assert 'joined_leagues' in user
        assert 'owned_leagues' in user
        assert 'plan' in user
        assert user['plan'] in ['free', 'premium', 'vip']
        
        # Verify joined_leagues in response
        assert 'joined_leagues' in data
        assert isinstance(data['joined_leagues'], list)
    
    def test_user_accessible_championships(self):
        """GET /api/user/{username}/accessible-championships"""
        response = requests.get(f"{BASE_URL}/api/user/Mario/accessible-championships")
        assert response.status_code == 200
        
        championships = response.json()
        assert isinstance(championships, list)
        assert len(championships) >= 1
        
        # Verify championship structure
        champ = championships[0]
        assert 'championship_id' in champ
        assert 'name' in champ
        assert 'access_type' in champ


class TestLeagueRanking:
    """Tests for league ranking endpoint"""
    
    def test_league_ranking(self):
        """GET /api/ranking/league/{league_id}"""
        # Get a valid league_id
        leagues_res = requests.get(f"{BASE_URL}/api/leagues/user/Mario")
        leagues = leagues_res.json()
        league_id = leagues[0]['league_id']
        
        response = requests.get(f"{BASE_URL}/api/ranking/league/{league_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert 'league' in data
        assert 'ranking' in data
        
        ranking = data['ranking']
        if len(ranking) > 0:
            # Verify ranking is sorted by points
            for i in range(len(ranking) - 1):
                assert ranking[i]['total_points'] >= ranking[i+1]['total_points']


class TestPlanLimits:
    """Tests for plan-based access control"""
    
    def test_premium_status(self):
        """GET /api/premium/status/{username}"""
        response = requests.get(f"{BASE_URL}/api/premium/status/Mario")
        assert response.status_code == 200
        
        data = response.json()
        assert 'is_premium' in data
        assert 'plan' in data
        assert data['is_premium'] == True
        assert data['plan'] == 'premium'


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
