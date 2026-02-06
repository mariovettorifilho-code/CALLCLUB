import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  Users, Trophy, Crown, ArrowLeft, Copy, Check, SignOut,
  SoccerBall, Target, ChartBar, Diamond, Eye, X
} from "@phosphor-icons/react";
import UserPredictionsModal from "../components/UserPredictionsModal";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function LeagueDetailPage({ username }) {
  const { leagueId } = useParams();
  const navigate = useNavigate();
  
  const [league, setLeague] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [roundRanking, setRoundRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaving, setLeaving] = useState(false);
  
  // Tabs Geral/Por Rodada (igual ao FREE)
  const [viewMode, setViewMode] = useState("geral");
  const [selectedRound, setSelectedRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(38);
  const [currentRound, setCurrentRound] = useState(1);
  
  // Modal de palpites
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadLeagueData();
  }, [leagueId]);

  useEffect(() => {
    if (viewMode === "rodada" && league) {
      loadRoundRanking();
    }
  }, [viewMode, selectedRound, league]);

  const loadLeagueData = async () => {
    try {
      const res = await axios.get(`${API}/leagues/${leagueId}`);
      setLeague(res.data.league);
      setRanking(res.data.ranking || []);
      
      // Busca info do campeonato para total de rodadas
      if (res.data.league?.championship_id) {
        try {
          const champRes = await axios.get(`${API}/championships/${res.data.league.championship_id}`);
          setTotalRounds(champRes.data?.total_rounds || 38);
          
          const roundRes = await axios.get(`${API}/rounds/current?championship_id=${res.data.league.championship_id}`);
          setCurrentRound(roundRes.data?.round_number || 1);
          setSelectedRound(roundRes.data?.round_number || 1);
        } catch (e) {
          console.error("Erro ao buscar info do campeonato:", e);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar liga:", err);
      setError("Liga não encontrada");
    } finally {
      setLoading(false);
    }
  };

  const loadRoundRanking = async () => {
    if (!league?.championship_id) return;
    
    try {
      // Busca ranking da rodada filtrado pelos membros da liga
      const res = await axios.get(`${API}/ranking/round/${selectedRound}?championship_id=${league.championship_id}`);
      
      // Filtra apenas membros da liga
      const members = league.members || [];
      const filtered = (res.data || [])
        .filter(player => members.includes(player.username))
        .map((player, index) => ({ ...player, position: index + 1 }));
      
      setRoundRanking(filtered);
    } catch (error) {
      console.error("Erro ao carregar ranking da rodada:", error);
    }
  };

  const copyInviteCode = () => {
    if (league?.invite_code) {
      navigator.clipboard.writeText(league.invite_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleLeaveLeague = async () => {
    setLeaving(true);
    try {
      await axios.post(`${API}/leagues/${leagueId}/leave?username=${username}`);
      navigate("/leagues");
    } catch (err) {
      console.error("Erro ao sair da liga:", err);
      alert("Não foi possível sair da liga");
    } finally {
      setLeaving(false);
      setShowLeaveModal(false);
    }
  };

  const openUserModal = (targetUsername) => {
    setSelectedUser(targetUsername);
    setModalOpen(true);
  };

  const getRowStyle = (position, isCurrentUser) => {
    if (isCurrentUser) return "bg-pitch-green/10 border-l-4 border-l-pitch-green";
    if (position === 1) return "bg-gradient-to-r from-yellow-50 to-amber-50";
    if (position === 2) return "bg-gradient-to-r from-gray-50 to-slate-50";
    if (position === 3) return "bg-gradient-to-r from-orange-50 to-amber-50";
    return "bg-white hover:bg-gray-50";
  };

  // Gera lista de rodadas
  const roundOptions = [];
  for (let i = 1; i <= totalRounds; i++) {
    roundOptions.push(i);
  }

  // Dados a exibir
  const displayData = viewMode === "geral" ? ranking : roundRanking;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pitch-green border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-text-secondary">Carregando liga...</p>
        </div>
      </div>
    );
  }

  if (error || !league) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <X size={40} className="text-red-500" weight="bold" />
        </div>
        <h2 className="font-heading text-xl font-bold text-text-primary mb-2">
          {error || "Liga não encontrada"}
        </h2>
        <Link 
          to="/leagues"
          className="inline-flex items-center gap-2 text-pitch-green font-semibold hover:underline mt-4"
        >
          <ArrowLeft size={20} />
          Voltar para Ligas
        </Link>
      </div>
    );
  }

  const isOwner = league.owner_username === username;
  const isMember = league.members?.includes(username);
  const userPosition = ranking.findIndex(r => r.username === username) + 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-pitch-green to-emerald-700 rounded-2xl p-6 text-white shadow-xl">
        <Link 
          to="/leagues" 
          className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-all"
        >
          <ArrowLeft size={20} />
          Voltar para Ligas
        </Link>
        
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-heading text-2xl md:text-3xl font-bold">{league.name}</h1>
              {isOwner && (
                <span className="bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                  <Crown size={12} weight="fill" />
                  Dono
                </span>
              )}
            </div>
            <p className="text-white/80">
              {league.members?.length || 0} membros • Criada por {league.owner_username}
            </p>
          </div>
          
          {/* Código de convite */}
          <button
            onClick={copyInviteCode}
            data-testid="copy-invite-code"
            className="bg-white/20 backdrop-blur px-4 py-2 rounded-xl hover:bg-white/30 transition-all flex items-center gap-2"
          >
            {copiedCode ? (
              <>
                <Check size={18} weight="bold" />
                <span className="font-semibold">Copiado!</span>
              </>
            ) : (
              <>
                <Copy size={18} />
                <span className="font-mono font-bold">{league.invite_code}</span>
              </>
            )}
          </button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
            <Users size={24} className="mx-auto mb-2 text-white/80" />
            <p className="text-2xl font-bold">{league.members?.length || 0}</p>
            <p className="text-xs text-white/70">Membros</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
            <Trophy size={24} weight="fill" className="mx-auto mb-2 text-yellow-300" />
            <p className="text-2xl font-bold">#{userPosition || '-'}</p>
            <p className="text-xs text-white/70">Sua Posição</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
            <SoccerBall size={24} className="mx-auto mb-2 text-white/80" />
            <p className="text-sm font-semibold">Rodada {currentRound}</p>
            <p className="text-xs text-white/70">Atual</p>
          </div>
        </div>
      </div>

      {/* Classificação da Liga - MESMO PADRÃO DO FREE */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-paper overflow-hidden">
        {/* Tabs: Geral vs Por Rodada */}
        <div className="flex border-b-2 border-paper">
          <button
            onClick={() => setViewMode("geral")}
            data-testid="tab-geral-liga"
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
            data-testid="tab-rodada-liga"
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
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-green-200">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="text-center">
              <p className="text-xs text-text-secondary">Rodada</p>
              <p className="text-xl sm:text-2xl font-bold text-text-primary">{currentRound}</p>
            </div>
            <div className="text-center hidden sm:block">
              <p className="text-xs text-text-secondary">Total</p>
              <p className="text-2xl font-bold text-text-primary">{totalRounds}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-text-secondary">Participantes</p>
              <p className="text-xl sm:text-2xl font-bold text-text-primary">{league.members?.length || 0}</p>
            </div>
          </div>
          
          {/* Seletor de Rodada */}
          {viewMode === "rodada" && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-text-secondary">Rodada:</label>
              <select
                value={selectedRound}
                onChange={(e) => setSelectedRound(parseInt(e.target.value))}
                data-testid="round-selector-liga"
                className="px-3 py-2 rounded-lg border-2 border-green-300 bg-white font-semibold text-pitch-green focus:outline-none focus:ring-2 focus:ring-pitch-green"
              >
                {roundOptions.map(r => (
                  <option key={r} value={r}>
                    {r}{r === currentRound ? " (Atual)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tabela de Classificação - MESMAS COLUNAS DO FREE */}
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
                  const isLeagueOwner = player.username === league.owner_username;
                  const position = player.position;
                  
                  // Verifica se há empate de pontos com o jogador anterior
                  const prevPlayer = index > 0 ? displayData[index - 1] : null;
                  const hasTie = prevPlayer && prevPlayer.total_points === player.total_points;
                  
                  return (
                    <tr
                      key={player.username}
                      className={`${getRowStyle(position, isCurrentUser)} border-b border-paper transition-colors`}
                    >
                      {/* Posição - sem variação aqui */}
                      <td className="px-3 py-4">
                        <span className={`text-lg font-bold ${
                          position === 1 ? "text-yellow-600" :
                          position === 2 ? "text-gray-500" :
                          position === 3 ? "text-amber-700" :
                          "text-text-secondary"
                        }`}>
                          {hasTie ? "" : `${position}º`}
                        </span>
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
                          {isLeagueOwner && (
                            <span title="Dono da Liga" className="cursor-help">
                              <Crown size={14} weight="fill" className="text-yellow-500" />
                            </span>
                          )}
                          {isCurrentUser && (
                            <span className="text-xs bg-pitch-green/20 text-pitch-green px-2 py-0.5 rounded-full font-medium">
                              Você
                            </span>
                          )}
                        </div>
                      </td>
                      
                      {/* Pontos + Variação de posição */}
                      <td className="px-3 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-lg font-bold text-pitch-green">
                            {player.total_points || player.points || 0}
                          </span>
                          {/* Variação de posição ao lado dos pontos */}
                          {player.position_change !== 0 && player.position_change !== undefined && (
                            <span className={`text-xs font-bold ${
                              player.position_change > 0 ? "text-green-500" : "text-red-500"
                            }`}>
                              {player.position_change > 0 ? `↑${player.position_change}` : `↓${Math.abs(player.position_change)}`}
                            </span>
                          )}
                          {player.position_change === 0 && player.previous_position && (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>
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
                      : "Nenhum participante com palpites ainda."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legenda das Colunas */}
      <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-paper">
        <div className="flex items-center gap-2 mb-2 text-text-secondary">
          <span className="text-sm font-semibold">📊 Legenda das Colunas</span>
        </div>
        <p className="text-xs text-text-secondary">
          <strong>Res.</strong> = V/E/D &nbsp;
          <strong>Casa</strong> = Gols mandante &nbsp;
          <strong>Vis.</strong> = Gols visitante &nbsp;
          <span className="text-orange-500"><strong>Exato</strong></span> = Placares exatos &nbsp;
          <strong>%</strong> = Aproveitamento
        </p>
      </div>

      {/* Botão Sair da Liga */}
      {isMember && !isOwner && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowLeaveModal(true)}
            data-testid="btn-leave-league"
            className="inline-flex items-center gap-2 text-red-500 hover:text-red-600 font-semibold transition-all"
          >
            <SignOut size={20} />
            Sair da Liga
          </button>
        </div>
      )}

      {/* Modal Confirmar Saída */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <SignOut size={32} className="text-red-500" />
              </div>
              <h3 className="font-heading text-xl font-bold text-text-primary">
                Sair da Liga?
              </h3>
              <p className="text-text-secondary mt-2">
                Tem certeza que deseja sair de <strong>{league.name}</strong>? 
                Você poderá entrar novamente usando o código de convite.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="flex-1 bg-paper text-text-primary py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleLeaveLeague}
                disabled={leaving}
                data-testid="confirm-leave-league"
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {leaving ? (
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <>
                    <SignOut size={20} />
                    Sair
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Palpites do Usuário - Reutilizando componente do FREE */}
      <UserPredictionsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        targetUsername={selectedUser}
        championshipId={league?.championship_id}
      />
    </div>
  );
}
