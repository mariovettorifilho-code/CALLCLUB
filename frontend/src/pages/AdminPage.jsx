import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Shield, Users, Warning, Check, X, Key, Star, Plus, 
  Trash, PencilSimple, Eye, EyeSlash, UserPlus, Crown,
  ChartBar, Lock, LockOpen, Copy, ArrowClockwise, Database,
  Download, Upload, Wrench, CalendarBlank, SoccerBall, ListNumbers,
  ClockCounterClockwise, Broom, MagnifyingGlass
} from "@phosphor-icons/react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [users, setUsers] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditPin, setShowEditPin] = useState(false);
  const [showGenerateKey, setShowGenerateKey] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUserName, setNewUserName] = useState("");
  const [newUserPin, setNewUserPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [generatedKey, setGeneratedKey] = useState("");
  const [showPins, setShowPins] = useState({});
  const [notification, setNotification] = useState(null);
  
  // Maintenance states
  const [maintenanceResult, setMaintenanceResult] = useState(null);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [viewRoundChamp, setViewRoundChamp] = useState("brasileirao");
  const [viewRoundNum, setViewRoundNum] = useState(1);
  const [roundMatches, setRoundMatches] = useState([]);
  const [viewUserPredictions, setViewUserPredictions] = useState("");
  const [userPredictions, setUserPredictions] = useState([]);
  const [currentRounds, setCurrentRounds] = useState({});
  const [debugInfo, setDebugInfo] = useState(null);
  const [setRoundChamp, setSetRoundChamp] = useState("brasileirao");
  const [setRoundNum, setSetRoundNum] = useState(1);
  const [championships, setChampionships] = useState([]);
  
  // Match management states
  const [manageChamp, setManageChamp] = useState("brasileirao");
  const [manageRound, setManageRound] = useState(1);
  const [manageMatches, setManageMatches] = useState([]);
  const [editingMatch, setEditingMatch] = useState(null);
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [newMatch, setNewMatch] = useState({
    home_team: "",
    away_team: "",
    match_date: "",
    match_time: "",
    home_score: "",
    away_score: "",
    is_finished: false,
    predictions_closed: false
  });

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

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
      const [usersRes, logsRes, statsRes, champsRes] = await Promise.all([
        axios.get(`${API}/admin/users?password=${password}`),
        axios.get(`${API}/admin/security-logs?password=${password}`),
        axios.get(`${API}/admin/stats?password=${password}`),
        axios.get(`${API}/admin/championships?password=${password}`)
      ]);
      setUsers(usersRes.data || []);
      setSecurityLogs(logsRes.data || []);
      setStats(statsRes.data || null);
      setChampionships(champsRes.data || []);
      
      // Carrega rodada atual do brasileirão
      const brasileiraoRound = await axios.get(`${API}/rounds/current?championship_id=brasileirao`);
      setCurrentRounds({
        brasileirao: brasileiraoRound.data?.round_number || 1
      });
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  // ==================== MANUTENÇÃO ====================
  
  const handleSyncMatches = async (championshipId = "brasileirao") => {
    setMaintenanceLoading(true);
    setMaintenanceResult(null);
    try {
      const res = await axios.get(`${API}/admin/force-populate?password=${password}&championship_id=${championshipId}`);
      setMaintenanceResult({
        success: true,
        title: "Sincronização de Partidas",
        message: `Criadas: ${res.data.results?.matches_created || 0}, Atualizadas: ${res.data.results?.matches_updated || 0}`,
        data: res.data
      });
      showNotification(`Partidas de ${championshipId} sincronizadas com sucesso!`);
      loadData();
    } catch (error) {
      setMaintenanceResult({ success: false, title: "Erro", message: error.response?.data?.detail || "Erro ao sincronizar" });
      showNotification("Erro ao sincronizar partidas", "error");
    } finally {
      setMaintenanceLoading(false));
    }
  };

  const handleSyncResults = async () => {
    setMaintenanceLoading(true);
    setMaintenanceResult(null);
    try {
      const res = await axios.post(`${API}/admin/sync-results`);
      setMaintenanceResult({
        success: true,
        title: "Atualização de Resultados",
        message: `Partidas atualizadas: ${res.data.matches_updated}, Usuários recalculados: ${res.data.users_recalculated}`,
        data: res.data
      });
      showNotification("Resultados atualizados com sucesso!");
      loadData();
    } catch (error) {
      setMaintenanceResult({ success: false, title: "Erro", message: error.response?.data?.detail || "Erro ao atualizar resultados" });
      showNotification("Erro ao atualizar resultados", "error");
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const handleRecalculatePoints = async () => {
    setMaintenanceLoading(true);
    setMaintenanceResult(null);
    try {
      const res = await axios.post(`${API}/admin/recalculate-points`);
      setMaintenanceResult({
        success: true,
        title: "Recálculo de Pontos",
        message: `Usuários recalculados: ${res.data.users_updated}`,
        data: res.data
      });
      showNotification("Pontos recalculados com sucesso!");
      loadData();
    } catch (error) {
      setMaintenanceResult({ success: false, title: "Erro", message: error.response?.data?.detail || "Erro ao recalcular" });
      showNotification("Erro ao recalcular pontos", "error");
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const handleFixPredictions = async () => {
    setMaintenanceLoading(true);
    setMaintenanceResult(null);
    try {
      const res = await axios.get(`${API}/admin/fix-predictions-championship?password=${password}`);
      setMaintenanceResult({
        success: true,
        title: "Correção de Palpites",
        message: `Palpites corrigidos: ${res.data.predictions_fixed}`,
        data: res.data
      });
      showNotification("Palpites corrigidos com sucesso!");
    } catch (error) {
      setMaintenanceResult({ success: false, title: "Erro", message: error.response?.data?.detail || "Erro ao corrigir" });
      showNotification("Erro ao corrigir palpites", "error");
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const handleExportPredictions = async () => {
    setMaintenanceLoading(true);
    try {
      const res = await axios.get(`${API}/admin/export-predictions?password=${password}`);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `palpites_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      showNotification(`Exportados ${res.data.total} palpites!`);
    } catch (error) {
      showNotification("Erro ao exportar", "error");
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const handleImportPredictions = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setMaintenanceLoading(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await axios.post(`${API}/admin/import-predictions?password=${password}`, data);
      setMaintenanceResult({
        success: true,
        title: "Importação de Palpites",
        message: `Importados: ${res.data.imported}, Pulados: ${res.data.skipped}`,
        data: res.data
      });
      showNotification("Palpites importados com sucesso!");
      loadData();
    } catch (error) {
      showNotification("Erro ao importar palpites", "error");
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const handleSetCurrentRound = async () => {
    setMaintenanceLoading(true);
    try {
      const res = await axios.post(`${API}/admin/set-current-round?password=${password}`, {
        championship_id: setRoundChamp,
        round_number: setRoundNum
      });
      const champName = championships.find(c => c.championship_id === setRoundChamp)?.name || setRoundChamp;
      setMaintenanceResult({
        success: true,
        title: "Rodada Atual Definida",
        message: `${champName} agora está na rodada ${setRoundNum}`,
        data: res.data
      });
      showNotification(`Rodada ${setRoundNum} definida como atual!`);
      loadData();
    } catch (error) {
      showNotification("Erro ao definir rodada", "error");
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const handleViewRoundMatches = async () => {
    try {
      const res = await axios.get(`${API}/matches/${viewRoundNum}?championship_id=${viewRoundChamp}`);
      setRoundMatches(res.data || []);
    } catch (error) {
      showNotification("Erro ao carregar jogos", "error");
    }
  };

  const handleViewUserPredictions = async () => {
    if (!viewUserPredictions.trim()) return;
    try {
      const res = await axios.get(`${API}/user/${viewUserPredictions}/predictions`);
      setUserPredictions(res.data.predictions || []);
    } catch (error) {
      showNotification("Erro ao carregar palpites do usuário", "error");
    }
  };

  // ==================== MATCH MANAGEMENT ====================
  
  const loadManageMatches = async () => {
    try {
      const res = await axios.get(`${API}/matches/${manageRound}?championship_id=${manageChamp}`);
      setManageMatches(res.data || []);
    } catch (error) {
      showNotification("Erro ao carregar jogos", "error");
    }
  };

  const handleUpdateMatch = async (matchId, updates) => {
    setMaintenanceLoading(true);
    try {
      await axios.post(`${API}/admin/update-match?password=${password}`, {
        match_id: matchId,
        ...updates
      });
      showNotification("Partida atualizada!");
      loadManageMatches();
      setEditingMatch(null);
    } catch (error) {
      showNotification("Erro ao atualizar partida", "error");
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const handleAddNewMatch = async () => {
    if (!newMatch.home_team || !newMatch.away_team) {
      showNotification("Preencha os times", "error");
      return;
    }
    setMaintenanceLoading(true);
    try {
      const matchDateTime = newMatch.match_date && newMatch.match_time 
        ? `${newMatch.match_date}T${newMatch.match_time}:00`
        : new Date().toISOString();
      
      await axios.post(`${API}/admin/add-match?password=${password}`, {
        championship: manageChamp,
        round_number: manageRound,
        home_team: newMatch.home_team,
        away_team: newMatch.away_team,
        match_date: matchDateTime,
        home_score: newMatch.home_score ? parseInt(newMatch.home_score) : null,
        away_score: newMatch.away_score ? parseInt(newMatch.away_score) : null,
        is_finished: newMatch.is_finished,
        predictions_closed: newMatch.predictions_closed
      });
      showNotification("Partida adicionada!");
      loadManageMatches();
      setShowAddMatch(false);
      setNewMatch({
        home_team: "",
        away_team: "",
        match_date: "",
        match_time: "",
        home_score: "",
        away_score: "",
        is_finished: false,
        predictions_closed: false
      });
    } catch (error) {
      showNotification("Erro ao adicionar partida", "error");
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm("Tem certeza que deseja EXCLUIR esta partida? Os palpites relacionados serão mantidos.")) {
      return;
    }
    setMaintenanceLoading(true);
    try {
      await axios.delete(`${API}/admin/delete-match?password=${password}&match_id=${matchId}`);
      showNotification("Partida excluída!");
      loadManageMatches();
    } catch (error) {
      showNotification("Erro ao excluir partida", "error");
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const handleDebugInfo = async () => {
    setMaintenanceLoading(true);
    try {
      const res = await axios.get(`${API}/admin/debug-matches?password=${password}`);
      setDebugInfo(res.data);
    } catch (error) {
      showNotification("Erro ao carregar debug", "error");
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const handleClearOldLogs = async () => {
    if (!window.confirm("Tem certeza que deseja limpar logs antigos (mais de 30 dias)?")) return;
    showNotification("Funcionalidade em desenvolvimento", "warning");
  };

  // ==================== USER MANAGEMENT ====================

  const handleBan = async (username, isBanned) => {
    try {
      if (isBanned) {
        await axios.post(`${API}/admin/unban-user?password=${password}&username=${username}`);
        showNotification(`${username} foi desbanido`);
      } else {
        await axios.post(`${API}/admin/ban-user?password=${password}&username=${username}`);
        showNotification(`${username} foi banido`, "warning");
      }
      loadData();
    } catch (error) {
      showNotification("Erro ao processar", "error");
    }
  };

  const handleAddUser = async () => {
    if (!newUserName.trim() || !newUserPin.trim()) {
      showNotification("Preencha todos os campos", "error");
      return;
    }
    if (newUserPin.length !== 4 || !/^\d+$/.test(newUserPin)) {
      showNotification("PIN deve ter 4 dígitos", "error");
      return;
    }
    try {
      const res = await axios.post(`${API}/admin/add-user`, {
        password,
        username: newUserName.trim(),
        pin: newUserPin
      });
      showNotification(res.data.message);
      setShowAddUser(false);
      setNewUserName("");
      setNewUserPin("");
      loadData();
    } catch (error) {
      showNotification(error.response?.data?.detail || "Erro ao adicionar", "error");
    }
  };

  const handleUpdatePin = async () => {
    if (!newPin.trim()) {
      showNotification("Digite o novo PIN", "error");
      return;
    }
    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      showNotification("PIN deve ter 4 dígitos", "error");
      return;
    }
    try {
      await axios.post(`${API}/admin/update-pin`, {
        password,
        username: selectedUser,
        new_pin: newPin
      });
      showNotification(`PIN de ${selectedUser} atualizado!`);
      setShowEditPin(false);
      setNewPin("");
      setSelectedUser(null);
      loadData();
    } catch (error) {
      showNotification("Erro ao atualizar PIN", "error");
    }
  };

  const handleTogglePremium = async (username, currentPremium) => {
    try {
      await axios.post(`${API}/admin/toggle-premium`, {
        password,
        username,
        is_premium: !currentPremium
      });
      showNotification(`Premium ${!currentPremium ? "ativado" : "desativado"} para ${username}`);
      loadData();
    } catch (error) {
      showNotification("Erro ao alterar premium", "error");
    }
  };

  const handleGenerateKey = async () => {
    try {
      const res = await axios.post(`${API}/admin/generate-key`, {
        password,
        username: selectedUser
      });
      setGeneratedKey(res.data.key);
      showNotification("Chave gerada com sucesso!");
      loadData();
    } catch (error) {
      showNotification("Erro ao gerar chave", "error");
    }
  };

  const handleRemoveUser = async (username) => {
    if (!window.confirm(`Tem certeza que deseja REMOVER ${username}? Esta ação não pode ser desfeita!`)) {
      return;
    }
    try {
      await axios.delete(`${API}/admin/remove-user?password=${password}&username=${username}`);
      showNotification(`${username} removido completamente`, "warning");
      loadData();
    } catch (error) {
      showNotification("Erro ao remover usuário", "error");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showNotification("Copiado!");
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
      case "premium_activated": 
      case "premium_ativado": return "bg-green-100 text-green-800 border-green-300";
      case "user_banned": return "bg-red-100 text-red-800 border-red-300";
      case "user_added": return "bg-blue-100 text-blue-800 border-blue-300";
      case "pin_updated": return "bg-purple-100 text-purple-800 border-purple-300";
      case "key_generated": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getLogTypeLabel = (type) => {
    switch (type) {
      case "stolen_key_attempt": return "🚨 TENTATIVA DE USO INDEVIDO";
      case "invalid_key": return "⚠️ Chave inválida";
      case "premium_activated":
      case "premium_ativado": return "✅ Premium ativado";
      case "premium_desativado": return "❌ Premium desativado";
      case "user_banned": return "🚫 Usuário banido";
      case "user_added": return "➕ Usuário adicionado";
      case "user_removed": return "🗑️ Usuário removido";
      case "pin_updated": return "🔑 PIN atualizado";
      case "key_generated": return "🎫 Chave gerada";
      default: return type;
    }
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-500/30">
              <Shield size={40} className="text-white" weight="fill" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Painel Admin</h1>
            <p className="text-gray-400">CallClub - Área Restrita</p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-8 border border-gray-700 shadow-xl">
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
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  placeholder="Digite a senha"
                  data-testid="admin-password-input"
                />
              </div>

              {authError && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <X size={18} />
                  {authError}
                </div>
              )}

              <button
                onClick={handleLogin}
                data-testid="admin-login-btn"
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-gray-900 font-bold py-3 px-6 rounded-xl hover:from-yellow-400 hover:to-amber-500 transition-all shadow-lg shadow-yellow-500/20"
              >
                Entrar no Painel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white p-4 md:p-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg ${
          notification.type === "error" ? "bg-red-500" :
          notification.type === "warning" ? "bg-yellow-500 text-gray-900" :
          "bg-green-500"
        }`}>
          {notification.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
              <Shield size={24} className="text-white" weight="fill" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Painel Admin</h1>
              <p className="text-gray-400 text-sm">CallClub - Liga dos Palpiteiros</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ArrowClockwise size={18} />
              Atualizar
            </button>
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
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: "dashboard", label: "Dashboard", icon: ChartBar },
            { id: "users", label: `Usuários (${users.length})`, icon: Users },
            { id: "matches", label: "Partidas", icon: SoccerBall },
            { id: "maintenance", label: "Manutenção", icon: Wrench },
            { id: "diagnostics", label: "Diagnóstico", icon: MagnifyingGlass },
            { id: "security", label: `Segurança (${securityLogs.filter(l => l.type === "stolen_key_attempt").length})`, icon: Warning },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              data-testid={`tab-${tab.id}`}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-gray-900 shadow-lg shadow-yellow-500/20"
                  : "bg-gray-800/50 text-gray-300 hover:bg-gray-700"
              }`}
            >
              <tab.icon size={20} weight={activeTab === tab.id ? "fill" : "regular"} />
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Carregando...</p>
          </div>
        ) : (
          <>
            {/* Dashboard Tab */}
            {activeTab === "dashboard" && stats && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-2xl p-5 border border-blue-500/30">
                    <Users size={28} className="text-blue-400 mb-2" />
                    <p className="text-3xl font-bold">{stats.total_users}</p>
                    <p className="text-blue-300 text-sm">Usuários</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-500/20 to-amber-600/10 rounded-2xl p-5 border border-yellow-500/30">
                    <Star size={28} className="text-yellow-400 mb-2" weight="fill" />
                    <p className="text-3xl font-bold">{stats.premium_users}</p>
                    <p className="text-yellow-300 text-sm">Premium</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/10 rounded-2xl p-5 border border-green-500/30">
                    <Check size={28} className="text-green-400 mb-2" />
                    <p className="text-3xl font-bold">{stats.total_predictions}</p>
                    <p className="text-green-300 text-sm">Palpites</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-2xl p-5 border border-purple-500/30">
                    <SoccerBall size={28} className="text-purple-400 mb-2" />
                    <p className="text-3xl font-bold">{stats.total_matches}</p>
                    <p className="text-purple-300 text-sm">Partidas</p>
                  </div>
                </div>

                {/* Current Rounds */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700">
                    <div className="flex items-center gap-3 mb-3">
                      <CalendarBlank size={24} className="text-green-400" />
                      <h3 className="font-bold">Campeonato Carioca</h3>
                    </div>
                    <p className="text-3xl font-bold text-green-400">Rodada {currentRounds.carioca || 1}</p>
                    <p className="text-gray-400 text-sm">Rodada atual</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700">
                    <div className="flex items-center gap-3 mb-3">
                      <CalendarBlank size={24} className="text-yellow-400" />
                      <h3 className="font-bold">Campeonato Brasileiro</h3>
                    </div>
                    <p className="text-3xl font-bold text-yellow-400">Rodada {currentRounds.brasileirao || 1}</p>
                    <p className="text-gray-400 text-sm">Rodada atual</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Plus size={20} className="text-yellow-500" />
                    Ações Rápidas
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                      onClick={() => setShowAddUser(true)}
                      className="flex flex-col items-center gap-2 p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-colors group"
                    >
                      <UserPlus size={28} className="text-green-400 group-hover:scale-110 transition-transform" />
                      <span className="text-sm">Adicionar Usuário</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("maintenance")}
                      className="flex flex-col items-center gap-2 p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-colors group"
                    >
                      <Wrench size={28} className="text-orange-400 group-hover:scale-110 transition-transform" />
                      <span className="text-sm">Manutenção</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("security")}
                      className="flex flex-col items-center gap-2 p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-colors group"
                    >
                      <Warning size={28} className="text-red-400 group-hover:scale-110 transition-transform" />
                      <span className="text-sm">Ver Alertas</span>
                    </button>
                    <button
                      onClick={loadData}
                      className="flex flex-col items-center gap-2 p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-colors group"
                    >
                      <ArrowClockwise size={28} className="text-purple-400 group-hover:scale-110 transition-transform" />
                      <span className="text-sm">Atualizar Dados</span>
                    </button>
                  </div>
                </div>

                {/* Recent Logs */}
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Warning size={20} className="text-yellow-500" />
                    Atividade Recente
                  </h3>
                  <div className="space-y-2">
                    {securityLogs.slice(0, 5).map((log, index) => (
                      <div key={index} className={`rounded-lg p-3 border ${getLogTypeColor(log.type)}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{getLogTypeLabel(log.type)}</span>
                          <span className="text-xs opacity-75">{formatDate(log.timestamp)}</span>
                        </div>
                        <p className="text-xs mt-1 opacity-75">Usuário: {log.username}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Maintenance Tab */}
            {activeTab === "maintenance" && (
              <div className="space-y-6">
                {/* Result Display */}
                {maintenanceResult && (
                  <div className={`rounded-2xl p-5 border ${maintenanceResult.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                    <h4 className={`font-bold mb-2 ${maintenanceResult.success ? 'text-green-400' : 'text-red-400'}`}>
                      {maintenanceResult.title}
                    </h4>
                    <p className="text-gray-300">{maintenanceResult.message}</p>
                  </div>
                )}

                {/* Data Sync */}
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Database size={20} className="text-blue-400" />
                    Dados e Sincronização
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <button
                      onClick={handleSyncMatches}
                      disabled={maintenanceLoading}
                      className="flex flex-col items-center gap-2 p-4 bg-blue-500/20 rounded-xl hover:bg-blue-500/30 transition-colors border border-blue-500/30 disabled:opacity-50"
                    >
                      <ArrowClockwise size={28} className="text-blue-400" />
                      <span className="text-sm font-medium">Sincronizar Partidas</span>
                      <span className="text-xs text-gray-400">Busca jogos da API</span>
                    </button>
                    <button
                      onClick={handleSyncResults}
                      disabled={maintenanceLoading}
                      className="flex flex-col items-center gap-2 p-4 bg-green-500/20 rounded-xl hover:bg-green-500/30 transition-colors border border-green-500/30 disabled:opacity-50"
                    >
                      <Check size={28} className="text-green-400" />
                      <span className="text-sm font-medium">Atualizar Resultados</span>
                      <span className="text-xs text-gray-400">Busca placares finais</span>
                    </button>
                    <button
                      onClick={handleRecalculatePoints}
                      disabled={maintenanceLoading}
                      className="flex flex-col items-center gap-2 p-4 bg-yellow-500/20 rounded-xl hover:bg-yellow-500/30 transition-colors border border-yellow-500/30 disabled:opacity-50"
                    >
                      <ListNumbers size={28} className="text-yellow-400" />
                      <span className="text-sm font-medium">Recalcular Pontos</span>
                      <span className="text-xs text-gray-400">Recalcula rankings</span>
                    </button>
                    <button
                      onClick={handleFixPredictions}
                      disabled={maintenanceLoading}
                      className="flex flex-col items-center gap-2 p-4 bg-purple-500/20 rounded-xl hover:bg-purple-500/30 transition-colors border border-purple-500/30 disabled:opacity-50"
                    >
                      <Wrench size={28} className="text-purple-400" />
                      <span className="text-sm font-medium">Corrigir Palpites</span>
                      <span className="text-xs text-gray-400">Sem championship</span>
                    </button>
                    <button
                      onClick={handleExportPredictions}
                      disabled={maintenanceLoading}
                      className="flex flex-col items-center gap-2 p-4 bg-cyan-500/20 rounded-xl hover:bg-cyan-500/30 transition-colors border border-cyan-500/30 disabled:opacity-50"
                    >
                      <Download size={28} className="text-cyan-400" />
                      <span className="text-sm font-medium">Exportar Palpites</span>
                      <span className="text-xs text-gray-400">Backup JSON</span>
                    </button>
                    <label className="flex flex-col items-center gap-2 p-4 bg-orange-500/20 rounded-xl hover:bg-orange-500/30 transition-colors border border-orange-500/30 cursor-pointer">
                      <Upload size={28} className="text-orange-400" />
                      <span className="text-sm font-medium">Importar Palpites</span>
                      <span className="text-xs text-gray-400">Restaurar backup</span>
                      <input type="file" accept=".json" onChange={handleImportPredictions} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Logs Management */}
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <ClockCounterClockwise size={20} className="text-red-400" />
                    Gerenciamento de Logs
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setActiveTab("security")}
                      className="flex flex-col items-center gap-2 p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-colors"
                    >
                      <Eye size={28} className="text-blue-400" />
                      <span className="text-sm font-medium">Ver Logs de Segurança</span>
                    </button>
                    <button
                      onClick={handleClearOldLogs}
                      className="flex flex-col items-center gap-2 p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-colors"
                    >
                      <Broom size={28} className="text-red-400" />
                      <span className="text-sm font-medium">Limpar Logs Antigos</span>
                    </button>
                  </div>
                </div>

                {/* Set Current Round */}
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <CalendarBlank size={20} className="text-green-400" />
                    Definir Rodada Atual Manualmente
                  </h3>
                  <div className="flex flex-wrap gap-3 items-end">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Campeonato</label>
                      <select
                        value={setRoundChamp}
                        onChange={(e) => setSetRoundChamp(e.target.value)}
                        className="px-4 py-2 bg-gray-700 rounded-lg text-white"
                      >
                        <option value="carioca">Carioca</option>
                        <option value="brasileirao">Brasileirão</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Rodada</label>
                      <input
                        type="number"
                        value={setRoundNum}
                        onChange={(e) => setSetRoundNum(parseInt(e.target.value) || 1)}
                        min="1"
                        max={setRoundChamp === 'carioca' ? 6 : 38}
                        className="px-4 py-2 bg-gray-700 rounded-lg text-white w-24"
                      />
                    </div>
                    <button
                      onClick={handleSetCurrentRound}
                      disabled={maintenanceLoading}
                      className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg font-medium hover:from-green-400 hover:to-emerald-500 transition-colors disabled:opacity-50"
                    >
                      Definir como Atual
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Isso vai alterar qual rodada é considerada "atual" no sistema. Use quando a rodada não atualizar automaticamente.
                  </p>
                </div>

                {maintenanceLoading && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-2xl p-8 text-center">
                      <div className="animate-spin w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-gray-300">Processando...</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Diagnostics Tab */}
            {activeTab === "diagnostics" && (
              <div className="space-y-6">
                {/* View Round Matches */}
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <SoccerBall size={20} className="text-green-400" />
                    Ver Jogos de uma Rodada
                  </h3>
                  <div className="flex flex-wrap gap-3 mb-4">
                    <select
                      value={viewRoundChamp}
                      onChange={(e) => setViewRoundChamp(e.target.value)}
                      className="px-4 py-2 bg-gray-700 rounded-lg text-white"
                    >
                      <option value="carioca">Carioca</option>
                      <option value="brasileirao">Brasileirão</option>
                    </select>
                    <input
                      type="number"
                      value={viewRoundNum}
                      onChange={(e) => setViewRoundNum(parseInt(e.target.value) || 1)}
                      min="1"
                      max="38"
                      className="px-4 py-2 bg-gray-700 rounded-lg text-white w-24"
                      placeholder="Rodada"
                    />
                    <button
                      onClick={handleViewRoundMatches}
                      className="px-4 py-2 bg-green-500 rounded-lg font-medium hover:bg-green-600 transition-colors"
                    >
                      Buscar
                    </button>
                  </div>
                  {roundMatches.length > 0 && (
                    <div className="space-y-2">
                      {roundMatches.map((match, i) => (
                        <div key={i} className="bg-gray-700/50 rounded-lg p-3 flex justify-between items-center">
                          <span>{match.home_team} vs {match.away_team}</span>
                          <span className="text-sm text-gray-400">{match.match_date}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* View User Predictions */}
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Users size={20} className="text-blue-400" />
                    Ver Palpites de um Usuário
                  </h3>
                  <div className="flex flex-wrap gap-3 mb-4">
                    <input
                      type="text"
                      value={viewUserPredictions}
                      onChange={(e) => setViewUserPredictions(e.target.value)}
                      className="px-4 py-2 bg-gray-700 rounded-lg text-white flex-1"
                      placeholder="Nome do usuário"
                    />
                    <button
                      onClick={handleViewUserPredictions}
                      className="px-4 py-2 bg-blue-500 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                    >
                      Buscar
                    </button>
                  </div>
                  {userPredictions.length > 0 && (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {userPredictions.map((pred, i) => (
                        <div key={i} className="bg-gray-700/50 rounded-lg p-3">
                          <div className="flex justify-between">
                            <span>{pred.home_team} vs {pred.away_team}</span>
                            <span className="font-bold">{pred.home_prediction} x {pred.away_prediction}</span>
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            Pontos: {pred.points || 0} | {pred.championship} R{pred.round_number}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Debug Info */}
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Database size={20} className="text-purple-400" />
                    Informações do Banco de Dados
                  </h3>
                  <button
                    onClick={handleDebugInfo}
                    disabled={maintenanceLoading}
                    className="px-4 py-2 bg-purple-500 rounded-lg font-medium hover:bg-purple-600 transition-colors mb-4"
                  >
                    Carregar Debug
                  </button>
                  {debugInfo && (
                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-xs text-gray-300">{JSON.stringify(debugInfo, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Matches Tab - Gerenciamento Manual de Partidas */}
            {activeTab === "matches" && (
              <div className="space-y-6">
                {/* Seletor de Campeonato e Rodada */}
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <SoccerBall size={20} className="text-green-400" />
                    Gerenciar Partidas
                  </h3>
                  <div className="flex flex-wrap gap-3 items-end mb-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Campeonato</label>
                      <select
                        value={manageChamp}
                        onChange={(e) => setManageChamp(e.target.value)}
                        className="px-4 py-2 bg-gray-700 rounded-lg text-white"
                      >
                        <option value="carioca">Campeonato Carioca</option>
                        <option value="brasileirao">Campeonato Brasileiro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Rodada</label>
                      <input
                        type="number"
                        value={manageRound}
                        onChange={(e) => setManageRound(parseInt(e.target.value) || 1)}
                        min="1"
                        max={manageChamp === 'carioca' ? 6 : 38}
                        className="px-4 py-2 bg-gray-700 rounded-lg text-white w-24"
                      />
                    </div>
                    <button
                      onClick={loadManageMatches}
                      className="px-6 py-2 bg-green-500 rounded-lg font-medium hover:bg-green-600 transition-colors"
                    >
                      Carregar Jogos
                    </button>
                    <button
                      onClick={() => setShowAddMatch(true)}
                      className="px-6 py-2 bg-blue-500 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
                    >
                      <Plus size={18} />
                      Adicionar Partida
                    </button>
                  </div>
                </div>

                {/* Lista de Partidas */}
                {manageMatches.length > 0 && (
                  <div className="bg-gray-800/50 rounded-2xl border border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-700/50">
                          <tr>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Mandante</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Visitante</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Data/Hora</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Placar</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Status</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {manageMatches.map((match) => (
                            <tr key={match.match_id} className="border-t border-gray-700 hover:bg-gray-700/30">
                              {editingMatch === match.match_id ? (
                                // Modo edição
                                <>
                                  <td className="px-4 py-3">
                                    <input
                                      type="text"
                                      defaultValue={match.home_team}
                                      id={`home_${match.match_id}`}
                                      className="px-2 py-1 bg-gray-600 rounded text-white w-full"
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <input
                                      type="text"
                                      defaultValue={match.away_team}
                                      id={`away_${match.match_id}`}
                                      className="px-2 py-1 bg-gray-600 rounded text-white w-full"
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <input
                                      type="datetime-local"
                                      defaultValue={match.match_date?.slice(0, 16)}
                                      id={`date_${match.match_id}`}
                                      className="px-2 py-1 bg-gray-600 rounded text-white"
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        defaultValue={match.home_score ?? ''}
                                        id={`hscore_${match.match_id}`}
                                        className="px-2 py-1 bg-gray-600 rounded text-white w-12 text-center"
                                        min="0"
                                      />
                                      <span>x</span>
                                      <input
                                        type="number"
                                        defaultValue={match.away_score ?? ''}
                                        id={`ascore_${match.match_id}`}
                                        className="px-2 py-1 bg-gray-600 rounded text-white w-12 text-center"
                                        min="0"
                                      />
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="space-y-1">
                                      <label className="flex items-center gap-2 text-sm">
                                        <input
                                          type="checkbox"
                                          defaultChecked={match.is_finished}
                                          id={`finished_${match.match_id}`}
                                          className="rounded"
                                        />
                                        Encerrada
                                      </label>
                                      <label className="flex items-center gap-2 text-sm">
                                        <input
                                          type="checkbox"
                                          defaultChecked={match.predictions_closed}
                                          id={`closed_${match.match_id}`}
                                          className="rounded"
                                        />
                                        Palpites fechados
                                      </label>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => {
                                          const homeTeam = document.getElementById(`home_${match.match_id}`).value;
                                          const awayTeam = document.getElementById(`away_${match.match_id}`).value;
                                          const matchDate = document.getElementById(`date_${match.match_id}`).value;
                                          const homeScore = document.getElementById(`hscore_${match.match_id}`).value;
                                          const awayScore = document.getElementById(`ascore_${match.match_id}`).value;
                                          const isFinished = document.getElementById(`finished_${match.match_id}`).checked;
                                          const predictionsClosed = document.getElementById(`closed_${match.match_id}`).checked;
                                          
                                          handleUpdateMatch(match.match_id, {
                                            home_team: homeTeam,
                                            away_team: awayTeam,
                                            match_date: matchDate ? `${matchDate}:00` : match.match_date,
                                            home_score: homeScore !== '' ? parseInt(homeScore) : null,
                                            away_score: awayScore !== '' ? parseInt(awayScore) : null,
                                            is_finished: isFinished,
                                            predictions_closed: predictionsClosed
                                          });
                                        }}
                                        className="px-3 py-1 bg-green-500 rounded text-sm font-medium hover:bg-green-600"
                                      >
                                        Salvar
                                      </button>
                                      <button
                                        onClick={() => setEditingMatch(null)}
                                        className="px-3 py-1 bg-gray-600 rounded text-sm hover:bg-gray-500"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  </td>
                                </>
                              ) : (
                                // Modo visualização
                                <>
                                  <td className="px-4 py-3 font-medium">{match.home_team}</td>
                                  <td className="px-4 py-3">{match.away_team}</td>
                                  <td className="px-4 py-3 text-sm text-gray-400">
                                    {match.match_date ? new Date(match.match_date).toLocaleString('pt-BR') : '-'}
                                  </td>
                                  <td className="px-4 py-3">
                                    {match.home_score !== null && match.away_score !== null ? (
                                      <span className="font-bold text-lg">{match.home_score} x {match.away_score}</span>
                                    ) : (
                                      <span className="text-gray-500">- x -</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-col gap-1">
                                      {match.is_finished ? (
                                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Encerrada</span>
                                      ) : (
                                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">Em aberto</span>
                                      )}
                                      {match.predictions_closed && (
                                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">Palpites fechados</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => setEditingMatch(match.match_id)}
                                        className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30"
                                        title="Editar"
                                      >
                                        <PencilSimple size={16} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteMatch(match.match_id)}
                                        className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                                        title="Excluir"
                                      >
                                        <Trash size={16} />
                                      </button>
                                    </div>
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {manageMatches.length === 0 && (
                  <div className="bg-gray-800/50 rounded-2xl p-12 text-center border border-gray-700">
                    <SoccerBall size={48} className="mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">Selecione um campeonato e rodada, depois clique em "Carregar Jogos"</p>
                  </div>
                )}

                {/* Modal Adicionar Partida */}
                {showAddMatch && (
                  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-lg border border-gray-700">
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Plus size={24} className="text-green-500" />
                        Adicionar Nova Partida
                      </h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Time Mandante</label>
                            <input
                              type="text"
                              value={newMatch.home_team}
                              onChange={(e) => setNewMatch({...newMatch, home_team: e.target.value})}
                              className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white"
                              placeholder="Ex: Flamengo"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Time Visitante</label>
                            <input
                              type="text"
                              value={newMatch.away_team}
                              onChange={(e) => setNewMatch({...newMatch, away_team: e.target.value})}
                              className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white"
                              placeholder="Ex: Fluminense"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Data</label>
                            <input
                              type="date"
                              value={newMatch.match_date}
                              onChange={(e) => setNewMatch({...newMatch, match_date: e.target.value})}
                              className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Horário</label>
                            <input
                              type="time"
                              value={newMatch.match_time}
                              onChange={(e) => setNewMatch({...newMatch, match_time: e.target.value})}
                              className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Gols Mandante (opcional)</label>
                            <input
                              type="number"
                              value={newMatch.home_score}
                              onChange={(e) => setNewMatch({...newMatch, home_score: e.target.value})}
                              className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white"
                              min="0"
                              placeholder="-"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Gols Visitante (opcional)</label>
                            <input
                              type="number"
                              value={newMatch.away_score}
                              onChange={(e) => setNewMatch({...newMatch, away_score: e.target.value})}
                              className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white"
                              min="0"
                              placeholder="-"
                            />
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={newMatch.is_finished}
                              onChange={(e) => setNewMatch({...newMatch, is_finished: e.target.checked})}
                              className="rounded"
                            />
                            <span className="text-sm">Partida encerrada</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={newMatch.predictions_closed}
                              onChange={(e) => setNewMatch({...newMatch, predictions_closed: e.target.checked})}
                              className="rounded"
                            />
                            <span className="text-sm">Palpites fechados</span>
                          </label>
                        </div>
                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={() => {
                              setShowAddMatch(false);
                              setNewMatch({
                                home_team: "",
                                away_team: "",
                                match_date: "",
                                match_time: "",
                                home_score: "",
                                away_score: "",
                                is_finished: false,
                                predictions_closed: false
                              });
                            }}
                            className="flex-1 px-4 py-3 bg-gray-700 rounded-xl hover:bg-gray-600"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleAddNewMatch}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-bold hover:from-green-400 hover:to-emerald-500"
                          >
                            Adicionar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {maintenanceLoading && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-2xl p-8 text-center">
                      <div className="animate-spin w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-gray-300">Processando...</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
              <div className="space-y-4">
                {/* Add User Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowAddUser(true)}
                    data-testid="add-user-btn"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-medium hover:from-green-400 hover:to-emerald-500 transition-all shadow-lg shadow-green-500/20"
                  >
                    <UserPlus size={20} weight="bold" />
                    Adicionar Usuário
                  </button>
                </div>

                {/* Users Table */}
                <div className="bg-gray-800/50 rounded-2xl border border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-700/50">
                        <tr>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Usuário</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">PIN</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Status</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Chave Premium</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Pontos</th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.username} className="border-t border-gray-700 hover:bg-gray-700/30 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{user.username}</span>
                                {user.is_premium && (
                                  <Star size={16} className="text-yellow-500" weight="fill" />
                                )}
                                {user.pioneer_number && (
                                  <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">
                                    #{user.pioneer_number}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <code className="bg-gray-700 px-2 py-1 rounded text-sm">
                                  {showPins[user.username] ? user.pin : "••••"}
                                </code>
                                <button
                                  onClick={() => setShowPins(prev => ({...prev, [user.username]: !prev[user.username]}))}
                                  className="text-gray-400 hover:text-white transition-colors"
                                >
                                  {showPins[user.username] ? <EyeSlash size={16} /> : <Eye size={16} />}
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedUser(user.username);
                                    setShowEditPin(true);
                                  }}
                                  className="text-blue-400 hover:text-blue-300 transition-colors"
                                  title="Editar PIN"
                                >
                                  <PencilSimple size={16} />
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {user.is_banned ? (
                                <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-full">BANIDO</span>
                              ) : (
                                <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">Ativo</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {user.premium_key ? (
                                <div className="flex items-center gap-2">
                                  <code className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs">
                                    {user.premium_key}
                                  </code>
                                  <button
                                    onClick={() => copyToClipboard(user.premium_key)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                    title="Copiar"
                                  >
                                    <Copy size={14} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedUser(user.username);
                                    setGeneratedKey("");
                                    setShowGenerateKey(true);
                                  }}
                                  className="text-xs text-yellow-500 hover:text-yellow-400 flex items-center gap-1"
                                >
                                  <Key size={14} />
                                  Gerar Chave
                                </button>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-mono font-bold text-lg">{user.total_points || 0}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {/* Toggle Premium */}
                                <button
                                  onClick={() => handleTogglePremium(user.username, user.is_premium)}
                                  className={`p-2 rounded-lg transition-colors ${
                                    user.is_premium
                                      ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                                  }`}
                                  title={user.is_premium ? "Desativar Premium" : "Ativar Premium"}
                                >
                                  {user.is_premium ? <Crown size={16} weight="fill" /> : <Crown size={16} />}
                                </button>

                                {/* Ban/Unban */}
                                <button
                                  onClick={() => handleBan(user.username, user.is_banned)}
                                  className={`p-2 rounded-lg transition-colors ${
                                    user.is_banned
                                      ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                      : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                  }`}
                                  title={user.is_banned ? "Desbanir" : "Banir"}
                                >
                                  {user.is_banned ? <LockOpen size={16} /> : <Lock size={16} />}
                                </button>

                                {/* Remove */}
                                <button
                                  onClick={() => handleRemoveUser(user.username)}
                                  className="p-2 rounded-lg bg-gray-700 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                  title="Remover usuário"
                                >
                                  <Trash size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-3">
                {securityLogs.length === 0 ? (
                  <div className="bg-gray-800/50 rounded-2xl p-12 text-center border border-gray-700">
                    <Check size={64} className="mx-auto text-green-500 mb-4" />
                    <p className="text-xl font-bold text-white mb-2">Tudo Seguro!</p>
                    <p className="text-gray-400">Nenhum evento de segurança registrado</p>
                  </div>
                ) : (
                  securityLogs.map((log, index) => (
                    <div
                      key={index}
                      className={`rounded-xl p-4 border ${getLogTypeColor(log.type)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold mb-1">{getLogTypeLabel(log.type)}</p>
                          <p className="text-sm">
                            <strong>Usuário:</strong> {log.username}
                          </p>
                          {log.attempted_key && (
                            <p className="text-sm">
                              <strong>Chave tentada:</strong> <code className="bg-black/20 px-1 rounded">{log.attempted_key}</code>
                            </p>
                          )}
                          {log.key_owner && (
                            <p className="text-sm">
                              <strong>Dono da chave:</strong> {log.key_owner}
                            </p>
                          )}
                          {log.key && (
                            <p className="text-sm">
                              <strong>Chave:</strong> <code className="bg-black/20 px-1 rounded">{log.key}</code>
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
          </>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <UserPlus size={24} className="text-green-500" />
              Adicionar Novo Usuário
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nome do Usuário</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: João"
                  data-testid="new-user-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">PIN (4 dígitos)</label>
                <input
                  type="text"
                  value={newUserPin}
                  onChange={(e) => setNewUserPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-2xl tracking-widest text-center"
                  placeholder="0000"
                  maxLength={4}
                  data-testid="new-user-pin"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowAddUser(false);
                    setNewUserName("");
                    setNewUserPin("");
                  }}
                  className="flex-1 px-4 py-3 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddUser}
                  data-testid="confirm-add-user"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-bold hover:from-green-400 hover:to-emerald-500 transition-all"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit PIN Modal */}
      {showEditPin && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Key size={24} className="text-blue-500" />
              Alterar PIN de {selectedUser}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Novo PIN (4 dígitos)</label>
                <input
                  type="text"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-2xl tracking-widest text-center"
                  placeholder="0000"
                  maxLength={4}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowEditPin(false);
                    setNewPin("");
                    setSelectedUser(null);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdatePin}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl font-bold hover:from-blue-400 hover:to-blue-500 transition-all"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Key Modal */}
      {showGenerateKey && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Key size={24} className="text-yellow-500" />
              Gerar Chave Premium
            </h3>
            <div className="space-y-4">
              <p className="text-gray-300">
                Gerar chave premium para <strong className="text-white">{selectedUser}</strong>?
              </p>
              
              {generatedKey && (
                <div className="bg-green-500/20 border border-green-500 rounded-xl p-4 text-center">
                  <p className="text-sm text-green-300 mb-2">Chave gerada com sucesso!</p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="text-xl font-bold text-green-400">{generatedKey}</code>
                    <button
                      onClick={() => copyToClipboard(generatedKey)}
                      className="text-green-400 hover:text-green-300"
                    >
                      <Copy size={20} />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowGenerateKey(false);
                    setGeneratedKey("");
                    setSelectedUser(null);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors"
                >
                  {generatedKey ? "Fechar" : "Cancelar"}
                </button>
                {!generatedKey && (
                  <button
                    onClick={handleGenerateKey}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-gray-900 rounded-xl font-bold hover:from-yellow-400 hover:to-amber-500 transition-all"
                  >
                    Gerar Chave
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
