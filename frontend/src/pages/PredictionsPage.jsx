import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { Trophy, Clock, Lock, Check, Fire, Users, Star, Key } from "@phosphor-icons/react";
import confetti from "canvas-confetti";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function PredictionsPage({ username }) {
  const [searchParams] = useSearchParams();
  const [championships, setChampionships] = useState([]);
  const [selectedChampionship, setSelectedChampionship] = useState("carioca");
  const [allRounds, setAllRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [popularPredictions, setPopularPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  
  // Premium state
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumKey, setPremiumKey] = useState("");
  const [premiumError, setPremiumError] = useState("");
  const [activatingPremium, setActivatingPremium] = useState(false);

  // Carrega parâmetros da URL
  useEffect(() => {
    const champParam = searchParams.get('championship');
    const roundParam = searchParams.get('round');
    
    if (champParam) {
      setSelectedChampionship(champParam);
    }
    if (roundParam) {
      setSelectedRound(parseInt(roundParam));
    }
  }, [searchParams]);

  useEffect(() => {
    loadChampionships();
    checkPremiumStatus();
  }, []);

  useEffect(() => {
    if (selectedChampionship) {
      // Verifica se precisa de premium
      const champ = championships.find(c => c.id === selectedChampionship);
      if (champ?.premium && !isPremium) {
        setShowPremiumModal(true);
      } else {
        setShowPremiumModal(false);
        loadRounds();
      }
    }
  }, [selectedChampionship, isPremium, championships]);

  useEffect(() => {
    if (selectedRound && !showPremiumModal) {
      loadMatches();
    }
  }, [selectedRound, selectedChampionship, showPremiumModal]);

  const checkPremiumStatus = async () => {
    try {
      const res = await axios.get(`${API}/premium/status/${username}`);
      setIsPremium(res.data.is_premium);
    } catch (error) {
      console.error("Erro ao verificar premium:", error);
    }
  };

  const activatePremiumKey = async () => {
    setActivatingPremium(true);
    setPremiumError("");
    
    try {
      const res = await axios.post(`${API}/premium/activate`, {
        username,
        key: premiumKey
      });
      
      if (res.data.success) {
        // Confetes de celebração! 🎉
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#FF6347', '#32CD32', '#1E90FF']
        });
        
        // Segundo disparo para mais impacto
        setTimeout(() => {
          confetti({
            particleCount: 100,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#FFD700', '#FFA500']
          });
          confetti({
            particleCount: 100,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#FFD700', '#FFA500']
          });
        }, 250);
        
        setIsPremium(true);
        setShowPremiumModal(false);
        setPremiumKey("");
      }
    } catch (error) {
      setPremiumError(error.response?.data?.detail || "Erro ao ativar chave");
    } finally {
      setActivatingPremium(false);
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

  const loadRounds = async () => {
    setLoading(true);
    try {
      const [roundsRes, currentRes] = await Promise.all([
        axios.get(`${API}/rounds/all?championship=${selectedChampionship}`),
        axios.get(`${API}/rounds/current?championship=${selectedChampionship}`)
      ]);

      setAllRounds(roundsRes.data || []);
      
      // Se tem rodada na URL E é a primeira carga, usa ela
      const urlRound = searchParams.get('round');
      const urlChamp = searchParams.get('championship');
      
      // Só usa a rodada da URL se o campeonato da URL é o mesmo selecionado
      if (urlRound && urlChamp === selectedChampionship) {
        setSelectedRound(parseInt(urlRound));
      } else {
        // Caso contrário, usa a rodada atual do campeonato selecionado
        const currentRoundNum = currentRes.data?.round_number || 1;
        setSelectedRound(currentRoundNum);
      }
      } else if (!selectedRound) {
        const currentRoundNum = currentRes.data?.round_number || 1;
        setSelectedRound(currentRoundNum);
      }
    } catch (error) {
      console.error("Erro ao carregar rodadas:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    try {
      const [matchesRes, predictionsRes] = await Promise.all([
        axios.get(`${API}/matches/${selectedRound}?championship=${selectedChampionship}`),
        axios.get(`${API}/predictions/${username}?round_number=${selectedRound}&championship=${selectedChampionship}`)
      ]);

      setMatches(matchesRes.data || []);
      
      const predsMap = {};
      (predictionsRes.data || []).forEach(p => {
        predsMap[p.match_id] = {
          home: p.home_prediction,
          away: p.away_prediction
        };
      });
      setPredictions(predsMap);

      if (matchesRes.data && matchesRes.data.length > 0) {
        const matchIds = matchesRes.data.map(m => m.match_id).join(',');
        try {
          const popularRes = await axios.get(`${API}/matches/popular-predictions/batch?match_ids=${matchIds}`);
          setPopularPredictions(popularRes.data || {});
        } catch (err) {
          console.error("Erro ao carregar palpites populares:", err);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar jogos:", error);
    }
  };

  const handlePrediction = (matchId, team, value) => {
    const numValue = parseInt(value) || 0;
    setPredictions(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [team]: numValue
      }
    }));
  };

  const savePrediction = async (match) => {
    const pred = predictions[match.match_id];
    if (pred?.home === undefined || pred?.away === undefined) return;

    setSaving(prev => ({ ...prev, [match.match_id]: true }));

    try {
      await axios.post(`${API}/predictions`, {
        username,
        match_id: match.match_id,
        championship: selectedChampionship,
        round_number: selectedRound,
        home_prediction: pred.home,
        away_prediction: pred.away
      });
      
      setTimeout(() => loadMatches(), 500);
    } catch (error) {
      console.error("Erro ao salvar palpite:", error);
    } finally {
      setSaving(prev => ({ ...prev, [match.match_id]: false }));
    }
  };

  const isMatchLocked = (match) => {
    const now = new Date();
    const matchDate = new Date(match.match_date);
    return now >= matchDate || match.is_finished;
  };

  const formatMatchDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month} às ${hours}h${minutes}`;
  };

  const getTimeRemaining = (dateString) => {
    const now = new Date();
    const matchDate = new Date(dateString);
    const diff = matchDate - now;

    if (diff <= 0) return null;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  // Modal Premium
  if (showPremiumModal) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <Star size={40} weight="fill" className="text-white" />
            <h1 className="font-heading text-3xl font-bold">
              Conteúdo Premium
            </h1>
          </div>
          <p className="text-white/90 text-lg mb-2">
            O Campeonato Brasileiro é exclusivo para membros premium do CallClub.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-yellow-400">
          <div className="text-center mb-6">
            <Key size={48} className="mx-auto text-yellow-500 mb-4" />
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-2">
              Ative sua Chave do Clube
            </h2>
            <p className="text-text-secondary">
              Digite a chave premium que você recebeu
            </p>
          </div>

          <div className="max-w-md mx-auto space-y-4">
            <input
              type="text"
              value={premiumKey}
              onChange={(e) => setPremiumKey(e.target.value.toUpperCase())}
              placeholder="NOME-CLUB-XXXX"
              className="w-full px-4 py-4 border-2 border-paper rounded-lg text-center text-xl font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />

            {premiumError && (
              <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg text-sm text-center">
                {premiumError}
              </div>
            )}

            <button
              onClick={activatePremiumKey}
              disabled={premiumKey.length < 10 || activatingPremium}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {activatingPremium ? "Ativando..." : "🔓 Ativar Premium"}
            </button>

            <button
              onClick={() => {
                setSelectedChampionship("carioca");
                setShowPremiumModal(false);
              }}
              className="w-full text-text-secondary hover:text-text-primary py-2 transition-colors"
            >
              ← Voltar para o Carioca (gratuito)
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-paper text-center">
            <p className="text-xs text-text-secondary">
              ⚠️ Sua chave é pessoal e intransferível.<br/>
              Tentativas de uso indevido são registradas e podem resultar em banimento.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-pitch-green border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-text-secondary">Carregando jogos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Seletores - FIXO NO TOPO */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-paper sticky top-0 z-40">
        <div className="flex items-center gap-3 mb-6">
          <Trophy size={32} weight="fill" className="text-pitch-green" />
          <h1 className="font-heading text-3xl font-bold text-text-primary">
            Palpites
          </h1>
          {isPremium && (
            <span className="ml-auto bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Star size={12} weight="fill" />
              PREMIUM
            </span>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Seletor de Campeonato */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Campeonato
            </label>
            <select
              value={selectedChampionship}
              onChange={(e) => setSelectedChampionship(e.target.value)}
              data-testid="championship-filter"
              className="w-full px-4 py-3 border-2 border-paper rounded-lg bg-white text-text-primary font-semibold focus:outline-none focus:ring-2 focus:ring-pitch-green"
            >
              {championships.map((champ) => (
                <option key={champ.id} value={champ.id}>
                  {champ.name} {champ.premium && !isPremium ? "🔒" : champ.premium ? "⭐" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Seletor de Rodada */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Rodada
            </label>
            <select
              value={selectedRound || ''}
              onChange={(e) => setSelectedRound(parseInt(e.target.value))}
              data-testid="round-filter"
              className="w-full px-4 py-3 border-2 border-paper rounded-lg bg-white text-text-primary font-semibold focus:outline-none focus:ring-2 focus:ring-pitch-green"
            >
              {allRounds.map((round) => (
                <option key={round.round_number} value={round.round_number}>
                  Rodada {round.round_number}
                  {round.is_current && " (Atual)"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Jogos */}
      <div className="space-y-4">
        {matches.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-text-secondary">
              Nenhum jogo encontrado para esta rodada.
            </p>
          </div>
        ) : (
          matches.map((match) => {
            const locked = isMatchLocked(match);
            const pred = predictions[match.match_id] || {};
            const hasPrediction = pred.home !== undefined && pred.away !== undefined;
            const timeRemaining = getTimeRemaining(match.match_date);
            const popular = popularPredictions[match.match_id];

            return (
              <div
                key={match.match_id}
                data-testid={`match-${match.match_id}`}
                className={`bg-white rounded-xl p-6 shadow-lg border-2 transition-all ${
                  locked ? "border-gray-200 bg-gray-50" : "border-paper hover:border-pitch-green"
                }`}
              >
                {/* Header do Jogo */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Clock size={16} />
                    <span>{formatMatchDate(match.match_date)}</span>
                  </div>
                  
                  {locked ? (
                    <div className="flex items-center gap-1 text-error text-sm font-medium">
                      <Lock size={16} weight="bold" />
                      <span>Palpites fechados</span>
                    </div>
                  ) : timeRemaining && (
                    <div className="flex items-center gap-1 text-warning text-sm font-medium">
                      <Fire size={16} weight="fill" />
                      <span>Fecha em {timeRemaining}</span>
                    </div>
                  )}
                </div>

                {/* Times e Placar */}
                <div className="flex items-center justify-between gap-4">
                  {/* Time Casa */}
                  <div className="flex-1 text-center">
                    {match.home_badge ? (
                      <img 
                        src={match.home_badge} 
                        alt={match.home_team}
                        className="w-16 h-16 mx-auto mb-2 object-contain"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-16 h-16 mx-auto mb-2 bg-paper rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-text-secondary">
                          {match.home_team?.charAt(0)}
                        </span>
                      </div>
                    )}
                    <p className="font-heading font-bold text-text-primary text-lg mb-2">
                      {match.home_team}
                    </p>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={pred.home ?? ''}
                      onChange={(e) => handlePrediction(match.match_id, 'home', e.target.value)}
                      disabled={locked}
                      data-testid={`home-score-${match.match_id}`}
                      className={`w-16 h-16 text-center text-2xl font-mono font-bold rounded-lg border-2 ${
                        locked 
                          ? "bg-gray-100 border-gray-200 text-gray-500" 
                          : "border-paper focus:border-pitch-green focus:ring-2 focus:ring-pitch-green"
                      }`}
                    />
                  </div>

                  {/* VS */}
                  <div className="text-2xl font-bold text-text-secondary">×</div>

                  {/* Time Fora */}
                  <div className="flex-1 text-center">
                    {match.away_badge ? (
                      <img 
                        src={match.away_badge} 
                        alt={match.away_team}
                        className="w-16 h-16 mx-auto mb-2 object-contain"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-16 h-16 mx-auto mb-2 bg-paper rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-text-secondary">
                          {match.away_team?.charAt(0)}
                        </span>
                      </div>
                    )}
                    <p className="font-heading font-bold text-text-primary text-lg mb-2">
                      {match.away_team}
                    </p>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={pred.away ?? ''}
                      onChange={(e) => handlePrediction(match.match_id, 'away', e.target.value)}
                      disabled={locked}
                      data-testid={`away-score-${match.match_id}`}
                      className={`w-16 h-16 text-center text-2xl font-mono font-bold rounded-lg border-2 ${
                        locked 
                          ? "bg-gray-100 border-gray-200 text-gray-500" 
                          : "border-paper focus:border-pitch-green focus:ring-2 focus:ring-pitch-green"
                      }`}
                    />
                  </div>
                </div>

                {/* Palpite mais votado */}
                {popular && !locked && (
                  <div className="mt-4 pt-4 border-t border-paper">
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <Users size={16} className="text-pitch-green" />
                      <span className="text-text-secondary">Palpite mais votado:</span>
                      <span className="font-bold text-pitch-green">
                        {popular.home_prediction} × {popular.away_prediction}
                      </span>
                      <span className="text-text-secondary">
                        ({popular.count} {popular.count === 1 ? 'pessoa' : 'pessoas'})
                      </span>
                    </div>
                  </div>
                )}

                {/* Resultado Final e Pontos */}
                {match.is_finished && (
                  <div className="mt-4 pt-4 border-t border-paper">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-text-secondary">
                        Resultado Final: <span className="font-bold text-pitch-green">
                          {match.home_score} × {match.away_score}
                        </span>
                      </p>
                      {predictions[match.match_id] && (
                        <div className="text-right">
                          {(() => {
                            const predMatch = predictions[match.match_id];
                            let points = 0;
                            
                            const realResult = match.home_score > match.away_score ? 'H' : (match.away_score > match.home_score ? 'A' : 'D');
                            const predResult = predMatch.home > predMatch.away ? 'H' : (predMatch.away > predMatch.home ? 'A' : 'D');
                            if (realResult === predResult) points += 3;
                            if (match.home_score === predMatch.home) points += 1;
                            if (match.away_score === predMatch.away) points += 1;
                            
                            return (
                              <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                                points === 5 ? 'bg-yellow-500/20 text-yellow-600' :
                                points >= 3 ? 'bg-pitch-green/20 text-pitch-green' :
                                points > 0 ? 'bg-blue-500/20 text-blue-600' :
                                'bg-error/20 text-error'
                              }`}>
                                {points === 5 ? '🎯 ' : ''}{points} {points === 1 ? 'pt' : 'pts'}
                              </span>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Botão Salvar */}
                {!locked && (
                  <button
                    onClick={() => savePrediction(match)}
                    disabled={!hasPrediction || saving[match.match_id]}
                    data-testid={`save-${match.match_id}`}
                    className={`mt-4 w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                      hasPrediction
                        ? "bg-pitch-green text-bone hover:bg-pitch-green/90"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {saving[match.match_id] ? (
                      <>
                        <div className="w-5 h-5 border-2 border-bone border-t-transparent rounded-full animate-spin"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Check size={20} weight="bold" />
                        {predictions[match.match_id]?.home !== undefined ? "Atualizar Palpite" : "Salvar Palpite"}
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
