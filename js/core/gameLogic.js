// js/core/gameLogic.js
import { getGameState, incrementTime, updateGameState } from './gameState.js';
import { updateApertureEcology } from '../systems/apertureSystem.js';
import { log } from '../utils/helpers.js';

// Game Logic Functions
export function updateGame() {
    const currentGameState = getGameState();
    
    // Update game time
    const isNewDay = incrementTime();
    if (isNewDay) {
        log(`Um novo dia amanhece. É o Dia ${currentGameState.time.day}.`);
        // Add daily events if any
    }

    // Update systems
    if (currentGameState.aperture.unlocked) {
        updateApertureEcology(currentGameState);
    }
    updateFactions();
}

function updateFactions() {
    const currentGameState = getGameState();
    const updatedFactions = currentGameState.factions.map(faction => {
        if (Math.random() > 0.95) { // Slower power change
            return {
                ...faction,
                power: Math.max(10, faction.power + Math.floor(Math.random() * 5) - 2)
            };
        }
        return faction;
    });

    updateGameState({ factions: updatedFactions });
}