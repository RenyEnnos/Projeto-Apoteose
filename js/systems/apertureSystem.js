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

import { gameState } from '../core/gameState.js';
import { log } from '../utils/helpers.js';

export function createFissure() {
    const size = gameState.aperture.size;
    const x = Math.floor(Math.random() * size);
    const y = Math.floor(Math.random() * size);
    const index = y * size + x;

    gameState.aperture.fissures.push({ x, y });
    gameState.aperture.grid[index].fissure = true;
    log(`Uma fissura espiritual apareceu na sua Abertura em (${x}, ${y})!`, 'danger');
}
