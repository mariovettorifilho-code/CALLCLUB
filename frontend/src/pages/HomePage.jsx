import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Trophy, Fire, TrendUp, Clock, CalendarBlank, Timer, SoccerBall, 
  Star, Crown, Lightning, Sparkle, Medal, ArrowRight, Diamond
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function HomePage({ username }) {
  const [championships, setChampionships] = useState([]);
  const [selectedChampionship, setSelectedChampionship] = useState("carioca");
  const [currentRound, setCurrentRound] = useState(null);
  const [topPlayers, setTopPlayers] = useState([]);
  const [nextMatch, setNextMatch] = useState(null);
  const [nextBrasileiraoMatch, setNextBrasileiraoMatch] = useState(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [brasileiraoPosition, setBrasileiraoPosition] = useState(null);

  useEffect(() => {
    loadChampionships();
    checkPremiumStatus();
    loadUserStats();
  }, []);

  useEffect(() => {
    if (selectedChampionship) {
      loadData();
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

  const checkPremiumStatus = async () => {
    try {
      const res = await axios.get(`${API}/premium/status/${username}`);
      setIsPremium(res.data.is_premium);
      
      // Se premium, carrega próximo jogo do Brasileirão
      if (res.data.is_premium) {
        const brasRes = await axios.get(`${API}/matches/next?championship=brasileirao`);
        setNextBrasileiraoMatch(brasRes.data);
      }
    } catch (error) {
      console.error("Erro ao verificar premium:", error);
    }
  };

  const loadUserStats = async () => {
    try {
      const res = await axios.get(`${API}/user/${username}`);
      setUserStats(res.data);
    } catch (error) {
      console.error("Erro ao carregar stats:", error);
    }
  };

  const loadChampionships = async () => {
    try {
      const res = await axios.get(`${API}/championships`);
      setChampionships(res.data || []);
    } catch (error) {
      console.error("Erro ao carregar campeonatos:", error);
    }
  };

  const loadData = async () => {
    try {
      const [roundRes, rankingRes, nextMatchRes] = await Promise.all([
        axios.get(`${API}/rounds/current?championship=${selectedChampionship}`),
        axios.get(`${API}/ranking/general`),
        axios.get(`${API}/matches/next?championship=${selectedChampionship}`)
      ]);

      setCurrentRound(roundRes.data);
      setTopPlayers(rankingRes.data.slice(0, 5));
      setNextMatch(nextMatchRes.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-6">
      {/* Hero Section - Premium ou Normal */}
      {isPremium ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-600 p-8 text-white shadow-2xl">
          {/* Efeito de brilho */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-300/30 rounded-full blur-2xl -ml-24 -mb-24"></div>
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Diamond size={24} weight="fill" className="text-yellow-200" />
              <span className="text-yellow-200 font-semibold text-sm tracking-wider">MEMBRO PREMIUM</span>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <Crown size={36} weight="fill" className="text-yellow-200" />
              <h1 className="font-heading text-3xl md:text-4xl font-bold">
                {getGreeting()}, {username}!
              </h1>
            </div>
            
            <p className="text-white/90 text-lg mb-6 max-w-xl">
              Você tem acesso exclusivo ao <strong>Brasileirão 2026</strong>. 
              Seus palpites valem ouro! 🏆
            </p>
            
            <div className="flex flex-wrap gap-3">
              <Link
                to="/predictions"
                data-testid="make-predictions-button"
                className="inline-flex items-center gap-2 bg-white text-amber-600 px-6 py-3 rounded-xl font-bold hover:bg-yellow-50 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
              >
                <Trophy size={20} weight="fill" />
                Fazer Palpites
              </Link>
              <Link
                to="/rankings"
                className="inline-flex items-center gap-2 bg-white/20 backdrop-blur text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-all"
              >
                <TrendUp size={20} weight="bold" />
                Ver Ranking
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pitch-green via-emerald-600 to-teal-700 p-8 text-white shadow-2xl">
          {/* Efeito decorativo */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <Fire size={36} weight="fill" className="text-orange-400" />
              <h1 className="font-heading text-3xl md:text-4xl font-bold">
                {getGreeting()}, {username}!
              </h1>
            </div>
            <p className="text-white/90 text-lg mb-6">
              Rodada {currentRound?.round_number || 1} está aberta. Mostre que você entende de futebol! ⚽
            </p>
            <Link
              to="/predictions"
              data-testid="make-predictions-button"
              className="inline-flex items-center gap-2 bg-white text-pitch-green px-6 py-3 rounded-xl font-bold hover:bg-green-50 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
            >
              <Trophy size={20} weight="fill" />
              Fazer Palpites
            </Link>
          </div>
        </div>
      )}

      {/* Stats Rápidas do Usuário */}
      {userStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-paper hover:border-pitch-green transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Trophy size={20} weight="fill" className="text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{userStats.user?.total_points || 0}</p>
                <p className="text-xs text-text-secondary">Pontos</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-paper hover:border-pitch-green transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Fire size={20} weight="fill" className="text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{userStats.statistics?.perfect_scores || 0}</p>
                <p className="text-xs text-text-secondary">Placares Exatos</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-paper hover:border-pitch-green transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendUp size={20} weight="bold" className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{userStats.statistics?.accuracy_rate || 0}%</p>
                <p className="text-xs text-text-secondary">Aproveitamento</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-paper hover:border-pitch-green transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Medal size={20} weight="fill" className="text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">#{userStats.ranking?.position || '-'}</p>
                <p className="text-xs text-text-secondary">No Ranking</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seção Premium - Próximo jogo do Brasileirão */}
      {isPremium && nextBrasileiraoMatch && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-6 shadow-lg border-2 border-yellow-200">
          <div className="flex items-center gap-2 mb-4">
            <Diamond size={20} weight="fill" className="text-yellow-600" />
            <h3 className="font-heading text-lg font-bold text-yellow-800">Brasileirão Premium</h3>
            <span className="ml-auto text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full font-semibold">
              Rodada {nextBrasileiraoMatch.round_number}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-center">
                {nextBrasileiraoMatch.home_badge ? (
                  <img src={nextBrasileiraoMatch.home_badge} alt="" className="w-12 h-12 mx-auto object-contain" />
                ) : (
                  <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center mx-auto">
                    <span className="font-bold text-yellow-700">{nextBrasileiraoMatch.home_team?.charAt(0)}</span>
                  </div>
                )}
                <p className="text-sm font-semibold text-text-primary mt-1">{nextBrasileiraoMatch.home_team}</p>
              </div>
              
              <span className="text-xl font-bold text-yellow-600">VS</span>
              
              <div className="text-center">
                {nextBrasileiraoMatch.away_badge ? (
                  <img src={nextBrasileiraoMatch.away_badge} alt="" className="w-12 h-12 mx-auto object-contain" />
                ) : (
                  <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center mx-auto">
                    <span className="font-bold text-yellow-700">{nextBrasileiraoMatch.away_team?.charAt(0)}</span>
                  </div>
                )}
                <p className="text-sm font-semibold text-text-primary mt-1">{nextBrasileiraoMatch.away_team}</p>
              </div>
            </div>
            
            <Link
              to="/predictions"
              onClick={() => localStorage.setItem('selectedChampionship', 'brasileirao')}
              className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-yellow-600 hover:to-amber-600 transition-all flex items-center gap-2"
            >
              Palpitar <ArrowRight size={16} weight="bold" />
            </Link>
          </div>
        </div>
      )}

      {/* Seletor de Campeonato + Próximo Jogo */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Seletor */}
        <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-paper">
          <label className="text-sm font-medium text-text-secondary mb-2 block">
            Campeonato
          </label>
          <select
            value={selectedChampionship}
            onChange={(e) => setSelectedChampionship(e.target.value)}
            data-testid="home-championship-filter"
            className="w-full px-4 py-3 border-2 border-paper rounded-lg bg-white text-text-primary font-semibold focus:outline-none focus:ring-2 focus:ring-pitch-green text-lg"
          >
            {championships.map((champ) => (
              <option key={champ.id} value={champ.id}>
                {champ.name} {champ.premium && !isPremium ? "🔒" : champ.premium ? "⭐" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Mini Countdown */}
        {nextMatch && isCountdownActive && (
          <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-4 shadow-lg text-white">
            <div className="flex items-center gap-2 mb-2">
              <Timer size={20} weight="fill" />
              <span className="font-semibold text-sm">Próximo jogo em:</span>
            </div>
            <div className="flex gap-2">
              {[
                { value: countdown.days, label: 'd' },
                { value: countdown.hours, label: 'h' },
                { value: countdown.minutes, label: 'm' },
                { value: countdown.seconds, label: 's' }
              ].map((item, i) => (
                <div key={i} className="bg-white/20 backdrop-blur rounded-lg px-3 py-2 text-center">
                  <span className="font-mono text-2xl font-bold">{item.value.toString().padStart(2, '0')}</span>
                  <span className="text-xs ml-1">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Próximo Jogo Widget */}
      {nextMatch && (
        <div className="bg-white rounded-2xl shadow-xl border-2 border-paper overflow-hidden" data-testid="next-match-widget">
          <div className="bg-gradient-to-r from-pitch-green to-emerald-600 px-6 py-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <SoccerBall size={24} weight="fill" />
                <span className="font-bold text-lg">Próximo Jogo</span>
              </div>
              <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm font-semibold">
                Rodada {nextMatch.round_number}
              </span>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1 text-center">
                {nextMatch.home_badge ? (
                  <img 
                    src={nextMatch.home_badge} 
                    alt={nextMatch.home_team}
                    className="w-20 h-20 mx-auto mb-2 object-contain drop-shadow-lg"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-2 shadow-inner">
                    <span className="text-3xl font-bold text-gray-400">{nextMatch.home_team?.charAt(0)}</span>
                  </div>
                )}
                <p className="font-heading font-bold text-text-primary text-lg">{nextMatch.home_team}</p>
                <p className="text-xs text-pitch-green font-semibold">Mandante</p>
              </div>
              
              <div className="px-6">
                <div className="w-16 h-16 bg-gradient-to-br from-pitch-green to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">VS</span>
                </div>
              </div>
              
              <div className="flex-1 text-center">
                {nextMatch.away_badge ? (
                  <img 
                    src={nextMatch.away_badge} 
                    alt={nextMatch.away_team}
                    className="w-20 h-20 mx-auto mb-2 object-contain drop-shadow-lg"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-2 shadow-inner">
                    <span className="text-3xl font-bold text-gray-400">{nextMatch.away_team?.charAt(0)}</span>
                  </div>
                )}
                <p className="font-heading font-bold text-text-primary text-lg">{nextMatch.away_team}</p>
                <p className="text-xs text-terracotta font-semibold">Visitante</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 mb-6 text-text-secondary">
              <div className="flex items-center gap-2 bg-paper px-4 py-2 rounded-lg">
                <CalendarBlank size={18} weight="bold" className="text-pitch-green" />
                <span className="font-medium">{formatMatchDate(nextMatch.match_date).date}</span>
              </div>
              <div className="flex items-center gap-2 bg-paper px-4 py-2 rounded-lg">
                <Clock size={18} weight="bold" className="text-pitch-green" />
                <span className="font-medium">{formatMatchDate(nextMatch.match_date).time}</span>
              </div>
            </div>

            {isCountdownActive && (
              <Link
                to="/predictions"
                data-testid="quick-predict-button"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pitch-green to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:from-pitch-green/90 hover:to-emerald-600/90 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                <Lightning size={24} weight="fill" />
                Fazer meu palpite agora!
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Top 5 Players */}
      <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-paper">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Crown size={28} weight="fill" className="text-yellow-500" />
            <h2 className="font-heading text-2xl font-bold text-text-primary">
              Top 5 Palpiteiros
            </h2>
          </div>
          <Link to="/rankings" className="text-pitch-green font-semibold hover:underline flex items-center gap-1">
            Ver todos <ArrowRight size={16} />
          </Link>
        </div>

        {topPlayers.length === 0 ? (
          <p className="text-text-secondary text-center py-8">
            Nenhum ranking disponível ainda. Seja o primeiro a palpitar!
          </p>
        ) : (
          <div className="space-y-3">
            {topPlayers.map((player, index) => {
              const isCurrentUser = player.username === username;
              const isTop3 = index < 3;
              
              return (
                <div
                  key={player.username}
                  data-testid={`top-player-${index + 1}`}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                    isCurrentUser
                      ? "bg-gradient-to-r from-pitch-green/10 to-emerald-50 border-2 border-pitch-green ring-2 ring-pitch-green/20"
                      : isTop3
                      ? "bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200"
                      : "bg-paper border-2 border-transparent hover:border-paper"
                  }`}
                >
                  {/* Posição */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shadow-sm ${
                    index === 0 ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white" : 
                    index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white" :
                    index === 2 ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white" : 
                    "bg-white text-text-primary border-2 border-paper"
                  }`}>
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-text-primary text-lg">
                        {player.username}
                      </p>
                      {player.is_premium && (
                        <Diamond size={16} weight="fill" className="text-yellow-500" />
                      )}
                      {isCurrentUser && (
                        <span className="text-xs bg-pitch-green text-white px-2 py-0.5 rounded-full font-semibold">
                          Você
                        </span>
                      )}
                    </div>
                    {(player.max_perfect_streak || 0) > 0 && (
                      <p className="text-xs text-text-secondary flex items-center gap-1">
                        <Fire size={12} weight="fill" className="text-orange-500" />
                        {player.max_perfect_streak} acertos perfeitos
                      </p>
                    )}
                  </div>
                  
                  {/* Pontos */}
                  <div className="text-right">
                    <p className="font-mono text-2xl font-bold text-pitch-green">
                      {player.total_points || 0}
                    </p>
                    <p className="text-xs text-text-secondary">pontos</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Call to Action Premium (se não for premium) */}
      {!isPremium && (
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
          
          <div className="relative flex items-center gap-6">
            <div className="hidden md:flex w-16 h-16 bg-white/20 backdrop-blur rounded-2xl items-center justify-center">
              <Diamond size={32} weight="fill" className="text-yellow-300" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading text-xl font-bold mb-1">Desbloqueie o Brasileirão 2026</h3>
              <p className="text-white/80 text-sm">
                Acesso exclusivo a 380 jogos, ranking separado e muito mais!
              </p>
            </div>
            <Link
              to="/predictions"
              className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-yellow-50 transition-all whitespace-nowrap"
            >
              Saiba mais
            </Link>
          </div>
        </div>
      )}

      {/* Como Funciona */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-paper">
        <h3 className="font-heading text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <Sparkle size={24} weight="fill" className="text-yellow-500" />
          Como Funciona
        </h3>
        <div className="grid md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-paper rounded-xl">
            <div className="w-12 h-12 bg-pitch-green/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-pitch-green">3</span>
            </div>
            <p className="text-sm text-text-secondary">pts por resultado certo (V/E/D)</p>
          </div>
          <div className="text-center p-4 bg-paper rounded-xl">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-blue-600">+1</span>
            </div>
            <p className="text-sm text-text-secondary">pt por gol do mandante certo</p>
          </div>
          <div className="text-center p-4 bg-paper rounded-xl">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-orange-600">+1</span>
            </div>
            <p className="text-sm text-text-secondary">pt por gol do visitante certo</p>
          </div>
          <div className="text-center p-4 bg-paper rounded-xl">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-yellow-600">5</span>
            </div>
            <p className="text-sm text-text-secondary">pts máximo (placar exato!)</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border-2 border-orange-200">
            <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Fire size={24} weight="fill" className="text-white" />
            </div>
            <p className="text-sm text-text-secondary font-medium">Desempate: maior sequência de placares exatos</p>
          </div>
        </div>
      </div>
    </div>
  );
}
