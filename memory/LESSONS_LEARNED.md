# 📚 Lições Aprendidas - CallClub

## 🚨 CRÍTICO: Sistema de Autenticação

### Problema (27/01/2026)
**Sintoma:** Usuários não conseguiam fazer login. Mensagem: "Nome não autorizado"

**Causa Raiz:** 
O sistema de login usava uma lista `AUTHORIZED_USERS` **hardcoded** no código Python. Quando usuários eram adicionados pelo Painel Admin, eles iam para o banco de dados, mas NÃO eram adicionados na lista hardcoded do código.

**Código Problemático:**
```python
# ❌ ERRADO - Lista hardcoded
AUTHORIZED_USERS = {
    "Mario": "2412",
    "Marcos": "1234",
    # ... apenas esses usuários podiam logar
}

if data.username not in AUTHORIZED_USERS:
    raise HTTPException(status_code=403, detail="Nome não autorizado")
```

**Solução:**
```python
# ✅ CORRETO - Consulta o banco de dados
user = await db.users.find_one({"username": data.username})

if not user:
    raise HTTPException(status_code=403, detail="Nome não autorizado")

if user.get("pin") != data.pin:
    raise HTTPException(status_code=403, detail="PIN incorreto")
```

### Regra de Ouro
> **NUNCA use listas hardcoded para autenticação.** 
> Sempre consulte o banco de dados para validar usuários e senhas.

---

## 🎯 Estatísticas do Usuário na Home

### Problema (02/02/2026)
**Sintoma:** Posição do usuário na classificação sempre mostrava "#-"

**Causa Raiz:** 
A função `getUserRank()` buscava a posição do usuário apenas nos TOP 5 (`topPlayers`), não no ranking completo.

**Código Problemático:**
```javascript
// ❌ ERRADO - Busca só nos top 5
const getUserRank = () => {
  const index = topPlayers.findIndex(p => p.username === username);
  return index >= 0 ? index + 1 : null;
};
```

**Solução:**
```javascript
// ✅ CORRETO - Busca no ranking completo
const fullRanking = rankingRes.data?.ranking || [];
setTopPlayers(fullRanking.slice(0, 5));

// Encontra posição do usuário no ranking COMPLETO
const userIndex = fullRanking.findIndex(p => p.username === username);
setUserPosition(userIndex >= 0 ? userIndex + 1 : null);
```

### Regra de Ouro
> **Sempre buscar dados do usuário no conjunto COMPLETO, não em subconjuntos filtrados.**

---

## 📊 Exibição de Posição em Empates

### Requisito (02/02/2026)
Quando usuários têm a mesma pontuação, a posição deve ficar em branco (sem número) visualmente.

**Implementação:**
```javascript
// Verifica se há empate de pontos com o jogador anterior
const prevPlayer = index > 0 ? displayData[index - 1] : null;
const hasTie = prevPlayer && prevPlayer.total_points === player.total_points;

// Exibe posição ou vazio se empate
{hasTie ? "" : `${position}º`}
```

### Regra
> **Empates de pontuação NÃO mostram número de posição repetido.** 
> Apenas o primeiro do grupo empatado mostra a posição.

---

## 📋 Checklist Antes de Deploy

- [ ] Testar login com usuário existente
- [ ] Testar login com usuário novo (adicionado pelo Admin)
- [ ] Verificar se o Painel Admin está acessível
- [ ] Testar funcionalidade de adicionar usuário
- [ ] Testar funcionalidade de deletar usuário
- [ ] Testar atualização de PIN
- [ ] Verificar posição do usuário na Home

---

## 🔧 Problemas Comuns e Soluções

### 1. Usuários com PIN "N/A" no Admin
**Causa:** Usuários antigos criados antes de ter o campo `pin` no banco
**Solução:** Adicionar/atualizar o PIN via Painel Admin → Usuários → ícone de editar

### 2. Pontos não zerando
**Causa:** Os pontos são calculados dos PALPITES, não do campo `total_points`
**Solução:** Usar "Zerar Estatísticas" que agora também deleta todos os palpites

### 3. Classificação não aparece
**Causa:** Nenhum jogo finalizado ainda
**Solução:** Aguardar jogos terminarem ou inserir placares manualmente

### 4. API de Sincronização com erro
**Causa:** Limite de requisições da API externa (TheSportsDB)
**Solução:** Usar "Atualizar Resultados" ou inserir placares manualmente

### 5. Posição "#-" nas estatísticas
**Causa:** Função buscava posição apenas no TOP 5
**Solução:** Buscar no ranking completo antes de filtrar

---

## 🗂️ Arquitetura Correta

```
Painel Admin (Frontend)
    ↓
API Endpoints (Backend)
    ↓
MongoDB (Banco de Dados) ← ÚNICA FONTE DE VERDADE
```

**Nunca** manter dados de usuários em:
- Variáveis hardcoded no código
- Arquivos de configuração
- Cache local

---

## 📅 Histórico de Incidentes

| Data | Problema | Impacto | Tempo Resolução |
|------|----------|---------|-----------------|
| 27/01/2026 | Login bloqueado | 100% usuários | ~30 min |
| 02/02/2026 | Posição não aparecia | Visual | ~15 min |
| 02/02/2026 | Estatísticas do Perfil zeradas | Visual | ~20 min |

---

## 🎯 Funcionalidades Implementadas

### Variação de Posição (02/02/2026)
Mostra se o usuário subiu, desceu ou manteve posição na classificação:
- **↑7** (verde) = Subiu 7 posições
- **↓4** (vermelho) = Caiu 4 posições
- **■** (cinza) = Manteve posição

**Implementação:**
- Backend salva posição anterior em `user.previous_positions.{championship_id}`
- Posição é atualizada no `recalculate_all_points()`
- Frontend exibe a diferença na coluna de posição

### Estatísticas Completas do Perfil (02/02/2026)
Campos calculados no endpoint `/api/user/{username}`:
- `total_points`: soma de todos os pontos
- `perfect_scores`: total de placares exatos
- `games_played`: jogos com resultado
- `correct_results`: acertou V/E/D (3+ pts)
- `avg_points_per_game`: média de pontos
- `accuracy_rate`: aproveitamento %
- `rounds_played`: rodadas participadas
- `points_by_round`: pontos por rodada

---

*Última atualização: 02/02/2026*
