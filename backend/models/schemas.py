# CallClub - Pydantic Schemas
# Nova arquitetura global com sistema de planos

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
from enum import Enum


class PlanType(str, Enum):
    FREE = "free"
    PREMIUM = "premium"
    VIP = "vip"  # Preparado para futuro


class CountryCode(str, Enum):
    BR = "BR"  # Brasil
    IT = "IT"  # Itália
    ES = "ES"  # Espanha
    EN = "EN"  # Inglaterra
    DE = "DE"  # Alemanha
    FR = "FR"  # França
    PT = "PT"  # Portugal
    AR = "AR"  # Argentina
    NL = "NL"  # Holanda
    US = "US"  # EUA (MLS)


# ==================== USER SCHEMAS ====================
class User(BaseModel):
    username: str
    plan: PlanType = PlanType.FREE
    country: str = "BR"
    total_points: int = 0
    perfect_streak: int = 0
    max_perfect_streak: int = 0
    owned_leagues: List[str] = []      # IDs das ligas criadas (max 2 para premium)
    joined_leagues: List[str] = []      # IDs das ligas que participa
    extra_championships: List[str] = [] # IDs dos campeonatos extras (max 2 para premium)
    achievements: List[str] = []
    pioneer_number: Optional[int] = None
    is_banned: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserCreate(BaseModel):
    username: str
    pin: str
    country: str = "BR"


class UserLogin(BaseModel):
    username: str
    pin: str


class UserUpdateCountry(BaseModel):
    username: str
    country: str


# ==================== CHAMPIONSHIP SCHEMAS ====================
class Championship(BaseModel):
    model_config = ConfigDict(extra="ignore")
    championship_id: str              # ID interno (ex: "brasileirao", "serie_a")
    name: str                         # Nome de exibição
    country: str                      # Código do país
    api_id: str                       # ID na TheSportsDB
    is_national: bool = True          # Se é o campeonato principal do país
    season: str = "2026"
    total_rounds: int = 38
    logo_url: Optional[str] = None
    is_active: bool = True


class ChampionshipCreate(BaseModel):
    championship_id: str
    name: str
    country: str
    api_id: str
    is_national: bool = True
    season: str = "2026"
    total_rounds: int = 38


# ==================== LEAGUE SCHEMAS ====================
class League(BaseModel):
    model_config = ConfigDict(extra="ignore")
    league_id: str
    name: str
    owner_username: str
    invite_code: str                  # Código para convidar amigos
    championship_id: str              # Qual campeonato essa liga acompanha
    members: List[str] = []           # Lista de usernames
    max_members: int = 100
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class LeagueCreate(BaseModel):
    name: str
    owner_username: str
    championship_id: str


class LeagueJoin(BaseModel):
    username: str
    invite_code: str


# ==================== MATCH SCHEMAS ====================
class Match(BaseModel):
    model_config = ConfigDict(extra="ignore")
    match_id: str
    championship_id: str
    round_number: int
    home_team: str
    away_team: str
    home_badge: Optional[str] = None
    away_badge: Optional[str] = None
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    match_date: str
    venue: Optional[str] = None
    is_finished: bool = False
    predictions_closed: bool = False


# ==================== PREDICTION SCHEMAS ====================
class Prediction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    username: str
    match_id: str
    championship_id: str
    league_id: Optional[str] = None   # Se o palpite é de uma liga específica
    round_number: int
    home_prediction: int
    away_prediction: int
    points: Optional[int] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PredictionCreate(BaseModel):
    username: str
    match_id: str
    championship_id: str
    league_id: Optional[str] = None
    round_number: int
    home_prediction: int
    away_prediction: int


# ==================== ROUND SCHEMAS ====================
class Round(BaseModel):
    championship_id: str
    round_number: int
    is_current: bool = True


# ==================== ADMIN SCHEMAS ====================
class AdminLogin(BaseModel):
    password: str


class AdminAddUser(BaseModel):
    password: str
    username: str
    pin: str
    plan: PlanType = PlanType.FREE
    country: str = "BR"


class AdminUpdatePlan(BaseModel):
    password: str
    username: str
    plan: PlanType


class AdminAddChampionship(BaseModel):
    password: str
    championship: ChampionshipCreate



class AdminUpdateMatch(BaseModel):
    password: str
    match_id: str
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    is_finished: bool = False


# ==================== PLAN LIMITS ====================
PLAN_LIMITS = {
    PlanType.FREE: {
        "max_leagues_owned": 0,
        "max_extra_championships": 0,
        "can_create_leagues": False,
        "description": "Acesso ao campeonato nacional do seu país"
    },
    PlanType.PREMIUM: {
        "max_leagues_owned": 2,
        "max_extra_championships": 2,
        "can_create_leagues": True,
        "description": "Crie ligas e acesse campeonatos extras"
    },
    PlanType.VIP: {
        "max_leagues_owned": -1,  # ilimitado
        "max_extra_championships": -1,  # ilimitado
        "can_create_leagues": True,
        "description": "Acesso ilimitado a tudo"
    }
}


# ==================== COUNTRY TO CHAMPIONSHIP MAPPING ====================
# Mapeia país -> campeonato nacional principal
COUNTRY_NATIONAL_CHAMPIONSHIP = {
    "BR": "brasileirao",
    "IT": "serie_a",
    "ES": "la_liga",
    "EN": "premier_league",
    "DE": "bundesliga",
    "FR": "ligue_1",
    "PT": "primeira_liga",
    "AR": "liga_argentina",
    "NL": "eredivisie",
    "US": "mls"
}
