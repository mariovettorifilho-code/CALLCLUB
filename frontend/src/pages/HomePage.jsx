import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Trophy, Fire, TrendUp, Clock, CalendarBlank, Timer, SoccerBall, 
  Star, Crown, Lightning, Sparkle, Medal, ArrowRight, Diamond, GlobeHemisphereWest,
  Users, Plus, Target, Play
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function HomePage({ username }) {
  const [accessibleChampionships, setAccessibleChampionships] = useState([]);
  const [selectedChampionship, setSelectedChampionship] = useState(null);
  const [currentRound, setCurrentRound] = useState(null);
  const [topPlayers, setTopPlayers] = useState([]);
  const [nextMatch, setNextMatch] = useState(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [userLeagues, setUserLeagues] = useState([]);
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    loadUserInfo();
    loadCountries();
  }, []);

  useEffect(() => {
    if (selectedChampionship) {
      loadChampionshipData();
    }
  }, [selectedChampionship]);

  // Countdown timer
  useEffect(() => {
    if (!nextMatch?.match_date) return;

    const updateCountdown = () => {
      const now = new Date();
      const matchDate = new Date(nextMatch.match_date);
      const diff = matchDate - now;

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [nextMatch]);

  const loadCountries = async () => {
    try {
      const res = await axios.get(`${API}/countries`);
      setCountries(res.data || []);
    } catch (error) {
      console.error("Erro ao carregar países:", error);
    }
  };

  const loadUserInfo = async () => {
    try {
      // Carrega campeonatos acessíveis pelo usuário
      const [userRes, champsRes, leaguesRes] = await Promise.all([
        axios.get(`${API}/user/${username}`),
        axios.get(`${API}/user/${username}/accessible-championships`),
        axios.get(`${API}/leagues/user/${username}`)
      ]);
      
      setUserInfo(userRes.data);
      setAccessibleChampionships(champsRes.data || []);
      setUserLeagues(leaguesRes.data || []);
      
      // Define campeonato inicial (nacional do usuário)
      const nationalChamp = champsRes.data?.find(c => c.access_type === "national");
      if (nationalChamp) {
        setSelectedChampionship(nationalChamp.championship_id);
      } else if (champsRes.data?.length > 0) {
        setSelectedChampionship(champsRes.data[0].championship_id);
      }
    } catch (error) {
      console.error("Erro ao carregar info do usuário:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadChampionshipData = async () => {
    try {
      const [roundRes, rankingRes, nextMatchRes] = await Promise.all([
        axios.get(`${API}/rounds/current?championship_id=${selectedChampionship}`),
        axios.get(`${API}/ranking/detailed/${selectedChampionship}`),
        axios.get(`${API}/matches/next?championship_id=${selectedChampionship}`)
      ]);

      setCurrentRound(roundRes.data);
      setTopPlayers(rankingRes.data?.ranking?.slice(0, 5) || []);
      setNextMatch(nextMatchRes.data);
    } catch (error) {
      console.error("Erro ao carregar dados do campeonato:", error);
    }
  };

  const formatMatchDate = (dateString) => {
    const date = new Date(dateString);
    const options = { weekday: 'short', day: '2-digit', month: '2-digit' };
    const dateFormatted = date.toLocaleDateString('pt-BR', options);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return { date: dateFormatted, time: `${hours}h${minutes}` };
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const getUserRank = () => {
    const index = topPlayers.findIndex(p => p.username === username);
    return index >= 0 ? index + 1 : null;
  };

  const getPlanLabel = (plan) => {
    switch(plan) {
      case "premium": return { text: "PREMIUM", color: "from-yellow-500 to-amber-600", icon: Diamond };
      case "vip": return { text: "VIP", color: "from-purple-500 to-indigo-600", icon: Crown };
      default: return { text: "FREE", color: "from-emerald-500 to-teal-600", icon: Star };
    }
  };

  const getCountryFlag = (code) => {
    const country = countries.find(c => c.code === code);
    return country?.flag || "🌍";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pitch-green border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-text-secondary">Carregando...</p>
        </div>
      </div>
    );
  }

  const isCountdownActive = countdown.days > 0 || countdown.hours > 0 || countdown.minutes > 0 || countdown.seconds > 0;
  const userRank = getUserRank();
  const plan = userInfo?.user?.plan || "free";
  const planInfo = getPlanLabel(plan);
  const userCountry = userInfo?.user?.country || "BR";
  const isPremium = plan === "premium" || plan === "vip";

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${planInfo.color} p-8 text-white shadow-2xl`}>
        {/* Efeito de brilho */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -ml-24 -mb-24"></div>
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <planInfo.icon size={24} weight="fill" className="text-white/80" />
            <span className="text-white/80 font-semibold text-sm tracking-wider">{planInfo.text}</span>
            <span className="text-2xl ml-2">{getCountryFlag(userCountry)}</span>
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <Fire size={36} weight="fill" className="text-orange-300" />
            <h1 className="font-heading text-3xl md:text-4xl font-bold">
              {getGreeting()}, {username}!
            </h1>
          </div>
          
          <p className="text-white/90 text-lg mb-6 max-w-xl">
            {isPremium ? (
              <>Você pode criar <strong>ligas</strong> e acessar <strong>campeonatos extras</strong>! 🏆</>
            ) : (
              <>Rodada {currentRound?.round_number || 1} está aberta. Mostre que você entende de futebol! ⚽</>
            )}
          </p>
          
          <div className="flex flex-wrap gap-3">
            <Link
              to="/predictions"
              data-testid="make-predictions-button"
              className="inline-flex items-center gap-2 bg-white text-gray-800 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
            >
              <Trophy size={20} weight="fill" />
              Fazer Palpites
            </Link>
            <Link
              to="/rankings"
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-all"
            >
              <TrendUp size={20} weight="bold" />
              Ver Classificação
            </Link>
          </div>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-paper">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-text-primary">Suas Estatísticas</h3>
          <select
            value={selectedChampionship || ""}
            onChange={(e) => setSelectedChampionship(e.target.value)}
            className="px-3 py-1 rounded-lg text-sm font-semibold bg-paper text-text-secondary border-0 focus:ring-2 focus:ring-pitch-green"
          >
            {accessibleChampionships.map((champ) => (
              <option key={champ.championship_id} value={champ.championship_id}>
                {champ.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-paper rounded-xl p-4 hover:bg-gray-100 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Trophy size={20} weight="fill" className="text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{userInfo?.statistics?.total_points || 0}</p>
                <p className="text-xs text-text-secondary">Pontos</p>
              </div>
            </div>
          </div>
          
          <div className="bg-paper rounded-xl p-4 hover:bg-gray-100 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Fire size={20} weight="fill" className="text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{userInfo?.statistics?.perfect_scores || 0}</p>
                <p className="text-xs text-text-secondary">Placares Exatos</p>
              </div>
            </div>
          </div>
          
          <div className="bg-paper rounded-xl p-4 hover:bg-gray-100 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <SoccerBall size={20} weight="fill" className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{userInfo?.statistics?.games_played || 0}</p>
                <p className="text-xs text-text-secondary">Jogos</p>
              </div>
            </div>
          </div>
          
          <div className="bg-paper rounded-xl p-4 hover:bg-gray-100 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Medal size={20} weight="fill" className="text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">#{userRank || '-'}</p>
                <p className="text-xs text-text-secondary">Na Classificação</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Minhas Ligas */}
      {isPremium && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-6 shadow-lg border-2 border-yellow-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={20} weight="fill" className="text-yellow-600" />
              <h3 className="font-heading text-lg font-bold text-yellow-800">Minhas Ligas</h3>
            </div>
            <Link 
              to="/leagues/create"
              className="flex items-center gap-1 text-sm font-semibold text-yellow-700 hover:text-yellow-800"
            >
              <Plus size={16} weight="bold" />
              Criar Liga
            </Link>
          </div>
          
          {userLeagues.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-3">
              {userLeagues.map((league) => (
                <Link
                  key={league.league_id}
                  to={`/leagues/${league.league_id}`}
                  className="bg-white rounded-xl p-4 hover:shadow-md transition-all border border-yellow-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-text-primary">{league.name}</p>
                      <p className="text-sm text-text-secondary">{league.members?.length || 0} membros</p>
                    </div>
                    <ArrowRight size={20} className="text-yellow-600" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-yellow-700 text-center py-4">
              Você ainda não participa de nenhuma liga. 
              <Link to="/leagues/join" className="font-bold underline ml-1">Entre com código</Link> ou crie a sua!
            </p>
          )}
        </div>
      )}

      {/* Grid Principal */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Próximo Jogo */}
        {nextMatch && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-paper">
            <div className="bg-gradient-to-r from-pitch-green to-emerald-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Clock size={20} weight="fill" />
                <span className="font-semibold">Próximo Jogo</span>
              </div>
              <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full font-semibold">
                Rodada {nextMatch.round_number}
              </span>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="text-center flex-1">
                  {nextMatch.home_badge ? (
                    <img src={nextMatch.home_badge} alt="" className="w-16 h-16 mx-auto object-contain" />
                  ) : (
                    <div className="w-16 h-16 bg-paper rounded-full flex items-center justify-center mx-auto">
                      <span className="text-2xl font-bold text-pitch-green">{nextMatch.home_team?.charAt(0)}</span>
                    </div>
                  )}
                  <p className="font-bold text-text-primary mt-2">{nextMatch.home_team}</p>
                </div>
                
                <div className="px-4">
                  <div className="w-12 h-12 bg-pitch-green/10 rounded-full flex items-center justify-center">
                    <span className="text-pitch-green font-bold text-lg">VS</span>
                  </div>
                </div>
                
                <div className="text-center flex-1">
                  {nextMatch.away_badge ? (
                    <img src={nextMatch.away_badge} alt="" className="w-16 h-16 mx-auto object-contain" />
                  ) : (
                    <div className="w-16 h-16 bg-paper rounded-full flex items-center justify-center mx-auto">
                      <span className="text-2xl font-bold text-pitch-green">{nextMatch.away_team?.charAt(0)}</span>
                    </div>
                  )}
                  <p className="font-bold text-text-primary mt-2">{nextMatch.away_team}</p>
                </div>
              </div>
              
              {/* Countdown */}
              {isCountdownActive && (
                <div className="bg-paper rounded-xl p-4 mb-4">
                  <p className="text-sm text-text-secondary text-center mb-2">Tempo para palpitar:</p>
                  <div className="flex justify-center gap-2">
                    {countdown.days > 0 && (
                      <div className="text-center bg-white px-3 py-2 rounded-lg shadow-sm">
                        <p className="text-2xl font-bold text-pitch-green">{countdown.days}</p>
                        <p className="text-xs text-text-secondary">dias</p>
                      </div>
                    )}
                    <div className="text-center bg-white px-3 py-2 rounded-lg shadow-sm">
                      <p className="text-2xl font-bold text-pitch-green">{countdown.hours.toString().padStart(2, '0')}</p>
                      <p className="text-xs text-text-secondary">horas</p>
                    </div>
                    <div className="text-center bg-white px-3 py-2 rounded-lg shadow-sm">
                      <p className="text-2xl font-bold text-pitch-green">{countdown.minutes.toString().padStart(2, '0')}</p>
                      <p className="text-xs text-text-secondary">min</p>
                    </div>
                    <div className="text-center bg-white px-3 py-2 rounded-lg shadow-sm">
                      <p className="text-2xl font-bold text-orange-500">{countdown.seconds.toString().padStart(2, '0')}</p>
                      <p className="text-xs text-text-secondary">seg</p>
                    </div>
                  </div>
                </div>
              )}
              
              <Link
                to={`/predictions?championship=${selectedChampionship}&round=${nextMatch.round_number}`}
                className="block w-full bg-gradient-to-r from-pitch-green to-emerald-600 text-white text-center py-3 rounded-xl font-bold hover:from-pitch-green/90 hover:to-emerald-600/90 transition-all"
              >
                Fazer Palpite
              </Link>
            </div>
          </div>
        )}

        {/* Top 5 Classificação */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-paper">
          <div className="bg-gradient-to-r from-yellow-500 to-amber-500 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Trophy size={20} weight="fill" />
              <span className="font-semibold">Top 5 Classificação</span>
            </div>
            <Link to="/rankings" className="text-white/80 text-sm hover:text-white">
              Ver completo →
            </Link>
          </div>
          
          <div className="p-4">
            {topPlayers.length > 0 ? (
              <div className="space-y-2">
                {topPlayers.map((player, index) => (
                  <div 
                    key={player.username}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      player.username === username 
                        ? "bg-pitch-green/10 border-2 border-pitch-green" 
                        : "bg-paper hover:bg-gray-100"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? "bg-yellow-400 text-yellow-900" :
                      index === 1 ? "bg-gray-300 text-gray-700" :
                      index === 2 ? "bg-amber-600 text-white" :
                      "bg-paper text-text-secondary"
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${player.username === username ? "text-pitch-green" : "text-text-primary"}`}>
                        {player.username}
                        {player.username === username && <span className="ml-2 text-xs">(você)</span>}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-text-primary">{player.total_points} pts</p>
                      <p className="text-xs text-text-secondary">{player.exact_scores} exatos</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-text-secondary">
                <Trophy size={48} className="mx-auto mb-2 opacity-30" />
                <p>Nenhum palpite ainda</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Campeonatos Disponíveis */}
      <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-paper">
        <div className="flex items-center gap-2 mb-4">
          <GlobeHemisphereWest size={20} weight="fill" className="text-pitch-green" />
          <h3 className="font-heading font-bold text-text-primary">Seus Campeonatos</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {accessibleChampionships.map((champ) => (
            <Link
              key={champ.championship_id}
              to={`/predictions?championship=${champ.championship_id}`}
              className={`p-4 rounded-xl transition-all hover:scale-105 ${
                champ.access_type === "national" 
                  ? "bg-gradient-to-br from-pitch-green/10 to-emerald-100 border-2 border-pitch-green/30"
                  : champ.access_type === "extra"
                    ? "bg-gradient-to-br from-yellow-50 to-amber-100 border-2 border-yellow-300"
                    : "bg-gradient-to-br from-purple-50 to-indigo-100 border-2 border-purple-300"
              }`}
            >
              <div className="text-center">
                <p className="font-bold text-text-primary text-sm">{champ.name}</p>
                <p className="text-xs text-text-secondary mt-1">
                  {champ.access_type === "national" && "🏠 Nacional"}
                  {champ.access_type === "extra" && "⭐ Extra"}
                  {champ.access_type === "league" && `👥 ${champ.league_name}`}
                </p>
              </div>
            </Link>
          ))}
        </div>
        
        {!isPremium && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200 text-center">
            <p className="text-sm text-yellow-800">
              <Diamond size={16} weight="fill" className="inline mr-1" />
              Faça upgrade para <strong>PREMIUM</strong> e acesse mais campeonatos + crie suas próprias ligas!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
