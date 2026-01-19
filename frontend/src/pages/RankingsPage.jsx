import { useState, useEffect } from "react";
import axios from "axios";
import { ChartBar, Medal, TrendUp, Fire } from "@phosphor-icons/react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function RankingsPage({ username }) {
  const [view, setView] = useState("general"); // 'general' or 'round'
  const [currentRound, setCurrentRound] = useState(null);
  const [generalRanking, setGeneralRanking] = useState([]);
  const [roundRanking, setRoundRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [roundRes, generalRes] = await Promise.all([
        axios.get(`${API}/rounds/current`),
        axios.get(`${API}/ranking/general`)
      ]);

      setCurrentRound(roundRes.data);
      setGeneralRanking(generalRes.data);

      // Carrega ranking da rodada
      const roundRankingRes = await axios.get(`${API}/ranking/round/${roundRes.data.round_number}`);
      setRoundRanking(roundRankingRes.data);
    } catch (error) {
      console.error("Erro ao carregar rankings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalColor = (position) => {
    if (position === 0) return "text-warning";
    if (position === 1) return "text-text-secondary";
    if (position === 2) return "text-terracotta";
    return "text-text-primary";
  };

  const getMedalBg = (position) => {
    if (position === 0) return "bg-warning/20 border-warning";
    if (position === 1) return "bg-text-secondary/10 border-text-secondary";
    if (position === 2) return "bg-terracotta/10 border-terracotta";
    return "bg-paper border-paper";
  };

  if (loading) {
    return <div className="text-center py-20">Carregando rankings...</div>;
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
        <div className="flex gap-2">
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
            Rodada {currentRound?.round_number || 1}
          </button>
        </div>
      </div>

      {/* Ranking Table */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-paper">
        {currentRanking.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary">
              Nenhum dado disponível ainda. Faça seus palpites!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 pb-3 border-b-2 border-paper text-sm font-semibold text-text-secondary">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-6 md:col-span-7">Jogador</div>
              <div className="col-span-5 md:col-span-4 text-right">
                {isGeneral ? "Total" : "Pontos"}
              </div>
            </div>

            {/* Ranking Rows */}
            {currentRanking.map((player, index) => {
              const isCurrentUser = player.username === username;
              const points = isGeneral ? player.total_points : player.points;
              const streak = isGeneral ? player.max_perfect_streak : player.perfect_count;

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
                  <div className={`col-span-1 flex items-center justify-center font-mono text-xl font-bold ${getMedalColor(index)}`}>
                    {index < 3 ? (
                      <Medal size={28} weight="fill" />
                    ) : (
                      `#${index + 1}`
                    )}
                  </div>

                  {/* Player Info */}
                  <div className="col-span-6 md:col-span-7 flex flex-col justify-center">
                    <p className={`font-semibold ${isCurrentUser ? "text-pitch-green" : "text-text-primary"}`}>
                      {player.username}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs bg-pitch-green text-bone px-2 py-1 rounded">
                          Você
                        </span>
                      )}
                    </p>
                    {streak > 0 && (
                      <p className="text-xs text-text-secondary">
                        <Fire size={12} weight="fill" className="inline text-terracotta" />
                        {streak} {isGeneral ? "acertos perfeitos" : "placar(es) exato(s)"}
                      </p>
                    )}
                  </div>

                  {/* Points */}
                  <div className="col-span-5 md:col-span-4 flex items-center justify-end">
                    <span className="font-mono text-2xl font-bold text-pitch-green">
                      {points || 0}
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
      {isGeneral && (
        <div className="bg-paper rounded-lg p-6 border-2 border-paper">
          <h3 className="font-semibold text-text-primary mb-2">
            Critério de Desempate
          </h3>
          <p className="text-sm text-text-secondary">
            Em caso de empate no total de pontos, vence quem tem a maior sequência consecutiva de acertos perfeitos (5 pontos).
          </p>
        </div>
      )}
    </div>
  );
}
