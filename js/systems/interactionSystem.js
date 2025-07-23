
import { GameData } from '../core/constants.js';
import { 
    getGameState, 
    updatePlayerState, 
    updatePlayerPosition, 
    addPlayerExp, 
    updatePlayerQi,
    updateApertureState,
    updateWorldState 
} from '../core/gameState.js';
import { log } from '../utils/helpers.js';
import { engageCombat, engageCombatWithAI } from './combatSystem.js';
import { showPlantingMenu, showFactionDialog, chooseAbility } from '../ui/uiManager.js';
import { updateQuestProgress } from './questSystem.js';

function cellClickHandler(x, y) {
    const gameState = getGameState();
    
    if (gameState.world.currentView === 'external') {
        // Move player to clicked position
        updatePlayerPosition(x, y);
        log(`Movido para posição (${x}, ${y}).`);
        
        // Handle any interaction at the new position
        const cellIndex = y * gameState.world.sizeX + x;
        const cell = gameState.world.grid[cellIndex];
        handleCellInteraction(cell, x, y);
    } else {
        handleApertureInteraction(x, y);
    }
}

function handleCellInteraction(cell, x, y) {
    if (cell.soul) {
        const gameState = getGameState();
        const gained = cell.soul;
        addPlayerExp(gained);
        
        const newLostExp = Math.max(0, (gameState.player.lostExp || 0) - gained);
        updatePlayerState({ lostExp: newLostExp });
        
        const newSoulRemnants = gameState.world.soulRemnants.filter(s => !(s.x === x && s.y === y));
        const newGrid = [...gameState.world.grid];
        delete newGrid[y * gameState.world.sizeX + x].soul;
        
        updateWorldState({ 
            soulRemnants: newSoulRemnants, 
            grid: newGrid 
        });
        
        log(`Você recuperou ${gained} de EXP perdido!`, 'success');
        checkRealmUp();
        return;
    }
    
    switch (cell.type) {
        case 'enemy':
            const enemyType = GameData.enemies[Math.floor(Math.random() * GameData.enemies.length)];
            log(`💀 Você encontrou: ${enemyType.name}!`, 'danger');
            
            // Análise com IA (assíncrona mas não bloqueia)
            engageCombatWithAI(enemyType).catch(error => {
                console.error('AI combat analysis failed:', error);
            });
            
            // Executa combate diretamente sem delay
            const chosenAbility = chooseAbility();
            // Fallback para ataque básico se chooseAbility retornar null/undefined
            const safeAbility = chosenAbility || {
                id: 'basic_attack',
                name: 'Ataque Básico',
                power: 20,
                cost: 5,
                tags: ['básico']
            };
            const result = engageCombat(enemyType, safeAbility);
            
            if (result === 'win') {
                cell.type = 'empty';
                processCombatLoot(enemyType);
                // Atualizar progresso de quests de caça
                updateQuestProgress('enemy_killed', enemyType.id);
                log('✅ Inimigo eliminado da região!', 'success');
            } else if (result === 'lose') {
                log('💀 Você foi derrotado e recuou!', 'danger');
            } else if (result === 'draw') {
                log('🤝 Combate inconclusivo - ambos recuaram', 'warning');
            } else if (result === 'ongoing') {
                log('⚔️ O combate continua...', 'warning');
            }
            break;
        case 'resource':
            const gameState = getGameState();
            
            // Determinar qual recurso foi encontrado (baseado na flora do jogo)
            const availableFlora = GameData.flora;
            const foundResource = availableFlora[Math.floor(Math.random() * availableFlora.length)];
            
            const qiGained = 50 + Math.floor(Math.random() * 50);
            const maxQi = GameData.realms[gameState.player.realmIndex].maxQi;
            const newQi = Math.min(maxQi, gameState.player.qi + qiGained);
            
            updatePlayerState({ qi: newQi });
            
            const newGrid = [...gameState.world.grid];
            newGrid[y * gameState.world.sizeX + x].type = 'empty';
            updateWorldState({ grid: newGrid });
            
            // Atualizar progresso de quests de coleta
            updateQuestProgress('resource_gathered', foundResource.id);
            
            log(`Você coletou ${foundResource.name} e absorveu ${qiGained} de Essência.`, 'success');
            break;
        case 'ruin':
            log('Você encontrou ruínas antigas e misteriosas.', 'important');
            if (Math.random() > 0.5) {
                const gameState = getGameState();
                const availableInsights = GameData.insights.filter(i => !gameState.player.discoveredInsights.includes(i.id));
                if (availableInsights.length > 0) {
                    const insight = availableInsights[Math.floor(Math.random() * availableInsights.length)];
                    const newInsights = [...gameState.player.discoveredInsights, insight.id];
                    updatePlayerState({ discoveredInsights: newInsights });
                    log(`Dentro das ruínas, você encontrou o Fragmento de Insight: ${insight.name}!`, 'gold');
                }
            }
            
            const gameState2 = getGameState();
            const newGrid2 = [...gameState2.world.grid];
            newGrid2[y * gameState2.world.sizeX + x].type = 'empty';
            updateWorldState({ grid: newGrid2 });
            break;
        case 'special':
            // Eventos especiais variados
            const eventRoll = Math.random();
            if (eventRoll < 0.4) {
                // Comerciante errante
                const gameState = getGameState();
                const qiOffered = 100 + Math.floor(Math.random() * 100);
                const expCost = 50 + Math.floor(Math.random() * 50);
                
                if (gameState.player.exp >= expCost) {
                    updatePlayerState({ exp: gameState.player.exp - expCost });
                    updatePlayerQi(qiOffered);
                    log(`🧙 Comerciante errante oferece ${qiOffered} Qi por ${expCost} EXP. Negócio fechado!`, 'gold');
                } else {
                    log(`🧙 Comerciante errante ofereceria ${qiOffered} Qi por ${expCost} EXP, mas você não tem EXP suficiente.`, 'warning');
                }
            } else if (eventRoll < 0.7) {
                // Fonte de energia natural
                const qiGained = 75 + Math.floor(Math.random() * 75);
                updatePlayerQi(qiGained);
                log(`🌟 Você encontrou uma fonte de energia natural pura e absorveu ${qiGained} Qi!`, 'success');
            } else {
                // Encontro com cultivador amigável
                const expGained = 100 + Math.floor(Math.random() * 100);
                addPlayerExp(expGained);
                log(`👥 Você teve um encontro proveitoso com outro cultivador e ganhou ${expGained} EXP através de troca de experiências!`, 'gold');
            }
            
            // Remove evento especial após uso
            const gameState4 = getGameState();
            const newGrid4 = [...gameState4.world.grid];
            newGrid4[y * gameState4.world.sizeX + x].type = 'empty';
            updateWorldState({ grid: newGrid4 });
            break;
        case 'faction':
            const gameState3 = getGameState();
            const faction = gameState3.factions.find(f => f.id === cell.faction);
            if (faction) {
                showFactionDialog(faction);
            }
            break;
    }
    checkRealmUp();
}


function processCombatLoot(enemyType) {
    enemyType.loot.forEach(loot => {
        if (Math.random() < loot.chance) {
            if (loot.item === 'insight_fragment') {
                const gameState = getGameState();
                const insight = GameData.insights.find(i => i.id === loot.type);
                if (insight && !gameState.player.discoveredInsights.includes(insight.id)) {
                    const newInsights = [...gameState.player.discoveredInsights, insight.id];
                    updatePlayerState({ discoveredInsights: newInsights });
                    log(`Você descobriu um novo Fragmento de Insight: ${insight.name}!`, 'success');
                }
            }
        }
    });
}

function handleApertureInteraction(x, y) {
    const gameState = getGameState();
    const index = y * gameState.aperture.size + x;
    const cell = gameState.aperture.grid[index];
    const plant = gameState.aperture.flora.find(p => p.position.x === x && p.position.y === y);
    
    if (plant) {
        const plantData = GameData.flora.find(p => p.id === plant.id);
        if (plant.growthProgress >= plantData.growthTime) {
            harvestPlant(plant, plantData);
            return;
        }
    }
    
    if (cell.fissure) {
        sealFissure(x, y);
        return;
    }
    
    showPlantingMenu(x, y);
}

function harvestPlant(plant, plantData) {
    const gameState = getGameState();
    
    if (plantData.resource === 'qi') {
        updatePlayerQi(plantData.amount);
        log(`Você colheu ${plantData.name} e absorveu ${plantData.amount} de Qi.`, 'success');
    } else if (plantData.resource === 'dao_mark') {
        const currentMarks = gameState.player.daoMarks[plantData.type] || 0;
        const newDaoMarks = { 
            ...gameState.player.daoMarks, 
            [plantData.type]: currentMarks + plantData.amount 
        };
        updatePlayerState({ daoMarks: newDaoMarks });
        log(`Você colheu ${plantData.name} e ganhou ${plantData.amount} Marcas de Dao ${plantData.type}.`, 'success');
    }
    
    const newFlora = gameState.aperture.flora.filter(p => !(p.position.x === plant.position.x && p.position.y === plant.position.y));
    updateApertureState({ flora: newFlora });
}

function sealFissure(x, y) {
    const gameState = getGameState();
    const soulCost = 50;
    
    if (gameState.aperture.soulFoundation >= soulCost) {
        const newSoulFoundation = gameState.aperture.soulFoundation - soulCost;
        const newStability = gameState.aperture.stability + 5;
        const index = y * gameState.aperture.size + x;
        
        const newGrid = [...gameState.aperture.grid];
        const newCell = { ...newGrid[index] };
        delete newCell.fissure;
        newGrid[index] = newCell;
        
        const newFissures = gameState.aperture.fissures.filter(f => !(f.x === x && f.y === y));
        
        updateApertureState({ 
            soulFoundation: newSoulFoundation, 
            stability: newStability, 
            grid: newGrid, 
            fissures: newFissures 
        });
        
        log(`Você selou a fissura espiritual em (${x}, ${y}) usando ${soulCost} Fundação da Alma.`, 'success');
    } else {
        log('Fundação da Alma insuficiente para selar a fissura!', 'danger');
    }
}

function checkRealmUp() {
    const gameState = getGameState();
    const player = gameState.player;
    const realm = GameData.realms[player.realmIndex];
    
    if (player.exp >= realm.expToNext) {
        const newExp = player.exp - realm.expToNext;
        const newRealmIndex = player.realmIndex + 1;
        const newRealm = GameData.realms[newRealmIndex];
        
        updatePlayerState({ 
            exp: newExp, 
            realmIndex: newRealmIndex, 
            qi: newRealm.maxQi 
        });
        
        log(`AVANÇO! Você alcançou o reino de ${newRealm.name}!`, 'important');
        
        if (newRealmIndex === 2 && !gameState.aperture.unlocked) {
            updateApertureState({ unlocked: true });
            log('Sua alma se expande! A Abertura Imortal nasceu!', 'gold');
        }
    }
}

export { cellClickHandler, handleCellInteraction, handleApertureInteraction, checkRealmUp };
