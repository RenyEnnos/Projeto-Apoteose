// js/ui/eventHandlers.js
import {
    toggleView,
    saveGame,
    loadGame
} from '../main.js';
import {
    showApertureManagement,
    showResearch,
    showQuests,
    showCodex
} from './uiManager.js';
import { closeModal } from '../rendering/modal.js';

export function initializeEventListeners() {
    document.getElementById('toggle-view-btn').addEventListener('click', toggleView);
    document.getElementById('manage-aperture-btn').addEventListener('click', showApertureManagement);
    document.getElementById('research-btn').addEventListener('click', showResearch);
    document.getElementById('quests-btn').addEventListener('click', showQuests);
    document.getElementById('codex-btn').addEventListener('click', showCodex);
    document.getElementById('save-game-btn').addEventListener('click', saveGame);
    document.getElementById('load-game-btn').addEventListener('click', loadGame);
    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
}
