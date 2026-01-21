#!/usr/bin/env python3
"""
🔍 DIAGNÓSTICO COMPLETO DO CALLCLUB
Execute este script para verificar integridade dos dados.

Uso: python3 diagnostico.py
"""

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
    warnings = []
    
    # ========== 1. VERIFICAR MATCHES ==========
    print('\n📊 MATCHES:')
    
    total_matches = await db.matches.count_documents({})
    null_champ_matches = await db.matches.count_documents({'championship': None})
    carioca_matches = await db.matches.count_documents({'championship': 'carioca'})
    brasileirao_matches = await db.matches.count_documents({'championship': 'brasileirao'})
    finished_matches = await db.matches.count_documents({'is_finished': True})
    
    print(f'  Total: {total_matches}')
    print(f'  Carioca: {carioca_matches}')
    print(f'  Brasileirão: {brasileirao_matches}')
    print(f'  Finalizados: {finished_matches}')
    
    if null_champ_matches > 0:
        issues.append(f'❌ {null_champ_matches} matches SEM championship definido')
        print(f'  ⚠️ SEM CHAMPIONSHIP: {null_champ_matches}')
    else:
        print(f'  ✅ Todos com championship definido')
    
    # Verificar jogos finalizados sem placar
    finished_no_score = await db.matches.count_documents({
        'is_finished': True,
        '$or': [{'home_score': None}, {'away_score': None}]
    })
    if finished_no_score > 0:
        issues.append(f'❌ {finished_no_score} jogos finalizados sem placar')
    
    # ========== 2. VERIFICAR PREDICTIONS ==========
    print('\n📊 PREDICTIONS:')
    
    total_preds = await db.predictions.count_documents({})
    null_champ_preds = await db.predictions.count_documents({'championship': None})
    carioca_preds = await db.predictions.count_documents({'championship': 'carioca'})
    brasileirao_preds = await db.predictions.count_documents({'championship': 'brasileirao'})
    preds_with_points = await db.predictions.count_documents({'points': {'$ne': None}})
    
    print(f'  Total: {total_preds}')
    print(f'  Carioca: {carioca_preds}')
    print(f'  Brasileirão: {brasileirao_preds}')
    print(f'  Com pontos calculados: {preds_with_points}')
    
    if null_champ_preds > 0:
        issues.append(f'❌ {null_champ_preds} predictions SEM championship definido')
        print(f'  ⚠️ SEM CHAMPIONSHIP: {null_champ_preds}')
    else:
        print(f'  ✅ Todos com championship definido')
    
    # ========== 3. VERIFICAR CRUZAMENTO ==========
    print('\n🔗 CRUZAMENTO PALPITES x JOGOS:')
    
    predictions = await db.predictions.find({}).to_list(10000)
    matches = await db.matches.find({}).to_list(10000)
    match_ids = {str(m['match_id']) for m in matches}
    
    orphan_count = 0
    for p in predictions:
        if str(p.get('match_id')) not in match_ids:
            orphan_count += 1
    
    if orphan_count > 0:
        issues.append(f'❌ {orphan_count} palpites órfãos (sem jogo correspondente)')
        print(f'  ⚠️ Palpites órfãos: {orphan_count}')
    else:
        print(f'  ✅ Todos os palpites têm jogos correspondentes')
    
    # ========== 4. VERIFICAR PONTOS PENDENTES ==========
    print('\n📊 PONTOS PENDENTES:')
    
    finished_match_ids = [str(m['match_id']) for m in matches if m.get('is_finished')]
    
    preds_missing_points = 0
    for p in predictions:
        if str(p.get('match_id')) in finished_match_ids and p.get('points') is None:
            preds_missing_points += 1
    
    if preds_missing_points > 0:
        warnings.append(f'⚠️ {preds_missing_points} palpites sem pontos (jogos já finalizados)')
        print(f'  ⚠️ Palpites sem pontos calculados: {preds_missing_points}')
    else:
        print(f'  ✅ Todos os palpites de jogos finalizados têm pontos')
    
    # ========== 5. VERIFICAR USUÁRIOS ==========
    print('\n👤 USUÁRIOS:')
    
    users = await db.users.find({}).to_list(1000)
    print(f'  Total: {len(users)}')
    
    for user in users:
        username = user.get('username')
        user_points = user.get('total_points', 0)
        
        # Soma dos palpites
        pipeline = [
            {'$match': {'username': username, 'points': {'$ne': None}}},
            {'$group': {'_id': None, 'total': {'$sum': '$points'}}}
        ]
        result = await db.predictions.aggregate(pipeline).to_list(1)
        pred_points = result[0]['total'] if result else 0
        
        if user_points != pred_points:
            warnings.append(f'⚠️ {username}: user.total_points={user_points} ≠ soma_palpites={pred_points}')
            print(f'  ⚠️ {username}: divergência de pontos (user={user_points}, palpites={pred_points})')
        else:
            print(f'  ✅ {username}: {user_points} pts')
    
    # ========== RESULTADO FINAL ==========
    print('\n' + '='*60)
    print('📋 RESULTADO DO DIAGNÓSTICO')
    print('='*60)
    
    if issues:
        print('\n❌ PROBLEMAS CRÍTICOS:')
        for issue in issues:
            print(f'  {issue}')
        print('\n👉 Execute: python3 fix_data.py para corrigir')
    
    if warnings:
        print('\n⚠️ AVISOS:')
        for warning in warnings:
            print(f'  {warning}')
    
    if not issues and not warnings:
        print('\n✅ SISTEMA 100% ÍNTEGRO!')
    
    print('\n' + '='*60)
    
    return len(issues) == 0

if __name__ == '__main__':
    result = asyncio.run(run_diagnostics())
    exit(0 if result else 1)
