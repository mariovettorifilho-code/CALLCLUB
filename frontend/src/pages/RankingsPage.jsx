import { useState, useEffect } from "react";
import axios from "axios";
import { ChartBar, Medal, TrendUp, Fire, Trophy } from "@phosphor-icons/react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function RankingsPage({ username }) {
  const [view, setView] = useState("general"); // 'general' or 'round'
  const [allRounds, setAllRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);
  const [generalRanking, setGeneralRanking] = useState([]);
  const [roundRanking, setRoundRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedRound && view === "round") {
      loadRoundRanking(selectedRound);
    }
  }, [selectedRound, view]);

  const loadData = async () => {
    try {
      const [roundsRes, generalRes, currentRes] = await Promise.all([
        axios.get(`${API}/rounds/all`),
        axios.get(`${API}/ranking/general`),
        axios.get(`${API}/rounds/current`)
      ]);

      setAllRounds(roundsRes.data || []);
      setGeneralRanking(generalRes.data || []);
      
      const currentRoundNum = currentRes.data?.round_number || 1;
      setSelectedRound(currentRoundNum);

      // Carrega ranking da rodada atual
      const roundRankingRes = await axios.get(`${API}/ranking/round/${currentRoundNum}`);
      setRoundRanking(roundRankingRes.data || []);
    } catch (error) {
      console.error("Erro ao carregar rankings:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoundRanking = async (roundNum) => {
    try {
      const res = await axios.get(`${API}/ranking/round/${roundNum}`);
      setRoundRanking(res.data || []);
    } catch (error) {
      console.error("Erro ao carregar ranking da rodada:", error);
    }
  };

  const getMedalColor = (position) => {
    if (position === 0) return "text-yellow-500";
    if (position === 1) return "text-gray-400";
    if (position === 2) return "text-amber-700";
    return "text-text-primary";
  };

  const getMedalBg = (position) => {
    if (position === 0) return "bg-yellow-500/10 border-yellow-500";
    if (position === 1) return "bg-gray-400/10 border-gray-400";
    if (position === 2) return "bg-amber-700/10 border-amber-700";
    return "bg-paper border-paper";
  };

  const getPositionDisplay = (position) => {
    if (position === 0) return "🥇";
    if (position === 1) return "🥈";
    if (position === 2) return "🥉";
    return `#${position + 1}`;
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-pitch-green border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-text-secondary">Carregando rankings...</p>
      </div>
    );
  }

  const currentRanking = view === "general" ? generalRanking : roundRanking;
  const isGeneral = view === "general";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-paper">
        <div className="flex items-center gap-3 mb-6">
          <ChartBar size={32} weight="fill" className="text-pitch-green" />
          <h1 className="font-heading text-3xl font-bold text-text-primary">
            Rankings
          </h1>
        </div>

        {/* Toggle View */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setView("general")}
            data-testid="general-ranking-tab"
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              view === "general"
                ? "bg-pitch-green text-bone"
                : "bg-paper text-text-secondary hover:bg-paper/80"
            }`}
          >
            <TrendUp size={20} weight="bold" className="inline mr-2" />
            Geral
          </button>
          <button
            onClick={() => setView("round")}
            data-testid="round-ranking-tab"
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              view === "round"
                ? "bg-pitch-green text-bone"
                : "bg-paper text-text-secondary hover:bg-paper/80"
            }`}
          >
            <Fire size={20} weight="bold" className="inline mr-2" />
            Por Rodada
          </button>
        </div>

        {/* Seletor de Rodada */}
        {view === "round" && allRounds.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-text-secondary">Rodada:</label>
            <select
              value={selectedRound || ''}
              onChange={(e) => setSelectedRound(parseInt(e.target.value))}
              data-testid="round-selector"
              className="flex-1 px-4 py-2 border-2 border-paper rounded-lg bg-white text-text-primary font-semibold focus:outline-none focus:ring-2 focus:ring-pitch-green"
            >
              {allRounds.map((round) => (
                <option key={round.round_number} value={round.round_number}>
                  Rodada {round.round_number}
                  {round.is_current && " (Atual)"}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Ranking Table */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-paper">
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={24} weight="fill" className="text-pitch-green" />
          <h2 className="font-heading text-xl font-bold text-text-primary">
            {isGeneral ? "Classificação Geral" : `Ranking da Rodada ${selectedRound}`}
          </h2>
        </div>

        {currentRanking.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary mb-2">
              Nenhum dado disponível ainda.
            </p>
            <p className="text-sm text-text-secondary/70">
              Os rankings aparecem após os jogos serem finalizados.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 pb-3 border-b-2 border-paper text-sm font-semibold text-text-secondary">
              <div className="col-span-2 text-center">#</div>
              <div className="col-span-6">Jogador</div>
              <div className="col-span-4 text-right">
                {isGeneral ? "Total" : "Pontos"}
              </div>
            </div>

            {/* Ranking Rows */}
            {currentRanking.map((player, index) => {
              const isCurrentUser = player.username === username;
              const points = isGeneral ? (player.total_points || 0) : (player.points || 0);
              const streak = isGeneral ? (player.max_perfect_streak || 0) : (player.perfect_count || 0);

              return (
                <div
                  key={player.username}
                  data-testid={`rank-${index + 1}`}
                  className={`grid grid-cols-12 gap-4 p-4 rounded-lg transition-all border-2 ${
                    isCurrentUser
                      ? "bg-pitch-green/10 border-pitch-green"
                      : getMedalBg(index)
                  }`}
                >
                  {/* Position */}
                  <div className={`col-span-2 flex items-center justify-center font-mono text-xl font-bold ${getMedalColor(index)}`}>
                    {index < 3 ? (
                      <span className="text-2xl">{getPositionDisplay(index)}</span>
                    ) : (
                      <span className="text-lg">#{index + 1}</span>
                    )}
                  </div>

                  {/* Player Info */}
                  <div className="col-span-6 flex flex-col justify-center">
                    <p className={`font-semibold ${isCurrentUser ? "text-pitch-green" : "text-text-primary"}`}>
                      {player.username}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs bg-pitch-green text-bone px-2 py-1 rounded">
                          Você
                        </span>
                      )}
                    </p>
                    {streak > 0 && (
                      <p className="text-xs text-text-secondary flex items-center gap-1">
                        <Fire size={12} weight="fill" className="text-orange-500" />
                        {streak} {isGeneral ? "acertos perfeitos (sequência)" : "placar(es) exato(s)"}
                      </p>
                    )}
                  </div>

                  {/* Points */}
                  <div className="col-span-4 flex items-center justify-end">
                    <span className="font-mono text-2xl font-bold text-pitch-green">
                      {points}
                    </span>
                    <span className="ml-1 text-sm text-text-secondary">pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-paper rounded-lg p-6 border-2 border-paper">
        <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Trophy size={20} weight="fill" className="text-pitch-green" />
          Sistema de Pontuação
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-text-secondary mb-2">
              <span className="font-bold text-pitch-green">3 pts</span> - Acertar o resultado (V/E/D)
            </p>
            <p className="text-text-secondary mb-2">
              <span className="font-bold text-pitch-green">+1 pt</span> - Acertar gols do mandante
            </p>
            <p className="text-text-secondary">
              <span className="font-bold text-pitch-green">+1 pt</span> - Acertar gols do visitante
            </p>
          </div>
          <div>
            <p className="text-text-secondary mb-2">
              <span className="font-bold text-yellow-500">5 pts</span> - Máximo por jogo (placar exato)
            </p>
            <p className="text-text-secondary text-xs mt-4 italic">
              <Fire size={12} weight="fill" className="inline text-orange-500 mr-1" />
              Desempate: maior sequência de acertos perfeitos (5 pts)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
