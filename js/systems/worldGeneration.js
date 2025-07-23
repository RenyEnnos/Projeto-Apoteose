import { GameData } from '../core/constants.js';

function lerp(t, a, b) { return a + t * (b - a); }
function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function mulberry32(a) { return function() { let t = a += 0x6d2b79f5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function createNoise(seed) {
    const rand = mulberry32(seed);
    const perm = new Uint8Array(512);
    for (let i = 0; i < 256; i++) perm[i] = i;
    for (let i = 0; i < 256; i++) {
        const j = i + Math.floor(rand() * (256 - i));
        [perm[i], perm[j]] = [perm[j], perm[i]];
        perm[i + 256] = perm[i];
    }
    function grad(hash, x, y) {
        const h = hash & 3;
        return ((h & 1) ? -x : x) + ((h & 2) ? -y : y);
    }
    return function (x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        x -= Math.floor(x);
        y -= Math.floor(y);
        const u = fade(x);
        const v = fade(y);
        const A = perm[X] + Y;
        const B = perm[X + 1] + Y;
        return lerp(v,
            lerp(u, grad(perm[A], x, y), grad(perm[B], x - 1, y)),
            lerp(u, grad(perm[A + 1], x, y - 1), grad(perm[B + 1], x - 1, y - 1))
        );
    };
}

export function generateWorld(gameState, seed = Math.random()) {
    const noise = createNoise(Math.floor(seed * 65536));
    const random = mulberry32(Math.floor(seed * 1000));
    
    gameState.world.grid = [];
    
    // Gera biomas e conteúdo
    for (let y = 0; y < gameState.world.sizeY; y++) {
        for (let x = 0; x < gameState.world.sizeX; x++) {
            const n = noise(x / 10, y / 10);
            let biome = 'forest';
            if (n < -0.2) biome = 'ocean';
            else if (n < 0) biome = 'desert';
            else if (n < 0.2) biome = 'forest';
            else if (n < 0.5) biome = 'mountain';
            else biome = 'volcanic';
            
            // Cria célula base
            const cell = { biome, type: 'empty' };
            
            // Evita spawnar conteúdo na posição inicial do jogador
            const isPlayerStart = gameState.player.position && 
                (x === gameState.player.position.x && y === gameState.player.position.y);
            
            if (!isPlayerStart) {
                const contentRoll = random();
                
                // 20% chance de inimigo (aumentado de 15%)
                if (contentRoll < 0.20) {
                    cell.type = 'enemy';
                }
                // 18% chance de recurso (aumentado de 10%)
                else if (contentRoll < 0.38) {
                    cell.type = 'resource';
                }
                // 8% chance de ruína (aumentado de 5%)
                else if (contentRoll < 0.46) {
                    cell.type = 'ruin';
                }
                // 4% chance de comerciante/evento especial (novo)
                else if (contentRoll < 0.50) {
                    cell.type = 'special';
                }
                // 50% fica vazio (reduzido de 70%)
            }
            
            gameState.world.grid[y * gameState.world.sizeX + x] = cell;
        }
    }
    
    // Estatísticas de geração do mundo (removido console.log para produção)
    const stats = gameState.world.grid.reduce((acc, cell) => {
        acc[cell.type] = (acc[cell.type] || 0) + 1;
        return acc;
    }, {});
}
