import { GameData } from '../core/constants.js';
import { gameState } from '../core/gameState.js';
import { log } from '../utils/helpers.js';
import { createFissure } from './apertureSystem.js';

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

// A função agora recebe a habilidade escolhida como um parâmetro
export function engageCombat(enemy, chosenAbility){
    log(`Combate iniciado com: ${enemy.name}`, 'danger');
    let playerQi = gameState.player.qi;
    let enemyState = { hp: enemy.hp };
    
    // Usa a habilidade fornecida
    if(chosenAbility){
        const result = useAbility(chosenAbility, gameState.player, enemyState);
        playerQi = gameState.player.qi;
        if(result.outcome==='no_qi'){
            log('Qi insuficiente para usar a habilidade!', 'danger');
        }else if(result.outcome==='failure'){
            log('Sua habilidade falhou catastroficamente!', 'danger');
            playerQi -= 50;
        }else{
            log(`Você usou ${chosenAbility.name} causando ${result.damage} de dano!`, 'important');
        }
    }else{
        // Ataque padrão se nenhuma habilidade for escolhida
        const dmg = 20 + Math.floor(Math.random()*30);
        enemyState.hp -= dmg;
        log(`Você causou ${dmg} de dano ao ${enemy.name}!`, 'important');
    }
    
    if(enemyState.hp > 0) {
        const enemyDmg = enemy.power + Math.floor(Math.random()*10);
        playerQi -= enemyDmg;
        log(`O ${enemy.name} causou ${enemyDmg} de dano a você!`, 'danger');
    }

    gameState.player.qi = Math.max(0, playerQi);

    if(playerQi <= 0){
        handleDeath();
        return 'lose';
    }

    if(enemyState.hp <= 0) {
        const expGained = enemy.power * 10;
        gameState.player.exp += expGained;
        log(`Você derrotou o ${enemy.name} e ganhou ${expGained} EXP!`, 'success');
        return 'win';
    }
    
    // Se ninguém morreu, o combate pode continuar em um próximo turno (lógica a ser implementada no futuro)
    return 'ongoing'; 
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
        const pos = { x: gameState.player.position.x, y: gameState.player.position.y };
        gameState.world.soulRemnants.push({ x: pos.x, y: pos.y, exp: lost });
        const idx = pos.y * gameState.world.sizeX + pos.x;
        if(!gameState.world.grid[idx]) gameState.world.grid[idx] = { biome: 'forest' };
        gameState.world.grid[idx].soul = lost;
        if(Math.random()<0.3){
            createFissure();
        }
    }
}
