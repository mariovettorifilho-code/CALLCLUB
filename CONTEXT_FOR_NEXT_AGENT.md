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

## ESTADO ATUAL DO SISTEMA
- Projeto funcional e em produção
- Backend: FastAPI (arquivo crítico: server.py)
- Frontend: React + Tailwind CSS
- Banco de dados: MongoDB
- API externa: TheSportsDB

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

## MODO DE TRABALHO
- Aguarde uma tarefa específica e delimitada
- Faça SOMENTE o que foi pedido
- Se houver qualquer risco de efeito colateral, PARE e avise
