import { gameState } from '../core/gameState.js';
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
    const size = gameState.aperture.size;
    const x = Math.floor(Math.random() * size);
    const y = Math.floor(Math.random() * size);
    const index = y * size + x;

    gameState.aperture.fissures.push({ x, y });
    gameState.aperture.grid[index].fissure = true;
    log(`Uma fissura espiritual apareceu na sua Abertura em (${x}, ${y})!`, 'danger');
}

export function updateApertureEcology(currentGameState) {
    const aperture = currentGameState.aperture;

    // Grow flora
    aperture.flora.forEach(plant => {
        const plantData = GameData.flora.find(p => p.id === plant.id);
        if (!plantData) return;
        plant.growthProgress += aperture.timeRate;
        if (plant.growthProgress > plantData.growthTime) {
            plant.growthProgress = plantData.growthTime;
        }
    });

    // Handle fauna reproduction
    aperture.fauna.forEach(creature => {
        const creatureData = GameData.fauna.find(f => f.id === creature.id);
        if (!creatureData) return;
        creature.reproductionProgress += aperture.timeRate;
        if (creature.reproductionProgress >= creatureData.reproducesIn) {
            creature.reproductionProgress = 0;
            const pos = {
                x: Math.max(0, Math.min(aperture.size - 1, creature.position.x + (Math.random() < 0.5 ? -1 : 1))),
                y: Math.max(0, Math.min(aperture.size - 1, creature.position.y + (Math.random() < 0.5 ? -1 : 1)))
            };
            aperture.fauna.push({ id: creature.id, position: pos, health: creature.health, reproductionProgress: 0 });
            log(`Uma nova criatura ${creatureData.name} surgiu em sua Abertura.`, 'important');
        }
    });
}
