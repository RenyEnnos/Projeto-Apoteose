import { GameData } from '../core/constants.js';

export function getRelationStatus(value) {
    if (value < -50) return 'Inimigo Mortal';
    if (value < 0) return 'Hostil';
    if (value < 30) return 'Neutro';
    if (value < 70) return 'Amigável';
    return 'Aliado';
}

export function updateHUD(gameState) {
    const player = gameState.player;
    const realm = GameData.realms[player.realmIndex];
    document.getElementById('cultivation-realm').textContent = realm.name;
    document.getElementById('exp-value').textContent = `${player.exp} / ${realm.expToNext}`;
    const expPercent = Math.min(100, (player.exp / realm.expToNext) * 100);
    document.getElementById('exp-bar').style.width = `${expPercent}%`;
    document.getElementById('exp-text').textContent = `${expPercent.toFixed(1)}%`;
    document.getElementById('qi-value').textContent = `${player.qi} / ${realm.maxQi}`;
    const qiPercent = (player.qi / realm.maxQi) * 100;
    document.getElementById('qi-bar').style.width = `${qiPercent}%`;
    document.getElementById('qi-text').textContent = `${qiPercent.toFixed(1)}%`;
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
    const factionsDisplay = document.getElementById('factions-display');
    factionsDisplay.innerHTML = gameState.factions.map(f =>
        `<div class="faction-info" data-tooltip="Poder: ${f.power}\nRelação: ${f.relation}">
            <div class="faction-name">${f.name}</div>
            <div class="faction-status">${getRelationStatus(f.relation)}</div>
        </div>`
    ).join('');
    document.getElementById('location-status').textContent =
        gameState.world.currentView === 'external' ? 'Mundo Exterior' : 'Abertura Imortal';
    document.getElementById('game-time').textContent = `Dia ${gameState.time.day}`;
    document.getElementById('death-count').textContent = gameState.deaths;
}
