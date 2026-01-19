# CallClub - PRD (Product Requirements Document)

## Visão Geral
Site de palpites de futebol para grupo privado de ~80 amigos. Foco inicial no Campeonato Carioca 2026.

## Problema
Grupo de amigos quer fazer palpites de jogos de futebol de forma organizada, com ranking e sistema de pontuação.

## Requisitos Funcionais

### Autenticação
- [x] Login por nome (whitelist de usuários autorizados)
- [x] Sem senha - apenas verificação do nome na lista
- [ ] Lista de 80 nomes (pendente: usuário ainda não forneceu)

### Palpites
- [x] Página de palpites com dropdown de rodadas (1-6)
- [x] Exibir jogos da rodada selecionada
- [x] Input de placar para cada jogo
- [x] Bloquear palpites após início do jogo
- [x] Mostrar resultado final e pontos ganhos em jogos finalizados
- [x] Indicador visual de tempo restante para palpitar

### Sistema de Pontuação
- [x] **3 pontos** - Acertar resultado (Vitória/Empate/Derrota)
- [x] **+1 ponto** - Acertar placar do mandante
- [x] **+1 ponto** - Acertar placar do visitante
- [x] **5 pontos** - Máximo por jogo (placar exato)
- [x] Cálculo automático quando jogo finaliza

### Rankings
- [x] Ranking Geral - soma de todas as rodadas
- [x] Ranking por Rodada - pontos de uma rodada específica
- [x] Critério de desempate: maior sequência de acertos perfeitos (5 pts)
- [x] Destaque visual para top 3 (medalhas)
- [x] Indicador "Você" para o usuário logado

### Integração de Dados
- [x] TheSportsDB API - dados reais do Campeonato Carioca 2026
- [x] Sincronização de jogos (36 jogos, 6 rodadas)
- [x] Atualização automática de resultados
- [x] Script de sync: `/app/backend/sync_thesportsdb.py`

## Stack Técnica
- **Frontend**: React + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Banco de Dados**: MongoDB
- **API de Dados**: TheSportsDB (gratuita)

## Arquitetura
```
/app/
├── backend/
│   ├── server.py          # API principal
│   ├── sync_thesportsdb.py # Sincronização de dados
│   └── .env
├── frontend/
│   └── src/
│       └── pages/
│           ├── LoginPage.jsx
│           ├── HomePage.jsx
│           ├── PredictionsPage.jsx
│           └── RankingsPage.jsx
└── test_reports/
```

## API Endpoints
- `POST /api/auth/check-name` - Login
- `GET /api/rounds/all` - Listar rodadas
- `GET /api/rounds/current` - Rodada atual
- `GET /api/matches/{round}` - Jogos da rodada
- `POST /api/predictions` - Salvar palpite
- `GET /api/predictions/{user}` - Palpites do usuário
- `GET /api/ranking/general` - Ranking geral
- `GET /api/ranking/round/{round}` - Ranking da rodada
- `POST /api/admin/sync-results` - Sincronizar resultados
- `POST /api/admin/recalculate-points` - Recalcular pontos

## Status do Projeto

### ✅ Implementado (19/01/2026)
1. Sistema de autenticação por whitelist
2. Integração com TheSportsDB (6 rodadas, 36 jogos)
3. Página de palpites completa
4. Sistema de pontuação funcionando
5. Rankings (geral e por rodada)
6. Cálculo automático de pontos

### 🔜 Próximas Tarefas
1. **P1** - Página de Perfil do usuário (histórico de palpites)
2. **P2** - Adicionar lista dos 80 usuários reais
3. **P2** - Integrar Campeonato Brasileiro quando começar
4. **P3** - Admin para gerenciar whitelist via interface

### 🔧 Melhorias Futuras
- Notificações de jogos próximos
- Estatísticas detalhadas do usuário
- Compartilhamento de ranking em redes sociais
- PWA para mobile

## Usuários de Teste
Nomes na whitelist (exemplo): Mario, Marcos, João, Pedro, Carlos, Lucas, Rafael, Bruno, Fernando, Ricardo, Paulo, Anderson, Gabriel, Felipe, Rodrigo, Thiago, Marcelo, Diego, Matheus, Vinicius, Gustavo, Leonardo, André, Alexandre, Renato, Fabio

## Dados Atuais
- **Rodadas 1-2**: Finalizadas (resultados disponíveis)
- **Rodada 3**: Atual (jogos em 21-22/01)
- **Rodadas 4-6**: Futuras

## Changelog
- **19/01/2026**: Sistema de pontuação e rankings implementados
- **19/01/2026**: Corrigido sync para buscar todas as 6 rodadas
- **19/01/2026**: Integração TheSportsDB funcionando
