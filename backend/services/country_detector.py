# CallClub - Serviço de detecção de país por IP

import httpx
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Mapeamento de códigos de país para nossos códigos internos
COUNTRY_CODE_MAP = {
    "BR": "BR",
    "IT": "IT",
    "ES": "ES",
    "GB": "EN",  # UK -> Inglaterra
    "UK": "EN",
    "DE": "DE",
    "FR": "FR",
    "PT": "PT",
    "AR": "AR",
    "NL": "NL",
    "US": "US",
    # Adicionar mais conforme necessário
}

# Default para países não mapeados
DEFAULT_COUNTRY = "BR"


async def detect_country_by_ip(ip: str) -> str:
    """
    Detecta o país do usuário baseado no IP.
    Usa API gratuita ip-api.com
    """
    # IPs locais retornam Brasil por padrão
    if ip in ["127.0.0.1", "localhost", "::1"] or ip.startswith("192.168.") or ip.startswith("10."):
        return DEFAULT_COUNTRY
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"http://ip-api.com/json/{ip}?fields=countryCode")
            if response.status_code == 200:
                data = response.json()
                country_code = data.get("countryCode", "")
                
                # Mapeia para nosso código interno
                mapped_code = COUNTRY_CODE_MAP.get(country_code, DEFAULT_COUNTRY)
                logger.info(f"IP {ip} detectado como país: {mapped_code}")
                return mapped_code
                
    except Exception as e:
        logger.error(f"Erro ao detectar país por IP: {e}")
    
    return DEFAULT_COUNTRY


def get_supported_countries() -> list:
    """Retorna lista de países suportados"""
    return [
        {"code": "BR", "name": "Brasil", "flag": "🇧🇷", "championship": "Brasileirão"},
        {"code": "IT", "name": "Itália", "flag": "🇮🇹", "championship": "Serie A"},
        {"code": "ES", "name": "Espanha", "flag": "🇪🇸", "championship": "La Liga"},
        {"code": "EN", "name": "Inglaterra", "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "championship": "Premier League"},
        {"code": "DE", "name": "Alemanha", "flag": "🇩🇪", "championship": "Bundesliga"},
        {"code": "FR", "name": "França", "flag": "🇫🇷", "championship": "Ligue 1"},
        {"code": "PT", "name": "Portugal", "flag": "🇵🇹", "championship": "Primeira Liga"},
        {"code": "AR", "name": "Argentina", "flag": "🇦🇷", "championship": "Liga Argentina"},
        {"code": "NL", "name": "Holanda", "flag": "🇳🇱", "championship": "Eredivisie"},
        {"code": "US", "name": "Estados Unidos", "flag": "🇺🇸", "championship": "MLS"},
    ]
