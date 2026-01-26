# CallClub - Changelog

## [1.2.0] - 2026-01-26

### 🏷️ V1.2.0 - Separação LIGAS ≠ CAMPEONATOS

**Status:** ✅ IMPLEMENTADO E TESTADO (100% backend, 100% frontend)  
**Escopo:** Regras de domínio - Ligas são filtros, Campeonatos são fonte de dados

---

### ✨ Mudanças de Arquitetura

#### Separação Clara de Conceitos
- **Campeonatos Oficiais:** Fonte de jogos, rodadas e palpites
- **Ligas Privadas:** Apenas agrupam usuários e filtram rankings

#### Novos Endpoints
- `GET /api/user/{username}/official-championships` - APENAS campeonatos oficiais (para Palpites)
- `GET /api/user/{username}/accessible-championships` - Campeonatos + Ligas (para Classificação)

#### Tela de Palpites
- Mostra APENAS campeonatos oficiais
- Ligas NUNCA aparecem como opção
- Dropdown limpo sem duplicações

#### Tela de Classificação
- Mostra campeonatos oficiais + ligas
- Ligas identificadas com ícone 👥 e nome
- Ex: "Campeonato Brasileiro – Série A (2026) (Liga dos Crias) 👥"

#### Tela Criar Liga
- Dropdown mostra APENAS campeonatos oficiais
- Tab renomeada: "Entrar" → "Entrar em uma liga"

#### Campeonatos Oficiais (Lista Fixa)
```
- Campeonato Brasileiro – Série A (2026)
- Copa Libertadores da América (2026)
- Copa do Brasil (2026)
- Copa do Mundo (2026)
```

---

### 📊 Checklist de Regras de Domínio ✅

- [x] Tela de Palpites mostra apenas campeonatos oficiais
- [x] Usuário vê somente campeonatos que participa
- [x] Ligas não aparecem em nenhum select de palpites
- [x] Palpites funcionam com múltiplas ligas
- [x] Ranking da liga reflete palpites do campeonato
- [x] Dropdown Criar Liga mostra apenas oficiais
- [x] Campeonatos têm ano no nome (2026)
- [x] Classificação oficial lista todos os usuários
- [x] Classificação de liga lista apenas membros

---

## [1.1.2] - 2026-01-26

### 🏷️ V1.1.2 - Compartilhamento WhatsApp + Serie A

**Status:** ✅ IMPLEMENTADO E TESTADO (100% backend, 100% frontend)  
**Escopo:** Botão compartilhar liga via WhatsApp + jogos Serie A seedados

---

### ✨ Novas Funcionalidades

#### Botão "Convidar" via WhatsApp
- **Localização:** Cards de liga na LeaguesPage e LeagueDetailPage
- **Cor:** Verde (bg-green-500) com ícone WhatsApp
- **Mensagem formatada:**
  ```
  ⚽ Entra na minha liga no CallClub!
  
  🏆 Liga: {nome_liga}
  📋 Código: {codigo}
  
  👉 Acesse: {url}/leagues
  
  Bora palpitar juntos! 🔥
  ```

#### Serie A Seedada
- 25 jogos criados (5 rodadas × 5 jogos)
- Rodada 1 finalizada com resultados
- Palpites de Mario e Marcos para validação
- Liga "Os Boleiros" agora tem ranking funcional

#### Filtro de Ligas no Perfil
- ProfilePage agora tem optgroup "👥 Minhas Ligas"
- Usuário pode filtrar histórico por liga específica

---

### 🐛 Correções

- Corrigido warning de React key duplicada no PredictionsPage
- Key agora usa: `${championship_id}_${access_type}_${league_id || idx}`

---

### 📊 Dados de Teste Atualizados

| Liga | Código | Campeonato | Ranking |
|------|--------|------------|---------|
| Liga dos Crias | 1RFA1C | Brasileirão | Mario (20pts) > Marcos (17pts) |
| Os Boleiros | XTL7V5 | Serie A | Marcos (15pts) > Mario (14pts) |

---

## [1.1.1] - 2026-01-26

### 🏷️ V1.1.1 - Ajustes de UX nas Ligas Privadas

**Status:** ✅ IMPLEMENTADO E TESTADO (100% backend, 100% frontend)  
**Escopo:** Ligas privadas com MESMA estrutura do campeonato FREE

---

### ✨ Melhorias Implementadas

#### LeagueDetailPage - Paridade com FREE
- **Tabs Geral/Por Rodada** idênticas ao RankingsPage
- **Mesmas 9 colunas:** Pos, Palpiteiro, Pts, Res, Casa, Vis, Exato, Palp, %
- **Modal de transparência:** Clicar no nome do usuário abre palpites
- **Seletor de rodada** na tab "Por Rodada"
- **Legenda das colunas** no final da tabela

#### Seletores de Campeonato
- Mostram nome da liga: "Campeonato Brasileiro (Liga dos Crias)"
- Ícone 👥 para campeonatos via liga
- Suporte a múltiplas ligas do mesmo campeonato

#### LeaguesPage
- Seção "Ligas que criei" com contador (X/2)
- Seção "Ligas que participo" separada
- Marcos agora vê corretamente as ligas onde é membro

#### Backend
- `get_league_ranking()` agora retorna estatísticas completas:
  - `correct_results`, `correct_home_goals`, `correct_away_goals`
  - `efficiency` (aproveitamento em %)
- Endpoint `accessible-championships` inclui `league_name` e `league_id`

---

### 📊 Checklist de QA (V1.1.1) ✅

- [x] Tabs de classificação funcionando (Geral / Por Rodada)
- [x] Mesmas colunas do Free no ranking
- [x] Modal de palpites funciona após partidas
- [x] Ligas que participo aparecem corretamente
- [x] Seleção de campeonato mostra nome da liga
- [x] Micro-interações consistentes com Free
- [x] Regras de negócio e limites PREMIUM mantidos

---

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
