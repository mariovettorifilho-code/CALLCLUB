# CallClub - Product Requirements Document
## 🏷️ Versão 1.0 (V1) - FINAL

**Status:** ✅ V1 CONSOLIDADA  
**Data:** 26/01/2026  
**Ambiente:** Produção Ready

---

## 1. Visão Geral

**CallClub** é uma plataforma global de palpites esportivos que permite usuários fazerem previsões em partidas de futebol, competirem em classificações e criarem suas próprias ligas com amigos.

### Público-Alvo
- Fase atual: Beta testers (amigos próximos)
- Visão futura: Escala global, multi-idioma, multi-esporte

---

## 2. Sistema de Planos (V1)

| Plano | Preço | Benefícios |
|-------|-------|------------|
| **FREE** | Grátis | Campeonato nacional do país do usuário |
| **PREMIUM** | - | +2 campeonatos extras, +2 ligas próprias |
| **VIP** | Futuro | Ilimitado (não implementado na V1) |

### Regras de Acesso
- País detectado automaticamente por IP
- Usuário pode trocar país manualmente (futuro)
- Beta testers = PREMIUM automático

---

## 3. Sistema de Pontuação (V1) 🔒

| Acerto | Pontos |
|--------|--------|
| Resultado (V/E/D) | 3 pts |
| Gols do mandante | +1 pt |
| Gols do visitante | +1 pt |
| **Placar exato** | **5 pts** |

### Critérios de Desempate
1. Total de placares exatos
2. Acertos de resultado (V/E/D)

> ⚠️ **LOCKED:** Sistema de pontuação não deve ser alterado sem validação do PO.

---

## 4. Campeonatos Suportados (V1)

### Nacionais (FREE)
| País | Campeonato | API ID |
|------|------------|--------|
| 🇧🇷 Brasil | Campeonato Brasileiro | 4351 |
| 🇮🇹 Itália | Serie A | 4332 |
| 🇪🇸 Espanha | La Liga | 4335 |
| 🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra | Premier League | 4328 |
| 🇩🇪 Alemanha | Bundesliga | 4331 |
| 🇫🇷 França | Ligue 1 | 4334 |

### Extras (PREMIUM)
- Copa Libertadores
- UEFA Champions League

> ❌ **REMOVIDO na V1:** Campeonato Carioca

---

## 5. Arquitetura Técnica (V1)

### Stack
- **Frontend:** React 18 + Tailwind CSS + Shadcn/UI
- **Backend:** FastAPI (Python 3.11) + Motor
- **Database:** MongoDB (Atlas em produção)
- **API Externa:** TheSportsDB (dados de partidas)

### Estrutura de Arquivos
```
/app/
├── backend/
│   ├── server.py           # API principal (~1100 linhas)
│   ├── models/schemas.py   # Pydantic models
│   ├── services/           # Serviços auxiliares
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/          # HomePage, PredictionsPage, etc.
│       └── components/     # Layout, UI components
└── memory/
    └── PRD.md              # Este arquivo
```

### Collections MongoDB
- `users` - Usuários e planos
- `championships` - Campeonatos cadastrados
- `matches` - Partidas
- `predictions` - Palpites
- `leagues` - Ligas customizadas
- `security_logs` - Logs de auditoria

---

## 6. Funcionalidades V1 ✅

### Autenticação
- [x] Login por nome + PIN (4 dígitos)
- [x] Lista de usuários autorizados (backend)
- [x] Detecção de país por IP

### Palpites
- [x] Fazer palpites antes do jogo começar
- [x] Editar palpites (antes do jogo)
- [x] **Bloqueio automático 1 minuto após início do jogo**
- [x] Ver palpites populares
- [x] Histórico de palpites no perfil

### Classificação
- [x] Classificação Geral (soma do campeonato)
- [x] Classificação Por Rodada
- [x] **Atualização imediata após cada jogo finalizado**
- [x] Mesmas colunas em ambas visões
- [x] Badge Premium discreto (💎)
- [x] **Clique no nome para ver palpites do usuário**

### Transparência de Palpites
- [x] **Modal de palpites de outros usuários**
- [x] **Palpites só visíveis após jogo finalizado**
- [x] **Jogos não finalizados mostram "Oculto"**

### Perfil
- [x] Estatísticas do usuário
- [x] Sistema de níveis (Amador → Lendário)
- [x] Conquistas (8 tipos)
- [x] Jornada do Palpiteiro (timeline)

### Admin Panel (/admin)
- [x] Dashboard com estatísticas
- [x] Gerenciar usuários e planos
- [x] Sincronizar partidas da API
- [x] Definir resultados manualmente
- [x] **Cálculo automático de pontos ao finalizar jogo**
- [x] Ver campeonatos cadastrados

### Ligas (estrutura pronta)
- [x] Backend: criar, entrar, sair, ranking
- [ ] Frontend: UI de gerenciamento (V1.1)

---

## 7. Dados de Teste (V1)

### Usuários Beta
| Usuário | PIN | Plano | Pontos |
|---------|-----|-------|--------|
| Mario | 2412 | PREMIUM | 20 |
| Marcos | 6969 | PREMIUM | 17 |

### Liga de Teste
- **Nome:** Liga dos Crias
- **Código:** 1RFA1C
- **Membros:** Mario, Marcos
- **Campeonato:** Brasileirão

### Partidas Seed (Rodada 1)
- 5 partidas com resultados definidos
- Pontuações calculadas e validadas

---

## 8. Credenciais

| Recurso | Acesso |
|---------|--------|
| Admin Panel | `/admin` - Senha: `callclub2026` |
| Usuário teste 1 | Mario / 2412 |
| Usuário teste 2 | Marcos / 6969 |

---

## 9. Bugs Corrigidos na V1

- [x] ProfilePage: erro "position undefined"
- [x] Timezone: conversão UTC → Brasília
- [x] Campo championship → championship_id
- [x] Próximo jogo: lógica de rodada atual
- [x] Classificação Por Rodada: mesmas colunas da Geral

---

## 10. Roadmap Pós-V1

### V1.1 (Próximo)
- [ ] UI de Ligas (criar, entrar por código)
- [ ] Configurações de país manual
- [ ] Ajustes finais de UX

### V1.2
- [ ] Campeonatos extras para Premium
- [ ] Feed de atividades

### V2.0
- [ ] Plano VIP
- [ ] Outros esportes (F1, NBA)
- [ ] Monetização

---

## 11. Contato

**Projeto:** CallClub  
**Versão:** 1.0  
**Status:** ✅ Consolidado
