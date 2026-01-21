#!/usr/bin/env python3
"""
🔧 CORREÇÃO AUTOMÁTICA DE DADOS DO CALLCLUB
Execute este script para corrigir problemas de integridade.

Uso: python3 fix_data.py
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def fix_all():
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL'))
    db = client[os.environ.get('DB_NAME', 'test_database')]
    
    print('='*60)
    print('🔧 CORREÇÃO AUTOMÁTICA DE DADOS')
    print('='*60)
    
    fixes_applied = []
    
    # ========== 1. CORRIGIR MATCHES SEM CHAMPIONSHIP ==========
    print('\n📊 Corrigindo matches sem championship...')
    
    null_matches = await db.matches.find({'championship': None}).to_list(10000)
    
    if null_matches:
        # Estratégia: Carioca tem 36 jogos (6 rodadas x 6 jogos)
        # Brasileirão tem 380 jogos (38 rodadas x 10 jogos)
        
        for m in null_matches:
            round_num = m.get('round_number', 0)
            league_id = m.get('league_id', '')
            
            # Determinar campeonato
            if 'carioca' in str(league_id).lower() or league_id == '4356':
                champ = 'carioca'
            elif 'brasil' in str(league_id).lower() or league_id == '4351':
                champ = 'brasileirao'
            elif round_num <= 6:
                # Assumir carioca para rodadas 1-6 se não tiver league_id
                champ = 'carioca'
            else:
                champ = 'brasileirao'
            
            await db.matches.update_one(
                {'_id': m['_id']},
                {'$set': {'championship': champ}}
            )
        
        fixes_applied.append(f'✅ {len(null_matches)} matches corrigidos')
        print(f'  ✅ {len(null_matches)} matches corrigidos')
    else:
        print('  ✓ Nenhum match para corrigir')
    
    # ========== 2. CORRIGIR PREDICTIONS SEM CHAMPIONSHIP ==========
    print('\n📊 Corrigindo predictions sem championship...')
    
    # Primeiro, criar dicionário de matches
    all_matches = await db.matches.find({}).to_list(10000)
    matches_dict = {str(m['match_id']): m for m in all_matches}
    
    null_preds = await db.predictions.find({'championship': None}).to_list(10000)
    
    if null_preds:
        fixed_count = 0
        for p in null_preds:
            match_id = str(p.get('match_id'))
            match = matches_dict.get(match_id)
            
            if match and match.get('championship'):
                await db.predictions.update_one(
                    {'_id': p['_id']},
                    {'$set': {'championship': match['championship']}}
                )
                fixed_count += 1
        
        fixes_applied.append(f'✅ {fixed_count} predictions corrigidos')
        print(f'  ✅ {fixed_count} predictions corrigidos')
    else:
        print('  ✓ Nenhum prediction para corrigir')
    
    # ========== 3. RECALCULAR PONTOS PENDENTES ==========
    print('\n📊 Recalculando pontos pendentes...')
    
    # Buscar palpites sem pontos de jogos finalizados
    finished_matches = {str(m['match_id']): m for m in all_matches if m.get('is_finished')}
    all_preds = await db.predictions.find({}).to_list(10000)
    
    recalc_count = 0
    for p in all_preds:
        match_id = str(p.get('match_id'))
        match = finished_matches.get(match_id)
        
        if match and p.get('points') is None:
            # Calcular pontos
            home_pred = p.get('home_prediction')
            away_pred = p.get('away_prediction')
            home_score = match.get('home_score')
            away_score = match.get('away_score')
            
            if home_score is not None and away_score is not None:
                points = 0
                
                # Verificar resultado (V/E/D)
                pred_result = 'home' if home_pred > away_pred else ('away' if away_pred > home_pred else 'draw')
                actual_result = 'home' if home_score > away_score else ('away' if away_score > home_score else 'draw')
                
                if pred_result == actual_result:
                    points += 3
                
                # Verificar gols
                if home_pred == home_score:
                    points += 1
                if away_pred == away_score:
                    points += 1
                
                await db.predictions.update_one(
                    {'_id': p['_id']},
                    {'$set': {'points': points}}
                )
                recalc_count += 1
    
    if recalc_count > 0:
        fixes_applied.append(f'✅ {recalc_count} pontos recalculados')
        print(f'  ✅ {recalc_count} pontos recalculados')
    else:
        print('  ✓ Nenhum ponto para recalcular')
    
    # ========== 4. ATUALIZAR TOTAL_POINTS DOS USUÁRIOS ==========
    print('\n📊 Atualizando total_points dos usuários...')
    
    users = await db.users.find({}).to_list(1000)
    
    for user in users:
        username = user.get('username')
        
        # Soma dos palpites
        pipeline = [
            {'$match': {'username': username, 'points': {'$ne': None}}},
            {'$group': {'_id': None, 'total': {'$sum': '$points'}}}
        ]
        result = await db.predictions.aggregate(pipeline).to_list(1)
        correct_points = result[0]['total'] if result else 0
        
        if user.get('total_points', 0) != correct_points:
            await db.users.update_one(
                {'_id': user['_id']},
                {'$set': {'total_points': correct_points}}
            )
            print(f'  ✅ {username}: {user.get("total_points", 0)} → {correct_points}')
    
    # ========== RESULTADO FINAL ==========
    print('\n' + '='*60)
    print('📋 RESULTADO DA CORREÇÃO')
    print('='*60)
    
    if fixes_applied:
        print('\n✅ CORREÇÕES APLICADAS:')
        for fix in fixes_applied:
            print(f'  {fix}')
    else:
        print('\n✓ Nenhuma correção necessária')
    
    print('\n👉 Execute: python3 diagnostico.py para verificar')
    print('='*60)

if __name__ == '__main__':
    asyncio.run(fix_all())
