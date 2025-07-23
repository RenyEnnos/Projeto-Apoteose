import { GameData } from "./core/constants.js";
import { 
    getGameState, 
    setGameState, 
    toggleWorldView,
    validateGameState 
} from "./core/gameState.js";
import { render } from "./rendering/renderer.js";
import { startGameLoop } from "./core/gameLoop.js";
import { generateWorld } from "./systems/worldGeneration.js";
import { initApertureGrid, createFissure } from "./systems/apertureSystem.js";
import { generateQuests } from "./systems/questSystem.js";
import { setRuneMap } from "./ui/uiManager.js";
import { log } from "./utils/helpers.js";
import { initializeEventListeners } from "./ui/eventHandlers.js";
import { updateGame } from "./core/gameLogic.js";
import { aiManager, promptForAPIKey } from "./ai/aiManager.js";
import { combatAI } from "./ai/combatAI.js";

// --- Public API for Event Handlers ---
export function toggleView() {
    if (!getGameState().aperture.unlocked) {
        log('Você ainda não despertou sua Abertura Imortal.', 'danger');
        return;
    }
    const newView = toggleWorldView();
    log(`Visão alterada para: ${newView === 'external' ? 'Mundo Exterior' : 'Abertura Imortal'}.`);
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

export function configureAI() {
    // IA já está configurada automaticamente com chave hardcoded
    log('🤖 IA já está configurada e ativa!', 'success');
}

export function loadGame() {
    const savedStateJSON = localStorage.getItem('apoteose_save_v3');
    if (savedStateJSON) {
        try {
            const savedState = JSON.parse(savedStateJSON);
            if (validateGameState(savedState)) {
                setGameState(savedState);
                initializeRuneMap();
                log('Jogo carregado com sucesso!', 'success');
                render(getGameState());
            } else {
                log('Save file inválido. Iniciando novo jogo.', 'danger');
                initializeNewGame();
            }
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
    try {
        initGame();
        document.getElementById('loading-screen').style.display = 'none';
    } catch (error) {
        console.error('Error during game initialization:', error);
        document.getElementById('loading-screen').style.display = 'none';
        document.body.innerHTML += '<div style="color:red;padding:20px;"><h2>Erro de Inicialização:</h2><pre>' + error.stack + '</pre></div>';
    }
};

function initGame() {
    initializeEventListeners(); // Set up all event listeners
    const savedState = localStorage.getItem('apoteose_save_v3');

    if (savedState) {
        loadGame();
    } else {
        initializeNewGame();
    }

    render(getGameState());
    
    // The main game loop - render after each update
    startGameLoop(() => {
        updateGame();
        render(getGameState());
    }, () => {});
}


// ===== INITIALIZATION HELPERS =====

function updateFactions(currentGameState) {
    currentGameState.factions.forEach(faction => {
        if (Math.random() > 0.95) { // Slower power change
            faction.power += Math.floor(Math.random() * 5) - 2;
            faction.power = Math.max(10, faction.power);
        }
    });
}

function initializeNewGame() {
    let newGameState = getGameState();
    generateWorld(newGameState);
    newGameState.aperture.grid = initApertureGrid(newGameState.aperture.size);
    newGameState.factions.forEach(faction => {
        const index = faction.position.y * newGameState.world.sizeX + faction.position.x;
        newGameState.world.grid[index].faction = faction.id;
    });
    
    initializeRuneMap();
    generateQuests(newGameState);
    setGameState(newGameState);
    
    // Auto-configura IA com chave de desenvolvimento (substitua por sua chave)
    const apiKey = localStorage.getItem('groq_api_key') || 'SUA_CHAVE_GROQ_AQUI';
    if (apiKey !== 'SUA_CHAVE_GROQ_AQUI') {
        aiManager.initialize(apiKey);
    } else {
        console.log('Configure sua chave API Groq no localStorage: groq_api_key');
    }
    const runeMap = {};
    for (const cat in GameData.runes) {
        GameData.runes[cat].forEach(r => runeMap[r.id] = r);
    }
    combatAI.setRuneMap(runeMap);
    
    log('Bem-vindo ao Projeto Apoteose. Sua jornada para a imortalidade começa agora.', 'important');
    log('🤖 IA de combate ativada automaticamente!', 'success');
}

function initializeRuneMap() {
    const runeMap = {};
    for (const cat in GameData.runes) {
        GameData.runes[cat].forEach(r => runeMap[r.id] = r);
    }
    setRuneMap(runeMap);
    
    // Configura IA se disponível
    if (aiManager.isAvailable()) {
        combatAI.setRuneMap(runeMap);
    }
}
