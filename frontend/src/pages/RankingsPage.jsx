import { useState, useEffect } from "react";
import axios from "axios";
import { ChartBar, Trophy, Star, SoccerBall, Percent, GlobeHemisphereWest, Diamond, Target, ListNumbers } from "@phosphor-icons/react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function RankingsPage({ username }) {
  const [championships, setChampionships] = useState([]);
  const [selectedChampionship, setSelectedChampionship] = useState("brasileirao");
  const [rankingData, setRankingData] = useState(null);
  const [roundRanking, setRoundRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Nova: visão selecionada (geral ou rodada)
  const [viewMode, setViewMode] = useState("geral"); // "geral" | "rodada"
  const [selectedRound, setSelectedRound] = useState(1);

  useEffect(() => {
    loadChampionships();
  }, []);

  useEffect(() => {
    if (selectedChampionship) {
      loadRanking();
    }
  }, [selectedChampionship]);

  useEffect(() => {
    if (viewMode === "rodada" && selectedChampionship) {
      loadRoundRanking();
    }
  }, [viewMode, selectedRound, selectedChampionship]);

  const loadChampionships = async () => {
    try {
      const res = await axios.get(`${API}/user/${username}/accessible-championships`);
      setChampionships(res.data || []);
      
      if (res.data?.length > 0) {
        const national = res.data.find(c => c.access_type === "national");
        setSelectedChampionship(national?.championship_id || res.data[0].championship_id);
      }
    } catch (error) {
      console.error("Erro ao carregar campeonatos:", error);
    }
  };

  const loadRanking = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/ranking/detailed/${selectedChampionship}`);
      setRankingData(res.data);
      setSelectedRound(res.data?.current_round || 1);
    } catch (error) {
      console.error("Erro ao carregar ranking:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoundRanking = async () => {
    try {
      const res = await axios.get(`${API}/ranking/round/${selectedRound}?championship_id=${selectedChampionship}`);
      setRoundRanking(res.data || []);
    } catch (error) {
      console.error("Erro ao carregar ranking da rodada:", error);
    }
  };

  const getPositionDisplay = (position) => {
    if (position === 1) return <span className="text-lg font-bold text-yellow-600">🥇</span>;
    if (position === 2) return <span className="text-lg font-bold text-gray-500">🥈</span>;
    if (position === 3) return <span className="text-lg font-bold text-amber-700">🥉</span>;
    return <span className="text-lg font-bold text-text-secondary">{position}º</span>;
  };

  const getRowStyle = (position, isCurrentUser, plan) => {
    if (isCurrentUser) return "bg-pitch-green/10 border-l-4 border-l-pitch-green";
    if (position === 1) return "bg-gradient-to-r from-yellow-50 to-amber-50";
    if (position === 2) return "bg-gradient-to-r from-gray-50 to-slate-50";
    if (position === 3) return "bg-gradient-to-r from-orange-50 to-amber-50";
    return "bg-white hover:bg-gray-50";
  };

  // Gera lista de rodadas para o seletor
  const roundOptions = [];
  const totalRounds = rankingData?.total_rounds || 38;
  for (let i = 1; i <= totalRounds; i++) {
    roundOptions.push(i);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-10 h-10 border-4 border-pitch-green border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-primary flex items-center gap-3">
            <Trophy size={32} weight="fill" className="text-yellow-500" />
            Classificação
          </h1>
          <p className="text-text-secondary mt-1">
            Classificação completa dos palpiteiros
          </p>
        </div>

        {/* Championship Selector */}
        <div className="flex flex-wrap gap-2">
          {championships.map((champ) => (
            <button
              key={champ.championship_id}
              onClick={() => setSelectedChampionship(champ.championship_id)}
              className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                selectedChampionship === champ.championship_id
                  ? "bg-gradient-to-r from-pitch-green to-emerald-600 text-white shadow-lg shadow-pitch-green/30"
                  : "bg-white text-text-secondary border-2 border-paper hover:border-pitch-green"
              }`}
            >
              {champ.access_type === "national" ? "🏠" : champ.access_type === "extra" ? "⭐" : "👥"}
              {champ.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs: Geral vs Por Rodada */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-paper overflow-hidden">
        <div className="flex border-b-2 border-paper">
          <button
            onClick={() => setViewMode("geral")}
            className={`flex-1 px-6 py-4 font-semibold text-center transition-all flex items-center justify-center gap-2 ${
              viewMode === "geral"
                ? "bg-pitch-green text-white"
                : "bg-white text-text-secondary hover:bg-gray-50"
            }`}
          >
            <ChartBar size={20} weight={viewMode === "geral" ? "fill" : "regular"} />
            Classificação Geral
          </button>
          <button
            onClick={() => setViewMode("rodada")}
            className={`flex-1 px-6 py-4 font-semibold text-center transition-all flex items-center justify-center gap-2 ${
              viewMode === "rodada"
                ? "bg-pitch-green text-white"
                : "bg-white text-text-secondary hover:bg-gray-50"
            }`}
          >
            <Target size={20} weight={viewMode === "rodada" ? "fill" : "regular"} />
            Por Rodada
          </button>
        </div>

        {/* Info Bar */}
        {rankingData && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-green-200">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs text-text-secondary">Rodada Atual</p>
                <p className="text-2xl font-bold text-text-primary">{rankingData.current_round}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-text-secondary">Total de Rodadas</p>
                <p className="text-2xl font-bold text-text-primary">{rankingData.total_rounds}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-text-secondary">Participantes</p>
                <p className="text-2xl font-bold text-text-primary">{rankingData.ranking.length}</p>
              </div>
            </div>
            
            {/* Seletor de Rodada (só aparece no modo rodada) */}
            {viewMode === "rodada" && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-text-secondary">Rodada:</label>
                <select
                  value={selectedRound}
                  onChange={(e) => setSelectedRound(parseInt(e.target.value))}
                  className="px-4 py-2 rounded-lg border-2 border-green-300 bg-white font-semibold text-pitch-green focus:outline-none focus:ring-2 focus:ring-pitch-green"
                >
                  {roundOptions.map(r => (
                    <option key={r} value={r}>
                      {r}{r === rankingData.current_round ? " (Atual)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Tabela de Classificação */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-pitch-green text-white">
                <th className="px-4 py-3 text-left">Pos.</th>
                <th className="px-4 py-3 text-left">Palpiteiro</th>
                {viewMode === "geral" && <th className="px-4 py-3 text-center">Rod.</th>}
                <th className="px-4 py-3 text-center">
                  <span className="flex items-center justify-center gap-1">
                    <Trophy size={16} weight="fill" /> Pts
                  </span>
                </th>
                {viewMode === "geral" && (
                  <>
                    <th className="px-4 py-3 text-center">Res.</th>
                    <th className="px-4 py-3 text-center">Casa</th>
                    <th className="px-4 py-3 text-center">Vis.</th>
                  </>
                )}
                <th className="px-4 py-3 text-center">Exato</th>
                {viewMode === "geral" && (
                  <>
                    <th className="px-4 py-3 text-center">
                      <span className="flex items-center justify-center gap-1">
                        <SoccerBall size={16} /> Palp.
                      </span>
                    </th>
                    <th className="px-4 py-3 text-center">% Aprov.</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {viewMode === "geral" ? (
                // Classificação Geral
                rankingData?.ranking.map((player, index) => {
                  const isCurrentUser = player.username === username;
                  const isPremium = player.plan === "premium" || player.plan === "vip";
                  return (
                    <tr
                      key={player.username}
                      className={`${getRowStyle(player.position, isCurrentUser, player.plan)} border-b border-paper transition-colors`}
                    >
                      <td className="px-4 py-4">
                        {getPositionDisplay(player.position)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${isCurrentUser ? "text-pitch-green" : "text-text-primary"}`}>
                            {player.username}
                          </span>
                          {/* Badge Premium - Diamante discreto */}
                          {isPremium && (
                            <Diamond size={14} weight="fill" className="text-amber-500" title="Premium" />
                          )}
                          {/* Número do Pioneiro */}
                          {player.pioneer_number && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-medium">
                              #{player.pioneer_number}
                            </span>
                          )}
                          {isCurrentUser && (
                            <span className="text-xs bg-pitch-green/20 text-pitch-green px-2 py-0.5 rounded-full font-medium">
                              Você
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          {rankingData.current_round}/{rankingData.total_rounds}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xl font-bold text-pitch-green">{player.total_points}</span>
                      </td>
                      <td className="px-4 py-4 text-center text-text-primary">{player.correct_results}</td>
                      <td className="px-4 py-4 text-center text-text-primary">{player.correct_home_goals}</td>
                      <td className="px-4 py-4 text-center text-text-primary">{player.correct_away_goals}</td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-semibold text-orange-500">{player.exact_scores}</span>
                      </td>
                      <td className="px-4 py-4 text-center text-text-primary">{player.total_predictions}</td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className={`font-semibold ${
                            player.efficiency >= 70 ? "text-green-600" :
                            player.efficiency >= 50 ? "text-yellow-600" : "text-red-500"
                          }`}>
                            {player.efficiency}%
                          </span>
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                player.efficiency >= 70 ? "bg-green-500" :
                                player.efficiency >= 50 ? "bg-yellow-500" : "bg-red-500"
                              }`}
                              style={{ width: `${player.efficiency}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                // Classificação Por Rodada
                roundRanking.length > 0 ? (
                  roundRanking.map((player, index) => {
                    const isCurrentUser = player.username === username;
                    const position = index + 1;
                    return (
                      <tr
                        key={player.username}
                        className={`${getRowStyle(position, isCurrentUser, "free")} border-b border-paper transition-colors`}
                      >
                        <td className="px-4 py-4">
                          {getPositionDisplay(position)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${isCurrentUser ? "text-pitch-green" : "text-text-primary"}`}>
                              {player.username}
                            </span>
                            {isCurrentUser && (
                              <span className="text-xs bg-pitch-green/20 text-pitch-green px-2 py-0.5 rounded-full font-medium">
                                Você
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-xl font-bold text-pitch-green">{player.points}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="font-semibold text-orange-500">{player.perfect_count || 0}</span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-text-secondary">
                      Nenhum palpite registrado nesta rodada ainda.
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legenda */}
      <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-paper">
        <h3 className="font-bold mb-3 flex items-center gap-2 text-text-primary">
          <ListNumbers size={20} className="text-pitch-green" />
          Legenda das Colunas
        </h3>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-secondary">
          <span><strong className="text-text-primary">Res.</strong> = Acertos V/E/D</span>
          <span><strong className="text-text-primary">Casa</strong> = Gols casa certos</span>
          <span><strong className="text-text-primary">Vis.</strong> = Gols visitante certos</span>
          <span><strong className="text-orange-500">Exato</strong> = Placares exatos</span>
          <span><strong className="text-text-primary">%</strong> = Pts ÷ (Jogos × 5)</span>
          <span><Diamond size={14} weight="fill" className="inline text-amber-500" /> = Usuário Premium</span>
        </div>
      </div>

      {/* Sistema de Pontuação */}
      <div className="bg-gradient-to-r from-pitch-green/5 to-emerald-50 rounded-xl p-4 border border-pitch-green/20">
        <h3 className="font-bold mb-3 text-text-primary">Sistema de Pontuação</h3>
        <div className="flex flex-wrap gap-3">
          <span className="px-3 py-1.5 bg-gray-100 rounded-full text-sm font-medium">
            <strong>3 pts</strong> = Resultado certo
          </span>
          <span className="px-3 py-1.5 bg-blue-100 rounded-full text-sm font-medium">
            <strong>+1 pt</strong> = Gols casa
          </span>
          <span className="px-3 py-1.5 bg-orange-100 rounded-full text-sm font-medium">
            <strong>+1 pt</strong> = Gols visitante
          </span>
          <span className="px-3 py-1.5 bg-yellow-100 rounded-full text-sm font-medium">
            <strong>5 pts</strong> = Placar exato!
          </span>
        </div>
        <div className="mt-3 pt-3 border-t border-pitch-green/20">
          <p className="text-sm text-text-secondary">
            <strong>Critérios de Desempate:</strong> 1º Total de placares exatos → 2º Acertos de resultado (V/E/D)
          </p>
        </div>
      </div>
    </div>
  );
}
