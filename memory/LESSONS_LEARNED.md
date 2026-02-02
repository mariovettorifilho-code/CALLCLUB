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

## 📋 Checklist Antes de Deploy

- [ ] Testar login com usuário existente
- [ ] Testar login com usuário novo (adicionado pelo Admin)
- [ ] Verificar se o Painel Admin está acessível
- [ ] Testar funcionalidade de adicionar usuário
- [ ] Testar funcionalidade de deletar usuário

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

---

*Última atualização: 27/01/2026*
