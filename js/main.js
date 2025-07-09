import { GameData } from "./core/constants.js";
import { gameState } from "./core/gameState.js";
import { render } from "./rendering/renderer.js";
import { startGameLoop } from "./core/gameLoop.js";
import { generateWorld } from "./systems/worldGeneration.js";
import { initApertureGrid } from "./systems/apertureSystem.js";
import { engageCombat } from "./systems/combatSystem.js";
import { generateQuests } from "./systems/questSystem.js";
import { cellClickHandler } from "./systems/interactionSystem.js";
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
    render();
    startGameLoop(updateGame.bind(null), render.bind(null, gameState), 1000);
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

// ===== GAME RENDERING =====
function render() {
    renderGrid();
    updateHUD();
}

function renderGrid() {
    const gridContainer = document.getElementById('world-grid');
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
            
            if (isExternal) {
                // World view
                if (cellData.type === 'enemy') cell.classList.add('enemy-cell');
                if (cellData.type === 'resource') cell.classList.add('resource-cell');
                if (cellData.type === 'ruin') cell.classList.add('ruin-cell');
                
                if (gameState.player.position.x === x && gameState.player.position.y === y) {
                    cell.classList.add('player-position');
                }
                
                // Factions
                gameState.factions.forEach(faction => {
                    if (faction.position.x === x && faction.position.y === y) {
                        cell.classList.add('faction-cell');
                        cell.style.background = faction.color;
                    }
                });
            } else {
                // Aperture view
                if (cellData.biome) {
                    const biome = GameData.biomes.find(b => b.id === cellData.biome);
                    if (biome) {
                        cell.classList.add(`biome-${biome.id}`);
                    }
                }
                
                if (cellData.fissure) {
                    cell.classList.add('fissure-cell');
                }
            }
            
            gridContainer.appendChild(cell);
        }
    }
}

function updateHUD() {
    const player = gameState.player;
    const realm = GameData.realms[player.realmIndex];
    
    // Player stats
    document.getElementById('cultivation-realm').textContent = realm.name;
    document.getElementById('exp-value').textContent = `${player.exp} / ${realm.expToNext}`;
    const expPercent = Math.min(100, (player.exp / realm.expToNext) * 100);
    document.getElementById('exp-bar').style.width = `${expPercent}%`;
    document.getElementById('exp-text').textContent = `${expPercent.toFixed(1)}%`;
    
    document.getElementById('qi-value').textContent = `${player.qi} / ${realm.maxQi}`;
    const qiPercent = (player.qi / realm.maxQi) * 100;
    document.getElementById('qi-bar').style.width = `${qiPercent}%`;
    document.getElementById('qi-text').textContent = `${qiPercent.toFixed(1)}%`;
    
    // Aperture stats
    const apertureSection = document.getElementById('aperture-hud');
    if (gameState.aperture.unlocked) {
        apertureSection.style.display = 'block';
        const aperture = gameState.aperture;
        document.getElementById('aperture-size').textContent = `${aperture.size * aperture.size} km²`;
        document.getElementById('time-rate').textContent = `${aperture.timeRate.toFixed(1)}x`;
        document.getElementById('stability-value').textContent = `${aperture.stability.toFixed(1)}%`;
        const stabilityPercent = aperture.stability;
        document.getElementById('stability-bar').style.width = `${stabilityPercent}%`;
        document.getElementById('stability-text').textContent = `${stabilityPercent.toFixed(1)}%`;
        document.getElementById('soul-foundation').textContent = aperture.soulFoundation;
    } else {
        apertureSection.style.display = 'none';
    }
    
    // Factions
    const factionsDisplay = document.getElementById('factions-display');
    factionsDisplay.innerHTML = gameState.factions.map(f => 
        `<div class="faction-info" data-tooltip="Poder: ${f.power}\nRelação: ${f.relation}">
            <div class="faction-name">${f.name}</div>
            <div class="faction-status">${getRelationStatus(f.relation)}</div>
        </div>`
    ).join('');
    
    // World state
    document.getElementById('location-status').textContent = 
        gameState.world.currentView === 'external' ? 'Mundo Exterior' : 'Abertura Imortal';
    document.getElementById('game-time').textContent = `Dia ${gameState.time.day}`;
    document.getElementById('death-count').textContent = gameState.deaths;
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
