import { GameData } from '../core/constants.js';
import { getGameState, updatePlayerState, updatePlayerQi, addPlayerExp, updateGameState } from '../core/gameState.js';
import { log } from '../utils/helpers.js';
import { createFissure } from './apertureSystem.js';
import { aiManager } from '../ai/aiManager.js';

export function calculateStability(tags) {
    let penalty = 0;
    tags.forEach(t => {
        if (['aoe','multi-alvo','sangue','canalizado'].includes(t)) penalty += 10;
    });
    return Math.max(10, 100 - penalty);
}

export function createAbility(base, modifier, vector) {
    const ability = {
        id: `ability_${Date.now()}`,
        name: `${base.name} ${modifier.name} ${vector.name}`,
        base: base.id,
        modifier: modifier.id,
        vector: vector.id,
        power: Math.round(base.power * modifier.powerMult),
        cost: Math.round(base.cost * modifier.costMult * vector.costMult),
        tags: [...base.tags, ...(modifier.tags||[]), ...(vector.tags||[])]
    };
    ability.stability = calculateStability(ability.tags);
    return ability;
}

export function useAbility(ability, player, enemy) {
    if (player.qi < ability.cost) {
        return { outcome: 'no_qi' };
    }
    player.qi -= ability.cost;
    if (Math.random() * 100 > ability.stability) {
        return { outcome: 'failure', catastrophic: true };
    }
    const damage = ability.power;
    enemy.hp -= damage;
    return { outcome: 'hit', damage };
}

// Nova função para combate com IA
export async function engageCombatWithAI(enemy) {
    const gameState = getGameState();
    
    // Solicita sugestões da IA
    log('🤖 Analisando combate...', 'info');
    const suggestions = await aiManager.getCombatSuggestions(enemy, {
        playerState: gameState.player
    });
    
    // Mostra sugestões para o jogador
    showCombatSuggestions(enemy, suggestions);
    
    return suggestions;
}

function showCombatSuggestions(enemy, suggestions) {
    if (!suggestions.suggestions || suggestions.suggestions.length === 0) {
        log('🤖 Nenhuma sugestão disponível', 'warning');
        return;
    }

    log(`💡 IA sugere (${suggestions.source === 'ai' ? 'IA' : 'Local'}):`, 'important');
    
    suggestions.suggestions.forEach((suggestion, index) => {
        const priority = suggestion.priority === 1 ? '🌟' : suggestion.priority === 2 ? '⭐' : '💡';
        const viableText = suggestion.viable !== false ? '' : ' ❌(runas faltando)';
        const damageText = suggestion.estimatedDamage ? ` (${suggestion.estimatedDamage} dano)` : '';
        const costText = suggestion.qiCost ? ` [${suggestion.qiCost} Qi]` : '';
        
        log(`${priority} ${index + 1}. ${suggestion.combo}${damageText}${costText}${viableText}`, 'info');
        log(`   ${suggestion.reason}`, 'info');
    });

    if (suggestions.strategy) {
        log(`🎯 Estratégia: ${suggestions.strategy}`, 'important');
    }

    if (suggestions.confidence !== undefined) {
        const confidenceText = suggestions.confidence > 0.8 ? 'Alta' : 
                              suggestions.confidence > 0.6 ? 'Média' : 'Baixa';
        log(`📊 Confiança: ${confidenceText} (${Math.round(suggestions.confidence * 100)}%)`, 'info');
    }
}

// A função agora recebe a habilidade escolhida como um parâmetro
export function engageCombat(enemy, chosenAbility){
    log(`⚔️ Combate iniciado com: ${enemy.name} (HP: ${enemy.hp}, Poder: ${enemy.power})`, 'danger');
    const gameState = getGameState();
    let playerQi = gameState.player.qi;
    let enemyState = { hp: enemy.hp };
    
    // Combate em turnos até alguém morrer
    let turnCount = 0;
    const maxTurns = 10; // Limite de segurança
    
    while (enemyState.hp > 0 && playerQi > 0 && turnCount < maxTurns) {
        turnCount++;
        log(`--- Turno ${turnCount} ---`, 'info');
        
        // Ataque do jogador
        let playerDamage = 0;
        if(chosenAbility && chosenAbility.id !== 'basic_attack' && turnCount === 1){
            const player = { ...gameState.player };
            const result = useAbility(chosenAbility, player, enemyState);
            const qiDiff = player.qi - gameState.player.qi;
            if (qiDiff !== 0) {
                updatePlayerQi(qiDiff);
                playerQi = player.qi;
            }
            if(result.outcome==='no_qi'){
                log('Qi insuficiente para usar a habilidade!', 'danger');
                playerDamage = 10; // Dano mínimo
            }else if(result.outcome==='failure'){
                log('Sua habilidade falhou catastroficamente!', 'danger');
                playerQi -= 20;
                playerDamage = 5;
            }else{
                playerDamage = result.damage;
                log(`Você usou ${chosenAbility.name} causando ${result.damage} de dano!`, 'important');
            }
        }else{
            // Ataque básico para turnos subsequentes ou se não há habilidade
            playerDamage = 15 + Math.floor(Math.random() * 20);
            const cost = 5 + Math.floor(Math.random() * 5);
            playerQi -= cost;
            log(`Você atacou causando ${playerDamage} de dano! (-${cost} Qi)`, 'important');
        }
        
        enemyState.hp -= playerDamage;
        
        // Verifica se inimigo morreu
        if(enemyState.hp <= 0) {
            break;
        }
        
        // Ataque do inimigo
        const enemyDmg = enemy.power + Math.floor(Math.random() * 15);
        playerQi -= enemyDmg;
        log(`${enemy.name} causou ${enemyDmg} de dano a você! (-${enemyDmg} Qi)`, 'danger');
        
        // Pequeno delay visual entre turnos (apenas log)
        if (turnCount < maxTurns && enemyState.hp > 0 && playerQi > 0) {
            log(`HP Inimigo: ${Math.max(0, enemyState.hp)}/${enemy.hp} | Seu Qi: ${Math.max(0, playerQi)}`, 'warning');
        }
    }

    // Atualiza o Qi final do jogador
    const currentGameState = getGameState();
    const finalQiDiff = playerQi - currentGameState.player.qi;
    if (finalQiDiff !== 0) {
        updatePlayerQi(finalQiDiff);
    }
    
    // Determina o resultado final
    if(enemyState.hp <= 0) {
        const expGained = enemy.power * 15;
        addPlayerExp(expGained);
        log(`🏆 Você derrotou o ${enemy.name} e ganhou ${expGained} EXP!`, 'success');
        return 'win';
    }

    if(playerQi <= 0){
        handleDeath();
        log(`💀 Você foi derrotado pelo ${enemy.name}!`, 'danger');
        return 'lose';
    }
    
    // Se chegou ao limite de turnos sem ninguém morrer
    log(`⏰ Combate exauriu após ${maxTurns} turnos. Ambos recuam.`, 'warning');
    return 'draw'; 
}


function handleDeath(){
    const gameState = getGameState();
    const newDeaths = gameState.deaths + 1;
    const realmQi = GameData.realms[gameState.player.realmIndex].maxQi;
    const newQi = Math.floor(realmQi * 0.5);
    
    updatePlayerState({ qi: newQi });
    
    if(!gameState.soulWounded){
        updateGameState({ deaths: newDeaths, soulWounded: true });
        log('Sua alma foi ferida!', 'danger');
    }else{
        const lost = Math.floor(gameState.player.exp * 0.05); // Reduzido de 20% para 5%
        const newExp = Math.max(0, gameState.player.exp - lost);
        const newLostExp = (gameState.player.lostExp || 0) + lost;
        
        updatePlayerState({ 
            exp: newExp, 
            lostExp: newLostExp 
        });
        
        log(`Você perdeu ${lost} de EXP de cultivo.`, 'danger');
        
        const pos = { x: gameState.player.position.x, y: gameState.player.position.y };
        const newSoulRemnants = [...gameState.world.soulRemnants, { x: pos.x, y: pos.y, exp: lost }];
        const idx = pos.y * gameState.world.sizeX + pos.x;
        const newGrid = [...gameState.world.grid];
        if(!newGrid[idx]) newGrid[idx] = { biome: 'forest' };
        newGrid[idx].soul = lost;
        
        updateGameState({ 
            deaths: newDeaths,
            world: { 
                ...gameState.world, 
                soulRemnants: newSoulRemnants, 
                grid: newGrid 
            }
        });
        
        if(Math.random() < 0.3){
            createFissure();
        }
    }
}
