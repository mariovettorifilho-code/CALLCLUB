# Lição Aprendida #06

## Título
Código Monolítico sem Separação de Responsabilidades

---

## Contexto
- **Funcionalidade afetada:** Todo o backend
- **Área:** Arquitetura - Estrutura de código
- **Momento do surgimento:** Desde o início do projeto, agravando-se com cada feature adicionada

---

## Problema Identificado
O arquivo `server.py` concentra mais de 1400 linhas de código contendo:
- Todas as rotas da API (auth, matches, predictions, rankings, admin, leagues)
- Toda a lógica de negócio
- Todo o acesso a dados (queries MongoDB)
- Configurações e constantes
- Funções auxiliares

Isso resulta em:
- Dificuldade para encontrar código específico
- Alto risco de efeitos colaterais em mudanças
- Impossibilidade de testar unidades isoladas
- Conflitos frequentes se múltiplos desenvolvedores trabalharem

---

## Causa Raiz

### Técnica
- Projeto iniciou como protótipo rápido em arquivo único
- Cada nova feature foi adicionada ao mesmo arquivo
- Sem refatoração periódica para extrair responsabilidades

### Arquitetural
- Ausência de arquitetura em camadas desde o início
- Sem padrões definidos (Repository, Service, etc.)
- Sem estrutura de pastas planejada

### De Processo
- Foco em "fazer funcionar" ao invés de "fazer bem"
- Débito técnico acumulado sem plano de pagamento
- Ausência de code review com critérios de arquitetura

---

## Por que não foi identificado antes

### Suposição feita
- "É só um arquivo, ainda dá para gerenciar"
- "Vamos refatorar depois quando tiver tempo"

### Onde a análise falhou
- Não foi estabelecido limite de linhas por arquivo
- Não foi questionado quando o arquivo passou de 500, 1000 linhas

### O que não foi questionado
- "Qual o custo de manutenção a longo prazo?"
- "Um novo desenvolvedor conseguiria entender esse código?"

---

## Impacto

### Técnico
- Tempo de onboarding alto para novos desenvolvedores
- Bugs difíceis de isolar (tudo está conectado)
- Impossibilidade de testes unitários efetivos
- Risco de regressão a cada mudança

### Operacional
- Correções simples demoram mais que o necessário
- Medo de "mexer" em código que funciona
- Debug por tentativa e erro

### Produto/usuário
- Lentidão na entrega de novas features
- Bugs recorrentes (ex: AUTHORIZED_USERS em múltiplos lugares)

---

## Solução Aplicada
Ainda não aplicada.

---

## Melhoria Estrutural Recomendada

### Estrutura de Pastas Proposta
```
/app/backend/
├── api/v1/
│   ├── auth.py           # Rotas de autenticação
│   ├── matches.py        # Rotas de partidas
│   ├── predictions.py    # Rotas de palpites
│   ├── rankings.py       # Rotas de classificação
│   ├── leagues.py        # Rotas de ligas
│   └── admin.py          # Rotas administrativas
├── services/
│   ├── auth_service.py
│   ├── match_service.py
│   ├── prediction_service.py
│   └── ranking_service.py
├── repositories/
│   ├── user_repository.py
│   ├── match_repository.py
│   └── prediction_repository.py
├── core/
│   ├── config.py
│   ├── security.py
│   └── exceptions.py
└── main.py               # Entry point enxuto
```

### Regras de Separação
1. **Rotas (api/):** Apenas validação de input e chamada de serviço
2. **Serviços (services/):** Lógica de negócio
3. **Repositórios (repositories/):** Acesso a dados
4. **Core:** Configurações, segurança, exceções

---

## Ação Preventiva
- [ ] Estabelecer limite máximo de 300 linhas por arquivo
- [ ] Alertar quando arquivo ultrapassar 200 linhas
- [ ] Code review deve verificar: "Esta lógica pertence a este arquivo?"
- [ ] Refatoração programada: 20% do tempo de cada sprint
- [ ] Documentar arquitetura de referência no README

---

## Status
**Aguardando Implementação** - Refatoração planejada para Fase 2

