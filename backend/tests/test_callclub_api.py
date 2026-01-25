"""
CallClub API Tests - Backend Testing
Tests for authentication, user management, championships, predictions, and admin endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns healthy status - Note: /health is not routed through /api"""
        # The /health endpoint is not exposed through the public URL, skip this test
        # In production, health checks are done internally
        pytest.skip("Health endpoint not exposed through public URL")


class TestAuthentication:
    """Authentication endpoint tests - Login with name + PIN"""
    
    def test_login_mario_success(self):
        """Test login with Mario/2412 credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/check-name", json={
            "username": "Mario",
            "pin": "2412"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert data.get("username") == "Mario"
        assert "user" in data
        # Verify user is PREMIUM (beta tester)
        assert data["user"].get("plan") == "premium"
    
    def test_login_marcos_success(self):
        """Test login with Marcos/6969 credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/check-name", json={
            "username": "Marcos",
            "pin": "6969"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert data.get("username") == "Marcos"
        assert "user" in data
        # Verify user is PREMIUM (beta tester)
        assert data["user"].get("plan") == "premium"
    
    def test_login_wrong_pin(self):
        """Test login with wrong PIN returns 403"""
        response = requests.post(f"{BASE_URL}/api/auth/check-name", json={
            "username": "Mario",
            "pin": "0000"
        })
        assert response.status_code == 403
        data = response.json()
        assert "PIN incorreto" in data.get("detail", "")
    
    def test_login_unauthorized_user(self):
        """Test login with unauthorized username returns 403"""
        response = requests.post(f"{BASE_URL}/api/auth/check-name", json={
            "username": "UnauthorizedUser",
            "pin": "1234"
        })
        assert response.status_code == 403
        data = response.json()
        assert "não autorizado" in data.get("detail", "").lower()


class TestUserProfile:
    """User profile endpoint tests"""
    
    def test_get_user_profile_mario(self):
        """Test getting Mario's profile"""
        response = requests.get(f"{BASE_URL}/api/user/Mario")
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"].get("username") == "Mario"
        assert data["user"].get("plan") == "premium"
        assert "national_championship" in data
        assert data["national_championship"] == "brasileirao"
        assert "statistics" in data
        assert "plan_info" in data
    
    def test_get_user_profile_not_found(self):
        """Test getting non-existent user returns 404"""
        response = requests.get(f"{BASE_URL}/api/user/NonExistentUser12345")
        assert response.status_code == 404
    
    def test_get_user_accessible_championships(self):
        """Test getting accessible championships for Mario"""
        response = requests.get(f"{BASE_URL}/api/user/Mario/accessible-championships")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should have at least the national championship (Brasileirão)
        assert len(data) >= 1
        # Check that access_type is present
        for champ in data:
            assert "access_type" in champ
            assert "championship_id" in champ
            assert "name" in champ
        # Verify Brasileirão is accessible as national
        brasileirao = next((c for c in data if c["championship_id"] == "brasileirao"), None)
        assert brasileirao is not None
        assert brasileirao["access_type"] == "national"


class TestChampionships:
    """Championship endpoint tests"""
    
    def test_get_all_championships(self):
        """Test getting all championships - should return 8"""
        response = requests.get(f"{BASE_URL}/api/championships")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 8  # 8 championships as per requirements
        
        # Verify expected championships exist
        championship_ids = [c["championship_id"] for c in data]
        expected = ["brasileirao", "serie_a", "la_liga", "premier_league", 
                   "bundesliga", "ligue_1", "libertadores", "champions_league"]
        for exp_id in expected:
            assert exp_id in championship_ids, f"Missing championship: {exp_id}"
    
    def test_get_championship_brasileirao(self):
        """Test getting Brasileirão details"""
        response = requests.get(f"{BASE_URL}/api/championships/brasileirao")
        assert response.status_code == 200
        data = response.json()
        assert data.get("championship_id") == "brasileirao"
        assert data.get("name") == "Campeonato Brasileiro"
        assert data.get("country") == "BR"
        assert data.get("is_national") == True
        assert data.get("total_rounds") == 38
    
    def test_get_championship_not_found(self):
        """Test getting non-existent championship returns 404"""
        response = requests.get(f"{BASE_URL}/api/championships/nonexistent")
        assert response.status_code == 404


class TestRankings:
    """Ranking endpoint tests"""
    
    def test_get_detailed_ranking_brasileirao(self):
        """Test getting detailed ranking for Brasileirão"""
        response = requests.get(f"{BASE_URL}/api/ranking/detailed/brasileirao")
        assert response.status_code == 200
        data = response.json()
        assert data.get("championship_id") == "brasileirao"
        assert "current_round" in data
        assert "total_rounds" in data
        assert data["total_rounds"] == 38
        assert "ranking" in data
        assert isinstance(data["ranking"], list)
        # If there are users in ranking, verify structure
        if len(data["ranking"]) > 0:
            user = data["ranking"][0]
            assert "username" in user
            assert "total_points" in user
            assert "position" in user  # Bug fix verification - position should exist
    
    def test_get_round_ranking(self):
        """Test getting ranking for a specific round"""
        response = requests.get(f"{BASE_URL}/api/ranking/round/1?championship_id=brasileirao")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestMatches:
    """Match endpoint tests"""
    
    def test_get_matches_round_1(self):
        """Test getting matches for round 1"""
        response = requests.get(f"{BASE_URL}/api/matches/1?championship_id=brasileirao")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_current_round(self):
        """Test getting current round"""
        response = requests.get(f"{BASE_URL}/api/rounds/current?championship_id=brasileirao")
        assert response.status_code == 200
        data = response.json()
        assert "championship_id" in data
        assert "round_number" in data
        assert data["championship_id"] == "brasileirao"
    
    def test_get_all_rounds(self):
        """Test getting all rounds"""
        response = requests.get(f"{BASE_URL}/api/rounds/all?championship_id=brasileirao")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 38  # Brasileirão has 38 rounds


class TestPredictions:
    """Prediction endpoint tests"""
    
    def test_get_user_predictions(self):
        """Test getting user predictions"""
        response = requests.get(f"{BASE_URL}/api/predictions/Mario?round_number=1&championship_id=brasileirao")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestAdminEndpoints:
    """Admin endpoint tests"""
    
    def test_admin_login_success(self):
        """Test admin login with correct password"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "password": "callclub2026"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
    
    def test_admin_login_wrong_password(self):
        """Test admin login with wrong password returns 403"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "password": "wrongpassword"
        })
        assert response.status_code == 403
    
    def test_admin_get_users(self):
        """Test admin get users endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/users?password=callclub2026")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_admin_get_stats(self):
        """Test admin get stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/stats?password=callclub2026")
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "total_predictions" in data
        assert "total_championships" in data
    
    def test_admin_get_championships(self):
        """Test admin get championships endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/championships?password=callclub2026")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 8  # Should have 8 championships


class TestCountries:
    """Country endpoint tests"""
    
    def test_get_countries(self):
        """Test getting supported countries"""
        response = requests.get(f"{BASE_URL}/api/countries")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should have Brazil
        br = next((c for c in data if c.get("code") == "BR"), None)
        assert br is not None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
