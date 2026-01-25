# CallClub - Product Requirements Document

## 1. Visão Geral

**CallClub** é uma plataforma global de palpites esportivos que permite usuários fazerem previsões em partidas de futebol, competirem em rankings e criarem suas próprias ligas com amigos.

## 2. Mudança Estratégica (Janeiro 2026)

### Antes (Modelo Local)
- Campeonato Carioca (FREE)
- Campeonato Brasileiro (PREMIUM com chave)
- Foco em amigos brasileiros

### Agora (Modelo Global)
- Plataforma multi-país
- Sistema de planos escalável (FREE/PREMIUM/VIP)
- Campeonato nacional automático por país
- Ligas customizáveis
- Visão de escala global

## 3. Sistema de Planos

### 🆓 FREE
- Acesso ao campeonato nacional principal do país do usuário
- Detecção automática por IP + escolha manual
- Sem limite de palpites
- Participação em rankings

### ⭐ PREMIUM
- Tudo do FREE +
- Criar até **2 ligas próprias** (grupos privados)
- Acessar até **2 campeonatos extras** (ex: Libertadores, Champions)
- Código de convite para ligas

### 👑 VIP (Futuro)
- Ligas ilimitadas
- Campeonatos ilimitados
- Outros esportes (F1, NBA, UFC, etc.)

## 4. Países e Campeonatos Suportados

| País | Código | Campeonato Nacional |
|------|--------|---------------------|
| Brasil | BR | Campeonato Brasileiro |
| Itália | IT | Serie A |
| Espanha | ES | La Liga |
| Inglaterra | EN | Premier League |
| Alemanha | DE | Bundesliga |
| França | FR | Ligue 1 |
| Portugal | PT | Primeira Liga |
| Argentina | AR | Liga Argentina |
| Holanda | NL | Eredivisie |
| EUA | US | MLS |

**Campeonatos Extras (Premium):**
- Copa Libertadores
- UEFA Champions League
- (Outros podem ser adicionados via Admin)

## 5. Arquitetura Técnica

### Frontend
- React + Tailwind CSS
- Componentes Shadcn/UI
- Phosphor Icons

### Backend
- FastAPI (Python)
- Motor (MongoDB async driver)
- Pydantic para validação

### Database (MongoDB)
**Collections:**
- `users` - Usuários e planos
- `championships` - Campeonatos cadastrados
- `matches` - Partidas
- `predictions` - Palpites
- `leagues` - Ligas customizadas

### APIs Externas
- TheSportsDB - Dados de partidas e escudos

## 6. Schemas do Banco

### users
```json
{
  "username": "Mario",
  "plan": "premium",
  "country": "BR",
  "total_points": 0,
  "owned_leagues": [],
  "joined_leagues": [],
  "extra_championships": [],
  "achievements": ["pioneer", "beta_tester"],
  "pioneer_number": 1,
  "is_banned": false,
  "created_at": "2026-01-25T00:00:00Z"
}
```

### championships
```json
{
  "championship_id": "brasileirao",
  "name": "Campeonato Brasileiro",
  "country": "BR",
  "api_id": "4351",
  "is_national": true,
  "season": "2026",
  "total_rounds": 38,
  "is_active": true
}
```

### leagues
```json
{
  "league_id": "abc123",
  "name": "Liga dos Crias",
  "owner_username": "Mario",
  "invite_code": "XYZ789",
  "championship_id": "brasileirao",
  "members": ["Mario", "Marcos"],
  "max_members": 100,
  "is_active": true
}
```

## 7. Endpoints Principais

### Autenticação
- `POST /api/auth/check-name` - Login com nome + PIN
- `POST /api/auth/update-country` - Atualiza país do usuário

### Campeonatos
- `GET /api/championships` - Lista todos
- `GET /api/user/{username}/accessible-championships` - Campeonatos acessíveis

### Ligas
- `POST /api/leagues/create` - Criar liga (Premium)
- `POST /api/leagues/join` - Entrar por código
- `GET /api/leagues/{league_id}` - Detalhes + ranking

### Palpites
- `POST /api/predictions` - Salvar palpite
- `GET /api/predictions/{username}` - Buscar palpites

### Rankings
- `GET /api/ranking/detailed/{championship_id}` - Ranking completo
- `GET /api/ranking/league/{league_id}` - Ranking da liga

### Admin
- `GET /api/admin/stats` - Estatísticas gerais
- `POST /api/admin/update-plan` - Atualizar plano de usuário
- `GET /api/admin/force-populate` - Sincronizar partidas

## 8. O que foi implementado (25/01/2026)

### ✅ Backend
- [x] Novo sistema de schemas (plans, championships, leagues)
- [x] Detecção de país por IP
- [x] Serviço de ligas (create, join, leave, ranking)
- [x] Endpoints de gerenciamento de planos
- [x] Migração de dados (Carioca removido, usuarios para PREMIUM)
- [x] 8 campeonatos iniciais cadastrados
- [x] Endpoint `/api/admin/update-match` para definir resultados
- [x] Liga de teste "Liga dos Crias" criada com Mario e Marcos
- [x] Seed de dados: 5 partidas com resultados e palpites

### ✅ Frontend
- [x] HomePage adaptada para planos
- [x] **Seção "Como Funciona"** com regras de pontuação e desempate
- [x] Seletor de campeonatos dinâmico
- [x] PredictionsPage com nova API
- [x] **RankingsPage renomeada para "Classificação"**
- [x] AdminPage atualizado
- [x] ProfilePage - Bug fix: ranking.position undefined
- [x] Menu de navegação: "Rankings" → "Classificação"

### ⏳ Pendente
- [ ] Página de criar/gerenciar ligas
- [ ] Página de entrar em liga por código
- [ ] Seleção manual de país nas configurações
- [ ] Página de adicionar campeonatos extras (Premium)

## 9. Credenciais de Teste

| Usuário | PIN | Plano |
|---------|-----|-------|
| Mario | 2412 | PREMIUM |
| Marcos | 6969 | PREMIUM |

**Admin:** `/admin` - Senha: `callclub2026`

## 10. Próximos Passos

### P0 (Crítico)
- Testar fluxo completo de login → palpite → ranking
- Validar API de ligas

### P1 (Importante)
- UI para criar ligas
- UI para entrar em ligas
- Configurações de país

### P2 (Melhoria)
- Feed de atividades
- Notificações
- Sistema de reações

### P3 (Futuro)
- Plano VIP
- Outros esportes
- Monetização
