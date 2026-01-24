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

## 🚨 REGRA CRÍTICA: PRESERVAÇÃO DO BANCO DE DADOS DO PREVIEW

**NUNCA limpar, resetar ou apagar dados do banco MongoDB local do preview.**

- O preview usa MongoDB local (dentro do container)
- A produção usa MongoDB Atlas (nuvem)
- Os dados do preview são VALIOSOS e devem ser preservados
- Quando o banco do preview é resetado, perdemos dados como escudos dos times, palpites, etc.
- Isso gera retrabalho e consumo desnecessário de créditos para re-sincronizar

**Se precisar fazer qualquer operação no banco:**
1. Faça BACKUP antes
2. Pergunte ao usuário antes de executar
3. Nunca use comandos como `drop()`, `deleteMany({})` ou similares sem autorização explícita

**Esta regra deve ser seguida por TODOS os agentes em TODOS os forks deste projeto.**

---

## 🕐 REGRA CRÍTICA: FUSO HORÁRIO DOS JOGOS

**Todos os horários de jogos devem ser salvos no fuso de BRASÍLIA (UTC-3).**

- A API TheSportsDB retorna horários em UTC
- O código em `/app/backend/server.py` (endpoint `force-populate`) já converte automaticamente UTC → Brasília
- NUNCA salvar horários em UTC sem converter
- O público do site é 100% brasileiro

**Se criar novos endpoints que busquem dados de jogos:**
1. Sempre converter horários de UTC para Brasília (subtrair 3 horas)
2. Usar o padrão: `brasilia_datetime = utc_datetime - timedelta(hours=3)`

**Esta regra se aplica a TODOS os campeonatos atuais e futuros.**

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
