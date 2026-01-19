import { useState, useEffect } from "react";
import axios from "axios";
import { Trophy, Clock, CalendarBlank } from "@phosphor-icons/react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function PredictionsPage({ username }) {
  const [currentRound, setCurrentRound] = useState(null);
  const [allRounds, setAllRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedRound) {
      loadMatchesForRound(selectedRound);
    }
  }, [selectedRound]);

  const loadData = async () => {
    try {
      const roundRes = await axios.get(`${API}/rounds/current`);
      const roundNum = roundRes.data.round_number;
      
      setCurrentRound(roundRes.data);
      setSelectedRound(roundNum);

      // Busca todas as rodadas para o filtro
      const allRoundsRes = await axios.get(`${API}/rounds/all`);
      setAllRounds(allRoundsRes.data || []);

      await loadMatchesForRound(roundNum);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar jogos");
    } finally {
      setLoading(false);
    }
  };

  const loadMatchesForRound = async (roundNum) => {
    try {
      const [matchesRes, predsRes] = await Promise.all([
        axios.get(`${API}/matches/${roundNum}`),
        axios.get(`${API}/predictions/${username}?round_number=${roundNum}`)
      ]);

      setMatches(matchesRes.data);

      // Converte palpites existentes para objeto
      const existingPreds = {};
      predsRes.data.forEach(pred => {
        existingPreds[pred.match_id] = {
          home: pred.home_prediction,
          away: pred.away_prediction
        };
      });
      setPredictions(existingPreds);
    } catch (error) {
      console.error("Erro ao carregar jogos:", error);
    }
  };

  const handlePredictionChange = (matchId, team, value) => {
    const numValue = parseInt(value) || 0;
    setPredictions(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [team]: numValue
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const promises = Object.entries(predictions).map(([matchId, pred]) => {
        if (pred.home !== undefined && pred.away !== undefined) {
          return axios.post(`${API}/predictions`, {
            username,
            match_id: matchId,
            round_number: selectedRound,
            home_prediction: pred.home,
            away_prediction: pred.away
          });
        }
        return null;
      }).filter(Boolean);

      await Promise.all(promises);
      toast.success("Palpites salvos com sucesso! 🎉");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar palpites");
    } finally {
      setSaving(false);
    }
  };

  const formatMatchDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return { date: `${day}/${month}`, time: `${hours}h${minutes}` };
  };

  const isMatchLocked = (matchDate) => {
    return new Date(matchDate) <= new Date();
  };

  const getTimeUntilMatch = (matchDate) => {
    const now = new Date();
    const match = new Date(matchDate);
    const diff = match - now;

    if (diff <= 0) return "Jogo iniciado";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `Falta ${days}d ${hours}h`;
    if (hours > 0) return `Falta ${hours}h ${minutes}min`;
    return `Falta ${minutes} minutos`;
  };

  if (loading) {
    return <div className="text-center py-20">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-paper">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Trophy size={32} weight="fill" className="text-pitch-green" />
            <div>
              <h1 className="font-heading text-3xl font-bold text-text-primary">
                Campeonato Carioca 2026
              </h1>
              <p className="text-text-secondary">Faça seus palpites</p>
            </div>
          </div>

          {/* Filtro de Rodadas */}
          {allRounds.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-text-secondary">Rodada:</label>
              <select
                value={selectedRound || ''}
                onChange={(e) => setSelectedRound(parseInt(e.target.value))}
                data-testid="round-filter"
                className="px-4 py-2 border-2 border-paper rounded-lg bg-white text-text-primary font-semibold focus:outline-none focus:ring-2 focus:ring-pitch-green"
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

        {matches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary mb-4">Nenhum jogo disponível ainda.</p>
            <button
              onClick={async () => {
                await axios.post(`${API}/admin/seed-data`);
                toast.success("Dados criados!");
                loadData();
              }}
              className="bg-pitch-green text-bone px-6 py-2 rounded-lg"
            >
              Criar Jogos de Exemplo
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => {
              const { date, time } = formatMatchDate(match.match_date);
              const locked = isMatchLocked(match.match_date);
              const timeRemaining = getTimeUntilMatch(match.match_date);

              return (
                <div
                  key={match.match_id}
                  data-testid={`match-${match.match_id}`}
                  className={`bg-paper rounded-lg p-6 border-2 transition-all ${
                    locked 
                      ? "border-text-secondary/30 opacity-75" 
                      : "border-paper hover:border-pitch-green"
                  }`}
                >
                  {/* Rodada, Data e Horário */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-paper">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 bg-pitch-green/10 px-3 py-1 rounded-lg">
                        <Trophy size={14} weight="fill" className="text-pitch-green" />
                        <span className="font-bold text-pitch-green">Rodada {match.round_number}</span>
                      </div>
                      <div className="flex items-center gap-1 text-text-secondary">
                        <CalendarBlank size={16} weight="bold" />
                        <span className="font-semibold">{date}</span>
                      </div>
                      <div className="flex items-center gap-1 text-text-secondary">
                        <Clock size={16} weight="bold" />
                        <span className="font-semibold">{time}</span>
                      </div>
                    </div>
                    <div className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      locked 
                        ? "bg-error/10 text-error" 
                        : "bg-warning/10 text-warning"
                    }`}>
                      {locked ? "🔒 Palpites fechados" : timeRemaining}
                    </div>
                  </div>

                  {/* Placar */}
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    {/* Time Casa */}
                    <div className="flex-1 text-right">
                      <p className="font-heading text-lg font-bold text-text-primary">
                        {match.home_team}
                      </p>
                    </div>

                    {/* Inputs de Placar */}
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        data-testid={`home-score-${match.match_id}`}
                        value={predictions[match.match_id]?.home ?? ""}
                        onChange={(e) => handlePredictionChange(match.match_id, "home", e.target.value)}
                        className="w-16 h-16 text-center text-2xl font-mono font-bold border-2 border-paper rounded-lg focus:border-pitch-green focus:ring-2 focus:ring-pitch-green/20 disabled:bg-text-secondary/10 disabled:cursor-not-allowed"
                        placeholder="0"
                        disabled={match.is_finished || locked}
                      />
                      <span className="text-2xl font-bold text-text-secondary">×</span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        data-testid={`away-score-${match.match_id}`}
                        value={predictions[match.match_id]?.away ?? ""}
                        onChange={(e) => handlePredictionChange(match.match_id, "away", e.target.value)}
                        className="w-16 h-16 text-center text-2xl font-mono font-bold border-2 border-paper rounded-lg focus:border-pitch-green focus:ring-2 focus:ring-pitch-green/20 disabled:bg-text-secondary/10 disabled:cursor-not-allowed"
                        placeholder="0"
                        disabled={match.is_finished || locked}
                      />
                    </div>

                    {/* Time Visitante */}
                    <div className="flex-1">
                      <p className="font-heading text-lg font-bold text-text-primary">
                        {match.away_team}
                      </p>
                    </div>
                  </div>

                  {match.is_finished && (
                    <div className="mt-3 pt-3 border-t border-paper">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-text-secondary">
                          Resultado Final: <span className="font-bold text-pitch-green">
                            {match.home_score} × {match.away_score}
                          </span>
                        </p>
                        {predictions[match.match_id] && (
                          <div className="text-right">
                            {(() => {
                              const pred = predictions[match.match_id];
                              let points = 0;
                              
                              // Calcula resultado
                              const realResult = match.home_score > match.away_score ? 'H' : (match.away_score > match.home_score ? 'A' : 'D');
                              const predResult = pred.home > pred.away ? 'H' : (pred.away > pred.home ? 'A' : 'D');
                              if (realResult === predResult) points += 3;
                              if (match.home_score === pred.home) points += 1;
                              if (match.away_score === pred.away) points += 1;
                              
                              return (
                                <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                                  points === 5 ? 'bg-yellow-500/20 text-yellow-600' :
                                  points >= 3 ? 'bg-pitch-green/20 text-pitch-green' :
                                  points > 0 ? 'bg-blue-500/20 text-blue-600' :
                                  'bg-error/20 text-error'
                                }`}>
                                  {points === 5 ? '🎯 ' : ''}{points} {points === 1 ? 'pt' : 'pts'}
                                </span>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {matches.length > 0 && (
          <button
            onClick={handleSave}
            disabled={saving}
            data-testid="save-predictions-button"
            className="mt-6 w-full bg-pitch-green text-bone font-bold py-4 rounded-lg hover:bg-pitch-green/90 disabled:opacity-50 transition-all transform hover:scale-105 active:scale-95"
          >
            {saving ? "Salvando..." : "Salvar Palpites"}
          </button>
        )}
      </div>
    </div>
  );
}
