# 🔧 TROUBLESHOOTING & LIÇÕES APRENDIDAS - CallClub

> Documento de referência para problemas encontrados e soluções aplicadas.
> Use este arquivo como guia para debugging e prevenção de problemas futuros.

---

## 📋 ÍNDICE
1. [Problema: Dados com championship=null](#problema-1-dados-com-championshipnull)
2. [Checklist de Integridade de Dados](#checklist-de-integridade-de-dados)
3. [Scripts de Diagnóstico](#scripts-de-diagnóstico)
4. [Boas Práticas](#boas-práticas)

---

## 🚨 PROBLEMA #1: Dados com championship=null

### Descrição
Estatísticas do ranking apareciam zeradas mesmo com palpites existentes no banco de dados.

### Causa Raiz
- Registros de `matches` e `predictions` foram criados **sem o campo `championship`** definido
- Quando a API filtrava por `championship: "carioca"`, os registros com `championship: null` eram ignorados
- Resultado: Ranking mostrava 0 pontos, 0 acertos, etc.

### Sintomas
- Ranking detalhado com todas estatísticas zeradas
- Total de palpites correto, mas pontuação errada
- Funciona no ranking geral mas não no ranking por campeonato

### Diagnóstico
```python
# Verificar registros sem championship
await db.predictions.count_documents({'championship': None})
await db.matches.count_documents({'championship': None})

# Se retornar > 0, há dados inconsistentes
```

### Solução Aplicada
```python
# 1. Atualizar matches sem championship
for match in matches:
    if match.get('championship') is None:
        # Determinar campeonato baseado em critérios (league_id, round_number, etc)
        new_champ = determine_championship(match)
        await db.matches.update_one(
            {'_id': match['_id']},
            {'$set': {'championship': new_champ}}
        )

# 2. Atualizar predictions baseado no match associado
for pred in predictions:
    match = await db.matches.find_one({'match_id': pred['match_id']})
    if match and match.get('championship'):
        await db.predictions.update_one(
            {'_id': pred['_id']},
            {'$set': {'championship': match['championship']}}
        )
```

### Prevenção Futura
1. **SEMPRE** definir `championship` ao criar novos registros
2. Adicionar validação no endpoint de criação de palpites
3. Adicionar campo `championship` como **required** nos models Pydantic
4. Criar script de verificação de integridade para rodar periodicamente

---

## ✅ CHECKLIST DE INTEGRIDADE DE DADOS

Execute este checklist quando houver problemas com estatísticas ou rankings:

### 1. Verificar Consistência de Campeonatos
```bash
# Rodar no backend
python3 -c "
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
load_dotenv()

async def check():
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL'))
    db = client[os.environ.get('DB_NAME', 'test_database')]
    
    # Contagens
    print('=== VERIFICAÇÃO DE INTEGRIDADE ===')
    
    # Matches
    total_matches = await db.matches.count_documents({})
    null_champ_matches = await db.matches.count_documents({'championship': None})
    carioca_matches = await db.matches.count_documents({'championship': 'carioca'})
    brasileirao_matches = await db.matches.count_documents({'championship': 'brasileirao'})
    
    print(f'Matches: {total_matches} total')
    print(f'  - carioca: {carioca_matches}')
    print(f'  - brasileirao: {brasileirao_matches}')
    print(f'  - SEM CHAMPIONSHIP: {null_champ_matches} ⚠️' if null_champ_matches > 0 else f'  - sem championship: 0 ✅')
    
    # Predictions
    total_preds = await db.predictions.count_documents({})
    null_champ_preds = await db.predictions.count_documents({'championship': None})
    
    print(f'\\nPredictions: {total_preds} total')
    print(f'  - SEM CHAMPIONSHIP: {null_champ_preds} ⚠️' if null_champ_preds > 0 else f'  - sem championship: 0 ✅')
    
    # Verificar pontos
    preds_with_points = await db.predictions.count_documents({'points': {'\\$ne': None}})
    preds_null_points = await db.predictions.count_documents({'points': None})
    
    print(f'\\nPontuação:')
    print(f'  - Com pontos calculados: {preds_with_points}')
    print(f'  - Sem pontos (aguardando): {preds_null_points}')

asyncio.run(check())
"
```

### 2. Verificar Cruzamento Palpites x Jogos
```bash
# Verificar se todos os palpites têm jogos correspondentes
python3 -c "
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
load_dotenv()

async def check():
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL'))
    db = client[os.environ.get('DB_NAME', 'test_database')]
    
    predictions = await db.predictions.find({}).to_list(10000)
    matches = await db.matches.find({}).to_list(10000)
    match_ids = {str(m['match_id']) for m in matches}
    
    orphan_preds = []
    for p in predictions:
        if str(p.get('match_id')) not in match_ids:
            orphan_preds.append(p)
    
    if orphan_preds:
        print(f'⚠️ {len(orphan_preds)} palpites órfãos (sem jogo correspondente)')
        for p in orphan_preds[:5]:
            print(f'  - {p.get(\"username\")} / match_id={p.get(\"match_id\")}')
    else:
        print('✅ Todos os palpites têm jogos correspondentes')

asyncio.run(check())
"
```

### 3. Verificar Usuários x Palpites
```bash
# Verificar se pontos dos usuários batem com soma dos palpites
python3 -c "
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
load_dotenv()

async def check():
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL'))
    db = client[os.environ.get('DB_NAME', 'test_database')]
    
    users = await db.users.find({}).to_list(1000)
    
    print('=== VERIFICAÇÃO USUÁRIOS x PALPITES ===')
    
    for user in users:
        username = user.get('username')
        user_points = user.get('total_points', 0)
        
        # Soma dos palpites
        pipeline = [
            {'\\$match': {'username': username, 'points': {'\\$ne': None}}},
            {'\\$group': {'_id': None, 'total': {'\\$sum': '\\$points'}}}
        ]
        result = await db.predictions.aggregate(pipeline).to_list(1)
        pred_points = result[0]['total'] if result else 0
        
        status = '✅' if user_points == pred_points else '⚠️ DIVERGÊNCIA'
        print(f'{status} {username}: user={user_points}, palpites={pred_points}')

asyncio.run(check())
"
```

---

## 🛠️ SCRIPTS DE DIAGNÓSTICO

### Script Completo de Diagnóstico
Salvar como `/app/backend/diagnostico.py`:

```python
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def run_diagnostics():
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL'))
    db = client[os.environ.get('DB_NAME', 'test_database')]
    
    print('='*60)
    print('🔍 DIAGNÓSTICO COMPLETO DO CALLCLUB')
    print('='*60)
    
    issues = []
    
    # 1. Verificar championship null
    null_matches = await db.matches.count_documents({'championship': None})
    null_preds = await db.predictions.count_documents({'championship': None})
    
    if null_matches > 0:
        issues.append(f'{null_matches} matches sem championship')
    if null_preds > 0:
        issues.append(f'{null_preds} predictions sem championship')
    
    # 2. Verificar jogos finalizados sem placar
    finished_no_score = await db.matches.count_documents({
        'is_finished': True,
        '$or': [{'home_score': None}, {'away_score': None}]
    })
    if finished_no_score > 0:
        issues.append(f'{finished_no_score} jogos finalizados sem placar')
    
    # 3. Verificar palpites sem pontos em jogos finalizados
    finished_matches = await db.matches.find({'is_finished': True}).to_list(1000)
    finished_ids = [str(m['match_id']) for m in finished_matches]
    
    preds_missing_points = await db.predictions.count_documents({
        'match_id': {'$in': [int(x) for x in finished_ids if x.isdigit()]},
        'points': None
    })
    if preds_missing_points > 0:
        issues.append(f'{preds_missing_points} palpites sem pontos calculados')
    
    # Resultado
    print('\n📊 RESULTADO:')
    if issues:
        print('⚠️ PROBLEMAS ENCONTRADOS:')
        for issue in issues:
            print(f'  - {issue}')
    else:
        print('✅ NENHUM PROBLEMA ENCONTRADO!')
    
    return len(issues) == 0

if __name__ == '__main__':
    asyncio.run(run_diagnostics())
```

### Script de Correção Automática
Salvar como `/app/backend/fix_data.py`:

```python
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def fix_all():
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL'))
    db = client[os.environ.get('DB_NAME', 'test_database')]
    
    print('🔧 INICIANDO CORREÇÃO DE DADOS...')
    
    # 1. Corrigir matches sem championship
    matches = await db.matches.find({'championship': None}).to_list(10000)
    for m in matches:
        # Lógica para determinar campeonato
        # Carioca: 36 jogos, 6 rodadas
        # Brasileirão: 320+ jogos, 38 rodadas
        round_num = m.get('round_number', 0)
        
        # Contar jogos na mesma rodada
        same_round = await db.matches.count_documents({
            'round_number': round_num,
            'championship': None
        })
        
        if round_num <= 6 and same_round <= 10:
            champ = 'carioca'
        else:
            champ = 'brasileirao'
        
        await db.matches.update_one(
            {'_id': m['_id']},
            {'$set': {'championship': champ}}
        )
    
    print(f'✅ {len(matches)} matches corrigidos')
    
    # 2. Corrigir predictions baseado nos matches
    matches_dict = {str(m['match_id']): m async for m in db.matches.find({})}
    predictions = await db.predictions.find({'championship': None}).to_list(10000)
    
    for p in predictions:
        match = matches_dict.get(str(p.get('match_id')))
        if match and match.get('championship'):
            await db.predictions.update_one(
                {'_id': p['_id']},
                {'$set': {'championship': match['championship']}}
            )
    
    print(f'✅ {len(predictions)} predictions corrigidos')
    
    print('🎉 CORREÇÃO CONCLUÍDA!')

if __name__ == '__main__':
    asyncio.run(fix_all())
```

---

## 📚 BOAS PRÁTICAS

### 1. Sempre Validar Dados na Entrada
```python
# No endpoint de criação de palpite
@api_router.post("/predictions")
async def create_prediction(pred: PredictionCreate):
    # SEMPRE buscar o match para garantir championship
    match = await db.matches.find_one({'match_id': pred.match_id})
    if not match:
        raise HTTPException(404, "Jogo não encontrado")
    
    # Usar championship do match, não do request
    pred_data = pred.model_dump()
    pred_data['championship'] = match.get('championship')  # IMPORTANTE!
    
    await db.predictions.insert_one(pred_data)
```

### 2. Criar Índices no MongoDB
```python
# Executar uma vez para otimizar queries
await db.matches.create_index([('championship', 1), ('round_number', 1)])
await db.predictions.create_index([('championship', 1), ('username', 1)])
await db.predictions.create_index('match_id')
```

### 3. Logs de Auditoria
Sempre logar operações críticas:
```python
await db.audit_logs.insert_one({
    'action': 'prediction_created',
    'username': username,
    'match_id': match_id,
    'championship': championship,
    'timestamp': datetime.now(timezone.utc)
})
```

### 4. Verificação Periódica
Rodar diagnóstico após:
- Sincronização de dados (sync_thesportsdb.py)
- Deploy de nova versão
- Recálculo de pontos
- Relatórios de bugs dos usuários

---

## 🔗 ARQUIVOS RELACIONADOS

- `/app/backend/server.py` - Endpoints principais
- `/app/backend/sync_thesportsdb.py` - Sincronização de dados
- `/app/backend/.env` - Configurações do banco
- `/app/memory/PRD.md` - Requisitos do produto

---

## 📅 HISTÓRICO DE PROBLEMAS

| Data | Problema | Solução | Impacto |
|------|----------|---------|---------|
| 2026-01-20 | championship=null em matches e predictions | Script de correção em massa | Alto - Ranking zerado |

---

*Documento criado em 20/01/2026*
*Última atualização: 20/01/2026*
