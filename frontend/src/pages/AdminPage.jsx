import { useState, useEffect } from "react";
import axios from "axios";
import { Shield, Users, Warning, Check, X, Key, Star } from "@phosphor-icons/react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [users, setUsers] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("users");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      await axios.post(`${API}/admin/login`, { password });
      setIsAuthenticated(true);
      setAuthError("");
      loadData();
    } catch (error) {
      setAuthError("Senha incorreta");
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, logsRes] = await Promise.all([
        axios.get(`${API}/admin/users?password=${password}`),
        axios.get(`${API}/admin/security-logs?password=${password}`)
      ]);
      setUsers(usersRes.data || []);
      setSecurityLogs(logsRes.data || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (username, isBanned) => {
    try {
      if (isBanned) {
        await axios.post(`${API}/admin/unban-user?password=${password}&username=${username}`);
      } else {
        await axios.post(`${API}/admin/ban-user?password=${password}&username=${username}`);
      }
      loadData();
    } catch (error) {
      console.error("Erro ao banir/desbanir:", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };

  const getLogTypeColor = (type) => {
    switch (type) {
      case "stolen_key_attempt": return "bg-red-100 text-red-800 border-red-300";
      case "invalid_key": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "premium_activated": return "bg-green-100 text-green-800 border-green-300";
      case "user_banned": return "bg-red-100 text-red-800 border-red-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getLogTypeLabel = (type) => {
    switch (type) {
      case "stolen_key_attempt": return "🚨 TENTATIVA DE USO INDEVIDO";
      case "invalid_key": return "⚠️ Chave inválida";
      case "premium_activated": return "✅ Premium ativado";
      case "user_banned": return "🚫 Usuário banido";
      default: return type;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Shield size={64} className="mx-auto text-yellow-500 mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Painel Admin</h1>
            <p className="text-gray-400">CallClub - Área Restrita</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Senha de Administrador
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Digite a senha"
                />
              </div>

              {authError && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
                  {authError}
                </div>
              )}

              <button
                onClick={handleLogin}
                className="w-full bg-yellow-500 text-gray-900 font-semibold py-3 px-6 rounded-lg hover:bg-yellow-400 transition-all"
              >
                Entrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield size={32} className="text-yellow-500" />
            <h1 className="text-2xl font-bold">Painel Admin - CallClub</h1>
          </div>
          <button
            onClick={() => {
              setIsAuthenticated(false);
              setPassword("");
            }}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Sair
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "users"
                ? "bg-yellow-500 text-gray-900"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            <Users size={20} className="inline mr-2" />
            Usuários ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "security"
                ? "bg-yellow-500 text-gray-900"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            <Warning size={20} className="inline mr-2" />
            Logs de Segurança ({securityLogs.filter(l => l.type === "stolen_key_attempt").length} alertas)
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Carregando...</p>
          </div>
        ) : activeTab === "users" ? (
          /* Users Tab */
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Usuário</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Chave Premium</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Pontos</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.username} className="border-t border-gray-700 hover:bg-gray-750">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.username}</span>
                        {user.is_premium && (
                          <Star size={16} className="text-yellow-500" weight="fill" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {user.is_banned ? (
                        <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded">BANIDO</span>
                      ) : (
                        <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">Ativo</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {user.premium_key ? (
                        <code className="bg-gray-700 px-2 py-1 rounded text-xs text-yellow-400">
                          {user.premium_key}
                        </code>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono">{user.total_points || 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleBan(user.username, user.is_banned)}
                        className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
                          user.is_banned
                            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        }`}
                      >
                        {user.is_banned ? "Desbanir" : "Banir"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Security Logs Tab */
          <div className="space-y-3">
            {securityLogs.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
                <Check size={48} className="mx-auto text-green-500 mb-4" />
                <p className="text-gray-400">Nenhum evento de segurança registrado</p>
              </div>
            ) : (
              securityLogs.map((log, index) => (
                <div
                  key={index}
                  className={`rounded-lg p-4 border ${getLogTypeColor(log.type)}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold mb-1">{getLogTypeLabel(log.type)}</p>
                      <p className="text-sm">
                        <strong>Usuário:</strong> {log.username}
                      </p>
                      {log.attempted_key && (
                        <p className="text-sm">
                          <strong>Chave tentada:</strong> <code>{log.attempted_key}</code>
                        </p>
                      )}
                      {log.key_owner && (
                        <p className="text-sm">
                          <strong>Dono da chave:</strong> {log.key_owner}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm opacity-75">
                      {formatDate(log.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button
            onClick={loadData}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            🔄 Atualizar dados
          </button>
        </div>
      </div>
    </div>
  );
}
