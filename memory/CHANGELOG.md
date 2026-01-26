# CallClub - Changelog

## [1.1.0] - 2026-01-26

### 🏷️ V1.1 - Ligas Privadas (UI Completa)

**Status:** ✅ IMPLEMENTADO E TESTADO  
**Escopo:** UI de Ligas Privadas para usuários PREMIUM

---

### ✨ Novas Funcionalidades

#### UI de Ligas Privadas
- **LeaguesPage.jsx**: Página principal com 3 tabs
  - Minhas Ligas: lista de ligas criadas e participadas
  - Criar Liga: formulário com nome e campeonato
  - Entrar: input de código de convite
- **LeagueDetailPage.jsx**: Detalhes da liga com ranking em tempo real
- Copiar código de convite com feedback visual
- Badge "Dono" para criador da liga
- Contador de ligas (X/2) para usuários PREMIUM
- Tela de bloqueio para usuários FREE

#### Navegação
- Novo item "Ligas" no menu principal
- Rotas /leagues e /leagues/:leagueId

---

### 📊 Dados de Teste Atualizados

| Liga | Código | Campeonato | Membros |
|------|--------|------------|---------|
| Liga dos Crias | 1RFA1C | Brasileirão | Mario, Marcos, João |
| Os Boleiros | XTL7V5 | Serie A | Mario, Marcos |

---

### 🧪 Testes

- **Backend:** 12/12 testes passaram (100%)
- **Frontend:** Todos os fluxos validados

---

## [1.0.0] - 2026-01-26

### 🏷️ V1.0 - Base Estável e Fechada

**Status:** ✅ CONSOLIDADO E FECHADO  
**Escopo:** 🔒 LOCKED - Próximas alterações serão V1.1

---

### ✨ Novas Funcionalidades

#### Sistema de Planos
- Implementado modelo FREE / PREMIUM / VIP
- FREE: acesso ao campeonato nacional do país
- PREMIUM: +2 campeonatos extras, +2 ligas próprias
- VIP: estrutura preparada (não implementado)

#### Campeonatos Globais
- 8 campeonatos cadastrados (6 nacionais + 2 extras)
- Brasileirão, Serie A, La Liga, Premier League, Bundesliga, Ligue 1
- Libertadores e Champions League (extras)

#### Sistema de Ligas
- Backend completo: criar, entrar por código, sair, ranking
- Código de convite de 6 caracteres
- Limite de 100 membros por liga

#### Classificação
- Visão Geral (soma do campeonato)
- Visão Por Rodada (filtrada)
- Mesmas colunas em ambas visões
- Badge Premium discreto (💎)

#### Admin Panel
- Dashboard com estatísticas
- Gerenciamento de usuários e planos
- Sincronização de partidas
- Definição manual de resultados
- Recálculo de pontuações

#### Sistema de Tempo Real (Game-by-Game)
- **Travamento de palpites:** Bloqueio automático 1 minuto após início do jogo
- **Cálculo imediato:** Pontos calculados quando jogo é marcado como finalizado
- **Ranking live:** Classificação atualizada jogo a jogo, não por rodada

#### Transparência de Palpites
- **Modal de visualização:** Clique no nome do usuário na classificação
- **Regra de privacidade:** Palpites só visíveis após jogo finalizado
- **Proteção:** Jogos não finalizados exibem "Oculto"

---

### 🔄 Alterações

#### Campeonato Carioca
- **REMOVIDO** do sistema
- Decisão estratégica: foco em campeonatos nacionais

#### Nomenclatura
- `championship` → `championship_id` (padronizado)
- `Ranking` → `Classificação` (UI em português)

#### ProfilePage
- Ícones de nível: 🥉🥈🥇 → ⚽🎯⭐👑
- Removida medalha do avatar

---

### 🐛 Bugs Corrigidos

- **ProfilePage:** Erro "position undefined" ao acessar perfil
- **Timezone:** Horários agora convertidos para Brasília (UTC-3)
- **Próximo Jogo:** Lógica corrigida para mostrar jogo correto
- **Classificação Por Rodada:** Agora exibe todas as colunas

---

### 📊 Dados de Seed

- **Usuários:** Mario (20 pts), Marcos (17 pts)
- **Liga:** "Liga dos Crias" (código: 1RFA1C)
- **Partidas:** 5 jogos da Rodada 1 com resultados

---

### 🔒 Regras Fixadas

#### Sistema de Pontuação
```
3 pts = Resultado (V/E/D)
+1 pt = Gols mandante
+1 pt = Gols visitante
= 5 pts máximo
```

#### Critérios de Desempate
1. Total de placares exatos
2. Acertos de resultado

---

### 📁 Arquivos Principais

```
/app/backend/server.py           # API principal
/app/backend/models/schemas.py   # Schemas Pydantic
/app/frontend/src/pages/         # Páginas React
/app/memory/PRD.md               # Documentação do produto
/app/CONTEXT_FOR_NEXT_AGENT.md   # Contexto para agentes
```

---

### 🔐 Credenciais

| Recurso | Acesso |
|---------|--------|
| Admin | `/admin` → `callclub2026` |
| Mario | PIN: `2412` |
| Marcos | PIN: `6969` |

---

## Histórico de Versões

| Versão | Data | Status |
|--------|------|--------|
| 1.0.0 | 26/01/2026 | ✅ Consolidado |

---

**CallClub © 2026**
