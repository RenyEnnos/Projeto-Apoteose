import { GameData } from "./core/constants.js";
import { gameState } from "./core/gameState.js";
import { render } from "./rendering/renderer.js";
import { startGameLoop } from "./core/gameLoop.js";
import { generateWorld } from "./systems/worldGeneration.js";
import { initApertureGrid } from "./systems/apertureSystem.js";
import { generateQuests } from "./systems/questSystem.js";
import * as UI from "./ui/uiManager.js";
import { setRuneMap } from "./ui/uiManager.js";
import { log } from "./utils/helpers.js";

// ===== GAME INITIALIZATION =====
window.onload = function() {
    initGame();
    document.getElementById('loading-screen').style.display = 'none';
};

function initGame() {
    if (localStorage.getItem('apoteose_save_v3')) {
        loadGame();
    } else {
        setupWorld();
        const map = {};
        for (const cat in GameData.runes) {
            GameData.runes[cat].forEach(r => map[r.id] = r);
        }
        setRuneMap(map);
        generateQuests(gameState);
        log('Bem-vindo ao Projeto Apoteose. Sua jornada para a imortalidade começa agora.', 'important');
    }
    render(gameState);
    startGameLoop(updateGame, () => render(gameState), 1000);
}

function setupWorld() {
    generateWorld(gameState);
    gameState.aperture.grid = initApertureGrid(gameState.aperture.size);
    gameState.factions.forEach(faction => {
        const index = faction.position.y * gameState.world.sizeX + faction.position.x;
        gameState.world.grid[index].faction = faction.id;
    });
}

// ===== GAME LOOP =====

function updateGame() {
    gameState.time.tick++;
    
    // Daily update
    if (gameState.time.tick >= 100) {
        gameState.time.tick = 0;
        gameState.time.day++;
        log(`Um novo dia amanhece. É o Dia ${gameState.time.day}.`);
        handleDailyEvents();
    }
    
    // Update aperture ecology
    if (gameState.aperture.unlocked) {
        updateApertureEcology();
    }
    
    // Update factions
    updateFactions();
}

function handleDailyEvents() {
    // Resource regeneration
    if (Math.random() > 0.3) {
        log("A energia espiritual do mundo se renovou.", 'success');
    }
    
    // Random events
    const events = [
        "Uma brisa espiritual carregada de energia positiva flui pela região.",
        "Mercadores viajantes chegaram à vila próxima com itens raros.",
        "Uma anomalia espacial foi detectada nas montanhas ao norte.",
        "Um antigo pergaminho de técnicas foi descoberto em ruínas próximas."
    ];
    
    if (Math.random() > 0.7) {
        log(events[Math.floor(Math.random() * events.length)], 'important');
    }
}

function updateApertureEcology() {
    // Update flora growth
    gameState.aperture.flora.forEach(plant => {
        plant.growthProgress++;
        if (plant.growthProgress >= GameData.flora.find(p => p.id === plant.id).growthTime) {
            log(`${GameData.flora.find(p => p.id === plant.id).name} está pronta para colheita na Abertura!`, 'success');
        }
    });
    
    // Update fauna reproduction
    gameState.aperture.fauna.forEach(animal => {
        animal.reproductionProgress++;
        const species = GameData.fauna.find(a => a.id === animal.id);
        if (animal.reproductionProgress >= species.reproducesIn) {
            animal.reproductionProgress = 0;
            
            // Find an empty spot for the offspring
            const emptyCells = [];
            for (let y = 0; y < gameState.aperture.size; y++) {
                for (let x = 0; x < gameState.aperture.size; x++) {
                    const index = y * gameState.aperture.size + x;
                    if (!gameState.aperture.grid[index].fauna) {
                        emptyCells.push({x, y});
                    }
                }
            }
            
            if (emptyCells.length > 0) {
                const spot = emptyCells[Math.floor(Math.random() * emptyCells.length)];
                gameState.aperture.fauna.push({
                    id: animal.id,
                    position: spot,
                    health: 100,
                    reproductionProgress: 0
                });
                log(`Um novo ${species.name} nasceu na sua Abertura!`, 'success');
            }
        }
    });
    
    // Update fissures
    if (gameState.aperture.stability < 80 && Math.random() > 0.8) {
        createFissure();
    }
}

function createFissure() {
    const x = Math.floor(Math.random() * gameState.aperture.size);
    const y = Math.floor(Math.random() * gameState.aperture.size);
    const index = y * gameState.aperture.size + x;
    
    gameState.aperture.fissures.push({x, y});
    gameState.aperture.grid[index].fissure = true;
    log(`Uma fissura espiritual apareceu na sua Abertura em (${x}, ${y})!`, 'danger');
}

function updateFactions() {
    // Simple faction behavior
    gameState.factions.forEach(faction => {
        if (Math.random() > 0.7) {
            faction.power += Math.floor(Math.random() * 5) - 2;
            faction.power = Math.max(10, faction.power);
        }
        
        if (faction.relation < 50 && Math.random() > 0.8) {
            faction.relation += Math.floor(Math.random() * 3);
        }
    });
}

// ===== UTILITY FUNCTIONS =====
function saveGame() {
    try {
        localStorage.setItem('apoteose_save_v3', JSON.stringify(gameState));
        log('Progresso salvo com sucesso!', 'success');
    } catch (e) {
        log('Falha ao salvar o jogo. O armazenamento pode estar cheio.', 'danger');
    }
}

function loadGame() {
    const savedState = localStorage.getItem('apoteose_save_v3');
    if (savedState) {
        gameState = JSON.parse(savedState);
        log('Jogo carregado com sucesso!', 'success');
        const map = {};
        for (const cat in GameData.runes) {
            GameData.runes[cat].forEach(r => map[r.id] = r);
        }
        setRuneMap(map);
    } else {
        log('Nenhum jogo salvo encontrado.', 'danger');
    }
}

function toggleView() {
    if (!gameState.aperture.unlocked) {
        log('Você ainda não despertou sua Abertura Imortal.', 'danger');
        return;
    }
    gameState.world.currentView = gameState.world.currentView === 'external' ? 'aperture' : 'external';
    log(`Visão alterada para: ${gameState.world.currentView === 'external' ? 'Mundo Exterior' : 'Abertura Imortal'}.`);
}

window.toggleView = toggleView;
window.saveGame = saveGame;
window.loadGame = loadGame;
window.showResearch = UI.showResearch;
window.showQuests = UI.showQuests;
window.showCodex = UI.showCodex;
window.showPlantingMenu = UI.showPlantingMenu;
window.plantFlora = UI.plantFlora;
window.acceptQuest = UI.acceptQuest;
window.showFactionDialog = UI.showFactionDialog;
window.showApertureManagement = UI.showApertureManagement;
window.craftAbility = UI.craftAbility;
window.allowDrop = UI.allowDrop;
window.dragRune = UI.dragRune;
window.dropRune = UI.dropRune;
