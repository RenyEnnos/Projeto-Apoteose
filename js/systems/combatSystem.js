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
