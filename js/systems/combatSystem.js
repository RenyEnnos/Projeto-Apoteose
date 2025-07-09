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
    if (Math.random() * 100 > ability.stability) {
        return { outcome: 'failure', catastrophic: true };
    }
    const damage = ability.power;
    enemy.hp -= damage;
    return { outcome: 'hit', damage };
}

import { GameData } from '../core/constants.js';
import { gameState } from '../core/gameState.js';
import { log } from '../utils/helpers.js';

export function engageCombat(enemy){
    log(`Combate iniciado com: ${enemy.name}`, 'danger');
    let playerHealth = gameState.player.qi;
    let enemyHealth = enemy.hp;
    let turn = 0;
    while(playerHealth>0 && enemyHealth>0){
        turn++;
        const ability = gameState.player.craftedAbilities[0];
        if(ability){
            const result = useAbility({...ability}, gameState.player, enemy);
            if(result.outcome==='failure'){
                log('Sua habilidade falhou catastroficamente!', 'danger');
                playerHealth -= 50;
            }else{
                enemyHealth -= result.damage;
                log(`Você usou ${ability.name} causando ${result.damage} de dano!`, 'important');
            }
        }else{
            const dmg = 20 + Math.floor(Math.random()*30);
            enemyHealth -= dmg;
            log(`Você causou ${dmg} de dano ao ${enemy.name}!`, 'important');
        }
        if(enemyHealth<=0)break;
        const enemyDmg = enemy.power + Math.floor(Math.random()*10);
        playerHealth -= enemyDmg;
        log(`O ${enemy.name} causou ${enemyDmg} de dano a você!`, 'danger');
    }
    gameState.player.qi = Math.max(0, playerHealth);
    if(playerHealth<=0){
        handleDeath();
        return 'lose';
    }
    const expGained = enemy.power * 10;
    gameState.player.exp += expGained;
    log(`Você derrotou o ${enemy.name} e ganhou ${expGained} EXP!`, 'success');
    return 'win';
}

function handleDeath(){
    gameState.deaths++;
    const realmQi = GameData.realms[gameState.player.realmIndex].maxQi;
    gameState.player.qi = Math.floor(realmQi*0.5);
    if(!gameState.soulWounded){
        gameState.soulWounded = true;
        log('Sua alma foi ferida!', 'danger');
    }else{
        const lost = Math.floor(gameState.player.exp*0.2);
        gameState.player.exp = Math.max(0, gameState.player.exp - lost);
        gameState.player.lostExp = (gameState.player.lostExp||0) + lost;
        log(`Você perdeu ${lost} de EXP de cultivo.`, 'danger');
        if(Math.random()<0.3){
            createFissure();
        }
    }
}
import { createFissure } from './apertureSystem.js';
