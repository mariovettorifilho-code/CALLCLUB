import { useState, useEffect } from "react";
import axios from "axios";
import { X, Lock, Trophy, Eye, EyeSlash, SoccerBall, Check, XCircle } from "@phosphor-icons/react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function UserPredictionsModal({ 
  isOpen, 
  onClose, 
  targetUsername, 
  championshipId,
  currentUsername 
}) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, finished: 0, points: 0, exacts: 0 });

  useEffect(() => {
    if (isOpen && targetUsername) {
      loadPredictions();
    }
  }, [isOpen, targetUsername, championshipId]);

  const loadPredictions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/predictions/${targetUsername}/public?championship_id=${championshipId}`);
      setPredictions(res.data || []);
      
      // Calcula estatísticas
      const finished = res.data.filter(p => p.is_finished);
      const totalPoints = finished.reduce((sum, p) => sum + (p.points || 0), 0);
      const exacts = finished.filter(p => p.points === 5).length;
      
      setStats({
        total: res.data.length,
        finished: finished.length,
        points: totalPoints,
        exacts
      });
    } catch (error) {
      console.error("Erro ao carregar palpites:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPointsColor = (points) => {
    if (points === 5) return "text-green-600 bg-green-100";
    if (points >= 3) return "text-yellow-600 bg-yellow-100";
    if (points > 0) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  };

  const getPointsLabel = (points) => {
    if (points === 5) return "Exato!";
    if (points === 4) return "Quase";
    if (points === 3) return "Resultado";
    if (points > 0) return "Parcial";
    return "Errou";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-pitch-green to-emerald-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Eye size={24} weight="fill" />
                Palpites de {targetUsername}
              </h2>
              <p className="text-white/80 text-sm mt-1">
                {currentUsername === targetUsername ? "Seus palpites" : "Visíveis apenas após o jogo"}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Stats */}
          <div className="flex gap-4 mt-4">
            <div className="bg-white/20 rounded-lg px-3 py-2 text-center">
              <p className="text-2xl font-bold">{stats.points}</p>
              <p className="text-xs text-white/80">Pontos</p>
            </div>
            <div className="bg-white/20 rounded-lg px-3 py-2 text-center">
              <p className="text-2xl font-bold">{stats.exacts}</p>
              <p className="text-xs text-white/80">Exatos</p>
            </div>
            <div className="bg-white/20 rounded-lg px-3 py-2 text-center">
              <p className="text-2xl font-bold">{stats.finished}/{stats.total}</p>
              <p className="text-xs text-white/80">Finalizados</p>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto max-h-[55vh] p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-pitch-green border-t-transparent rounded-full"></div>
            </div>
          ) : predictions.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <SoccerBall size={48} className="mx-auto mb-2 opacity-30" />
              <p>Nenhum palpite encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Agrupa por rodada */}
              {Object.entries(
                predictions.reduce((acc, pred) => {
                  const round = pred.round_number || 0;
                  if (!acc[round]) acc[round] = [];
                  acc[round].push(pred);
                  return acc;
                }, {})
              ).map(([round, roundPredictions]) => (
                <div key={round}>
                  <h3 className="text-sm font-semibold text-text-secondary mb-2 px-2">
                    Rodada {round}
                  </h3>
                  <div className="space-y-2">
                    {roundPredictions.map((pred) => (
                      <div 
                        key={pred.match_id}
                        className={`rounded-xl p-4 border-2 transition-all ${
                          pred.is_visible 
                            ? "bg-white border-paper" 
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        {pred.is_visible ? (
                          // Jogo finalizado - mostra tudo
                          <div className="flex items-center gap-3">
                            {/* Times */}
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {pred.home_badge && (
                                    <img src={pred.home_badge} alt="" className="w-6 h-6 object-contain" />
                                  )}
                                  <span className="font-medium text-sm">{pred.home_team}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{pred.away_team}</span>
                                  {pred.away_badge && (
                                    <img src={pred.away_badge} alt="" className="w-6 h-6 object-contain" />
                                  )}
                                </div>
                              </div>
                              
                              {/* Placares */}
                              <div className="flex items-center justify-center gap-4 text-sm">
                                <div className="text-center">
                                  <p className="text-xs text-text-secondary mb-1">Real</p>
                                  <p className="font-bold text-lg">
                                    {pred.home_score} - {pred.away_score}
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-text-secondary mb-1">Palpite</p>
                                  <p className={`font-bold text-lg ${
                                    pred.home_prediction === pred.home_score && 
                                    pred.away_prediction === pred.away_score
                                      ? "text-green-600"
                                      : "text-text-primary"
                                  }`}>
                                    {pred.home_prediction} - {pred.away_prediction}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Pontos */}
                            <div className={`px-3 py-2 rounded-lg text-center min-w-[70px] ${getPointsColor(pred.points)}`}>
                              <p className="text-xl font-bold">{pred.points}</p>
                              <p className="text-xs font-medium">{getPointsLabel(pred.points)}</p>
                            </div>
                          </div>
                        ) : (
                          // Jogo não finalizado - oculto
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {pred.home_badge && (
                                <img src={pred.home_badge} alt="" className="w-6 h-6 object-contain opacity-50" />
                              )}
                              <span className="text-text-secondary">{pred.home_team}</span>
                              <span className="text-text-secondary mx-2">vs</span>
                              <span className="text-text-secondary">{pred.away_team}</span>
                              {pred.away_badge && (
                                <img src={pred.away_badge} alt="" className="w-6 h-6 object-contain opacity-50" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                              <Lock size={16} weight="fill" />
                              <span className="text-sm">Oculto</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t border-paper px-6 py-4 bg-gray-50">
          <p className="text-xs text-text-secondary text-center">
            <Lock size={12} className="inline mr-1" />
            Palpites de jogos não finalizados ficam ocultos para outros usuários
          </p>
        </div>
      </div>
    </div>
  );
}
