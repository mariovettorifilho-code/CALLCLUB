import { useState, useEffect } from "react";
import axios from "axios";
import { Trophy, Fire, TrendUp, Clock, CalendarBlank, Timer, SoccerBall } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function HomePage({ username }) {
  const [championships, setChampionships] = useState([]);
  const [selectedChampionship, setSelectedChampionship] = useState("carioca");
  const [currentRound, setCurrentRound] = useState(null);
  const [topPlayers, setTopPlayers] = useState([]);
  const [nextMatch, setNextMatch] = useState(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChampionships();
  }, []);

  useEffect(() => {
    if (selectedChampionship) {
      loadData();
    }
  }, [selectedChampionship]);

  // Countdown timer
  useEffect(() => {
    if (!nextMatch?.match_date) return;

    const updateCountdown = () => {
      const now = new Date();
      const matchDate = new Date(nextMatch.match_date);
      const diff = matchDate - now;

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [nextMatch]);

  const loadData = async () => {
    try {
      const [roundRes, rankingRes, nextMatchRes] = await Promise.all([
        axios.get(`${API}/rounds/current`),
        axios.get(`${API}/ranking/general`),
        axios.get(`${API}/matches/next`)
      ]);

      setCurrentRound(roundRes.data);
      setTopPlayers(rankingRes.data.slice(0, 5));
      setNextMatch(nextMatchRes.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatMatchDate = (dateString) => {
    const date = new Date(dateString);
    const options = { weekday: 'short', day: '2-digit', month: '2-digit' };
    const dateFormatted = date.toLocaleDateString('pt-BR', options);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return { date: dateFormatted, time: `${hours}h${minutes}` };
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

  const isCountdownActive = countdown.days > 0 || countdown.hours > 0 || countdown.minutes > 0 || countdown.seconds > 0;

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

      {/* Próximo Jogo Widget */}
      {nextMatch && (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-paper overflow-hidden" data-testid="next-match-widget">
          {/* Header */}
          <div className="bg-gradient-to-r from-pitch-green to-pitch-green/80 px-6 py-3">
            <div className="flex items-center gap-2 text-bone">
              <Timer size={20} weight="fill" />
              <span className="font-semibold">Próximo Jogo</span>
              <span className="ml-auto text-sm bg-bone/20 px-2 py-1 rounded">
                Rodada {nextMatch.round_number}
              </span>
            </div>
          </div>

          <div className="p-6">
            {/* Teams */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1 text-center">
                <div className="w-16 h-16 mx-auto bg-paper rounded-full flex items-center justify-center mb-2">
                  <SoccerBall size={32} weight="fill" className="text-pitch-green" />
                </div>
                <p className="font-heading font-bold text-text-primary text-lg">
                  {nextMatch.home_team}
                </p>
                <p className="text-xs text-text-secondary">Mandante</p>
              </div>
              
              <div className="px-4">
                <span className="text-3xl font-bold text-text-secondary">VS</span>
              </div>
              
              <div className="flex-1 text-center">
                <div className="w-16 h-16 mx-auto bg-paper rounded-full flex items-center justify-center mb-2">
                  <SoccerBall size={32} weight="fill" className="text-terracotta" />
                </div>
                <p className="font-heading font-bold text-text-primary text-lg">
                  {nextMatch.away_team}
                </p>
                <p className="text-xs text-text-secondary">Visitante</p>
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex items-center justify-center gap-4 mb-6 text-text-secondary">
              <div className="flex items-center gap-1">
                <CalendarBlank size={18} weight="bold" />
                <span className="font-medium">{formatMatchDate(nextMatch.match_date).date}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={18} weight="bold" />
                <span className="font-medium">{formatMatchDate(nextMatch.match_date).time}</span>
              </div>
            </div>

            {/* Countdown */}
            {isCountdownActive ? (
              <div className="bg-gradient-to-r from-terracotta/10 to-warning/10 rounded-xl p-4">
                <p className="text-center text-sm text-text-secondary mb-3 font-medium">
                  ⏰ Tempo para palpitar:
                </p>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <div className="bg-white rounded-lg py-2 px-1 shadow-sm border border-paper">
                      <span className="font-mono text-2xl font-bold text-pitch-green">
                        {countdown.days.toString().padStart(2, '0')}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1">dias</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-white rounded-lg py-2 px-1 shadow-sm border border-paper">
                      <span className="font-mono text-2xl font-bold text-pitch-green">
                        {countdown.hours.toString().padStart(2, '0')}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1">horas</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-white rounded-lg py-2 px-1 shadow-sm border border-paper">
                      <span className="font-mono text-2xl font-bold text-pitch-green">
                        {countdown.minutes.toString().padStart(2, '0')}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1">min</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-white rounded-lg py-2 px-1 shadow-sm border border-paper animate-pulse">
                      <span className="font-mono text-2xl font-bold text-terracotta">
                        {countdown.seconds.toString().padStart(2, '0')}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1">seg</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-error/10 rounded-xl p-4 text-center">
                <p className="text-error font-semibold">🔒 Palpites encerrados para este jogo</p>
              </div>
            )}

            {/* CTA Button */}
            {isCountdownActive && (
              <Link
                to="/predictions"
                data-testid="quick-predict-button"
                className="mt-4 w-full flex items-center justify-center gap-2 bg-pitch-green text-bone py-3 rounded-lg font-semibold hover:bg-pitch-green/90 transition-all"
              >
                <Trophy size={18} weight="fill" />
                Fazer meu palpite agora!
              </Link>
            )}
          </div>
        </div>
      )}

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
                  player.username === username
                    ? "bg-pitch-green/10 border-2 border-pitch-green"
                    : index === 0
                    ? "bg-yellow-500/10 border-2 border-yellow-500"
                    : index === 1
                    ? "bg-gray-400/10 border-2 border-gray-400"
                    : index === 2
                    ? "bg-amber-700/10 border-2 border-amber-700"
                    : "bg-paper"
                }`}
              >
                <div className={`font-mono text-2xl font-bold ${
                  index === 0 ? "text-yellow-500" : 
                  index === 1 ? "text-gray-400" :
                  index === 2 ? "text-amber-700" : "text-text-primary"
                }`}>
                  {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-text-primary">
                    {player.username}
                    {player.username === username && (
                      <span className="ml-2 text-xs bg-pitch-green text-bone px-2 py-0.5 rounded">Você</span>
                    )}
                  </p>
                  {(player.max_perfect_streak || 0) > 0 && (
                    <p className="text-xs text-text-secondary flex items-center gap-1">
                      <Fire size={12} weight="fill" className="text-orange-500" />
                      {player.max_perfect_streak} acertos perfeitos
                    </p>
                  )}
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
