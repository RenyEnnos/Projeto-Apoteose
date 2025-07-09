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
    gameState.world.grid = [];
    for (let y = 0; y < gameState.world.sizeY; y++) {
        for (let x = 0; x < gameState.world.sizeX; x++) {
            const n = noise(x / 10, y / 10);
            let biome = 'forest';
            if (n < -0.2) biome = 'ocean';
            else if (n < 0) biome = 'desert';
            else if (n < 0.2) biome = 'forest';
            else if (n < 0.5) biome = 'mountain';
            else biome = 'volcanic';
            gameState.world.grid[y * gameState.world.sizeX + x] = { biome };
        }
    }
}
