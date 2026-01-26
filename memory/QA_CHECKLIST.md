# CallClub - QA Checklist & Lições Aprendidas

## 📋 Checklist de QA - Ligas Privadas

### ✅ Funcionalidades Core
- [x] Convite via WhatsApp (botão nos cards, mensagem formatada, link válido)
- [x] Jogos seedados (Serie A) carregam corretamente
- [x] Ranking atualizado em tempo real (tabs Geral / Por Rodada)
- [x] Modal de palpites funciona ao clicar no usuário
- [x] Filtro de ligas no perfil (select + optgroup)
- [x] Micro-interações e badges consistentes com Free
- [x] Endpoints existentes sem regressão
- [x] UI/UX geral consistente com Free

### ✅ Endpoints Validados
```
✅ /api/user/{username}
✅ /api/leagues/user/{username}
✅ /api/ranking/detailed/{championship_id}
✅ /api/ranking/round/{round}?championship_id=...
✅ /api/matches/{round}?championship_id=...
✅ /api/leagues/{league_id}
✅ /api/user/{username}/accessible-championships
```

---

## 📝 Lições Aprendidas

### 1. Evitar Duplicações de Código
**Problema encontrado:** Tag `</Link>` duplicada em LeaguesPage.jsx

**Causa:** Ao adicionar novo código, copiei um bloco sem remover a tag de fechamento extra.

**Prevenção:**
- Sempre usar `view_file` na região antes de editar
- Contar tags abertas/fechadas para garantir pareamento
- Usar `grep` para verificar se função/componente já existe
- Validar build após cada edição

### 2. Verificar Ambiente de Banco de Dados
**Problema encontrado:** Seeds indo para banco errado (`callclub` vs `test_database`)

**Causa:** Confusão entre variáveis de ambiente e bancos diferentes.

**Prevenção:**
- Verificar `DB_NAME` no .env antes de fazer seeds
- Testar via API (não direto no banco) para validar dados
- Comparar ambientes (preview, produção, local)

### 3. React Keys em Listas
**Problema encontrado:** Warning de key duplicada no PredictionsPage

**Causa:** Mesmo `championship_id` aparecendo múltiplas vezes (acesso nacional + via liga)

**Solução:**
```jsx
// Ruim
key={champ.championship_id}

// Bom
key={`${champ.championship_id}_${champ.access_type}_${champ.league_id || idx}`}
```

---

## 🛠️ Boas Práticas de Desenvolvimento

### Antes de Editar
1. `view_file` na região que será alterada
2. `grep` para verificar se código já existe
3. Verificar imports necessários

### Durante a Edição
1. Alteração mínima (não reescrever blocos inteiros)
2. Manter padrão existente do arquivo
3. Adicionar `data-testid` em elementos interativos

### Após a Edição
1. Verificar logs do frontend (`tail /var/log/supervisor/frontend.out.log`)
2. Testar endpoint via curl
3. Screenshot para validar UI

---

## 📊 Dados de Teste Disponíveis

| Usuário | PIN | Plano | Ligas |
|---------|-----|-------|-------|
| Mario | 2412 | PREMIUM | Dono: Liga dos Crias, Os Boleiros |
| Marcos | 6969 | PREMIUM | Membro das 2 ligas |
| João | 1234 | PREMIUM | Membro: Liga dos Crias |
| Carlos | 5678 | FREE | Nenhuma |

| Liga | Código | Campeonato | Membros |
|------|--------|------------|---------|
| Liga dos Crias | 1RFA1C | Brasileirão | Mario, Marcos, João, Carlos |
| Os Boleiros | XTL7V5 | Serie A | Mario, Marcos |

---

## 🔧 Comandos Úteis

```bash
# Verificar status dos serviços
sudo supervisorctl status

# Logs do frontend
tail -n 50 /var/log/supervisor/frontend.out.log

# Logs do backend
tail -n 50 /var/log/supervisor/backend.err.log

# Testar endpoint
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
curl -s "$API_URL/api/user/Mario" | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin), indent=2))"

# Buscar código em arquivo
grep -n "searchTerm" /app/frontend/src/pages/SomePage.jsx
```

---

**Última atualização:** 26/01/2026 - V1.1.2
