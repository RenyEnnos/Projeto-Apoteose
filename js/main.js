import { GameData } from "./core/constants.js";
import { gameState } from "./core/gameState.js";
import { render } from "./rendering/renderer.js";
import { startGameLoop } from "./core/gameLoop.js";
import { generateWorld } from "./systems/worldGeneration.js";
import { initApertureGrid, terraformCell } from "./systems/apertureSystem.js";
import { createAbility } from "./systems/combatSystem.js";
import { log } from "./utils/helpers.js";
import { showModal, closeModal } from "./rendering/modal.js";

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
        generateQuests();
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

function generateQuests() {
    gameState.quests = [
        {
            id: 'q1',
            title: 'Caçada ao Lobo Espiritual',
            description: 'Elimine 3 Lobos Espirituais nas Montanhas do Oeste',
            type: 'hunt',
            target: 'e1',
            amount: 3,
            reward: { spiritStones: 100, exp: 500 },
            completed: 0,
            faction: 1
        },
        {
            id: 'q2',
            title: 'Coleta de Ervas Espirituais',
            description: 'Colete 5 Ervas Espirituais na Floresta Ancestral',
            type: 'gather',
            target: 'f1',
            amount: 5,
            reward: { daoMarks: { life: 3 }, exp: 300 },
            completed: 0,
            faction: 3
        }
    ];
}

// ===== GAME LOOP =====
}

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
    
    render();
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

function getRelationStatus(value) {
    if (value < -50) return 'Inimigo Mortal';
    if (value < 0) return 'Hostil';
    if (value < 30) return 'Neutro';
    if (value < 70) return 'Amigável';
    return 'Aliado';
}

// ===== GAME ACTIONS =====
function cellClickHandler(x, y) {
    if (gameState.world.currentView === 'external') {
        const distance = Math.abs(x - gameState.player.position.x) + Math.abs(y - gameState.player.position.y);
        if (distance > 1) {
            log("Muito longe para interagir.", "danger");
            return;
        }
        
        gameState.player.position = {x, y};
        const cellIndex = y * gameState.world.sizeX + x;
        const cell = gameState.world.grid[cellIndex];
        
        handleCellInteraction(cell, x, y);
    } else {
        // Aperture interaction
        handleApertureInteraction(x, y);
    }
    
    render();
}

function handleCellInteraction(cell, x, y) {
    switch(cell.type) {
        case 'enemy':
            const enemyType = GameData.enemies[Math.floor(Math.random() * GameData.enemies.length)];
            const combatResult = engageCombat(enemyType);
            
            if (combatResult === 'win') {
                cell.type = 'empty';
                // Loot handling
                enemyType.loot.forEach(loot => {
                    if (Math.random() < loot.chance) {
                        if (loot.item === 'insight_fragment') {
                            const insight = GameData.insights.find(i => i.id === loot.type);
                            if (insight && !gameState.player.discoveredInsights.includes(insight.id)) {
                                gameState.player.discoveredInsights.push(insight.id);
                                log(`Você descobriu um novo Fragmento de Insight: ${insight.name}!`, 'success');
                            }
                        }
                    }
                });
            }
            break;
            
        case 'resource':
            const qiGained = 50 + Math.floor(Math.random() * 50);
            gameState.player.qi = Math.min(
                GameData.realms[gameState.player.realmIndex].maxQi, 
                gameState.player.qi + qiGained
            );
            log(`Você encontrou uma fonte de energia e absorveu ${qiGained} de Essência.`, 'success');
            cell.type = 'empty';
            break;
            
        case 'ruin':
            log('Você encontrou ruínas antigas e misteriosas.', 'important');
            
            // 50% chance to find an insight fragment
            if (Math.random() > 0.5) {
                const availableInsights = GameData.insights.filter(
                    i => !gameState.player.discoveredInsights.includes(i.id)
                );
                
                if (availableInsights.length > 0) {
                    const insight = availableInsights[Math.floor(Math.random() * availableInsights.length)];
                    gameState.player.discoveredInsights.push(insight.id);
                    log(`Dentro das ruínas, você encontrou o Fragmento de Insight: ${insight.name}!`, 'gold');
                }
            }
            cell.type = 'empty';
            break;
            
        case 'faction':
            const faction = gameState.factions.find(f => f.id === cell.faction);
            showFactionDialog(faction);
            break;
    }
    
    checkRealmUp();
}

function handleApertureInteraction(x, y) {
    const index = y * gameState.aperture.size + x;
    const cell = gameState.aperture.grid[index];
    
    // Harvest ready plants
    const plant = gameState.aperture.flora.find(p => 
        p.position.x === x && p.position.y === y
    );
    
    if (plant) {
        const plantData = GameData.flora.find(p => p.id === plant.id);
        if (plant.growthProgress >= plantData.growthTime) {
            harvestPlant(plant, plantData);
            return;
        }
    }
    
    // Handle fissures
    if (cell.fissure) {
        sealFissure(x, y);
        return;
    }
    
    // Default: try to plant something
    showPlantingMenu(x, y);
}

function harvestPlant(plant, plantData) {
    if (plantData.resource === 'qi') {
        gameState.player.qi += plantData.amount;
        log(`Você colheu ${plantData.name} e absorveu ${plantData.amount} de Qi.`, 'success');
    } else if (plantData.resource === 'dao_mark') {
        gameState.player.daoMarks[plantData.type] = 
            (gameState.player.daoMarks[plantData.type] || 0) + plantData.amount;
        log(`Você colheu ${plantData.name} e ganhou ${plantData.amount} Marcas de Dao ${plantData.type}.`, 'success');
    }
    
    // Remove the plant
    gameState.aperture.flora = gameState.aperture.flora.filter(p => 
        !(p.position.x === plant.position.x && p.position.y === plant.position.y)
    );
}

function sealFissure(x, y) {
    const soulCost = 50;
    if (gameState.aperture.soulFoundation >= soulCost) {
        gameState.aperture.soulFoundation -= soulCost;
        gameState.aperture.stability += 5;
        
        const index = y * gameState.aperture.size + x;
        delete gameState.aperture.grid[index].fissure;
        gameState.aperture.fissures = gameState.aperture.fissures.filter(
            f => !(f.x === x && f.y === y)
        );
        
        log(`Você selou a fissura espiritual em (${x}, ${y}) usando ${soulCost} Fundação da Alma.`, 'success');
    } else {
        log("Fundação da Alma insuficiente para selar a fissura!", 'danger');
    }
}

function engageCombat(enemy) {
    log(`Combate iniciado com: ${enemy.name}`, 'danger');
    
    let playerHealth = gameState.player.qi;
    let enemyHealth = enemy.hp;
    
    while (playerHealth > 0 && enemyHealth > 0) {
        // Player attack
        const playerDamage = 20 + Math.floor(Math.random() * 30);
        enemyHealth -= playerDamage;
        log(`Você causou ${playerDamage} de dano ao ${enemy.name}!`, 'important');
        
        if (enemyHealth <= 0) break;
        
        // Enemy attack
        const enemyDamage = enemy.power + Math.floor(Math.random() * 10);
        playerHealth -= enemyDamage;
        log(`O ${enemy.name} causou ${enemyDamage} de dano a você!`, 'danger');
    }
    
    if (playerHealth <= 0) {
        log("Você foi derrotado! Sua alma está ferida...", 'danger');
        gameState.deaths++;
        gameState.player.qi = GameData.realms[gameState.player.realmIndex].maxQi * 0.5;
        gameState.soulWounded = true;
        return 'lose';
    } else {
        const expGained = enemy.power * 10;
        gameState.player.exp += expGained;
        log(`Você derrotou o ${enemy.name} e ganhou ${expGained} EXP!`, 'success');
        return 'win';
    }
}

function checkRealmUp() {
    const player = gameState.player;
    const realm = GameData.realms[player.realmIndex];
    
    if (player.exp >= realm.expToNext) {
        player.exp -= realm.expToNext;
        player.realmIndex++;
        const newRealm = GameData.realms[player.realmIndex];
        
        // Full heal on level up
        player.qi = newRealm.maxQi;
        
        log(`AVANÇO! Você alcançou o reino de ${newRealm.name}!`, 'important');
        
        // Handle unlocks
        if (newRealm.unlocks.includes('aperture')) {
            gameState.aperture.unlocked = true;
            log('Sua alma se expande! A Abertura Imortal nasceu!', 'gold');
        }
    }
}

function toggleView() {
    if (!gameState.aperture.unlocked) {
        log("Você ainda não despertou sua Abertura Imortal.", "danger");
        return;
    }
    
    gameState.world.currentView = gameState.world.currentView === 'external' ? 'aperture' : 'external';
    log(`Visão alterada para: ${gameState.world.currentView === 'external' ? 'Mundo Exterior' : 'Abertura Imortal'}.`);
    render();
}

// ===== UI SYSTEMS =====
function showResearch() {
    let content = `
        <div class="modal-title">Mente do Dao</div>
        <p>Combine fragmentos de insight para desbloquear novas runas e forjar habilidades.</p>
        
        <h3>Fragmentos Desbloqueados</h3>
        <div class="research-grid">
    `;
    
    gameState.player.discoveredInsights.forEach(insightId => {
        const insight = GameData.insights.find(i => i.id === insightId);
        if (insight) {
            content += `
                <div class="research-node unlocked draggable-rune" 
                     draggable="true" 
                     ondragstart="dragRune(event)" 
                     data-type="insight" 
                     data-id="${insight.id}">
                    ${insight.name}
                </div>
            `;
        }
    });
    
    content += `</div>`;
    
    content += `
        <h3>Runas Desbloqueadas</h3>
        <div class="research-grid">
    `;
    
    gameState.player.unlockedRunes.forEach(runeId => {
        // Find rune in any category
        let rune = null;
        for (const category in GameData.runes) {
            const found = GameData.runes[category].find(r => r.id === runeId);
            if (found) {
                rune = found;
                break;
            }
        }
        
        if (rune) {
            content += `
                <div class="research-node unlocked draggable-rune" 
                     draggable="true" 
                     ondragstart="dragRune(event)" 
                     data-type="rune" 
                     data-id="${rune.id}">
                    ${rune.name}
                </div>
            `;
        }
    });
    
    content += `</div>`;
    
    content += `
        <div class="rune-combiner">
            <h3>Combinador de Runas</h3>
            <p>Arraste runas para os slots abaixo para criar novas habilidades:</p>
            
            <div style="display: flex; justify-content: center; gap: 20px; margin: 20px 0;">
                <div class="rune-slot" id="base-slot" ondrop="dropRune(event)" ondragover="allowDrop(event)">
                    Base
                </div>
                <div class="rune-slot" id="modifier-slot" ondrop="dropRune(event)" ondragover="allowDrop(event)">
                    Modificador
                </div>
                <div class="rune-slot" id="vector-slot" ondrop="dropRune(event)" ondragover="allowDrop(event)">
                    Vetor
                </div>
            </div>
            
            <button class="button button-success" onclick="craftAbility()">Forjar Habilidade</button>
        </div>
    `;
    
    showModal(content);
}

function allowDrop(ev) {
    ev.preventDefault();
}

function dragRune(ev) {
    ev.dataTransfer.setData("type", ev.target.dataset.type);
    ev.dataTransfer.setData("id", ev.target.dataset.id);
}

function dropRune(ev) {
    ev.preventDefault();
    const type = ev.dataTransfer.getData("type");
    const id = ev.dataTransfer.getData("id");
    const slot = ev.target;
    
    // Highlight slot
    slot.classList.add('highlight');
    setTimeout(() => slot.classList.remove('highlight'), 500);
    
    // Set slot content
    let name = "";
    if (type === "insight") {
        const insight = GameData.insights.find(i => i.id === id);
        if (insight) name = insight.name;
    } else if (type === "rune") {
        // Find rune in any category
        for (const category in GameData.runes) {
            const rune = GameData.runes[category].find(r => r.id === id);
            if (rune) {
                name = rune.name;
                break;
            }
        }
    }
    
    slot.textContent = name;
    slot.dataset.type = type;
    slot.dataset.id = id;
}

function craftAbility() {
    const baseSlot = document.getElementById("base-slot");
    const modifierSlot = document.getElementById("modifier-slot");
    const vectorSlot = document.getElementById("vector-slot");
    if (!baseSlot.dataset.id || !modifierSlot.dataset.id || !vectorSlot.dataset.id) {
        log("Preencha todos os slots para forjar uma habilidade!", "danger", gameState.time.day);
        return;
    }
    const findRune = id => { for (const c in GameData.runes) { const r = GameData.runes[c].find(r => r.id === id); if (r) return r; } };
    const baseRune = findRune(baseSlot.dataset.id);
    const modifierRune = findRune(modifierSlot.dataset.id);
    const vectorRune = findRune(vectorSlot.dataset.id);
    if (!baseRune || !modifierRune || !vectorRune) {
        log("Combinação inválida de runas!", "danger", gameState.time.day);
        return;
    }
    const ability = createAbility(baseRune, modifierRune, vectorRune);
    gameState.player.craftedAbilities.push(ability);
    log(`Habilidade forjada: ${ability.name}! Estabilidade ${ability.stability}%`, 'success', gameState.time.day);
    baseSlot.textContent = "Base"; baseSlot.dataset.id = "";
    modifierSlot.textContent = "Modificador"; modifierSlot.dataset.id = "";
    vectorSlot.textContent = "Vetor"; vectorSlot.dataset.id = "";
}

    if (!gameState.aperture.unlocked) {
        log("Você ainda não desbloqueou sua Abertura Imortal.", "danger");
        return;
    }
    
    let content = `
        <div class="modal-title">Gerenciamento da Abertura Imortal</div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div>
                <h3>Flora Espiritual</h3>
                <div class="research-grid">
    `;
    
    GameData.flora.forEach(plant => {
        content += `
            <div class="research-node" onclick="showPlantInfo('${plant.id}')">
                ${plant.name}
            </div>
        `;
    });
    
    content += `
                </div>
            </div>
            
            <div>
                <h3>Fauna Espiritual</h3>
                <div class="research-grid">
    `;
    
    GameData.fauna.forEach(animal => {
        content += `
            <div class="research-node" onclick="showAnimalInfo('${animal.id}')">
                ${animal.name}
            </div>
        `;
    });
    
    content += `
                </div>
            </div>
        </div>
        
        <h3>Biomas da Abertura</h3>
        <div class="research-grid">
    `;
    
    GameData.biomes.forEach(biome => {
        content += `
            <div class="research-node" style="background: ${biome.color}" onclick="changeBiome('${biome.id}')">
                ${biome.name}
            </div>
        `;
    });
    
    content += `
        </div>
        
        <div style="margin-top: 20px; text-align: center;">
            <button class="button button-success" onclick="consolidateFoundation()">
                Consolidar Fundação (Custo: 100 Qi)
            </button>
            <button class="button" onclick="expandAperture()">
                Expandir Abertura (Custo: 500 Qi)
            </button>
        </div>
    `;
    
    showModal(content);
}

function showPlantingMenu(x, y) {
    let content = `
        <div class="modal-title">Plantar na Abertura</div>
        <p>Selecione uma planta para plantar na posição (${x}, ${y}):</p>
        <div class="research-grid">
    `;
    
    GameData.flora.forEach(plant => {
        content += `
            <div class="research-node" onclick="plantFlora('${plant.id}', ${x}, ${y})">
                ${plant.name}
            </div>
        `;
    });
    
    content += `</div>`;
    
    showModal(content);
}

function plantFlora(plantId, x, y) {
    const plant = GameData.flora.find(p => p.id === plantId);
    if (!plant) return;
    
    // Check if already planted here
    const existing = gameState.aperture.flora.find(p => 
        p.position.x === x && p.position.y === y
    );
    
    if (existing) {
        log("Já há uma planta nesta posição!", "danger");
        closeModal();
        return;
    }
    
    gameState.aperture.flora.push({
        id: plantId,
        position: {x, y},
        growthProgress: 0
    });
    
    log(`Você plantou ${plant.name} em (${x}, ${y}).`, 'success');
    closeModal();
}

function showQuests() {
    let content = `
        <div class="modal-title">Quadro de Missões</div>
        <div style="max-height: 400px; overflow-y: auto;">
    `;
    
    if (gameState.quests.length > 0) {
        gameState.quests.forEach(quest => {
            const faction = gameState.factions.find(f => f.id === quest.faction);
            const progress = quest.completed >= quest.amount ? " (Completa)" : ` (${quest.completed}/${quest.amount})`;
            
            content += `
                <div class="quest-item" style="margin-bottom: 15px; padding: 15px; border: 1px solid var(--accent-color); border-radius: var(--border-radius);">
                    <div style="font-weight: bold; color: ${faction.color}">${quest.title}${progress}</div>
                    <p>${quest.description}</p>
                    <div>Recompensa: ${formatReward(quest.reward)}</div>
                    <button class="button" style="margin-top: 10px;" onclick="acceptQuest('${quest.id}')">
                        ${quest.completed >= quest.amount ? 'Reivindicar' : 'Aceitar'}
                    </button>
                </div>
            `;
        });
    } else {
        content += `<p>Não há missões disponíveis no momento.</p>`;
    }
    
    content += `</div>`;
    showModal(content);
}

function formatReward(reward) {
    if (reward.spiritStones) {
        return `${reward.spiritStones} Pedras Espirituais`;
    } else if (reward.daoMarks) {
        return Object.entries(reward.daoMarks).map(([type, amount]) => 
            `${amount} Marcas de Dao ${type}`
        ).join(", ");
    } else if (reward.exp) {
        return `${reward.exp} EXP`;
    }
    return "Recompensa desconhecida";
}

function acceptQuest(questId) {
    const quest = gameState.quests.find(q => q.id === questId);
    if (!quest) return;
    
    if (quest.completed >= quest.amount) {
        // Claim reward
        if (quest.reward.spiritStones) {
            gameState.player.inventory.spiritStones += quest.reward.spiritStones;
        }
        
        if (quest.reward.daoMarks) {
            Object.entries(quest.reward.daoMarks).forEach(([type, amount]) => {
                gameState.player.daoMarks[type] = (gameState.player.daoMarks[type] || 0) + amount;
            });
        }
        
        if (quest.reward.exp) {
            gameState.player.exp += quest.reward.exp;
        }
        
        // Improve faction relation
        const faction = gameState.factions.find(f => f.id === quest.faction);
        if (faction) {
            faction.relation += 10;
        }
        
        log(`Missão "${quest.title}" completada! Recompensa recebida.`, 'success');
        gameState.quests = gameState.quests.filter(q => q.id !== questId);
        closeModal();
    } else {
        log(`Missão "${quest.title}" aceita!`, 'important');
        closeModal();
    }
}

function showCodex() {
    let content = `
        <div class="modal-title">Codex do Dao</div>
        <div style="display: grid; grid-template-columns: 200px 1fr; gap: 20px; height: 500px;">
            <div style="border-right: 1px solid var(--accent-color); padding-right: 15px;">
                <h3>Categorias</h3>
                <div class="codex-category active" onclick="showCodexTab('realms')">Reinos de Cultivo</div>
                <div class="codex-category" onclick="showCodexTab('runes')">Runas</div>
                <div class="codex-category" onclick="showCodexTab('flora')">Flora</div>
                <div class="codex-category" onclick="showCodexTab('fauna')">Fauna</div>
                <div class="codex-category" onclick="showCodexTab('factions')">Facções</div>
            </div>
            
            <div id="codex-content" style="overflow-y: auto;"></div>
        </div>
    `;
    
    showModal(content);
    showCodexTab('realms');
}

function showCodexTab(category) {
    const contentEl = document.getElementById('codex-content');
    let html = '';
    
    // Highlight active tab
    document.querySelectorAll('.codex-category').forEach(el => el.classList.remove('active'));
    event.target.classList.add('active');
    
    switch(category) {
        case 'realms':
            html = `<h3>Reinos de Cultivo</h3>`;
            GameData.realms.forEach((realm, index) => {
                const isUnlocked = index <= gameState.player.realmIndex;
                html += `
                    <div class="codex-entry" style="margin-bottom: 15px; ${!isUnlocked ? 'opacity: 0.6;' : ''}">
                        <h4>${isUnlocked ? realm.name : '???'}</h4>
                        ${isUnlocked ? `<p>${realm.description}</p>` : '<p>Conhecimento bloqueado</p>'}
                        <div>EXP necessário: ${realm.expToNext}</div>
                        ${isUnlocked ? `<div>Qi máximo: ${realm.maxQi}</div>` : ''}
                    </div>
                `;
            });
            break;
            
        case 'runes':
            html = `<h3>Runas Conhecidas</h3><div class="research-grid">`;
            
            // Combine all runes
            const allRunes = [
                ...GameData.runes.base,
                ...GameData.runes.modifier,
                ...GameData.runes.vector,
                ...GameData.runes.trigger
            ];
            
            allRunes.forEach(rune => {
                const isUnlocked = gameState.player.unlockedRunes.includes(rune.id);
                html += `
                    <div class="research-node ${isUnlocked ? 'unlocked' : ''}">
                        ${isUnlocked ? rune.name : '???'}
                        ${isUnlocked ? `<div><small>${rune.tags.join(', ')}</small></div>` : ''}
                    </div>
                `;
            });
            
            html += `</div>`;
            break;
            
        case 'flora':
            html = `<h3>Flora Espiritual</h3><div class="research-grid">`;
            
            GameData.flora.forEach(plant => {
                const isDiscovered = gameState.aperture.flora.some(p => p.id === plant.id);
                html += `
                    <div class="research-node ${isDiscovered ? 'unlocked' : ''}">
                        ${isDiscovered ? plant.name : '???'}
                    </div>
                `;
            });
            
            html += `</div>`;
            break;
            
        case 'factions':
            html = `<h3>Facções do Mundo</h3>`;
            
            gameState.factions.forEach(faction => {
                html += `
                    <div class="codex-entry" style="margin-bottom: 15px;">
                        <h4 style="color: ${faction.color}">${faction.name}</h4>
                        <div>Poder: ${faction.power}</div>
                        <div>Relação: ${getRelationStatus(faction.relation)}</div>
                        <div>Objetivo: ${faction.goal === 'dominance' ? 'Domínio' : faction.goal === 'wealth' ? 'Riqueza' : 'Conhecimento'}</div>
                    </div>
                `;
            });
            break;
    }
    
    contentEl.innerHTML = html;
}

function showPlantInfo(plantId) {
    const plant = GameData.flora.find(p => p.id === plantId);
    if (!plant) return;
    
    const content = `
        <div class="modal-title">${plant.name}</div>
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; width: 100px; height: 100px; background: ${plant.biome === 'forest' ? '#2ed573' : plant.biome === 'volcanic' ? '#ff6b35' : '#a0d2eb'}; border-radius: 50%;"></div>
        </div>
        <p>${plant.description || 'Descrição não disponível.'}</p>
        <div class="stat-bar"><span class="stat-name">Bioma:</span> <span class="stat-value">${plant.biome}</span></div>
        <div class="stat-bar"><span class="stat-name">Tempo de Crescimento:</span> <span class="stat-value">${plant.growthTime} dias</span></div>
        <div class="stat-bar"><span class="stat-name">Recurso:</span> <span class="stat-value">${plant.resource === 'qi' ? 'Qi' : 'Marca de Dao (' + plant.type + ')'} +${plant.amount}</span></div>
    `;
    
    showModal(content);
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
        render();
    } else {
        log('Nenhum jogo salvo encontrado.', 'danger');
    }
}
