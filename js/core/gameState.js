let gameState = {
    version: 3.0,
    player: {
        realmIndex: 0,
        exp: 0,
        qi: 100,
        position: { x: 15, y: 10 },
        inventory: {
            spiritStones: 50,
            fireFragments: 3,
            iceFragments: 2
        },
        discoveredInsights: ['i1', 'i4'],
        unlockedRunes: ['b1', 'b4', 'm1', 'v1'],
        craftedAbilities: [],
        lostExp: 0,
        daoMarks: {
            fire: 5,
            ice: 3,
            life: 8
        }
    },
    
    aperture: {
        unlocked: false,
        size: 15,
        timeRate: 1.0,
        stability: 100,
        soulFoundation: 1000,
        grid: [],
        flora: [
            { id: 'f1', position: {x: 3, y: 4}, growthProgress: 8 },
            { id: 'f2', position: {x: 7, y: 2}, growthProgress: 15 }
        ],
        fauna: [
            { id: 'fa1', position: {x: 5, y: 8}, health: 100, reproductionProgress: 12 }
        ],
        fissures: []
    },
    
    world: {
        sizeX: 30,
        sizeY: 20,
        currentView: 'external',
        grid: [],
        apertureManifested: null,
        soulRemnants: []
    },
    
    factions: [
        { id: 1, name: 'Clã da Montanha de Ferro', power: 100, position: {x: 5, y: 5}, goal: 'dominance', color: '#ff6b35', relation: 0 },
        { id: 2, name: 'Seita da Névoa Oculta', power: 80, position: {x: 25, y: 15}, goal: 'wealth', color: '#4b0082', relation: 0 },
        { id: 3, name: 'Ordem da Vida Eterna', power: 120, position: {x: 10, y: 18}, goal: 'knowledge', color: '#50c878', relation: 20 }
    ],
    
    quests: [],
    time: { day: 1, tick: 0 },
    deaths: 0,
    soulWounded: false
};

// State Management Functions
export function getGameState() {
    return gameState;
}

export function setGameState(newState) {
    gameState = { ...newState };
}

export function updateGameState(updates) {
    gameState = { ...gameState, ...updates };
}

// Player State Management
export function updatePlayerState(playerUpdates) {
    gameState.player = { ...gameState.player, ...playerUpdates };
}

export function addPlayerExp(exp) {
    gameState.player.exp += exp;
}

export function updatePlayerQi(amount) {
    gameState.player.qi = Math.max(0, gameState.player.qi + amount);
}

export function updatePlayerPosition(x, y) {
    gameState.player.position = { x, y };
}

// Aperture State Management
export function updateApertureState(apertureUpdates) {
    gameState.aperture = { ...gameState.aperture, ...apertureUpdates };
}

export function unlockAperture() {
    gameState.aperture.unlocked = true;
}

// World State Management
export function updateWorldState(worldUpdates) {
    gameState.world = { ...gameState.world, ...worldUpdates };
}

export function toggleWorldView() {
    const currentView = gameState.world.currentView;
    gameState.world.currentView = currentView === 'external' ? 'aperture' : 'external';
    return gameState.world.currentView;
}

// Time Management
export function incrementTime() {
    gameState.time.tick++;
    if (gameState.time.tick >= 10) {
        gameState.time.tick = 0;
        gameState.time.day++;
        return true; // New day
    }
    return false;
}

// Validation Functions
export function validateGameState(state) {
    const required = ['player', 'aperture', 'world', 'factions', 'quests', 'time'];
    return required.every(key => key in state);
}

export function validatePlayerState(player) {
    const required = ['realmIndex', 'exp', 'qi', 'position', 'inventory'];
    return required.every(key => key in player) && 
           typeof player.realmIndex === 'number' &&
           typeof player.exp === 'number' &&
           typeof player.qi === 'number';
}
