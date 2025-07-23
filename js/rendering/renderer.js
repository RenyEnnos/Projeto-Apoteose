import { GameData } from '../core/constants.js';
import { updateHUD } from './hud.js';
import { cellClickHandler } from '../systems/interactionSystem.js';

export function render(gameState) {
    renderGrid(gameState);
    updateHUD(gameState);
}

export function renderGrid(gameState) {
    const gridContainer = document.getElementById('world-grid');
    
    if (!gridContainer) {
        console.error('Grid container not found!');
        return;
    }
    
    gridContainer.innerHTML = '';
    const isExternal = gameState.world.currentView === 'external';
    
    const gridData = isExternal ? gameState.world.grid : gameState.aperture.grid;
    const sizeX = isExternal ? gameState.world.sizeX : gameState.aperture.size;
    const sizeY = isExternal ? gameState.world.sizeY : gameState.aperture.size;
    
    gridContainer.className = `grid ${isExternal ? 'world-grid' : 'aperture-grid'}`;
    gridContainer.style.gridTemplateColumns = `repeat(${sizeX}, 1fr)`;
    gridContainer.style.gridTemplateRows = `repeat(${sizeY}, 1fr)`;
    
    for (let y = 0; y < sizeY; y++) {
        for (let x = 0; x < sizeX; x++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.x = x;
            cell.dataset.y = y;
            cell.onclick = () => cellClickHandler(x, y);
            const cellData = gridData[y * sizeX + x];
            if (isExternal && cellData) {
                if (cellData.type === 'enemy') cell.classList.add('enemy-cell');
                if (cellData.type === 'resource') cell.classList.add('resource-cell');
                if (cellData.type === 'ruin') cell.classList.add('ruin-cell');
                if (cellData.type === 'special') cell.classList.add('special-cell');
                if (cellData.soul) cell.classList.add('soul-cell');
                if (gameState.player.position.x === x && gameState.player.position.y === y) {
                    cell.classList.add('player-position');
                }
                gameState.factions.forEach(faction => {
                    if (faction.position.x === x && faction.position.y === y) {
                        cell.classList.add('faction-cell');
                        cell.style.background = faction.color;
                    }
                });
            } else {
                if (cellData.biome) {
                    const biome = GameData.biomes.find(b => b.id === cellData.biome);
                    if (biome) cell.classList.add(`biome-${biome.id}`);
                }
                if (cellData.fissure) cell.classList.add('fissure-cell');
            }
            gridContainer.appendChild(cell);
        }
    }
}
