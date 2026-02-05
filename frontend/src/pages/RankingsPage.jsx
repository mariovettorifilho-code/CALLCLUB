import { useState, useEffect } from "react";
import axios from "axios";
import { ChartBar, Trophy, Star, SoccerBall, Percent, GlobeHemisphereWest, Diamond, Target, ListNumbers, Eye } from "@phosphor-icons/react";
import UserPredictionsModal from "../components/UserPredictionsModal";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function RankingsPage({ username }) {
  const [championships, setChampionships] = useState([]);
  const [selectedChampionship, setSelectedChampionship] = useState("brasileirao");
  const [rankingData, setRankingData] = useState(null);
  const [roundRanking, setRoundRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Visão selecionada (geral ou rodada)
  const [viewMode, setViewMode] = useState("geral");
  const [selectedRound, setSelectedRound] = useState(1);
  
  // Modal de palpites do usuário
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const openUserModal = (targetUsername) => {
    setSelectedUser(targetUsername);
    setModalOpen(true);
  };

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
      // Usa endpoint de campeonatos OFICIAIS apenas (sem ligas)
      const res = await axios.get(`${API}/user/${username}/official-championships`);
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

  const getRowStyle = (position, isCurrentUser) => {
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

  // Dados a exibir (geral ou por rodada)
  const displayData = viewMode === "geral" ? rankingData?.ranking : roundRanking;

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

        {/* Championship Selector - APENAS campeonatos oficiais */}
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
              {champ.access_type === "national" ? "🏠" : "⭐"}
              <span className="hidden sm:inline">{champ.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabs: Geral vs Por Rodada */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-paper overflow-hidden">
        <div className="flex border-b-2 border-paper">
          <button
            onClick={() => setViewMode("geral")}
            data-testid="tab-geral"
            className={`flex-1 px-6 py-4 font-semibold text-center transition-all flex items-center justify-center gap-2 ${
              viewMode === "geral"
                ? "bg-pitch-green text-white"
                : "bg-white text-text-secondary hover:bg-gray-50"
            }`}
          >
            <ChartBar size={20} weight={viewMode === "geral" ? "fill" : "regular"} />
            <span className="hidden sm:inline">Classificação</span> Geral
          </button>
          <button
            onClick={() => setViewMode("rodada")}
            data-testid="tab-rodada"
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
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-green-200">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="text-center">
                <p className="text-xs text-text-secondary">Rodada</p>
                <p className="text-xl sm:text-2xl font-bold text-text-primary">{rankingData.current_round}</p>
              </div>
              <div className="text-center hidden sm:block">
                <p className="text-xs text-text-secondary">Total</p>
                <p className="text-2xl font-bold text-text-primary">{rankingData.total_rounds}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-text-secondary">Participantes</p>
                <p className="text-xl sm:text-2xl font-bold text-text-primary">{rankingData.ranking.length}</p>
              </div>
            </div>
            
            {/* Seletor de Rodada (só aparece no modo rodada) */}
            {viewMode === "rodada" && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-text-secondary">Rodada:</label>
                <select
                  value={selectedRound}
                  onChange={(e) => setSelectedRound(parseInt(e.target.value))}
                  data-testid="round-selector"
                  className="px-3 py-2 rounded-lg border-2 border-green-300 bg-white font-semibold text-pitch-green focus:outline-none focus:ring-2 focus:ring-pitch-green"
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
              <tr className="bg-pitch-green text-white text-sm">
                <th className="px-3 py-3 text-left">Pos.</th>
                <th className="px-3 py-3 text-left">Palpiteiro</th>
                <th className="px-3 py-3 text-center">
                  <span className="flex items-center justify-center gap-1">
                    <Trophy size={14} weight="fill" /> Pts
                  </span>
                </th>
                <th className="px-3 py-3 text-center hidden sm:table-cell">Res.</th>
                <th className="px-3 py-3 text-center hidden md:table-cell">Casa</th>
                <th className="px-3 py-3 text-center hidden md:table-cell">Vis.</th>
                <th className="px-3 py-3 text-center">Exato</th>
                <th className="px-3 py-3 text-center hidden sm:table-cell">Palp.</th>
                <th className="px-3 py-3 text-center hidden lg:table-cell">%</th>
              </tr>
            </thead>
            <tbody>
              {displayData && displayData.length > 0 ? (
                displayData.map((player, index) => {
                  const isCurrentUser = player.username === username;
                  const isPremium = player.plan === "premium" || player.plan === "vip";
                  const position = player.position;
                  
                  // Verifica se há empate de pontos com o jogador anterior
                  const prevPlayer = index > 0 ? displayData[index - 1] : null;
                  const hasTie = prevPlayer && prevPlayer.total_points === player.total_points;
                  
                  return (
                    <tr
                      key={player.username}
                      className={`${getRowStyle(position, isCurrentUser)} border-b border-paper transition-colors`}
                    >
                      {/* Posição + Variação */}
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-1">
                          <span className={`text-lg font-bold ${
                            position === 1 ? "text-yellow-600" :
                            position === 2 ? "text-gray-500" :
                            position === 3 ? "text-amber-700" :
                            "text-text-secondary"
                          }`}>
                            {hasTie ? "" : `${position}º`}
                          </span>
                          {/* Variação de posição */}
                          {player.position_change !== 0 && player.position_change !== undefined && (
                            <span className={`text-xs font-bold ml-1 ${
                              player.position_change > 0 ? "text-green-600" : "text-red-600"
                            }`}>
                              {player.position_change > 0 ? `↑${player.position_change}` : `↓${Math.abs(player.position_change)}`}
                            </span>
                          )}
                          {player.position_change === 0 && player.previous_position && (
                            <span className="text-xs text-gray-400 ml-1">■</span>
                          )}
                        </div>
                      </td>
                      
                      {/* Nome do usuário - clicável para ver palpites */}
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openUserModal(player.username)}
                            className={`font-semibold hover:underline flex items-center gap-1 ${isCurrentUser ? "text-pitch-green" : "text-text-primary"}`}
                            title="Ver palpites"
                          >
                            {player.username}
                            <Eye size={14} className="opacity-50" />
                          </button>
                          {/* Badge Premium - Diamante com tooltip */}
                          {isPremium && (
                            <span title="Usuário Premium" className="cursor-help">
                              <Diamond size={14} weight="fill" className="text-amber-500" />
                            </span>
                          )}
                          {isCurrentUser && (
                            <span className="text-xs bg-pitch-green/20 text-pitch-green px-2 py-0.5 rounded-full font-medium">
                              Você
                            </span>
                          )}
                        </div>
                      </td>
                      
                      {/* Pontos */}
                      <td className="px-3 py-4 text-center">
                        <span className="text-lg font-bold text-pitch-green">
                          {player.total_points || player.points || 0}
                        </span>
                      </td>
                      
                      {/* Resultados */}
                      <td className="px-3 py-4 text-center text-text-primary hidden sm:table-cell">
                        {player.correct_results || 0}
                      </td>
                      
                      {/* Gols Casa */}
                      <td className="px-3 py-4 text-center text-text-primary hidden md:table-cell">
                        {player.correct_home_goals || 0}
                      </td>
                      
                      {/* Gols Visitante */}
                      <td className="px-3 py-4 text-center text-text-primary hidden md:table-cell">
                        {player.correct_away_goals || 0}
                      </td>
                      
                      {/* Placares Exatos */}
                      <td className="px-3 py-4 text-center">
                        <span className="font-semibold text-orange-500">
                          {player.exact_scores || 0}
                        </span>
                      </td>
                      
                      {/* Total Palpites */}
                      <td className="px-3 py-4 text-center text-text-primary hidden sm:table-cell">
                        {player.total_predictions || 0}
                      </td>
                      
                      {/* Aproveitamento */}
                      <td className="px-3 py-4 text-center hidden lg:table-cell">
                        <div className="flex items-center justify-center gap-2">
                          <span className={`font-semibold text-sm ${
                            (player.efficiency || 0) >= 70 ? "text-green-600" :
                            (player.efficiency || 0) >= 50 ? "text-yellow-600" : "text-red-500"
                          }`}>
                            {player.efficiency || 0}%
                          </span>
                          <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden hidden xl:block">
                            <div 
                              className={`h-full rounded-full ${
                                (player.efficiency || 0) >= 70 ? "bg-green-500" :
                                (player.efficiency || 0) >= 50 ? "bg-yellow-500" : "bg-red-500"
                              }`}
                              style={{ width: `${player.efficiency || 0}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-text-secondary">
                    {viewMode === "rodada" 
                      ? "Nenhum palpite registrado nesta rodada ainda."
                      : "Nenhum participante ainda."}
                  </td>
                </tr>
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
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs sm:text-sm text-text-secondary">
          <span><strong className="text-text-primary">Res.</strong> = V/E/D</span>
          <span><strong className="text-text-primary">Casa</strong> = Gols mandante</span>
          <span><strong className="text-text-primary">Vis.</strong> = Gols visitante</span>
          <span><strong className="text-orange-500">Exato</strong> = Placares exatos</span>
          <span><strong className="text-text-primary">%</strong> = Aproveitamento</span>
          <span className="flex items-center gap-1">
            <Diamond size={12} weight="fill" className="text-amber-500" /> = Premium
          </span>
        </div>
      </div>

      {/* Sistema de Pontuação */}
      <div className="bg-gradient-to-r from-pitch-green/5 to-emerald-50 rounded-xl p-4 border border-pitch-green/20">
        <h3 className="font-bold mb-3 text-text-primary text-sm">Sistema de Pontuação</h3>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">
            <strong>3 pts</strong> = Resultado
          </span>
          <span className="px-2 py-1 bg-blue-100 rounded-full text-xs font-medium">
            <strong>+1</strong> = Gols casa
          </span>
          <span className="px-2 py-1 bg-orange-100 rounded-full text-xs font-medium">
            <strong>+1</strong> = Gols visitante
          </span>
          <span className="px-2 py-1 bg-yellow-100 rounded-full text-xs font-medium">
            <strong>5 pts</strong> = Exato!
          </span>
        </div>
        <p className="text-xs text-text-secondary mt-2">
          <strong>Desempate:</strong> 1º Placares exatos → 2º Acertos de resultado
        </p>
      </div>
      
      {/* Modal de Palpites do Usuário */}
      <UserPredictionsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        targetUsername={selectedUser}
        championshipId={selectedChampionship}
        currentUsername={username}
      />
    </div>
  );
}
