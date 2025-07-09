export const gameState = {
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
        apertureManifested: null
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

