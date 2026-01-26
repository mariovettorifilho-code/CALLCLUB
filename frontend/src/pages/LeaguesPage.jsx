import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { 
  Users, Plus, SignIn, Trophy, Crown, ArrowRight, 
  Copy, Check, X, Shield, SoccerBall, Sparkle
} from "@phosphor-icons/react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function LeaguesPage({ username }) {
  const [userInfo, setUserInfo] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [championships, setChampionships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("minhas"); // minhas | criar | entrar
  
  // Form states
  const [newLeagueName, setNewLeagueName] = useState("");
  const [selectedChampionship, setSelectedChampionship] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formMessage, setFormMessage] = useState({ type: "", text: "" });
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userRes, leaguesRes, champsRes] = await Promise.all([
        axios.get(`${API}/user/${username}`),
        axios.get(`${API}/leagues/user/${username}`),
        axios.get(`${API}/user/${username}/accessible-championships`)
      ]);
      
      setUserInfo(userRes.data);
      setLeagues(leaguesRes.data || []);
      setChampionships(champsRes.data || []);
      
      // Seleciona primeiro campeonato por padrão
      if (champsRes.data?.length > 0) {
        setSelectedChampionship(champsRes.data[0].championship_id);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLeague = async (e) => {
    e.preventDefault();
    setFormMessage({ type: "", text: "" });
    
    if (!newLeagueName.trim()) {
      setFormMessage({ type: "error", text: "Digite o nome da liga" });
      return;
    }
    
    if (!selectedChampionship) {
      setFormMessage({ type: "error", text: "Selecione um campeonato" });
      return;
    }
    
    setFormLoading(true);
    
    try {
      const res = await axios.post(`${API}/leagues/create`, {
        name: newLeagueName.trim(),
        owner_username: username,
        championship_id: selectedChampionship
      });
      
      if (res.data.success) {
        setFormMessage({ 
          type: "success", 
          text: `Liga criada! Código de convite: ${res.data.league.invite_code}` 
        });
        setNewLeagueName("");
        loadData(); // Recarrega ligas
        
        // Mostra código para copiar
        setTimeout(() => setActiveTab("minhas"), 2000);
      }
    } catch (error) {
      const detail = error.response?.data?.detail || "Erro ao criar liga";
      setFormMessage({ type: "error", text: detail });
    } finally {
      setFormLoading(false);
    }
  };

  const handleJoinLeague = async (e) => {
    e.preventDefault();
    setFormMessage({ type: "", text: "" });
    
    if (!inviteCode.trim()) {
      setFormMessage({ type: "error", text: "Digite o código de convite" });
      return;
    }
    
    setFormLoading(true);
    
    try {
      const res = await axios.post(`${API}/leagues/join`, {
        username: username,
        invite_code: inviteCode.trim().toUpperCase()
      });
      
      if (res.data.success) {
        setFormMessage({ 
          type: "success", 
          text: `Você entrou na liga "${res.data.league.name}"!` 
        });
        setInviteCode("");
        loadData();
        
        setTimeout(() => setActiveTab("minhas"), 2000);
      }
    } catch (error) {
      const detail = error.response?.data?.detail || "Código inválido ou liga não encontrada";
      setFormMessage({ type: "error", text: detail });
    } finally {
      setFormLoading(false);
    }
  };

  const copyInviteCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getChampionshipName = (id) => {
    return championships.find(c => c.championship_id === id)?.name || id;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pitch-green border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-text-secondary">Carregando ligas...</p>
        </div>
      </div>
    );
  }

  const plan = userInfo?.user?.plan || "free";
  const isPremium = plan === "premium" || plan === "vip";
  const ownedLeagues = leagues.filter(l => l.owner_username === username);
  const joinedLeagues = leagues.filter(l => l.owner_username !== username);
  const canCreateMore = plan === "vip" || ownedLeagues.length < 2;

  // Se não é premium, mostra aviso
  if (!isPremium) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-8 text-center border-2 border-yellow-200">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown size={40} weight="fill" className="text-yellow-600" />
          </div>
          
          <h1 className="font-heading text-2xl font-bold text-yellow-800 mb-4">
            Recurso Premium
          </h1>
          
          <p className="text-yellow-700 mb-6 max-w-md mx-auto">
            Ligas privadas são exclusivas para usuários <strong>PREMIUM</strong>. 
            Com o plano Premium você pode criar até 2 ligas e convidar seus amigos!
          </p>
          
          <div className="bg-white rounded-xl p-6 mb-6 text-left">
            <h3 className="font-bold text-text-primary mb-4">Benefícios Premium:</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-text-secondary">
                <Check size={20} className="text-green-500" weight="bold" />
                Criar até 2 ligas privadas
              </li>
              <li className="flex items-center gap-3 text-text-secondary">
                <Check size={20} className="text-green-500" weight="bold" />
                Participar de ligas de amigos
              </li>
              <li className="flex items-center gap-3 text-text-secondary">
                <Check size={20} className="text-green-500" weight="bold" />
                Acesso a 2 campeonatos extras
              </li>
              <li className="flex items-center gap-3 text-text-secondary">
                <Check size={20} className="text-green-500" weight="bold" />
                Badge exclusivo na classificação 💎
              </li>
            </ul>
          </div>
          
          <p className="text-sm text-yellow-600">
            Em breve: planos de assinatura disponíveis
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <Users size={28} weight="fill" />
          <h1 className="font-heading text-2xl font-bold">Ligas Privadas</h1>
        </div>
        <p className="text-white/90">
          Crie ligas com seus amigos e compita em rankings exclusivos!
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl p-1 shadow-lg border-2 border-paper flex">
        <button
          onClick={() => setActiveTab("minhas")}
          data-testid="tab-minhas-ligas"
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all ${
            activeTab === "minhas" 
              ? "bg-pitch-green text-white" 
              : "text-text-secondary hover:bg-paper"
          }`}
        >
          <Trophy size={20} weight={activeTab === "minhas" ? "fill" : "regular"} />
          Minhas Ligas
        </button>
        <button
          onClick={() => setActiveTab("criar")}
          data-testid="tab-criar-liga"
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all ${
            activeTab === "criar" 
              ? "bg-pitch-green text-white" 
              : "text-text-secondary hover:bg-paper"
          }`}
        >
          <Plus size={20} weight={activeTab === "criar" ? "bold" : "regular"} />
          Criar Liga
        </button>
        <button
          onClick={() => setActiveTab("entrar")}
          data-testid="tab-entrar-liga"
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all ${
            activeTab === "entrar" 
              ? "bg-pitch-green text-white" 
              : "text-text-secondary hover:bg-paper"
          }`}
        >
          <SignIn size={20} weight={activeTab === "entrar" ? "fill" : "regular"} />
          Entrar
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl shadow-xl border-2 border-paper overflow-hidden">
        
        {/* Minhas Ligas */}
        {activeTab === "minhas" && (
          <div className="p-6">
            {leagues.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-paper rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users size={40} className="text-text-secondary" />
                </div>
                <h3 className="font-heading text-xl font-bold text-text-primary mb-2">
                  Nenhuma liga ainda
                </h3>
                <p className="text-text-secondary mb-6">
                  Crie sua primeira liga ou entre em uma usando um código de convite!
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setActiveTab("criar")}
                    className="inline-flex items-center gap-2 bg-pitch-green text-white px-6 py-3 rounded-xl font-semibold hover:bg-pitch-green/90 transition-all"
                  >
                    <Plus size={20} weight="bold" />
                    Criar Liga
                  </button>
                  <button
                    onClick={() => setActiveTab("entrar")}
                    className="inline-flex items-center gap-2 bg-paper text-text-primary px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                  >
                    <SignIn size={20} />
                    Entrar com Código
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Ligas que criei */}
                {ownedLeagues.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Crown size={20} weight="fill" className="text-yellow-500" />
                      <h3 className="font-heading font-bold text-text-primary">
                        Ligas que criei ({ownedLeagues.length}/2)
                      </h3>
                    </div>
                    <div className="grid gap-4">
                      {ownedLeagues.map((league) => (
                        <LeagueCard 
                          key={league.league_id} 
                          league={league} 
                          isOwner={true}
                          championshipName={getChampionshipName(league.championship_id)}
                          onCopyCode={copyInviteCode}
                          copiedCode={copiedCode}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Ligas que participo */}
                {joinedLeagues.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Users size={20} weight="fill" className="text-pitch-green" />
                      <h3 className="font-heading font-bold text-text-primary">
                        Ligas que participo
                      </h3>
                    </div>
                    <div className="grid gap-4">
                      {joinedLeagues.map((league) => (
                        <LeagueCard 
                          key={league.league_id} 
                          league={league} 
                          isOwner={false}
                          championshipName={getChampionshipName(league.championship_id)}
                          onCopyCode={copyInviteCode}
                          copiedCode={copiedCode}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Criar Liga */}
        {activeTab === "criar" && (
          <div className="p-6">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-pitch-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus size={32} className="text-pitch-green" weight="bold" />
                </div>
                <h3 className="font-heading text-xl font-bold text-text-primary">
                  Criar Nova Liga
                </h3>
                <p className="text-text-secondary text-sm mt-1">
                  {canCreateMore 
                    ? `Você pode criar mais ${2 - ownedLeagues.length} liga(s)`
                    : "Você atingiu o limite de ligas"
                  }
                </p>
              </div>
              
              {!canCreateMore ? (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
                  <Shield size={40} className="text-yellow-600 mx-auto mb-3" />
                  <p className="text-yellow-800 font-semibold">
                    Limite de 2 ligas atingido
                  </p>
                  <p className="text-yellow-700 text-sm mt-2">
                    Delete uma liga existente para criar uma nova
                  </p>
                </div>
              ) : (
                <form onSubmit={handleCreateLeague} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                      Nome da Liga
                    </label>
                    <input
                      type="text"
                      value={newLeagueName}
                      onChange={(e) => setNewLeagueName(e.target.value)}
                      placeholder="Ex: Liga dos Crias"
                      data-testid="input-league-name"
                      className="w-full px-4 py-3 rounded-xl border-2 border-paper bg-paper focus:border-pitch-green focus:bg-white focus:outline-none transition-all"
                      maxLength={30}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                      Campeonato
                    </label>
                    <select
                      value={selectedChampionship}
                      onChange={(e) => setSelectedChampionship(e.target.value)}
                      data-testid="select-championship"
                      className="w-full px-4 py-3 rounded-xl border-2 border-paper bg-paper focus:border-pitch-green focus:bg-white focus:outline-none transition-all"
                    >
                      {championships.map((champ) => (
                        <option key={champ.championship_id} value={champ.championship_id}>
                          {champ.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-text-secondary mt-1">
                      A liga acompanhará este campeonato
                    </p>
                  </div>
                  
                  {formMessage.text && activeTab === "criar" && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 ${
                      formMessage.type === "success" 
                        ? "bg-green-50 text-green-800 border border-green-200" 
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}>
                      {formMessage.type === "success" ? (
                        <Check size={20} weight="bold" />
                      ) : (
                        <X size={20} weight="bold" />
                      )}
                      {formMessage.text}
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={formLoading}
                    data-testid="btn-create-league"
                    className="w-full bg-gradient-to-r from-pitch-green to-emerald-600 text-white py-4 rounded-xl font-bold hover:from-pitch-green/90 hover:to-emerald-600/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {formLoading ? (
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <>
                        <Sparkle size={20} weight="fill" />
                        Criar Liga
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Entrar em Liga */}
        {activeTab === "entrar" && (
          <div className="p-6">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SignIn size={32} className="text-blue-600" />
                </div>
                <h3 className="font-heading text-xl font-bold text-text-primary">
                  Entrar em uma Liga
                </h3>
                <p className="text-text-secondary text-sm mt-1">
                  Peça o código de convite para o criador da liga
                </p>
              </div>
              
              <form onSubmit={handleJoinLeague} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    Código de Convite
                  </label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="Ex: ABC123"
                    data-testid="input-invite-code"
                    className="w-full px-4 py-3 rounded-xl border-2 border-paper bg-paper focus:border-pitch-green focus:bg-white focus:outline-none transition-all text-center text-2xl font-mono tracking-widest uppercase"
                    maxLength={6}
                  />
                </div>
                
                {formMessage.text && activeTab === "entrar" && (
                  <div className={`p-4 rounded-xl flex items-center gap-3 ${
                    formMessage.type === "success" 
                      ? "bg-green-50 text-green-800 border border-green-200" 
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}>
                    {formMessage.type === "success" ? (
                      <Check size={20} weight="bold" />
                    ) : (
                      <X size={20} weight="bold" />
                    )}
                    {formMessage.text}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={formLoading || inviteCode.length < 6}
                  data-testid="btn-join-league"
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-xl font-bold hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {formLoading ? (
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <>
                      <SignIn size={20} weight="fill" />
                      Entrar na Liga
                    </>
                  )}
                </button>
              </form>
              
              <div className="mt-8 p-4 bg-paper rounded-xl">
                <h4 className="font-semibold text-text-primary text-sm mb-2">
                  Como funciona?
                </h4>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-pitch-green font-bold">1.</span>
                    Peça o código de 6 caracteres para quem criou a liga
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pitch-green font-bold">2.</span>
                    Digite o código acima e clique em &quot;Entrar&quot;
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pitch-green font-bold">3.</span>
                    Pronto! Seus palpites já contam para a liga
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente de Card de Liga
function LeagueCard({ league, isOwner, championshipName, onCopyCode, copiedCode }) {
  return (
    <div className="bg-paper rounded-xl p-4 hover:bg-gray-100 transition-all border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isOwner ? "bg-yellow-100" : "bg-pitch-green/10"
          }`}>
            {isOwner ? (
              <Crown size={24} weight="fill" className="text-yellow-600" />
            ) : (
              <Users size={24} weight="fill" className="text-pitch-green" />
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-text-primary">{league.name}</h4>
              {isOwner && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">
                  Dono
                </span>
              )}
            </div>
            <p className="text-sm text-text-secondary">
              {championshipName} • {league.members?.length || 0} membros
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isOwner && (
            <button
              onClick={() => onCopyCode(league.invite_code)}
              data-testid={`copy-code-${league.league_id}`}
              className="flex items-center gap-1 text-xs bg-white border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all"
              title="Copiar código de convite"
            >
              {copiedCode === league.invite_code ? (
                <>
                  <Check size={14} className="text-green-500" weight="bold" />
                  <span className="text-green-600 font-semibold">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy size={14} className="text-text-secondary" />
                  <span className="font-mono font-semibold text-text-primary">{league.invite_code}</span>
                </>
              )}
            </button>
          )}
          
          <Link
            to={`/leagues/${league.league_id}`}
            data-testid={`view-league-${league.league_id}`}
            className="bg-pitch-green text-white p-2 rounded-lg hover:bg-pitch-green/90 transition-all"
          >
            <ArrowRight size={20} weight="bold" />
          </Link>
        </div>
      </div>
    </div>
  );
}
