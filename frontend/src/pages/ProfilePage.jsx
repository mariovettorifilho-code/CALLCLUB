import { useState, useEffect } from "react";
import axios from "axios";
import { User, Trophy, Fire, ChartBar } from "@phosphor-icons/react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ProfilePage({ username }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [username]);

  const loadData = async () => {
    try {
      const response = await axios.get(`${API}/user/${username}`);
      setUserData(response.data);
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20">Carregando perfil...</div>;
  }

  if (!userData) {
    return <div className="text-center py-20 text-text-secondary">Perfil não encontrado</div>;
  }

  const user = userData.user;
  const totalPredictions = userData.total_predictions || 0;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-pitch-green to-pitch-green/80 rounded-2xl p-8 text-bone shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-bone/20 rounded-full flex items-center justify-center">
            <User size={40} weight="fill" className="text-bone" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold">{user.username}</h1>
            <p className="text-bone/80">Membro do CallClub</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-bone/10 backdrop-blur rounded-lg p-4 text-center">
            <Trophy size={28} weight="fill" className="mx-auto mb-2 text-terracotta" />
            <p className="text-2xl font-mono font-bold">{user.total_points || 0}</p>
            <p className="text-xs text-bone/80">Pontos Totais</p>
          </div>

          <div className="bg-bone/10 backdrop-blur rounded-lg p-4 text-center">
            <Fire size={28} weight="fill" className="mx-auto mb-2 text-warning" />
            <p className="text-2xl font-mono font-bold">{user.max_perfect_streak || 0}</p>
            <p className="text-xs text-bone/80">Sequência Máxima</p>
          </div>

          <div className="bg-bone/10 backdrop-blur rounded-lg p-4 text-center">
            <ChartBar size={28} weight="fill" className="mx-auto mb-2 text-bone" />
            <p className="text-2xl font-mono font-bold">{totalPredictions}</p>
            <p className="text-xs text-bone/80">Palpites Feitos</p>
          </div>
        </div>
      </div>

      {/* Recent Predictions */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-paper">
        <h2 className="font-heading text-2xl font-bold text-text-primary mb-4">
          Histórico Recente
        </h2>

        {userData.predictions.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            Você ainda não fez nenhum palpite. Comece agora!
          </div>
        ) : (
          <div className="space-y-3">
            {userData.predictions.slice(0, 10).map((pred, index) => (
              <div
                key={index}
                data-testid={`prediction-${index}`}
                className="flex items-center justify-between p-4 bg-paper rounded-lg"
              >
                <div>
                  <p className="text-sm text-text-secondary">
                    Rodada {pred.round_number} - Jogo #{pred.match_id}
                  </p>
                  <p className="font-mono font-bold text-text-primary">
                    {pred.home_prediction} × {pred.away_prediction}
                  </p>
                </div>
                <div className="text-right">
                  {pred.points !== null && pred.points !== undefined ? (
                    <div>
                      <p className={`font-mono text-xl font-bold ${
                        pred.points === 5 ? "text-terracotta" :
                        pred.points >= 3 ? "text-success" :
                        pred.points > 0 ? "text-warning" : "text-text-secondary"
                      }`}>
                        {pred.points} pts
                      </p>
                      {pred.points === 5 && (
                        <p className="text-xs text-terracotta">Perfeito!</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-text-secondary">Aguardando</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-paper">
        <h2 className="font-heading text-2xl font-bold text-text-primary mb-4">
          Estatísticas
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-paper rounded-lg">
            <p className="text-sm text-text-secondary mb-1">Sequência Atual</p>
            <p className="text-2xl font-bold text-pitch-green">
              {user.perfect_streak || 0}
            </p>
          </div>
          <div className="p-4 bg-paper rounded-lg">
            <p className="text-sm text-text-secondary mb-1">Média por Rodada</p>
            <p className="text-2xl font-bold text-pitch-green">
              {totalPredictions > 0 ? (user.total_points / totalPredictions * 10).toFixed(1) : "0.0"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
