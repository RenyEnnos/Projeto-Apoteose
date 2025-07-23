import { getGameState, updateApertureState } from '../core/gameState.js';
import { log } from '../utils/helpers.js';
import { GameData } from '../core/constants.js';

export function initApertureGrid(size) {
    const grid = [];
    for (let i = 0; i < size * size; i++) {
        grid[i] = { marks: {} };
    }
    return grid;
}

export function terraformCell(grid, x, y, size, daoType, amount) {
    const index = y * size + x;
    const cell = grid[index];
    if (!cell.marks[daoType]) cell.marks[daoType] = 0;
    cell.marks[daoType] += amount;
}

export function createFissure() {
    const gameState = getGameState();
    const size = gameState.aperture.size;
    const x = Math.floor(Math.random() * size);
    const y = Math.floor(Math.random() * size);
    const index = y * size + x;

    const newFissures = [...gameState.aperture.fissures, { x, y }];
    const newGrid = [...gameState.aperture.grid];
    newGrid[index] = { ...newGrid[index], fissure: true };
    
    updateApertureState({ 
        fissures: newFissures, 
        grid: newGrid 
    });
    
    log(`Uma fissura espiritual apareceu na sua Abertura em (${x}, ${y})!`, 'danger');
}

export function updateApertureEcology(currentGameState) {
    const aperture = currentGameState.aperture;
    let stabilityChange = 0;
    let qiGain = 0;

    // Grow flora with player benefit choices
    aperture.flora.forEach(plant => {
        const plantData = GameData.flora.find(p => p.id === plant.id);
        if (!plantData) return;
        plant.growthProgress += aperture.timeRate;
        if (plant.growthProgress > plantData.growthTime) {
            plant.growthProgress = plantData.growthTime;
            
            // Plantas maduras geram benefícios baseados no tipo
            if (plant.id === 'f1') { // Grama Espiritual
                qiGain += 5;
                stabilityChange += 0.5;
            } else if (plant.id === 'f2') { // Árvore da Vida
                qiGain += 15;
                stabilityChange += 1;
            }
        }
    });

    // Handle fauna reproduction with ecological balance
    let reproductions = 0;
    aperture.fauna.forEach(creature => {
        const creatureData = GameData.fauna.find(f => f.id === creature.id);
        if (!creatureData) return;
        creature.reproductionProgress += aperture.timeRate;
        
        // Limite de população baseado no tamanho da abertura
        const maxPopulation = aperture.size * aperture.size * 0.3;
        
        if (creature.reproductionProgress >= creatureData.reproducesIn && aperture.fauna.length < maxPopulation) {
            creature.reproductionProgress = 0;
            const pos = {
                x: Math.max(0, Math.min(aperture.size - 1, creature.position.x + (Math.random() < 0.5 ? -1 : 1))),
                y: Math.max(0, Math.min(aperture.size - 1, creature.position.y + (Math.random() < 0.5 ? -1 : 1)))
            };
            aperture.fauna.push({ id: creature.id, position: pos, health: creature.health, reproductionProgress: 0 });
            reproductions++;
            
            // Criaturas contribuem para a estabilidade
            stabilityChange += 0.3;
        }
    });
    
    // Aplicar mudanças na abertura
    if (stabilityChange > 0) {
        aperture.stability = Math.min(100, aperture.stability + stabilityChange);
    }
    
    // Dar Qi ao jogador baseado na ecologia
    if (qiGain > 0) {
        updatePlayerQi(qiGain);
        log(`🌿 Sua abertura gerou ${qiGain} Qi através da ecologia natural.`, 'success');
    }
    
    // Notificar reproduções
    if (reproductions > 0) {
        log(`🐾 ${reproductions} nova(s) criatura(s) nasceram em sua Abertura (+${(reproductions * 0.3).toFixed(1)} estabilidade).`, 'info');
    }
    
    // Eventos aleatórios na abertura que requerem decisão do jogador
    if (Math.random() < 0.1) { // 10% chance por update
        generateApertureEvent();
    }
}

// Nova função para eventos que requerem decisão do jogador
function generateApertureEvent() {
    const gameState = getGameState();
    const aperture = gameState.aperture;
    
    const events = [
        {
            name: "Invasão de Pragas",
            description: "Insetos espirituais ameaçam suas plantas. Como reagir?",
            choices: [
                {
                    text: "Usar Qi para exterminar (-20 Qi, salva plantas)",
                    cost: { qi: 20 },
                    effect: () => {
                        log("✨ Você usou Qi para eliminar as pragas. Plantas salvas!", 'success');
                        return { stability: 2 };
                    }
                },
                {
                    text: "Deixar a natureza seguir seu curso",
                    cost: {},
                    effect: () => {
                        // Remove algumas plantas
                        aperture.flora = aperture.flora.filter(() => Math.random() > 0.3);
                        log("🍃 Algumas plantas foram perdidas, mas o ecossistema se equilibrou.", 'warning');
                        return { stability: -1 };
                    }
                }
            ]
        },
        {
            name: "Descoberta de Nascente Espiritual",
            description: "Uma nascente de energia foi descoberta. Como utilizá-la?",
            choices: [
                {
                    text: "Canalizar para crescimento acelerado (acelera tempo)",
                    cost: {},
                    effect: () => {
                        aperture.timeRate += 0.2;
                        log("⏰ Taxa temporal da abertura aumentou permanentemente!", 'gold');
                        return { stability: 1 };
                    }
                },
                {
                    text: "Absorver energia diretamente (+100 Qi)",
                    cost: {},
                    effect: () => {
                        updatePlayerQi(100);
                        log("💎 Você absorveu a energia da nascente diretamente!", 'gold');
                        return { stability: 0 };
                    }
                }
            ]
        }
    ];
    
    const event = events[Math.floor(Math.random() * events.length)];
    log(`🌟 EVENTO DA ABERTURA: ${event.name}`, 'gold');
    log(`📝 ${event.description}`, 'info');
    
    // Por enquanto, aplicar efeito aleatório. Idealmente seria uma escolha do jogador via UI
    const choice = event.choices[Math.floor(Math.random() * event.choices.length)];
    
    // Verificar se pode pagar o custo
    const gameState2 = getGameState();
    let canAfford = true;
    if (choice.cost.qi && gameState2.player.qi < choice.cost.qi) {
        canAfford = false;
    }
    
    if (canAfford) {
        // Aplicar custos
        if (choice.cost.qi) {
            updatePlayerQi(-choice.cost.qi);
        }
        
        // Aplicar efeitos
        const effects = choice.effect();
        if (effects.stability) {
            aperture.stability = Math.max(0, Math.min(100, aperture.stability + effects.stability));
        }
        
        log(`⚡ ${choice.text}`, 'important');
    } else {
        log(`❌ Qi insuficiente para tomar ação. O evento passou sem intervenção.`, 'warning');
    }
}
