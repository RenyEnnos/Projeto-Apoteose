export { cellClickHandler, handleCellInteraction, handleApertureInteraction };

import { GameData } from '../core/constants.js';
import { gameState } from '../core/gameState.js';
import { log } from '../utils/helpers.js';
import { engageCombat } from './combatSystem.js';
import { showPlantingMenu, showFactionDialog } from '../ui/uiManager.js';

function cellClickHandler(x, y) {
    if (gameState.world.currentView === 'external') {
        const distance = Math.abs(x - gameState.player.position.x) + Math.abs(y - gameState.player.position.y);
        if (distance > 1) {
            log('Muito longe para interagir.', 'danger');
            return;
        }
        gameState.player.position = { x, y };
        const cellIndex = y * gameState.world.sizeX + x;
        const cell = gameState.world.grid[cellIndex];
        handleCellInteraction(cell, x, y);
    } else {
        handleApertureInteraction(x, y);
    }
}

function handleCellInteraction(cell, x, y) {
    switch (cell.type) {
        case 'enemy':
            const enemyType = GameData.enemies[Math.floor(Math.random() * GameData.enemies.length)];
            const result = engageCombat(enemyType);
            if (result === 'win') {
                cell.type = 'empty';
                enemyType.loot.forEach(loot => {
                    if (Math.random() < loot.chance) {
                        if (loot.item === 'insight_fragment') {
                            const insight = GameData.insights.find(i => i.id === loot.type);
                            if (insight && !gameState.player.discoveredInsights.includes(insight.id)) {
                                gameState.player.discoveredInsights.push(insight.id);
                                log(`Você descobriu um novo Fragmento de Insight: ${insight.name}!`, 'success');
                            }
                        }
                    }
                });
            }
            break;
        case 'resource':
            const qiGained = 50 + Math.floor(Math.random() * 50);
            gameState.player.qi = Math.min(
                GameData.realms[gameState.player.realmIndex].maxQi,
                gameState.player.qi + qiGained
            );
            log(`Você encontrou uma fonte de energia e absorveu ${qiGained} de Essência.`, 'success');
            cell.type = 'empty';
            break;
        case 'ruin':
            log('Você encontrou ruínas antigas e misteriosas.', 'important');
            if (Math.random() > 0.5) {
                const availableInsights = GameData.insights.filter(i => !gameState.player.discoveredInsights.includes(i.id));
                if (availableInsights.length > 0) {
                    const insight = availableInsights[Math.floor(Math.random() * availableInsights.length)];
                    gameState.player.discoveredInsights.push(insight.id);
                    log(`Dentro das ruínas, você encontrou o Fragmento de Insight: ${insight.name}!`, 'gold');
                }
            }
            cell.type = 'empty';
            break;
        case 'faction':
            const faction = gameState.factions.find(f => f.id === cell.faction);
            if (faction) {
                showFactionDialog(faction);
            }
            break;
    }
    checkRealmUp();
}

function handleApertureInteraction(x, y) {
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
    if (plantData.resource === 'qi') {
        gameState.player.qi += plantData.amount;
        log(`Você colheu ${plantData.name} e absorveu ${plantData.amount} de Qi.`, 'success');
    } else if (plantData.resource === 'dao_mark') {
        gameState.player.daoMarks[plantData.type] = (gameState.player.daoMarks[plantData.type] || 0) + plantData.amount;
        log(`Você colheu ${plantData.name} e ganhou ${plantData.amount} Marcas de Dao ${plantData.type}.`, 'success');
    }
    gameState.aperture.flora = gameState.aperture.flora.filter(p => !(p.position.x === plant.position.x && p.position.y === plant.position.y));
}

function sealFissure(x, y) {
    const soulCost = 50;
    if (gameState.aperture.soulFoundation >= soulCost) {
        gameState.aperture.soulFoundation -= soulCost;
        gameState.aperture.stability += 5;
        const index = y * gameState.aperture.size + x;
        delete gameState.aperture.grid[index].fissure;
        gameState.aperture.fissures = gameState.aperture.fissures.filter(f => !(f.x === x && f.y === y));
        log(`Você selou a fissura espiritual em (${x}, ${y}) usando ${soulCost} Fundação da Alma.`, 'success');
    } else {
        log('Fundação da Alma insuficiente para selar a fissura!', 'danger');
    }
}

function checkRealmUp() {
    const player = gameState.player;
    const realm = GameData.realms[player.realmIndex];
    if (player.exp >= realm.expToNext) {
        player.exp -= realm.expToNext;
        player.realmIndex++;
        const newRealm = GameData.realms[player.realmIndex];
        player.qi = newRealm.maxQi;
        log(`AVANÇO! Você alcançou o reino de ${newRealm.name}!`, 'important');
        if (player.realmIndex === 2 && !gameState.aperture.unlocked) {
            gameState.aperture.unlocked = true;
            log('Sua alma se expande! A Abertura Imortal nasceu!', 'gold');
        }
    }
}
