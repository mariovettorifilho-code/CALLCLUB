# 🏆 CallClub - Integração API-Football (Campeonato Carioca 2026)

## ✅ COMO CONFIGURAR (5 MINUTOS)

### Passo 1: Pegar sua API Key GRÁTIS

1. Acesse: https://www.api-football.com/
2. Clique em "**Get Your Free API Key**"
3. Preencha: nome, email
4. Confirme o email
5. Entre no dashboard: https://dashboard.api-football.com/
6. Copie sua **API Key**

### Passo 2: Adicionar a Key no CallClub

Edite o arquivo `/app/backend/.env` e cole sua key:

```bash
API_FOOTBALL_KEY="sua_key_aqui_123abc"
```

### Passo 3: Sincronizar Jogos do Carioca 2026

Execute no terminal:

```bash
cd /app/backend
python sync_carioca.py
```

**O que acontece:**
- ✅ Busca **todos os jogos** do Carioca 2026
- ✅ Cria **todas as rodadas** automaticamente
- ✅ Salva no MongoDB
- ✅ Seus amigos já podem palpitar!

---

## 🔄 ATUALIZANDO RESULTADOS AUTOMATICAMENTE

Sempre que quiser atualizar os placares:

```bash
cd /app/backend
python sync_carioca.py update
```

**O que acontece:**
- 🔍 Verifica jogos finalizados
- 📊 Atualiza placares
- 🧮 Recalcula pontuações automaticamente
- 🏆 Atualiza rankings

---

## ⚙️ AUTOMATIZAÇÃO (OPCIONAL)

### Atualizar resultados a cada 15 minutos (Linux/Mac):

Adicione no cron:

```bash
crontab -e
```

Adicione esta linha:

```
*/15 * * * * cd /app/backend && python sync_carioca.py update
```

Pronto! A cada 15 minutos, o CallClub atualiza os placares sozinho! 🤖

---

## 📊 COMANDOS ÚTEIS

### Ver quantos jogos tem no banco:
```bash
mongosh mongodb://localhost:27017/test_database --quiet --eval "db.matches.countDocuments({})"
```

### Ver próximos jogos:
```bash
mongosh mongodb://localhost:27017/test_database --quiet --eval "db.matches.find({is_finished: false}).limit(5).forEach(m => print(m.home_team + ' vs ' + m.away_team))"
```

### Limpar tudo e sincronizar de novo:
```bash
cd /app/backend
python sync_carioca.py
```

---

## ⚠️ IMPORTANTE - LIMITES DA API GRÁTIS

- **100 requisições por dia**
- **10 requisições por minuto**

**O que isso significa:**
- Sincronizar jogos: ~2 requisições
- Atualizar 10 resultados: ~10 requisições
- **Sobram 88 requisições!**

👉 **Recomendação:** Atualize resultados no máximo a cada 15 minutos (96 atualizações/dia = OK!)

---

## 🐛 PROBLEMAS COMUNS

### "Nenhum jogo encontrado"
→ API key está incorreta ou Carioca 2026 não começou ainda

### "Module not found"
→ Execute: `cd /app/backend && pip install httpx`

### "Liga não encontrada"
→ O script vai tentar IDs comuns automaticamente

### Resultados não atualizam
→ Verifique se os jogos já terminaram e rode: `python sync_carioca.py update`

---

## 🎯 CHECKLIST FINAL

- [ ] API Key copiada de api-football.com
- [ ] Key adicionada em `/app/backend/.env`
- [ ] Executou `python sync_carioca.py`
- [ ] Viu mensagem "✅ SINCRONIZAÇÃO COMPLETA!"
- [ ] Testou fazer um palpite no site
- [ ] (Opcional) Configurou atualização automática no cron

---

## 🚀 DEPOIS DO CARIOCA

Quando o **Brasileirão 2026** começar (abril), você pode:

1. Editar `sync_carioca.py`
2. Trocar "Carioca" por "Serie A"
3. Trocar season para 2026
4. Executar de novo!

**Pronto!** CallClub funciona com qualquer campeonato! 🏆

---

**Dúvidas?** Leia `/app/CALLCLUB_README.md`
