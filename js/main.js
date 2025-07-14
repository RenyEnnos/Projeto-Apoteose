import { GameData } from "./core/constants.js";
import { gameState, getGameState, setGameState } from "./core/gameState.js";
import { render } from "./rendering/renderer.js";
import { startGameLoop } from "./core/gameLoop.js";
import { generateWorld } from "./systems/worldGeneration.js";
import { initApertureGrid, createFissure, updateApertureEcology } from "./systems/apertureSystem.js";
import { generateQuests } from "./systems/questSystem.js";
import { setRuneMap } from "./ui/uiManager.js";
import { log } from "./utils/helpers.js";
import { initializeEventListeners } from "./ui/eventHandlers.js";

// --- Public API for Event Handlers ---
export function toggleView() {
    if (!getGameState().aperture.unlocked) {
        log('Você ainda não despertou sua Abertura Imortal.', 'danger');
        return;
    }
    const currentState = getGameState();
    currentState.world.currentView = currentState.world.currentView === 'external' ? 'aperture' : 'external';
    setGameState(currentState);
    log(`Visão alterada para: ${currentState.world.currentView === 'external' ? 'Mundo Exterior' : 'Abertura Imortal'}.`);
}

export function saveGame() {
    try {
        localStorage.setItem('apoteose_save_v3', JSON.stringify(getGameState()));
        log('Progresso salvo com sucesso!', 'success');
    } catch (e) {
        log('Falha ao salvar o jogo. O armazenamento pode estar cheio.', 'danger');
        console.error("Failed to save game:", e);
    }
}

export function loadGame() {
    const savedStateJSON = localStorage.getItem('apoteose_save_v3');
    if (savedStateJSON) {
        try {
            const savedState = JSON.parse(savedStateJSON);
            setGameState(savedState);
            const runeMap = {};
            for (const cat in GameData.runes) {
                GameData.runes[cat].forEach(r => runeMap[r.id] = r);
            }
            setRuneMap(runeMap);
            log('Jogo carregado com sucesso!', 'success');
            render(getGameState()); // Re-render after loading
        } catch (e) {
            log('Falha ao carregar o jogo. O arquivo salvo pode estar corrompido.', 'danger');
            console.error("Failed to load game:", e);
        }
    } else {
        log('Nenhum jogo salvo encontrado.', 'danger');
    }
}


// ===== GAME INITIALIZATION =====
window.onload = function() {
    document.getElementById('loading-screen').style.display = 'flex';
    initGame();
    document.getElementById('loading-screen').style.display = 'none';
};

function initGame() {
    initializeEventListeners(); // Set up all event listeners
    const savedState = localStorage.getItem('apoteose_save_v3');

    if (savedState) {
        loadGame();
    } else {
        let newGameState = getGameState();
        generateWorld(newGameState);
        newGameState.aperture.grid = initApertureGrid(newGameState.aperture.size);
        newGameState.factions.forEach(faction => {
            const index = faction.position.y * newGameState.world.sizeX + faction.position.x;
            newGameState.world.grid[index].faction = faction.id;
        });
        
        const runeMap = {};
        for (const cat in GameData.runes) {
            GameData.runes[cat].forEach(r => runeMap[r.id] = r);
        }
        setRuneMap(runeMap);
        generateQuests(newGameState);
        setGameState(newGameState);
        log('Bem-vindo ao Projeto Apoteose. Sua jornada para a imortalidade começa agora.', 'important');
    }

    render(getGameState());
    // The main game loop
    startGameLoop(updateGame, () => render(getGameState()));
}


// ===== GAME LOGIC =====

function updateGame() {
    let currentGameState = getGameState();
    
    // Update game time
    currentGameState.time.tick++;
    if (currentGameState.time.tick >= 10) { // Simplified for faster days
        currentGameState.time.tick = 0;
        currentGameState.time.day++;
        log(`Um novo dia amanhece. É o Dia ${currentGameState.time.day}.`);
        // Add daily events if any
    }

    // Update systems
    if (currentGameState.aperture.unlocked) {
        updateApertureEcology(currentGameState);
    }
    updateFactions(currentGameState);

    setGameState(currentGameState);
}

function updateFactions(currentGameState) {
    currentGameState.factions.forEach(faction => {
        if (Math.random() > 0.95) { // Slower power change
            faction.power += Math.floor(Math.random() * 5) - 2;
            faction.power = Math.max(10, faction.power);
        }
    });
}
