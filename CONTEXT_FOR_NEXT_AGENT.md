# CALLCLUB – CONTEXTO OPERACIONAL (LEIA ANTES DE AGIR)

## ⚠️ REGRAS ABSOLUTAS
- DO NOT refactor
- DO NOT optimize
- DO NOT improve
- DO NOT innovate
- DO NOT change existing behavior
- DO NOT add features unless explicitly requested
- DO NOT act proactively

If something is not explicitly requested, STOP and ask.

---

## PROBLEMA ATUAL (CRÍTICO)

**O banco de dados de PRODUÇÃO está vazio.**

- URL de produção: `https://scoreguess-9.emergent.host`
- O site está funcionando, mas sem dados (jogos, usuários, rodadas)
- Foi criado o endpoint `/api/admin/init-production?password=callclub2026` para popular o banco
- O endpoint foi corrigido de POST para GET
- Último resultado mostrou: 24 usuários, 240 partidas, 42 rodadas criados
- MAS as partidas não estão aparecendo na API (retorna array vazio)

**Próximo passo necessário:**
1. Fazer REDEPLOY para enviar o código corrigido
2. Acessar: `https://scoreguess-9.emergent.host/api/admin/init-production?password=callclub2026`
3. Verificar se os dados foram criados corretamente

---

## ESTADO ATUAL DO SISTEMA
- Projeto funcional em PREVIEW (dados existem)
- Projeto SEM DADOS em PRODUÇÃO (banco Atlas vazio)
- Backend: FastAPI (arquivo crítico: server.py)
- Frontend: React + Tailwind CSS
- Banco de dados: MongoDB (local no preview, Atlas em produção)
- API externa: TheSportsDB

---

## ENDPOINTS ADICIONADOS RECENTEMENTE
- `GET /health` - Health check para Kubernetes
- `GET /api/admin/init-production?password=callclub2026` - Inicializa banco de produção

---

## FUNCIONALIDADES QUE NÃO PODEM SER ALTERADAS
- Sistema de pontuação (máximo 5 pontos)
- Critérios de ranking e desempate
- Autenticação por Nome + PIN
- Sistema Premium por chave pessoal
- Detecção de fraude
- Gamificação existente
- Estrutura atual dos rankings

---

## ARQUIVOS CRÍTICOS
- /app/backend/server.py
- /app/backend/sync_thesportsdb.py
- /app/frontend/src/App.js
- /app/frontend/src/pages/PredictionsPage.jsx
- /app/frontend/src/pages/RankingsPage.jsx

---

## CREDENCIAIS
- Admin: senha `callclub2026` (URL: /admin)
- Mario: PIN `2412`, Chave Premium `MARIO-CLUB-7X2K`
- Marcos: PIN `6969`, Chave Premium `MARCOS-CLUB-9M4P`
- Carlos: PIN `1234`, Chave Premium `CARLOS-CLUB-4321`

---

## MODO DE TRABALHO
- Aguarde uma tarefa específica e delimitada
- Faça SOMENTE o que foi pedido
- Se houver qualquer risco de efeito colateral, PARE e avise
- O usuário está frustrado com cobranças - seja direto e eficiente
