import { useState, useEffect } from "react";
import axios from "axios";
import { Trophy, Clock } from "@phosphor-icons/react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function PredictionsPage({ username }) {
  const [currentRound, setCurrentRound] = useState(null);
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const roundRes = await axios.get(`${API}/rounds/current`);
      const roundNum = roundRes.data.round_number;
      
      const [matchesRes, predsRes] = await Promise.all([
        axios.get(`${API}/matches/${roundNum}`),
        axios.get(`${API}/predictions/${username}?round_number=${roundNum}`)
      ]);

      setCurrentRound(roundRes.data);
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
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar jogos");
    } finally {
      setLoading(false);
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
            round_number: currentRound.round_number,
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

  if (loading) {
    return <div className="text-center py-20">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-paper">
        <div className="flex items-center gap-3 mb-6">
          <Trophy size={32} weight="fill" className="text-pitch-green" />
          <div>
            <h1 className="font-heading text-3xl font-bold text-text-primary">
              Rodada {currentRound?.round_number || 1}
            </h1>
            <p className="text-text-secondary">Faça seus palpites</p>
          </div>
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
            {matches.map((match) => (
              <div
                key={match.match_id}
                data-testid={`match-${match.match_id}`}
                className="bg-paper rounded-lg p-6 border-2 border-paper hover:border-pitch-green transition-all"
              >
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
                      data-testid={`home-score-${match.match_id}`}
                      value={predictions[match.match_id]?.home ?? ""}
                      onChange={(e) => handlePredictionChange(match.match_id, "home", e.target.value)}
                      className="w-16 h-16 text-center text-2xl font-mono font-bold border-2 border-paper rounded-lg focus:border-pitch-green focus:ring-2 focus:ring-pitch-green/20"
                      placeholder="0"
                      disabled={match.is_finished}
                    />
                    <span className="text-2xl font-bold text-text-secondary">×</span>
                    <input
                      type="number"
                      min="0"
                      data-testid={`away-score-${match.match_id}`}
                      value={predictions[match.match_id]?.away ?? ""}
                      onChange={(e) => handlePredictionChange(match.match_id, "away", e.target.value)}
                      className="w-16 h-16 text-center text-2xl font-mono font-bold border-2 border-paper rounded-lg focus:border-pitch-green focus:ring-2 focus:ring-pitch-green/20"
                      placeholder="0"
                      disabled={match.is_finished}
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
                  <div className="mt-3 pt-3 border-t border-paper text-center">
                    <p className="text-sm text-text-secondary">
                      Resultado: <span className="font-bold text-pitch-green">
                        {match.home_score} × {match.away_score}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            ))}
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
