# CallClub - Contexto para Próximo Agente

## 🏷️ Versão: 1.0 (V1) - FINAL
**Data de Consolidação:** 26/01/2026  
**Status:** ✅ Estável | Produção Ready

---

## 1. Visão Geral do Produto

**CallClub** é uma plataforma de palpites esportivos focada em futebol, onde usuários fazem previsões de placares, competem em rankings e podem criar ligas privadas com amigos.

### Modelo de Negócio
- **Freemium** com 3 níveis de plano
- Foco inicial: mercado brasileiro
- Visão futura: expansão global multi-esporte

### Público-Alvo Atual
- Beta testers (amigos próximos do fundador)
- Todos os beta testers têm plano PREMIUM automaticamente

---

## 2. Decisões de Negócio Tomadas (V1)

### ✅ Aprovadas e Implementadas

| Decisão | Justificativa |
|---------|---------------|
| Remover Campeonato Carioca | Foco em campeonatos nacionais principais |
| Plano FREE = campeonato do país | Aumenta adesão inicial sem custo |
| Beta testers = PREMIUM | Permite testar todas funcionalidades |
| Travamento 1 min após início | Previne palpites após ver o jogo começar |
| Pontos calculados por jogo | Rankings atualizados em tempo real |
| Palpites visíveis só após jogo | Transparência sem spoilers |

### ❌ Rejeitadas/Adiadas

| Decisão | Status | Motivo |
|---------|--------|--------|
| Monetização na V1 | Adiado | Foco em validar produto primeiro |
| Outros esportes | Futuro (V2+) | Complexidade técnica |
| Notificações push | Futuro | Requer infraestrutura adicional |

---

## 3. Regras Globais do Sistema

### 🔒 Sistema de Pontuação (NÃO ALTERAR)

```
┌─────────────────────────────────────┐
│  ACERTO DO RESULTADO (V/E/D) = 3 pts │
│  + Gols do mandante corretos = +1 pt │
│  + Gols do visitante corretos = +1 pt│
│  ────────────────────────────────────│
│  MÁXIMO POR JOGO = 5 pontos          │
└─────────────────────────────────────┘
```

**Critérios de Desempate:**
1. Total de placares exatos (5 pts)
2. Total de resultados corretos (3+ pts)

> ⚠️ **LOCKED:** Qualquer alteração no sistema de pontuação deve ser validada pelo Product Owner.

### 🔒 Sistema de Planos (NÃO ALTERAR)

| Plano | Campeonatos | Ligas | Preço |
|-------|-------------|-------|-------|
| FREE | 1 (nacional do país) | 0 | Grátis |
| PREMIUM | 3 (nacional + 2 extras) | 2 | TBD |
| VIP | Ilimitado | Ilimitado | TBD |

### 🔒 Regras de Palpites (NÃO ALTERAR)

1. **Criação:** Usuário pode criar palpite a qualquer momento antes do jogo
2. **Edição:** Permitida apenas antes do jogo começar
3. **Travamento:** Automático 1 minuto após o horário oficial de início
4. **Visualização:** Palpites de outros usuários só visíveis após jogo finalizado
5. **Cálculo:** Pontos calculados imediatamente quando jogo é marcado como finalizado

---

## 4. O Que NÃO Deve Ser Alterado Sem Validação

### 🚫 Arquivos Críticos

| Arquivo | Motivo |
|---------|--------|
| Sistema de pontuação em `server.py` | Regra de negócio central |
| Estrutura de planos em `schemas.py` | Modelo de monetização |
| Horários de travamento | Integridade do jogo |
| Critérios de desempate | Afeta ranking existente |

### 🚫 Collections MongoDB

| Collection | Campos Críticos |
|------------|-----------------|
| `users` | `plan`, `pioneer_number` |
| `predictions` | `points_earned` (calculado pelo sistema) |
| `matches` | `is_finished`, `status` |

### 🚫 Fluxos Validados

1. **Login:** Usuário + PIN → JWT → Acesso
2. **Palpite:** Selecionar jogo → Inserir placar → Salvar (se não travado)
3. **Ranking:** Soma de pontos → Ordenação → Desempate
4. **Admin:** Sincronizar → Definir resultado → Calcular pontos

---

## 5. Arquitetura Técnica

### Stack Tecnológico
```
Frontend: React 18 + Tailwind CSS + Shadcn/UI
Backend:  FastAPI + Motor (async MongoDB)
Database: MongoDB Atlas
API:      TheSportsDB (dados de partidas)
```

### Estrutura de Diretórios
```
/app/
├── backend/
│   ├── server.py              # API principal (~1200 linhas)
│   ├── models/
│   │   └── schemas.py         # Pydantic models
│   └── services/
│       ├── country_detector.py
│       └── league_service.py
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── HomePage.jsx
│       │   ├── LoginPage.jsx
│       │   ├── PredictionsPage.jsx
│       │   ├── RankingsPage.jsx
│       │   ├── ProfilePage.jsx
│       │   └── AdminPage.jsx
│       └── components/
│           └── UserPredictionsModal.jsx
└── memory/
    ├── PRD.md
    └── CHANGELOG.md
```

### Collections MongoDB
- `users` - Usuários, planos, pioneiros
- `championships` - Campeonatos cadastrados
- `matches` - Partidas e resultados
- `predictions` - Palpites dos usuários
- `leagues` - Ligas privadas
- `security_logs` - Auditoria

---

## 6. Endpoints Críticos

### Palpites
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/save-prediction` | Salva palpite (verifica travamento) |
| GET | `/api/user-predictions/{username}` | Palpites do usuário (para modal) |

### Ranking
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/ranking` | Classificação geral |
| GET | `/api/ranking/round/{round}` | Classificação por rodada |

### Admin
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/admin/matches/update` | Atualiza resultado e calcula pontos |
| POST | `/api/admin/sync` | Sincroniza partidas da API |

---

## 7. Credenciais de Teste

| Recurso | Acesso |
|---------|--------|
| Admin Panel | `/admin` → Senha: `callclub2026` |
| Usuário 1 | Mario / PIN: `2412` |
| Usuário 2 | Marcos / PIN: `6969` |

---

## 8. Features da V1 (Completas)

- [x] Login por nome + PIN
- [x] Sistema de planos (FREE/PREMIUM/VIP)
- [x] Palpites com travamento automático
- [x] Ranking geral e por rodada
- [x] Modal de transparência de palpites
- [x] Perfil com estatísticas e conquistas
- [x] Admin panel completo
- [x] Sistema de ligas (backend)

---

## 9. Roadmap Pós-V1

### V1.1 (Próximo)
- [ ] UI para criar/entrar em ligas
- [ ] Seleção manual de país
- [ ] Ajustes de UX

### V1.2
- [ ] Feed de atividades
- [ ] Campeonatos extras funcionais

### V2.0
- [ ] Plano VIP ativo
- [ ] Outros esportes
- [ ] Monetização

---

## 10. Comunicação com o Usuário

**Idioma:** Português (Brasil)  
**Tom:** Informal e amigável ("mano", "beleza")  
**Preferência:** Respostas diretas, sem enrolação

---

## 11. Erros Comuns a Evitar

1. **Não mexer em pontuação** sem autorização explícita
2. **Não confundir preview vs produção** - são bancos diferentes
3. **Não alterar horários de travamento** - regra de negócio crítica
4. **Não expor palpites** de jogos não finalizados
5. **Não assumir timezone** - sempre usar UTC e converter para exibição

---

**CallClub V1.0 © 2026**
