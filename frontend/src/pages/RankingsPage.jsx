import { useState, useEffect } from "react";
import axios from "axios";
import { ChartBar, Trophy, Star, SoccerBall, Percent } from "@phosphor-icons/react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function RankingsPage({ username }) {
  const [selectedChampionship, setSelectedChampionship] = useState("carioca");
  const [rankingData, setRankingData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRanking();
  }, [selectedChampionship]);

  const loadRanking = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/ranking/detailed/${selectedChampionship}`);
      setRankingData(res.data);
    } catch (error) {
      console.error("Erro ao carregar ranking:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPositionDisplay = (position) => {
    return <span className="text-lg font-bold text-text-primary">{position}º</span>;
  };

  const getRowStyle = (position, isCurrentUser, isPremium) => {
    if (isCurrentUser) return "bg-pitch-green/10 border-l-4 border-l-pitch-green";
    if (position === 1) return "bg-gradient-to-r from-yellow-50 to-amber-50";
    if (position === 2) return "bg-gradient-to-r from-gray-50 to-slate-50";
    if (position === 3) return "bg-gradient-to-r from-orange-50 to-amber-50";
    if (isPremium) return "bg-gradient-to-r from-amber-50/50 to-yellow-50/50";
    return "bg-white hover:bg-gray-50";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-10 h-10 border-4 border-pitch-green border-t-transparent rounded-full"></div></div>
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
            Ranking
          </h1>
          <p className="text-text-secondary mt-1">
            Classificação completa dos palpiteiros
          </p>
        </div>

        {/* Championship Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedChampionship("carioca")}
            className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
              selectedChampionship === "carioca"
                ? "bg-pitch-green text-white shadow-lg shadow-pitch-green/30"
                : "bg-white text-text-secondary border-2 border-paper hover:border-pitch-green"
            }`}
          >
            🏆 Carioca
          </button>
          <button
            onClick={() => setSelectedChampionship("brasileirao")}
            className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
              selectedChampionship === "brasileirao"
                ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg shadow-yellow-500/30"
                : "bg-white text-text-secondary border-2 border-paper hover:border-yellow-500"
            }`}
          >
            🇧🇷 Brasileirão
          </button>
        </div>
      </div>

      {/* Info Bar */}
      {rankingData && (
        <div className={`rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 ${
          selectedChampionship === "brasileirao"
            ? "bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-300"
            : "bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300"
        }`}>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-text-secondary">Rodada Atual</p>
              <p className="text-2xl font-bold text-text-primary">{rankingData.current_round}</p>
            </div>
            <div className="w-px h-10 bg-black/10"></div>
            <div className="text-center">
              <p className="text-xs text-text-secondary">Total de Rodadas</p>
              <p className="text-2xl font-bold text-text-primary">{rankingData.total_rounds}</p>
            </div>
            <div className="w-px h-10 bg-black/10"></div>
            <div className="text-center">
              <p className="text-xs text-text-secondary">Participantes</p>
              <p className="text-2xl font-bold text-text-primary">{rankingData.ranking.length}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-bold ${
            selectedChampionship === "brasileirao"
              ? "bg-yellow-500 text-white"
              : "bg-pitch-green text-white"
          }`}>
            {selectedChampionship === "brasileirao" ? "Campeonato Brasileiro 2026" : "Campeonato Carioca 2026"}
          </div>
        </div>
      )}

      {/* Ranking Table */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-paper overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-white ${
                selectedChampionship === "brasileirao"
                  ? "bg-gradient-to-r from-yellow-500 to-amber-600"
                  : "bg-gradient-to-r from-pitch-green to-emerald-600"
              }`}>
                <th className="px-3 py-4 text-center font-bold w-16">
                  <span className="flex items-center justify-center gap-1">
                    <ListNumbers size={16} />
                    #
                  </span>
                </th>
                <th className="px-3 py-4 text-left font-bold">Palpiteiro</th>
                <th className="px-3 py-4 text-center font-bold">
                  <span className="flex items-center justify-center gap-1" title="Rodada Atual">
                    📅 Rod.
                  </span>
                </th>
                <th className="px-3 py-4 text-center font-bold">
                  <span className="flex items-center justify-center gap-1" title="Pontuação Total">
                    <Trophy size={16} weight="fill" />
                    Pts
                  </span>
                </th>
                <th className="px-3 py-4 text-center font-bold">
                  <span className="flex items-center justify-center gap-1" title="Acertos de Resultado (V/E/D)">
                    ✓ Res.
                  </span>
                </th>
                <th className="px-3 py-4 text-center font-bold">
                  <span className="flex items-center justify-center gap-1" title="Acertos Gols Casa">
                    🏠 Casa
                  </span>
                </th>
                <th className="px-3 py-4 text-center font-bold">
                  <span className="flex items-center justify-center gap-1" title="Acertos Gols Visitante">
                    ✈️ Vis.
                  </span>
                </th>
                <th className="px-3 py-4 text-center font-bold">
                  <span className="flex items-center justify-center gap-1" title="Placares Exatos">
                    🎯 Exato
                  </span>
                </th>
                <th className="px-3 py-4 text-center font-bold">
                  <span className="flex items-center justify-center gap-1" title="Total de Palpites">
                    <SoccerBall size={16} />
                    Palp.
                  </span>
                </th>
                <th className="px-3 py-4 text-center font-bold">
                  <span className="flex items-center justify-center gap-1" title="Aproveitamento">
                    <Percent size={16} />
                    Aprov.
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rankingData?.ranking.map((player) => {
                const isCurrentUser = player.username === username;
                const isPremium = player.is_premium === true;

                return (
                  <tr
                    key={player.username}
                    data-testid={`rank-${player.position}`}
                    className={`border-b border-gray-100 transition-all ${getRowStyle(player.position, isCurrentUser, isPremium)}`}
                  >
                    {/* Posição */}
                    <td className="px-3 py-3 text-center">
                      {getMedalDisplay(player.position)}
                    </td>

                    {/* Nome */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isCurrentUser ? "text-pitch-green" : "text-text-primary"}`}>
                          {player.username}
                        </span>
                        {isPremium && (
                          <span className="inline-flex items-center gap-0.5 text-xs bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                            <Star size={10} weight="fill" />
                          </span>
                        )}
                        {player.pioneer_number && (
                          <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-medium">
                            #{player.pioneer_number}
                          </span>
                        )}
                        {isCurrentUser && (
                          <span className="text-xs bg-pitch-green text-white px-2 py-0.5 rounded font-bold">
                            Você
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Rodada Atual */}
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        selectedChampionship === "brasileirao"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {rankingData.current_round}/{rankingData.total_rounds}
                      </span>
                    </td>

                    {/* Pontuação */}
                    <td className="px-3 py-3 text-center">
                      <span className={`text-xl font-bold ${
                        player.position === 1 ? "text-yellow-600" :
                        player.position === 2 ? "text-gray-500" :
                        player.position === 3 ? "text-orange-600" :
                        "text-pitch-green"
                      }`}>
                        {player.total_points}
                      </span>
                    </td>

                    {/* Acertos Resultado */}
                    <td className="px-3 py-3 text-center">
                      <span className="font-mono font-semibold text-blue-600">
                        {player.correct_results}
                      </span>
                    </td>

                    {/* Acertos Casa */}
                    <td className="px-3 py-3 text-center">
                      <span className="font-mono font-semibold text-emerald-600">
                        {player.correct_home_goals}
                      </span>
                    </td>

                    {/* Acertos Visitante */}
                    <td className="px-3 py-3 text-center">
                      <span className="font-mono font-semibold text-orange-600">
                        {player.correct_away_goals}
                      </span>
                    </td>

                    {/* Placares Exatos */}
                    <td className="px-3 py-3 text-center">
                      <span className={`font-mono font-bold ${
                        player.exact_scores > 0 ? "text-yellow-600" : "text-gray-400"
                      }`}>
                        {player.exact_scores > 0 && "🎯 "}{player.exact_scores}
                      </span>
                    </td>

                    {/* Total Palpites */}
                    <td className="px-3 py-3 text-center">
                      <span className="font-mono text-text-secondary">
                        {player.total_predictions}
                      </span>
                    </td>

                    {/* Aproveitamento */}
                    <td className="px-3 py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`font-bold ${
                          player.efficiency >= 70 ? "text-green-600" :
                          player.efficiency >= 50 ? "text-yellow-600" :
                          player.efficiency >= 30 ? "text-orange-600" :
                          "text-red-500"
                        }`}>
                          {player.efficiency}%
                        </span>
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mt-1">
                          <div 
                            className={`h-full rounded-full ${
                              player.efficiency >= 70 ? "bg-green-500" :
                              player.efficiency >= 50 ? "bg-yellow-500" :
                              player.efficiency >= 30 ? "bg-orange-500" :
                              "bg-red-500"
                            }`}
                            style={{ width: `${Math.min(player.efficiency, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {(!rankingData?.ranking || rankingData.ranking.length === 0) && (
          <div className="text-center py-12">
            <Trophy size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-text-secondary">Nenhum palpite registrado ainda</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl p-4 border-2 border-paper">
        <h3 className="font-bold text-text-primary mb-3 flex items-center gap-2">
          <ChartBar size={18} className="text-pitch-green" />
          Legenda das Colunas
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">✓</span>
            <span className="text-text-secondary">Res. = Acertos V/E/D</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🏠</span>
            <span className="text-text-secondary">Gols casa certos</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">✈️</span>
            <span className="text-text-secondary">Gols visitante certos</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <span className="text-text-secondary">Placares exatos</span>
          </div>
          <div className="flex items-center gap-2">
            <Percent size={16} className="text-pitch-green" />
            <span className="text-text-secondary">Pts ÷ (Jogos × 5)</span>
          </div>
        </div>
      </div>

      {/* Scoring Info */}
      <div className="bg-gradient-to-r from-pitch-green/10 to-emerald-100 rounded-xl p-4 border-2 border-pitch-green/30">
        <h3 className="font-bold text-text-primary mb-2">📊 Sistema de Pontuação</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="bg-white px-3 py-1 rounded-lg shadow-sm"><strong>3 pts</strong> = Resultado certo</span>
          <span className="bg-white px-3 py-1 rounded-lg shadow-sm"><strong>+1 pt</strong> = Gols casa</span>
          <span className="bg-white px-3 py-1 rounded-lg shadow-sm"><strong>+1 pt</strong> = Gols visitante</span>
          <span className="bg-yellow-100 px-3 py-1 rounded-lg shadow-sm border border-yellow-300"><strong>5 pts</strong> = Placar exato! 🎯</span>
        </div>
      </div>
    </div>
  );
}
