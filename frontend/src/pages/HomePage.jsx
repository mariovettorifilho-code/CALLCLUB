import { useState, useEffect } from "react";
import axios from "axios";
import { Trophy, Fire, TrendUp } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function HomePage({ username }) {
  const [currentRound, setCurrentRound] = useState(null);
  const [topPlayers, setTopPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [roundRes, rankingRes] = await Promise.all([
        axios.get(`${API}/rounds/current`),
        axios.get(`${API}/ranking/general`)
      ]);

      setCurrentRound(roundRes.data);
      setTopPlayers(rankingRes.data.slice(0, 5));
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pitch-green border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-text-secondary">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-pitch-green to-pitch-green/80 rounded-2xl p-8 text-bone shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <Fire size={32} weight="fill" className="text-terracotta" />
          <h1 className="font-heading text-3xl md:text-4xl font-bold">
            Bem-vindo, {username}!
          </h1>
        </div>
        <p className="text-bone/90 text-lg mb-6">
          Rodada {currentRound?.round_number || 1} do Campeonato Carioca 2026 está aberta para palpites!
        </p>
        <Link
          to="/predictions"
          data-testid="make-predictions-button"
          className="inline-flex items-center gap-2 bg-terracotta text-bone px-6 py-3 rounded-lg font-semibold hover:bg-terracotta/90 transition-all transform hover:scale-105 active:scale-95"
        >
          <Trophy size={20} weight="fill" />
          Fazer Palpites
        </Link>
      </div>

      {/* Top 5 Players */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-paper">
        <div className="flex items-center gap-2 mb-6">
          <TrendUp size={24} weight="bold" className="text-pitch-green" />
          <h2 className="font-heading text-2xl font-bold text-text-primary">
            Top 5 Palpiteiros
          </h2>
        </div>

        {topPlayers.length === 0 ? (
          <p className="text-text-secondary text-center py-8">
            Nenhum ranking disponível ainda. Seja o primeiro a palpitar!
          </p>
        ) : (
          <div className="space-y-3">
            {topPlayers.map((player, index) => (
              <div
                key={player.username}
                data-testid={`top-player-${index + 1}`}
                className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                  index === 0
                    ? "bg-warning/20 border-2 border-warning"
                    : index === 1
                    ? "bg-text-secondary/10 border-2 border-text-secondary"
                    : index === 2
                    ? "bg-terracotta/10 border-2 border-terracotta"
                    : "bg-paper"
                }`}
              >
                <div className={`font-mono text-2xl font-bold ${
                  index === 0 ? "text-warning" : 
                  index === 1 ? "text-text-secondary" :
                  index === 2 ? "text-terracotta" : "text-text-primary"
                }`}>
                  #{index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-text-primary">{player.username}</p>
                  <p className="text-sm text-text-secondary">
                    Sequência: {player.max_perfect_streak || 0} acertos perfeitos
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xl font-bold text-pitch-green">
                    {player.total_points || 0} pts
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <Link
          to="/rankings"
          data-testid="view-full-ranking"
          className="mt-6 block text-center text-pitch-green font-semibold hover:underline"
        >
          Ver Ranking Completo →
        </Link>
      </div>

      {/* Info Box */}
      <div className="bg-paper rounded-lg p-6 border-2 border-paper">
        <h3 className="font-heading text-lg font-bold text-text-primary mb-3">
          Como Funciona
        </h3>
        <ul className="space-y-2 text-sm text-text-secondary">
          <li className="flex items-start gap-2">
            <span className="text-pitch-green font-bold">3 pts</span>
            <span>Acertar o resultado (vitória, empate ou derrota)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-pitch-green font-bold">+1 pt</span>
            <span>Acertar gols do time da casa</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-pitch-green font-bold">+1 pt</span>
            <span>Acertar gols do time visitante</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-terracotta font-bold">5 pts</span>
            <span className="font-semibold">Acerto perfeito (placar exato + resultado)!</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
