import { useState, useEffect } from "react";
import axios from "axios";
import { 
  User, Trophy, Fire, ChartBar, Target, Medal, CalendarBlank, 
  SoccerBall, TrendUp, Check, X, Star, Lightning, Crown, 
  Crosshair, FirstAid, Flame, Rocket, Diamond, Shield
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Sistema de Níveis
const LEVELS = [
  { name: "Amador", minPoints: 0, maxPoints: 50, icon: "🥉", color: "text-amber-600" },
  { name: "Profissional", minPoints: 51, maxPoints: 150, icon: "🥈", color: "text-gray-400" },
  { name: "Craque", minPoints: 151, maxPoints: 300, icon: "🥇", color: "text-yellow-500" },
  { name: "Lendário", minPoints: 301, maxPoints: Infinity, icon: "👑", color: "text-purple-500" }
];

// Sistema de Conquistas
const ACHIEVEMENTS = [
  { id: "first_prediction", name: "Primeiro Palpite", description: "Fez seu primeiro palpite no CallClub", icon: "🎯", color: "bg-blue-500" },
  { id: "sniper", name: "Sniper", description: "Acertou o placar exato pela primeira vez", icon: "🔫", color: "bg-red-500" },
  { id: "on_fire", name: "Em Chamas", description: "Emplacou 3 acertos de resultado seguidos", icon: "🔥", color: "bg-orange-500" },
  { id: "round_king", name: "Rei da Rodada", description: "Conquistou o topo de uma rodada", icon: "👑", color: "bg-yellow-500" },
  { id: "perfect_round", name: "Rodada Perfeita", description: "Marcou 5+ placares exatos em uma rodada", icon: "⭐", color: "bg-purple-500" },
  { id: "veteran", name: "Veterano", description: "Palpitou em mais de 50 jogos", icon: "🎖️", color: "bg-green-500" },
  { id: "premium", name: "Membro Premium", description: "Desbloqueou o acesso ao Brasileirão", icon: "💎", color: "bg-gradient-to-r from-yellow-400 to-yellow-600" },
  { id: "pioneer", name: "Pioneiro", description: "PIONEER_SPECIAL", icon: "🏛️", color: "bg-gradient-to-r from-indigo-500 to-purple-600" }
];

const getLevel = (points) => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
};

const getNextLevel = (points) => {
  for (let i = 0; i < LEVELS.length; i++) {
    if (points < LEVELS[i].maxPoints) {
      return LEVELS[i + 1] || null;
    }
  }
  return null;
};

const getLevelProgress = (points) => {
  const level = getLevel(points);
  const nextLevel = getNextLevel(points);
  if (!nextLevel) return 100;
  
  const pointsInLevel = points - level.minPoints;
  const levelRange = nextLevel.minPoints - level.minPoints;
  return Math.min((pointsInLevel / levelRange) * 100, 100);
};

export default function ProfilePage({ username }) {
  const [userData, setUserData] = useState(null);
  const [allRounds, setAllRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState("all");
  const [selectedChampionship, setSelectedChampionship] = useState("all");
  const [loading, setLoading] = useState(true);
  const [userAchievements, setUserAchievements] = useState([]);

  useEffect(() => {
    loadData();
  }, [username]);

  const loadData = async () => {
    try {
      const [profileRes, roundsRes] = await Promise.all([
        axios.get(`${API}/user/${username}`),
        axios.get(`${API}/rounds/all`)
      ]);
      setUserData(profileRes.data);
      setAllRounds(roundsRes.data || []);
      
      // Calcula conquistas baseado nos dados
      calculateAchievements(profileRes.data);
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAchievements = (data) => {
    const achievements = [];
    const { statistics, predictions, user } = data;
    
    // Primeiro palpite
    if (predictions && predictions.length > 0) {
      achievements.push("first_prediction");
    }
    
    // Sniper - acertou placar exato
    if (statistics.perfect_scores > 0) {
      achievements.push("sniper");
    }
    
    // Veterano - 50+ jogos
    if (statistics.games_played >= 50) {
      achievements.push("veteran");
    }
    
    // Premium
    if (user.is_premium) {
      achievements.push("premium");
    }
    
    // Em Chamas - 3+ acertos seguidos
    if (user.max_perfect_streak >= 3) {
      achievements.push("on_fire");
    }
    
    // Rodada Perfeita - muitos acertos em uma rodada
    if (statistics.perfect_scores >= 5) {
      achievements.push("perfect_round");
    }
    
    // Pioneiro - primeiros 100 usuários (baseado no número do pioneer_number)
    if (user.pioneer_number && user.pioneer_number <= 100) {
      achievements.push("pioneer");
    }
    
    setUserAchievements(achievements);
  };

  // Função para gerar descrição especial do Pioneiro
  const getPioneerDescription = (pioneerNumber) => {
    if (!pioneerNumber) return "";
    
    const messages = [
      `#${pioneerNumber} dos 100 Pioneiros. Você faz parte da história do CallClub.`,
      `Palpiteiro #${pioneerNumber}. Quando outros chegarem, você já era lenda.`,
      `#${pioneerNumber} na escalação original. Os primeiros 100 nunca serão esquecidos.`,
      `Pioneiro #${pioneerNumber}. Você acreditou antes de todos.`,
      `#${pioneerNumber} do clube. Sua presença construiu esse lugar.`
    ];
    
    // Usa o número do pioneiro para escolher uma mensagem consistente
    return messages[pioneerNumber % messages.length];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pitch-green border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-text-secondary">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="text-center py-20">
        <User size={64} className="mx-auto text-text-secondary mb-4" />
        <p className="text-text-secondary">Perfil não encontrado</p>
      </div>
    );
  }

  const { user, statistics, ranking, predictions } = userData;
  const level = getLevel(user.total_points || 0);
  const nextLevel = getNextLevel(user.total_points || 0);
  const levelProgress = getLevelProgress(user.total_points || 0);

  // Filtra palpites por campeonato primeiro
  const filteredByChampionship = selectedChampionship === "all"
    ? predictions
    : predictions.filter(p => p.championship === selectedChampionship);

  // Depois filtra por rodada
  const filteredPredictions = selectedRound === "all" 
    ? filteredByChampionship 
    : filteredByChampionship.filter(p => p.round_number === parseInt(selectedRound));

  // Pega as rodadas disponíveis para o campeonato selecionado
  const availableRounds = selectedChampionship === "all"
    ? [...new Set(predictions.map(p => p.round_number))].sort((a, b) => a - b)
    : [...new Set(predictions.filter(p => p.championship === selectedChampionship).map(p => p.round_number))].sort((a, b) => a - b);

  // Agrupa por campeonato e rodada para exibição
  const groupedByChampionshipAndRound = {};
  filteredPredictions.forEach(pred => {
    const champ = pred.championship || "carioca";
    const rn = pred.round_number;
    if (!groupedByChampionshipAndRound[champ]) {
      groupedByChampionshipAndRound[champ] = {};
    }
    if (!groupedByChampionshipAndRound[champ][rn]) {
      groupedByChampionshipAndRound[champ][rn] = [];
    }
    groupedByChampionshipAndRound[champ][rn].push(pred);
  });

  // Mapeamento de nomes de campeonatos
  const championshipNames = {
    "carioca": "Campeonato Carioca 2026",
    "brasileirao": "Campeonato Brasileiro 2026"
  };

  const getPointsBadgeStyle = (points) => {
    if (points === 5) return "bg-yellow-500 text-white";
    if (points >= 3) return "bg-pitch-green text-white";
    if (points > 0) return "bg-blue-500 text-white";
    return "bg-gray-300 text-gray-600";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Profile Header - Premium Style */}
      <div className={`rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden ${
        user.is_premium 
          ? "bg-gradient-to-br from-yellow-500 via-yellow-600 to-amber-700 text-white" 
          : "bg-gradient-to-br from-pitch-green to-pitch-green/80 text-bone"
      }`}>
        {/* Premium Glow Effect */}
        {user.is_premium && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
        )}
        
        <div className="relative flex flex-col md:flex-row md:items-center gap-6">
          {/* Avatar & Name */}
          <div className="flex items-center gap-4">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
              user.is_premium 
                ? "bg-white/20 ring-4 ring-white/50" 
                : "bg-bone/20"
            }`}>
              <span className="text-4xl">{level.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-3xl font-bold">{user.username}</h1>
                {user.is_premium && (
                  <span className="bg-white/20 backdrop-blur px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Diamond size={12} weight="fill" />
                    PREMIUM
                  </span>
                )}
              </div>
              <p className={`flex items-center gap-2 ${user.is_premium ? "text-white/80" : "text-bone/80"}`}>
                <Medal size={16} weight="fill" />
                #{ranking.position} de {ranking.total_users} palpiteiros
              </p>
              <p className={`text-sm ${level.color} font-bold mt-1`}>
                {level.icon} {level.name}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className={`backdrop-blur rounded-lg p-3 text-center ${user.is_premium ? "bg-white/10" : "bg-bone/10"}`}>
              <Trophy size={24} weight="fill" className="mx-auto mb-1 text-yellow-400" />
              <p className="text-2xl font-mono font-bold">{user.total_points || 0}</p>
              <p className={`text-xs ${user.is_premium ? "text-white/80" : "text-bone/80"}`}>Pontos</p>
            </div>
            <div className={`backdrop-blur rounded-lg p-3 text-center ${user.is_premium ? "bg-white/10" : "bg-bone/10"}`}>
              <Fire size={24} weight="fill" className="mx-auto mb-1 text-orange-400" />
              <p className="text-2xl font-mono font-bold">{user.max_perfect_streak || 0}</p>
              <p className={`text-xs ${user.is_premium ? "text-white/80" : "text-bone/80"}`}>Sequência</p>
            </div>
            <div className={`backdrop-blur rounded-lg p-3 text-center ${user.is_premium ? "bg-white/10" : "bg-bone/10"}`}>
              <Target size={24} weight="fill" className="mx-auto mb-1 text-red-400" />
              <p className="text-2xl font-mono font-bold">{statistics.perfect_scores || 0}</p>
              <p className={`text-xs ${user.is_premium ? "text-white/80" : "text-bone/80"}`}>Placares Exatos</p>
            </div>
            <div className={`backdrop-blur rounded-lg p-3 text-center ${user.is_premium ? "bg-white/10" : "bg-bone/10"}`}>
              <ChartBar size={24} weight="fill" className={`mx-auto mb-1 ${user.is_premium ? "text-white" : "text-bone"}`} />
              <p className="text-2xl font-mono font-bold">{statistics.accuracy_rate || 0}%</p>
              <p className={`text-xs ${user.is_premium ? "text-white/80" : "text-bone/80"}`}>Aproveitamento</p>
            </div>
          </div>
        </div>

        {/* Level Progress Bar */}
        <div className="mt-6 relative">
          <div className="flex justify-between text-xs mb-1">
            <span>{level.icon} {level.name}</span>
            {nextLevel && <span>{nextLevel.icon} {nextLevel.name}</span>}
          </div>
          <div className={`h-3 rounded-full overflow-hidden ${user.is_premium ? "bg-white/20" : "bg-bone/20"}`}>
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                user.is_premium 
                  ? "bg-gradient-to-r from-white to-yellow-200" 
                  : "bg-gradient-to-r from-terracotta to-warning"
              }`}
              style={{ width: `${levelProgress}%` }}
            />
          </div>
          {nextLevel && (
            <p className={`text-xs mt-1 text-center ${user.is_premium ? "text-white/70" : "text-bone/70"}`}>
              {nextLevel.minPoints - (user.total_points || 0)} pts para {nextLevel.name}
            </p>
          )}
        </div>
      </div>

      {/* Conquistas */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-paper">
        <h2 className="font-heading text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <Star size={24} weight="fill" className="text-yellow-500" />
          Conquistas ({userAchievements.length}/{ACHIEVEMENTS.length})
        </h2>
        
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {ACHIEVEMENTS.map((achievement) => {
            const unlocked = userAchievements.includes(achievement.id);
            const isPioneer = achievement.id === "pioneer";
            const pioneerNumber = user.pioneer_number;
            
            // Descrição especial para Pioneiro
            const description = isPioneer && unlocked 
              ? getPioneerDescription(pioneerNumber)
              : achievement.description;
            
            return (
              <div
                key={achievement.id}
                className={`relative group cursor-pointer transition-all ${
                  unlocked ? "transform hover:scale-110" : "opacity-30 grayscale"
                }`}
              >
                <div className={`w-full aspect-square rounded-xl flex items-center justify-center text-2xl ${
                  unlocked ? achievement.color : "bg-gray-200"
                } ${isPioneer && unlocked ? "ring-2 ring-purple-400 ring-offset-2 animate-pulse" : ""}`}>
                  {achievement.icon}
                </div>
                
                {/* Tooltip Especial */}
                <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap z-20 pointer-events-none shadow-xl ${
                  isPioneer && unlocked 
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white min-w-[280px] whitespace-normal text-center"
                    : "bg-gray-900 text-white"
                }`}>
                  <p className={`font-bold ${isPioneer && unlocked ? "text-lg mb-1" : ""}`}>
                    {isPioneer && unlocked ? `🏛️ Pioneiro #${pioneerNumber}` : achievement.name}
                  </p>
                  <p className={`${isPioneer && unlocked ? "text-purple-200 text-sm" : "text-gray-300 text-xs"}`}>
                    {description}
                  </p>
                  {isPioneer && unlocked && (
                    <div className="mt-2 pt-2 border-t border-purple-400/30">
                      <p className="text-xs text-purple-300 italic">
                        "Os primeiros 100 constroem a história"
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Número do Pioneiro Badge */}
                {isPioneer && unlocked && pioneerNumber && (
                  <div className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
                    {pioneerNumber}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-lg border-2 border-paper">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-pitch-green/10 rounded-lg flex items-center justify-center">
              <SoccerBall size={20} weight="fill" className="text-pitch-green" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Jogos Palpitados</p>
              <p className="text-2xl font-bold text-text-primary">{statistics.games_played || 0}</p>
            </div>
          </div>
          <div className="text-xs text-text-secondary">
            em {statistics.rounds_played || 0} rodada(s)
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-lg border-2 border-paper">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-pitch-green/10 rounded-lg flex items-center justify-center">
              <Check size={20} weight="bold" className="text-pitch-green" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Resultados Certos</p>
              <p className="text-2xl font-bold text-text-primary">{statistics.correct_results || 0}</p>
            </div>
          </div>
          <div className="text-xs text-text-secondary">
            de {statistics.games_played || 0} jogos finalizados
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-lg border-2 border-paper">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-pitch-green/10 rounded-lg flex items-center justify-center">
              <TrendUp size={20} weight="bold" className="text-pitch-green" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Média por Jogo</p>
              <p className="text-2xl font-bold text-text-primary">{statistics.avg_points_per_game || 0} pts</p>
            </div>
          </div>
          <div className="text-xs text-text-secondary">
            máximo possível: 5 pts
          </div>
        </div>
      </div>

      {/* Points by Round Chart */}
      {statistics.points_by_round && Object.keys(statistics.points_by_round).length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-lg border-2 border-paper">
          <h3 className="font-heading text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <ChartBar size={20} weight="fill" className="text-pitch-green" />
            Evolução por Rodada
          </h3>
          <div className="flex items-end gap-2 h-32">
            {Object.entries(statistics.points_by_round)
              .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
              .map(([round, points]) => {
                const maxPoints = Math.max(...Object.values(statistics.points_by_round), 30);
                const height = (points / maxPoints) * 100;
                return (
                  <div key={round} className="flex-1 flex flex-col items-center group">
                    <span className="text-xs font-bold text-pitch-green mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{points}</span>
                    <div 
                      className="w-full bg-gradient-to-t from-pitch-green to-pitch-green/60 rounded-t-lg transition-all group-hover:from-terracotta group-hover:to-terracotta/60"
                      style={{ height: `${Math.max(height, 10)}%` }}
                    />
                    <span className="text-xs text-text-secondary mt-1">R{round}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Predictions History */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-paper">
        <div className="flex flex-col gap-4 mb-6">
          <h2 className="font-heading text-2xl font-bold text-text-primary flex items-center gap-2">
            <CalendarBlank size={24} weight="fill" className="text-pitch-green" />
            Histórico de Palpites
          </h2>
          
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Filtro de Campeonato */}
            <select
              value={selectedChampionship}
              onChange={(e) => {
                setSelectedChampionship(e.target.value);
                setSelectedRound("all"); // Reset rodada ao mudar campeonato
              }}
              data-testid="championship-filter"
              className="flex-1 px-4 py-2 border-2 border-paper rounded-lg bg-white text-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-pitch-green"
            >
              <option value="all">🏆 Todos os Campeonatos</option>
              <option value="carioca">⚪ Campeonato Carioca 2026</option>
              <option value="brasileirao">🟡 Campeonato Brasileiro 2026</option>
            </select>

            {/* Filtro de Rodada */}
            <select
              value={selectedRound}
              onChange={(e) => setSelectedRound(e.target.value)}
              data-testid="round-filter"
              className="flex-1 px-4 py-2 border-2 border-paper rounded-lg bg-white text-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-pitch-green"
            >
              <option value="all">📅 Todas as Rodadas</option>
              {availableRounds.map((roundNum) => (
                <option key={roundNum} value={roundNum}>
                  Rodada {roundNum}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredPredictions.length === 0 ? (
          <div className="text-center py-12">
            <SoccerBall size={48} className="mx-auto text-text-secondary/50 mb-4" />
            <p className="text-text-secondary mb-4">
              {selectedChampionship !== "all" || selectedRound !== "all"
                ? "Nenhum palpite encontrado com os filtros selecionados."
                : "Você ainda não fez nenhum palpite."}
            </p>
            <Link
              to="/predictions"
              className="inline-flex items-center gap-2 bg-pitch-green text-bone px-6 py-3 rounded-lg font-semibold hover:bg-pitch-green/90 transition-all"
            >
              <Trophy size={18} weight="fill" />
              Fazer Palpites
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedByChampionshipAndRound)
              .sort((a, b) => a[0] === "brasileirao" ? -1 : 1) // Brasileirão primeiro
              .map(([championship, rounds]) => (
                <div key={championship}>
                  {/* Header do Campeonato */}
                  {selectedChampionship === "all" && (
                    <div className={`flex items-center gap-2 mb-4 pb-2 border-b-2 ${
                      championship === "brasileirao" 
                        ? "border-yellow-400" 
                        : "border-pitch-green"
                    }`}>
                      <span className={`text-2xl`}>
                        {championship === "brasileirao" ? "🇧🇷" : "🏆"}
                      </span>
                      <h3 className={`font-heading text-lg font-bold ${
                        championship === "brasileirao" 
                          ? "text-yellow-600" 
                          : "text-pitch-green"
                      }`}>
                        {championshipNames[championship] || championship}
                      </h3>
                      {championship === "brasileirao" && (
                        <span className="ml-2 text-xs bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-2 py-0.5 rounded-full font-bold">
                          PREMIUM
                        </span>
                      )}
                    </div>
                  )}

                  {/* Rodadas */}
                  <div className="space-y-4">
                    {Object.entries(rounds)
                      .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
                      .map(([roundNum, roundPreds]) => (
                        <div key={`${championship}-${roundNum}`} className={`${
                          selectedChampionship === "all" ? "ml-4" : ""
                        }`}>
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                              championship === "brasileirao"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-pitch-green/10 text-pitch-green"
                            }`}>
                              Rodada {roundNum}
                            </span>
                            <span className="text-sm text-text-secondary">
                              {roundPreds.length} {roundPreds.length === 1 ? 'palpite' : 'palpites'}
                            </span>
                            <span className={`ml-auto text-sm font-bold ${
                              championship === "brasileirao" ? "text-yellow-600" : "text-pitch-green"
                            }`}>
                              {roundPreds.reduce((sum, p) => sum + (p.points || 0), 0)} pts
                            </span>
                          </div>

                  <div className="grid gap-3">
                    {roundPreds.map((pred, index) => (
                      <div
                        key={`${pred.match_id}-${index}`}
                        data-testid={`prediction-${roundNum}-${index}`}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          pred.is_finished 
                            ? pred.points === 5 
                              ? "bg-yellow-50 border-yellow-400"
                              : pred.points >= 3
                              ? "bg-green-50 border-green-300"
                              : pred.points > 0
                              ? "bg-blue-50 border-blue-300"
                              : "bg-gray-50 border-gray-200"
                            : "bg-paper border-paper"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-sm text-text-secondary mb-1">
                              <CalendarBlank size={14} />
                              {formatDate(pred.match_date)}
                            </div>
                            <p className="font-semibold text-text-primary truncate">
                              {pred.home_team} <span className="text-text-secondary">vs</span> {pred.away_team}
                            </p>
                          </div>

                          <div className="text-center px-3">
                            <p className="text-xs text-text-secondary mb-1">Palpite</p>
                            <p className="font-mono text-lg font-bold text-text-primary">
                              {pred.home_prediction} × {pred.away_prediction}
                            </p>
                          </div>

                          <div className="text-center min-w-[80px]">
                            {pred.is_finished ? (
                              <>
                                <p className="text-xs text-text-secondary mb-1">Resultado</p>
                                <p className="font-mono text-lg font-bold text-pitch-green mb-1">
                                  {pred.home_score} × {pred.away_score}
                                </p>
                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${getPointsBadgeStyle(pred.points)}`}>
                                  {pred.points === 5 ? "🎯 " : ""}{pred.points} pts
                                </span>
                              </>
                            ) : (
                              <div className="flex items-center justify-center gap-1 text-text-secondary">
                                <div className="w-2 h-2 bg-warning rounded-full animate-pulse"></div>
                                <span className="text-sm">Aguardando</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-paper rounded-lg p-4 border-2 border-paper">
        <h4 className="font-semibold text-text-primary mb-3">Legenda de Pontuação</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">5</span>
            <span className="text-text-secondary">Placar exato</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-pitch-green rounded-full flex items-center justify-center text-white text-xs font-bold">3+</span>
            <span className="text-text-secondary">Resultado certo</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1-2</span>
            <span className="text-text-secondary">Gol(s) certo(s)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs font-bold">0</span>
            <span className="text-text-secondary">Nenhum acerto</span>
          </div>
        </div>
      </div>
    </div>
  );
}
