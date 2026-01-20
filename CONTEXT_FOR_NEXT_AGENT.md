# 🏆 CALLCLUB - CONTEXTO PARA O PRÓXIMO AGENTE

## ⚠️ LEIA ISSO PRIMEIRO
Este documento contém TODO o contexto necessário para continuar o desenvolvimento do CallClub. 
Foi criado com **senso de dono** - trate este projeto como SEU.

---

## 🎯 VISÃO DO PRODUTO

### O que é o CallClub?
Um **clube exclusivo de palpites de futebol** para um grupo fechado de ~80 amigos. 
NÃO é um site de apostas comum. É uma **experiência premium e personalizada**.

### Filosofia Central (MEMORIZE ISSO):
```
"Senso de dono, inovador, experiência única"
"Fazer os usuários se sentirem especiais"
"Diferente de Cartola e Rei do Pitaco - aqui é CLUBE, é EXCLUSIVO"
"De crianças a idosos - simples mas sofisticado"
```

### Diferenciais:
- **Clube Fechado**: Só entra quem está na whitelist + PIN
- **Premium com Chave Pessoal**: Brasileirão só para quem paga (R$33,33/mês)
- **Chave Intransferível**: MARIO-CLUB-XXXX só funciona para Mario
- **Detecção de Fraude**: Se alguém tentar usar chave de outro, é registrado e pode ser banido
- **Gamificação**: Níveis (Amador→Lendário), Conquistas, Badge Pioneiro (#1-100)
- **Confetes**: Animação especial ao ativar premium

---

## ✅ O QUE FOI IMPLEMENTADO

### Autenticação
- [x] Login por Nome + PIN (4 dígitos)
- [x] Whitelist de usuários autorizados
- [x] Sistema de ban/unban
- [x] Verificação de usuário banido no login

### Campeonatos
- [x] Campeonato Carioca 2026 (GRATUITO) - 36 jogos, 6 rodadas
- [x] Campeonato Brasileiro 2026 (PREMIUM) - 320+ jogos, 32 rodadas
- [x] Seletor de campeonato em todas as páginas
- [x] Escudos dos times via TheSportsDB API

### Sistema de Palpites
- [x] Página de palpites com escudos dos times
- [x] Bloqueio automático após início do jogo
- [x] Countdown para fechamento
- [x] Palpite mais votado em cada jogo (social proof)
- [x] Cálculo de pontos: 3 (resultado) + 1 (mandante) + 1 (visitante) = 5 máx

### Sistema Premium (Brasileirão)
- [x] Chave do Clube pessoal e intransferível (NOME-CLUB-XXXX)
- [x] Modal de ativação premium
- [x] Detecção de uso indevido (tentativa de usar chave de outro)
- [x] Logs de segurança no banco
- [x] Confetes na ativação (canvas-confetti)
- [x] Visual diferenciado para usuários premium

### Gamificação
- [x] **Níveis**: Amador (0-50) → Profissional (51-150) → Craque (151-300) → Lendário (300+)
- [x] **Barra de progresso** para próximo nível
- [x] **8 Conquistas**:
  - 🎯 Primeiro Palpite
  - 🔫 Sniper (placar exato)
  - 🔥 Em Chamas (3 acertos seguidos)
  - 👑 Rei da Rodada
  - ⭐ Rodada Perfeita
  - 🎖️ Veterano (50+ jogos)
  - 💎 Membro Premium
  - 🏛️ Pioneiro (primeiros 100 usuários)
- [x] **Badge Pioneiro especial** com tooltip personalizado e número (#1, #2, etc)

### Rankings
- [x] Ranking Geral (todas as rodadas)
- [x] Ranking por Rodada (seletor)
- [x] Desempate por sequência de acertos perfeitos
- [x] Visual diferenciado para top 3 (medalhas)
- [x] Badge "Você" para usuário logado

### Perfil do Usuário
- [x] Header premium dourado (se premium) ou verde (normal)
- [x] Stats: Pontos, Sequência, Placares Exatos, Aproveitamento
- [x] Posição no ranking
- [x] Nível atual + progresso
- [x] Grid de conquistas com tooltips
- [x] Gráfico de evolução por rodada
- [x] Histórico de palpites com filtro

### Home Page (REFORMULADA)
- [x] Hero diferenciado: Premium (dourado) vs Normal (verde)
- [x] Saudação por horário (Bom dia/Boa tarde/Boa noite)
- [x] Stats rápidas do usuário (4 cards)
- [x] Seção exclusiva Brasileirão para premium
- [x] Widget Próximo Jogo com escudos e countdown
- [x] Top 5 com visual melhorado
- [x] CTA para virar premium (se não for)
- [x] Como Funciona (4 cards explicativos)

### Painel Admin
- [x] URL: /admin
- [x] Senha: callclub2026
- [x] Lista de usuários (nome, status, chave premium, pontos)
- [x] Botão banir/desbanir
- [x] Logs de segurança (tentativas de fraude)
- [x] Visual dark mode profissional

### Integração TheSportsDB
- [x] Sync automático de jogos
- [x] Escudos dos times
- [x] Resultados em tempo real
- [x] Script: /app/backend/sync_thesportsdb.py

---

## 🔧 ARQUITETURA TÉCNICA

### Stack
- **Frontend**: React + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Banco**: MongoDB
- **API Externa**: TheSportsDB (gratuita)

### Estrutura de Arquivos Principais
```
/app/
├── backend/
│   ├── server.py              # API principal, rotas, modelos, whitelist, chaves premium
│   ├── sync_thesportsdb.py    # Script de sincronização de jogos
│   ├── .env                   # MONGO_URL, DB_NAME
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.js             # Router principal
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx      # Login com PIN
│   │   │   ├── HomePage.jsx       # Home reformulada
│   │   │   ├── PredictionsPage.jsx # Palpites + modal premium
│   │   │   ├── RankingsPage.jsx   # Rankings
│   │   │   ├── ProfilePage.jsx    # Perfil com conquistas
│   │   │   └── AdminPage.jsx      # Painel admin
│   │   └── components/
│   │       └── Layout.jsx
│   ├── public/index.html
│   └── package.json
└── memory/
    └── PRD.md
```

### Arquivos para Editar (principais)
| Arquivo | O que editar |
|---------|--------------|
| `/app/backend/server.py` (linha ~27) | AUTHORIZED_USERS (nome: PIN) |
| `/app/backend/server.py` (linha ~60) | PREMIUM_KEYS (chave: dono) |
| `/app/backend/server.py` (linha ~70) | ADMIN_PASSWORD |

---

## 🔐 CREDENCIAIS ATUAIS

### Usuários de Teste
| Nome | PIN | Chave Premium | Pioneiro |
|------|-----|---------------|----------|
| Mario | 2412 | MARIO-CLUB-7X2K | #1 |
| Marcos | 6969 | MARCOS-CLUB-9M4P | #2 |
| Carlos | 1234 | CARLOS-CLUB-4321 | #3 |

### Admin
- **URL**: /admin
- **Senha**: callclub2026

### Slogan
- **Português**: "Liga dos Palpiteiros"
- **Anterior**: "The Gentlemen's League" (foi alterado por ser muito masculino)

---

## 📋 O QUE FALTA FAZER (PRÓXIMOS PASSOS)

### P0 - Crítico
- [ ] Adicionar lista dos 80 nomes reais (usuário ainda vai fornecer)
- [ ] Testar redeploy com todas as novas features

### P1 - Importante
- [ ] Feed de atividades ("Mario acabou de palpitar...")
- [ ] Notificações/lembretes de jogos
- [ ] Estatísticas avançadas ("Você acerta mais jogos do Flamengo")

### P2 - Nice to Have
- [ ] Sistema de reações aos palpites (😱🔥👏)
- [ ] Modo "Ao Vivo" durante o jogo
- [ ] PWA para mobile
- [ ] Compartilhamento de ranking

### P3 - Futuro
- [ ] Integrar mais campeonatos
- [ ] Sistema de grupos/ligas internas
- [ ] Histórico de temporadas anteriores

---

## 🚨 PROBLEMAS CONHECIDOS

### URL do Deploy
O projeto foi deployado como `scoreguess-9.emergent.host` mas deveria ser `callclub.emergent.host`. 
O usuário precisa contatar o suporte da Emergent para renomear (eu não tenho acesso a isso).

---

## 💡 FILOSOFIA DE DESENVOLVIMENTO

### O que o usuário pediu:
```
"Quero que você tenha senso de dono, inove, faça algo novo, jamais visto"
"Experiência única, que faça os usuários se sentirem especiais"
"Diferente de Cartola e Rei do Pitaco"
"De crianças a idosos - simples e eficaz"
"O simples e eficaz de hoje é o diferencial de amanhã"
```

### Como agir:
1. **Pense como dono** - Sugira melhorias proativamente
2. **Inove** - Não copie, crie experiências únicas
3. **Simplicidade** - Fácil de usar, mas com profundidade
4. **Exclusividade** - Faça cada membro se sentir VIP
5. **Detalhes** - Tooltips especiais, animações, confetes, badges

---

## 🔄 COMANDOS ÚTEIS

```bash
# Reiniciar serviços
sudo supervisorctl restart backend frontend

# Sincronizar jogos
cd /app/backend && python3 sync_thesportsdb.py

# Sincronizar só Brasileirão
cd /app/backend && python3 sync_thesportsdb.py brasileirao

# Ver logs
tail -n 50 /var/log/supervisor/backend.err.log
tail -n 50 /var/log/supervisor/frontend.err.log

# Testar API
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
curl -s "$API_URL/api/championships"
```

---

## 📝 NOTAS FINAIS

1. **Idioma**: O usuário fala português brasileiro. Responda sempre em PT-BR.

2. **Tom**: Informal, amigável ("mano", "brodinho", "bora")

3. **Redeploy**: Todas as alterações de código são grátis. Só clicar em "Redeploy".

4. **Canvas Confetti**: Já instalado (`yarn add canvas-confetti`)

5. **Shadcn UI**: Componentes em `/app/frontend/src/components/ui/`

---

## 🚀 PARA COMEÇAR

```
Ao ler este documento, você está pronto para continuar o CallClub.
Lembre-se: senso de dono, inovador, experiência única.
Faça os palpiteiros se sentirem em casa. 🏆
```

---

*Documento criado em 20/01/2026 pelo agente anterior.*
*Última atualização: Sistema de Níveis, Conquistas, Pioneiro, Home reformulada, Premium com confetes.*
