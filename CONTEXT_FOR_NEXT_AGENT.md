# CallClub - Context for Next Agent
## 🏷️ Versão 1.0 (V1) - Estado Consolidado

**Última atualização:** 26/01/2026  
**Status:** Produção Ready

---

## 1. Visão Geral do Produto

**CallClub** é uma plataforma de palpites esportivos que começou como um projeto entre amigos brasileiros e evoluiu para uma arquitetura global escalável.

### Propósito
- Permitir usuários fazerem palpites em partidas de futebol
- Competir em classificações com amigos
- Criar ligas privadas para grupos específicos

### Fase Atual
- **Beta fechado** com amigos próximos
- Todos os beta testers têm plano PREMIUM
- Foco em validação e refinamento

---

## 2. Decisões de Negócio 🔒

### 2.1 Modelo de Planos
```
FREE     → Campeonato nacional do país (automático por IP)
PREMIUM  → +2 campeonatos extras + criar até 2 ligas
VIP      → Ilimitado (não implementar ainda)
```

**Decisão:** Beta testers são PREMIUM por padrão para testar todas as features.

### 2.2 Campeonato Carioca
**REMOVIDO** da V1. Decisão estratégica de focar em campeonatos nacionais de cada país, não regionais.

### 2.3 Sistema de Pontuação
```
3 pts = Resultado correto (V/E/D)
+1 pt = Gols do mandante correto
+1 pt = Gols do visitante correto
= 5 pts máximo (placar exato)
```

**Desempate:** 1º placares exatos → 2º acertos de resultado

---

## 3. O que NÃO deve ser mudado sem validação ⚠️

### 3.1 Regras de Pontuação
- Sistema de 3+1+1 pontos está validado
- Critérios de desempate estão definidos
- **Não alterar** sem aprovação explícita do PO

### 3.2 Estrutura de Planos
- FREE/PREMIUM/VIP está definido
- Limites de ligas (0/2/ilimitado) estão fixos
- **Não criar** novos planos sem validação

### 3.3 Autenticação
- Login por nome + PIN de 4 dígitos
- Lista de usuários autorizados no backend
- **Não implementar** cadastro público sem validação

### 3.4 Credenciais de Admin
- Senha do admin: `callclub2026`
- **Não alterar** sem comunicar ao PO

### 3.5 Dados dos Beta Testers
- Mario (2412) e Marcos (6969) são contas de teste oficial
- Liga "Liga dos Crias" é seed oficial
- **Não deletar** esses dados

---

## 4. Arquitetura Técnica

### Stack Atual
| Componente | Tecnologia |
|------------|------------|
| Frontend | React 18 + Tailwind CSS |
| Backend | FastAPI + Motor |
| Database | MongoDB |
| API Externa | TheSportsDB |

### Endpoints Críticos
```
POST /api/auth/check-name     → Login
GET  /api/championships       → Lista campeonatos
GET  /api/matches/{round}     → Partidas da rodada
POST /api/predictions         → Salvar palpite
GET  /api/ranking/detailed/{champ} → Classificação geral
GET  /api/ranking/round/{round}    → Classificação por rodada
```

### Variáveis de Ambiente
```bash
# Backend (.env)
MONGO_URL=...
DB_NAME=...

# Frontend (.env)
REACT_APP_BACKEND_URL=...
```

---

## 5. Padrões de Código

### Nomenclatura
- `championship_id` (não `championship`)
- `round_number` (não `round` sozinho)
- Português para UI, inglês para código

### MongoDB
- Sempre excluir `_id` nas respostas
- Usar `championship_id` como campo padrão
- Datas em UTC, conversão para Brasília no backend

### Frontend
- Componentes em `/pages/` para rotas
- Shadcn/UI em `/components/ui/`
- Phosphor Icons para ícones

---

## 6. Histórico de Problemas Resolvidos

| Problema | Solução | Data |
|----------|---------|------|
| position undefined | Fallback no ProfilePage | 25/01/2026 |
| Timezone incorreto | Conversão UTC-3 no backend | 25/01/2026 |
| Carioca vs Brasileirão | Removido Carioca | 25/01/2026 |
| Ranking por rodada incompleto | Mesmas colunas da geral | 26/01/2026 |

---

## 7. Próximos Passos Planejados

### V1.1 (Ajustes de UX)
- UI para criar/entrar em ligas
- Configuração manual de país
- Refinamentos visuais

### V1.2 (Expansão)
- Seletor de campeonatos extras (Premium)
- Feed de atividades

### V2.0 (Escala)
- Plano VIP
- Outros esportes
- Monetização

---

## 8. Contatos e Recursos

### Admin Panel
- URL: `/admin`
- Senha: `callclub2026`

### Usuários de Teste
- Mario: PIN 2412
- Marcos: PIN 6969

### Documentação
- PRD: `/app/memory/PRD.md`
- Changelog: `/app/memory/CHANGELOG.md`
- Este arquivo: `/app/CONTEXT_FOR_NEXT_AGENT.md`

---

## 9. Regras para Agentes Futuros

1. **Ler este arquivo** antes de qualquer implementação
2. **Não alterar** regras de pontuação ou planos sem validação
3. **Não deletar** dados de seed (Mario, Marcos, Liga dos Crias)
4. **Manter** nomenclatura `championship_id`
5. **Testar** antes de finalizar qualquer feature
6. **Documentar** mudanças significativas no CHANGELOG

---

**CallClub V1.0 - Base Estável ✅**
