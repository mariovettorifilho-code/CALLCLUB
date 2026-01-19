# 🏆 CallClub - Guia de Configuração

## ✅ O que está pronto:

### Backend (FastAPI):
- ✅ Sistema de whitelist (lista branca de 70 usuários)
- ✅ Autenticação por nome (sem senha)
- ✅ API de palpites completa
- ✅ Sistema de pontuação automático (3 pts resultado + 1 pt gols casa + 1 pt gols fora)
- ✅ Rankings (rodada + geral)
- ✅ Perfil do usuário com estatísticas
- ✅ Integração MongoDB
- ✅ Preparado para API-Football

### Frontend (React):
- ✅ Design "The Gentlemen's League" (exclusivo e aconchegante)
- ✅ Página de Login com verificação de whitelist
- ✅ Home com destaques e Top 5
- ✅ Página de Palpites (estilo ticket)
- ✅ Rankings (rodada + geral) com critério de desempate
- ✅ Perfil do usuário
- ✅ Navegação mobile-first
- ✅ Notificações (Sonner)
- ✅ LocalStorage para lembrar usuário

---

## 🔧 Como Adicionar seus 70 Amigos

### Passo 1: Editar a Whitelist

Abra o arquivo `/app/backend/server.py` e localize a linha 24:

```python
AUTHORIZED_USERS = [
    "Mario", "João", "Pedro", "Carlos", "Lucas", 
    "Rafael", "Bruno", "Fernando", "Ricardo", "Paulo",
    # Adicione os outros 60 nomes aqui quando tiver todos
]
```

**Substitua pelos nomes reais dos seus 70 amigos:**

```python
AUTHORIZED_USERS = [
    "Mario", "João", "Pedro", "Carlos", "Lucas",
    "Rafael", "Bruno", "Fernando", "Ricardo", "Paulo",
    "Anderson", "Gabriel", "Felipe", "Rodrigo", "Thiago",
    "Marcelo", "Diego", "Matheus", "Vinicius", "Gustavo",
    # ... adicione os outros 50 nomes
]
```

### Passo 2: Reiniciar Backend

```bash
sudo supervisorctl restart backend
```

---

## 🎮 Como Usar o CallClub

### Para Você (Administrador):

1. **Compartilhar o link do site** com os 70 amigos
2. **Criar os jogos da rodada** (manualmente ou via API-Football - ver abaixo)
3. **Atualizar resultados** após os jogos terminarem

### Para Seus Amigos:

1. Acessar o site
2. Digitar o nome (deve estar na whitelist)
3. Fazer palpites
4. Acompanhar ranking

---

## 📊 Como Atualizar Resultados dos Jogos

### Opção 1: Manualmente via API

```bash
curl -X POST "SEU_SITE/api/admin/update-results?match_id=1&home_score=3&away_score=1"
```

### Opção 2: Criar interface de Admin (futuro)

Você pode adicionar uma página `/admin` onde só você consegue atualizar os resultados.

---

## 🔐 Segurança da Whitelist

✅ **Como funciona:**
- Apenas os 70 nomes que você adicionar podem entrar
- Sistema verifica nome no backend (não é possível burlar pelo frontend)
- Se alguém tentar entrar com nome não autorizado: acesso negado

⚠️ **Importante:**
- Nomes são **case-sensitive** (Mario ≠ mario)
- Evite nomes duplicados
- Se quiser adicionar mais pessoas depois, basta editar a lista e reiniciar

---

## 🚀 Próximos Passos Recomendados

### Curto Prazo (MVP - 30 dias):
1. ✅ **Adicionar os 70 nomes** na whitelist
2. ⏳ **Criar jogos da primeira rodada** (manualmente ou com API)
3. ⏳ **Compartilhar link** com os amigos
4. ⏳ **Testar com rodada real**
5. ⏳ **Coletar feedback**

### Médio Prazo (60-90 dias):
- Integrar API-Football para resultados automáticos
- Adicionar notificações (WhatsApp/Email quando resultado sai)
- Sistema de badges/conquistas
- Histórico de confrontos diretos entre amigos

### Longo Prazo (6 meses+):
- Abrir para público (com convites)
- Adicionar outros campeonatos (Champions, Premier League)
- Monetização via Premium
- Parcerias com casas de apostas (como discutido)

---

## 🔗 Informações Técnicas

### URLs Importantes:
- **Frontend:** http://localhost:3000 (local) ou seu domínio
- **Backend API:** `REACT_APP_BACKEND_URL/api`
- **MongoDB:** localhost:27017

### Estrutura do Banco de Dados:
- **users** - usuários e estatísticas
- **matches** - jogos
- **predictions** - palpites
- **rounds** - rodadas

### Arquivos Principais:
- **Backend:** `/app/backend/server.py`
- **Frontend:** `/app/frontend/src/pages/`
- **Design:** `/app/design_guidelines.json`

---

## 🐛 Solução de Problemas

### "Nome não autorizado"
→ Adicione o nome na whitelist (`AUTHORIZED_USERS`)

### "Nenhum jogo disponível"
→ Clique em "Criar Jogos de Exemplo" ou use API `/admin/seed-data`

### Palpites não salvam
→ Verifique se o backend está rodando: `sudo supervisorctl status`

### Ranking vazio
→ É normal no início. Após palpites + resultados, aparecerá

---

## 📞 Contato e Suporte

Este site foi criado exclusivamente para seu grupo de 70 amigos.

**Desenvolvido por:** E1 (Emergent AI)
**Data:** Janeiro 2025
**Stack:** FastAPI + React + MongoDB

---

## 🎯 Lembrete Importante

CallClub NÃO é uma casa de apostas. É um jogo de habilidade/competição entre amigos, 100% legal e seguro.

**Boa sorte e bons palpites! 🍀🏆**
