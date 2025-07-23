import { GameData } from '../core/constants.js';
import { getGameState, updateGameState } from '../core/gameState.js';
import { addPlayerExp } from '../core/gameState.js';
import { log } from '../utils/helpers.js';

function randomElement(arr){return arr[Math.floor(Math.random()*arr.length)];}

function generateQuests(gameState){
    const templates=[
        gs=>({
            id:`q${Date.now()}`,
            title:'Caçada Regional',
            description:'Derrote algumas criaturas que ameaçam os arredores.',
            type:'hunt',
            target:randomElement(GameData.enemies).id,
            amount:3+Math.floor(Math.random()*3),
            reward:{exp:200+gs.time.day*10},
            completed:0,
            status:'active',
            faction:randomElement(gs.factions).id
        }),
        gs=>({
            id:`q${Date.now()}b`,
            title:'Coleta de Recursos',
            description:'Reúna materiais raros para a facção aliada.',
            type:'gather',
            target:randomElement(GameData.flora).id,
            amount:2+Math.floor(Math.random()*4),
            reward:{daoMarks:{life:1},exp:150},
            completed:0,
            status:'active',
            faction:randomElement(gs.factions).id
        })
    ];
    gameState.quests=templates.map(t=>t(gameState));
}

// Função para atualizar progresso de quests
function updateQuestProgress(action, targetId) {
    const gameState = getGameState();
    let questCompleted = false;
    
    gameState.quests.forEach(quest => {
        if (quest.status !== 'active') return;
        
        // Quest de caça - quando matamos inimigo
        if (quest.type === 'hunt' && action === 'enemy_killed' && quest.target === targetId) {
            quest.completed++;
            log(`📋 Quest: ${quest.title} (${quest.completed}/${quest.amount})`, 'info');
            
            if (quest.completed >= quest.amount) {
                completeQuest(quest);
                questCompleted = true;
            }
        }
        
        // Quest de coleta - quando coletamos recurso
        if (quest.type === 'gather' && action === 'resource_gathered' && quest.target === targetId) {
            quest.completed++;
            log(`📋 Quest: ${quest.title} (${quest.completed}/${quest.amount})`, 'info');
            
            if (quest.completed >= quest.amount) {
                completeQuest(quest);
                questCompleted = true;
            }
        }
    });
    
    // Atualiza o estado do jogo se alguma quest foi completada
    if (questCompleted) {
        updateGameState({ quests: gameState.quests });
    }
}

// Função para completar uma quest
function completeQuest(quest) {
    quest.status = 'completed';
    
    // Dar recompensas
    if (quest.reward.exp) {
        addPlayerExp(quest.reward.exp);
        log(`🏆 Quest completada: ${quest.title}! +${quest.reward.exp} EXP`, 'success');
    }
    
    if (quest.reward.daoMarks) {
        // Aqui adicionaríamos dao marks quando esse sistema estiver implementado
        log(`🏆 Quest completada: ${quest.title}! Dao Marks recebidas!`, 'success');
    }
    
    // Melhorar relação com a facção
    const gameState = getGameState();
    const faction = gameState.factions.find(f => f.id === quest.faction);
    if (faction) {
        faction.relationship = Math.min(100, faction.relationship + 10);
        log(`🤝 Relação com ${faction.name} melhorou (+10)`, 'info');
    }
    
    // Gerar nova quest para manter sempre algumas ativas
    generateNewQuest();
}

// Função para gerar uma nova quest quando uma é completada
function generateNewQuest() {
    const gameState = getGameState();
    const templates = [
        gs => ({
            id: `q${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            title: 'Patrulha de Segurança',
            description: 'Elimine ameaças nas proximidades.',
            type: 'hunt',
            target: randomElement(GameData.enemies).id,
            amount: 2 + Math.floor(Math.random() * 3),
            reward: { exp: 150 + gs.time.day * 8 },
            completed: 0,
            status: 'active',
            faction: randomElement(gs.factions).id
        }),
        gs => ({
            id: `q${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            title: 'Suprimentos Essenciais',
            description: 'Colete recursos naturais importantes.',
            type: 'gather',
            target: randomElement(GameData.flora).id,
            amount: 3 + Math.floor(Math.random() * 3),
            reward: { daoMarks: { life: 1 }, exp: 120 },
            completed: 0,
            status: 'active',
            faction: randomElement(gs.factions).id
        }),
        gs => ({
            id: `q${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            title: 'Investigação Arcana',
            description: 'Derrote criaturas poderosas para estudo.',
            type: 'hunt',
            target: randomElement(GameData.enemies.filter(e => e.power >= 15)).id,
            amount: 1,
            reward: { exp: 300 + gs.time.day * 15 },
            completed: 0,
            status: 'active',
            faction: randomElement(gs.factions).id
        })
    ];
    
    const newQuest = randomElement(templates)(gameState);
    gameState.quests.push(newQuest);
    log(`📋 Nova missão disponível: ${newQuest.title}`, 'gold');
}

export { generateQuests, updateQuestProgress };
