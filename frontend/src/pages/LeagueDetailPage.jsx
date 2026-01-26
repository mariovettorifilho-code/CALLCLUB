import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  Users, Trophy, Crown, ArrowLeft, Copy, Check, SignOut,
  SoccerBall, Target, Star, Fire, Eye, X
} from "@phosphor-icons/react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function LeagueDetailPage({ username }) {
  const { leagueId } = useParams();
  const navigate = useNavigate();
  
  const [league, setLeague] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaving, setLeaving] = useState(false);
  
  // Modal de palpites
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPredictions, setUserPredictions] = useState([]);
  const [loadingPredictions, setLoadingPredictions] = useState(false);

  useEffect(() => {
    loadLeagueData();
  }, [leagueId]);

  const loadLeagueData = async () => {
    try {
      const res = await axios.get(`${API}/leagues/${leagueId}`);
      setLeague(res.data.league);
      setRanking(res.data.ranking || []);
    } catch (err) {
      console.error("Erro ao carregar liga:", err);
      setError("Liga não encontrada");
    } finally {
      setLoading(false);
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

  const openUserPredictions = async (targetUsername) => {
    setSelectedUser(targetUsername);
    setLoadingPredictions(true);
    
    try {
      const res = await axios.get(`${API}/user-predictions/${targetUsername}?championship_id=${league.championship_id}`);
      setUserPredictions(res.data.predictions || []);
    } catch (err) {
      console.error("Erro ao carregar palpites:", err);
      setUserPredictions([]);
    } finally {
      setLoadingPredictions(false);
    }
  };

  const closeUserPredictions = () => {
    setSelectedUser(null);
    setUserPredictions([]);
  };

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
        
        <div className="flex items-start justify-between">
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
            <p className="text-sm font-semibold truncate">{league.championship_id}</p>
            <p className="text-xs text-white/70">Campeonato</p>
          </div>
        </div>
      </div>

      {/* Classificação da Liga */}
      <div className="bg-white rounded-2xl shadow-xl border-2 border-paper overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-500 to-amber-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Trophy size={24} weight="fill" />
            <h2 className="font-heading text-lg font-bold">Classificação da Liga</h2>
          </div>
          <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-semibold">
            Atualização em tempo real
          </span>
        </div>
        
        {ranking.length === 0 ? (
          <div className="text-center py-12">
            <SoccerBall size={48} className="text-text-secondary mx-auto mb-4" />
            <p className="text-text-secondary">
              Nenhum palpite ainda. Comece a palpitar!
            </p>
            <Link
              to="/predictions"
              className="inline-flex items-center gap-2 text-pitch-green font-semibold mt-4 hover:underline"
            >
              Fazer Palpites
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-paper">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Jogador
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Pts
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Exatos
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Jogos
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper">
                {ranking.map((player, index) => {
                  const isCurrentUser = player.username === username;
                  const isLeader = index === 0;
                  
                  return (
                    <tr 
                      key={player.username}
                      className={`transition-all ${
                        isCurrentUser 
                          ? "bg-pitch-green/10 border-l-4 border-pitch-green" 
                          : "hover:bg-paper"
                      }`}
                    >
                      <td className="px-4 py-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? "bg-yellow-400 text-yellow-900" :
                          index === 1 ? "bg-gray-300 text-gray-700" :
                          index === 2 ? "bg-amber-600 text-white" :
                          "bg-paper text-text-secondary"
                        }`}>
                          {player.position}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${
                            isCurrentUser ? "text-pitch-green" : "text-text-primary"
                          }`}>
                            {player.username}
                          </span>
                          {isCurrentUser && (
                            <span className="text-xs bg-pitch-green/20 text-pitch-green px-2 py-0.5 rounded-full">
                              você
                            </span>
                          )}
                          {isLeader && (
                            <Crown size={16} weight="fill" className="text-yellow-500" />
                          )}
                          {player.username === league.owner_username && (
                            <span className="text-xs text-yellow-600" title="Dono da liga">👑</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-bold text-text-primary text-lg">
                          {player.total_points}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Target size={14} className="text-orange-500" />
                          <span className="text-text-secondary">{player.exact_scores}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center text-text-secondary">
                        {player.total_predictions}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => openUserPredictions(player.username)}
                          data-testid={`view-predictions-${player.username}`}
                          className="inline-flex items-center gap-1 text-xs bg-paper hover:bg-gray-200 text-text-secondary px-3 py-1.5 rounded-lg transition-all"
                          title="Ver palpites"
                        >
                          <Eye size={14} />
                          Ver
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Botão Sair da Liga (se não for dono) */}
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

      {/* Modal de Palpites do Usuário */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-pitch-green to-emerald-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <Eye size={24} />
                <div>
                  <h3 className="font-heading font-bold">Palpites de {selectedUser}</h3>
                  <p className="text-white/80 text-sm">Apenas jogos finalizados são exibidos</p>
                </div>
              </div>
              <button
                onClick={closeUserPredictions}
                className="text-white/80 hover:text-white transition-all"
              >
                <X size={24} weight="bold" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loadingPredictions ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-pitch-green border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-text-secondary">Carregando palpites...</p>
                </div>
              ) : userPredictions.length === 0 ? (
                <div className="text-center py-8">
                  <SoccerBall size={48} className="text-text-secondary mx-auto mb-4" />
                  <p className="text-text-secondary">Nenhum palpite disponível para exibição</p>
                  <p className="text-xs text-text-secondary mt-2">
                    Palpites só aparecem após o jogo terminar
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userPredictions.map((pred, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-xl border-2 ${
                        pred.is_finished 
                          ? pred.points === 5 
                            ? "bg-green-50 border-green-200" 
                            : pred.points >= 3 
                              ? "bg-yellow-50 border-yellow-200"
                              : pred.points > 0
                                ? "bg-blue-50 border-blue-200"
                                : "bg-gray-50 border-gray-200"
                          : "bg-paper border-paper"
                      }`}
                    >
                      {pred.is_finished ? (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-sm text-text-secondary mb-1">
                              <span>Rodada {pred.round_number}</span>
                              {pred.points === 5 && (
                                <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                  <Star size={10} weight="fill" />
                                  EXATO
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-text-primary">
                                {pred.home_team}
                              </span>
                              <span className="font-bold text-pitch-green">
                                {pred.home_prediction} x {pred.away_prediction}
                              </span>
                              <span className="font-semibold text-text-primary">
                                {pred.away_team}
                              </span>
                            </div>
                            <div className="text-xs text-text-secondary mt-1">
                              Resultado: {pred.home_score} x {pred.away_score}
                            </div>
                          </div>
                          <div className={`text-2xl font-bold ${
                            pred.points === 5 ? "text-green-600" :
                            pred.points >= 3 ? "text-yellow-600" :
                            pred.points > 0 ? "text-blue-600" : "text-gray-400"
                          }`}>
                            +{pred.points || 0}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-text-secondary text-sm">Rodada {pred.round_number}</p>
                            <p className="font-semibold text-text-primary">
                              {pred.home_team} x {pred.away_team}
                            </p>
                          </div>
                          <span className="bg-paper text-text-secondary px-3 py-1 rounded-full text-sm font-semibold">
                            Oculto
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
