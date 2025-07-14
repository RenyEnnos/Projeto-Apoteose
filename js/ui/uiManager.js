// js/ui/uiManager.js
import { GameData } from '../core/constants.js';
import { gameState } from '../core/gameState.js';
import { createAbility } from '../systems/combatSystem.js';
import { showModal, closeModal } from '../rendering/modal.js';
import { log } from '../utils/helpers.js';

let runeMap = {};
export function setRuneMap(map) { runeMap = map; }

// --- Event Handlers for dynamically created content ---

function allowDrop(event) {
    event.preventDefault();
}

function dragRune(event) {
    event.dataTransfer.setData('type', event.target.dataset.type);
    event.dataTransfer.setData('id', event.target.dataset.id);
}

function dropRune(event) {
    event.preventDefault();
    const type = event.dataTransfer.getData('type');
    const id = event.dataTransfer.getData('id');
    const slot = event.target;
    slot.classList.add('highlight');
    setTimeout(() => slot.classList.remove('highlight'), 500);
    const name = type === 'insight' ? GameData.insights.find(i => i.id === id)?.name : runeMap[id]?.name;
    slot.textContent = name || '';
    slot.dataset.type = type;
    slot.dataset.id = id;
}

function craftAbility() {
    const baseId = document.getElementById('base-slot').dataset.id;
    const modifierId = document.getElementById('modifier-slot').dataset.id;
    const vectorId = document.getElementById('vector-slot').dataset.id;

    if (!baseId || !modifierId || !vectorId) {
        log('Preencha todos os slots para forjar uma habilidade!', 'danger');
        return;
    }

    const baseRune = runeMap[baseId];
    const modifierRune = runeMap[modifierId];
    const vectorRune = runeMap[vectorId];

    if (!baseRune || !modifierRune || !vectorRune) {
        log('Combinação inválida de runas!', 'danger');
        return;
    }

    const ability = createAbility(baseRune, modifierRune, vectorRune);
    gameState.player.craftedAbilities.push(ability);
    log(`Habilidade forjada: ${ability.name}! Estabilidade ${ability.stability}%`, 'success');

    ['base', 'modifier', 'vector'].forEach(slotType => {
        const element = document.getElementById(`${slotType}-slot`);
        element.textContent = slotType.charAt(0).toUpperCase() + slotType.slice(1);
        element.dataset.id = '';
    });
}

function plantFlora(event) {
    const { plantId, x, y } = event.target.dataset;
    const plant = GameData.flora.find(p => p.id === plantId);
    if (!plant) return;

    const existing = gameState.aperture.flora.find(p => p.position.x === parseInt(x) && p.position.y === parseInt(y));
    if (existing) {
        log('Já há uma planta nesta posição!', 'danger');
        closeModal();
        return;
    }

    gameState.aperture.flora.push({ id: plantId, position: { x: parseInt(x), y: parseInt(y) }, growthProgress: 0 });
    log(`Você plantou ${plant.name} em (${x}, ${y}).`, 'success');
    closeModal();
}

function acceptQuest(event) {
    const questId = event.target.dataset.questId;
    const quest = gameState.quests.find(q => q.id === questId);
    if (!quest) return;

    if (quest.completed >= quest.amount) {
        if (quest.reward.spiritStones) gameState.player.inventory.spiritStones += quest.reward.spiritStones;
        if (quest.reward.daoMarks) {
            Object.entries(quest.reward.daoMarks).forEach(([type, amount]) => {
                gameState.player.daoMarks[type] = (gameState.player.daoMarks[type] || 0) + amount;
            });
        }
        if (quest.reward.exp) gameState.player.exp += quest.reward.exp;

        const faction = gameState.factions.find(f => f.id === quest.faction);
        if (faction) faction.relation += 10;

        log(`Missão "${quest.title}" completada! Recompensa recebida.`, 'success');
        gameState.quests = gameState.quests.filter(q => q.id !== questId);
        closeModal();
    } else {
        log(`Missão "${quest.title}" aceita!`, 'important');
        closeModal();
    }
}

function showCodexTab(event) {
    const category = event.target.dataset.category;
    const contentEl = document.getElementById('codex-content');
    if (!contentEl) return;

    document.querySelectorAll('.codex-category.active').forEach(el => el.classList.remove('active'));
    event.target.classList.add('active');

    let html = '';
    switch (category) {
        case 'realms':
            html = '<h3>Reinos de Cultivo</h3>';
            GameData.realms.forEach((realm, index) => {
                const isUnlocked = index <= gameState.player.realmIndex;
                html += `
                    <div class="codex-entry" style="${!isUnlocked ? 'opacity:0.6;' : ''}">
                        <h4>${isUnlocked ? realm.name : '???'}</h4>
                        ${isUnlocked ? `<p>${realm.description}</p>` : '<p>Conhecimento bloqueado</p>'}
                        <div>EXP necessário: ${realm.expToNext}</div>
                        ${isUnlocked ? `<div>Qi máximo: ${realm.maxQi}</div>` : ''}
                    </div>`;
            });
            break;
        // Add other cases here...
    }
    contentEl.innerHTML = html;
}


// --- Modal Content Generators ---

export function showResearch() {
    let content = `<div class="modal-title">Mente do Dao</div><p>Combine fragmentos de insight para desbloquear novas runas e forjar habilidades.</p>`;
    content += `<h3>Fragmentos Desbloqueados</h3><div class="research-grid">`;
    gameState.player.discoveredInsights.forEach(id => {
        const insight = GameData.insights.find(i => i.id === id);
        if (insight) {
            content += `<div class="research-node unlocked draggable-rune" draggable="true" data-type="insight" data-id="${insight.id}">${insight.name}</div>`;
        }
    });
    content += `</div><h3>Runas Desbloqueadas</h3><div class="research-grid">`;
    gameState.player.unlockedRunes.forEach(id => {
        const rune = runeMap[id];
        if (rune) {
            content += `<div class="research-node unlocked draggable-rune" draggable="true" data-type="rune" data-id="${rune.id}">${rune.name}</div>`;
        }
    });
    content += `</div><div class="rune-combiner"><h3>Combinador de Runas</h3><p>Arraste runas para os slots abaixo para criar novas habilidades:</p>`;
    content += `<div style="display:flex;justify-content:center;gap:20px;margin:20px 0;">`;
    content += `<div class="rune-slot" id="base-slot">Base</div>`;
    content += `<div class="rune-slot" id="modifier-slot">Modificador</div>`;
    content += `<div class="rune-slot" id="vector-slot">Vetor</div>`;
    content += `</div><button class="button button-success" id="craft-ability-btn">Forjar Habilidade</button></div>`;

    showModal(content);

    // Add event listeners after content is in the DOM
    document.querySelectorAll('.draggable-rune').forEach(el => el.addEventListener('dragstart', dragRune));
    document.querySelectorAll('.rune-slot').forEach(el => {
        el.addEventListener('dragover', allowDrop);
        el.addEventListener('drop', dropRune);
    });
    document.getElementById('craft-ability-btn').addEventListener('click', craftAbility);
}


export function showPlantingMenu(x, y) {
    let content = `<div class="modal-title">Plantar na Abertura</div><p>Selecione uma planta para plantar na posição (${x}, ${y}):</p><div class="research-grid">`;
    GameData.flora.forEach(p => {
        content += `<div class="research-node plant-option" data-plant-id="${p.id}" data-x="${x}" data-y="${y}">${p.name}</div>`;
    });
    content += '</div>';
    showModal(content);

    document.querySelectorAll('.plant-option').forEach(el => el.addEventListener('click', plantFlora));
}


export function showQuests() {
    const formatReward = (reward) => {
        if (reward.spiritStones) return `${reward.spiritStones} Pedras Espirituais`;
        if (reward.daoMarks) return Object.entries(reward.daoMarks).map(([t, a]) => `${a} Marcas de Dao ${t}`).join(', ');
        if (reward.exp) return `${reward.exp} EXP`;
        return 'Recompensa desconhecida';
    };

    let content = `<div class="modal-title">Quadro de Missões</div><div style="max-height:400px;overflow-y:auto;">`;
    if (gameState.quests.length > 0) {
        gameState.quests.forEach(q => {
            const faction = gameState.factions.find(f => f.id === q.faction);
            const progress = q.completed >= q.amount ? ' (Completa)' : ` (${q.completed}/${q.amount})`;
            content += `
                <div class="quest-item">
                    <div style="font-weight:bold;color:${faction.color}">${q.title}${progress}</div>
                    <p>${q.description}</p>
                    <div>Recompensa: ${formatReward(q.reward)}</div>
                    <button class="button accept-quest-btn" style="margin-top:10px;" data-quest-id="${q.id}">
                        ${q.completed >= q.amount ? 'Reivindicar' : 'Aceitar'}
                    </button>
                </div>`;
        });
    } else {
        content += '<p>Não há missões disponíveis no momento.</p>';
    }
    content += '</div>';
    showModal(content);

    document.querySelectorAll('.accept-quest-btn').forEach(el => el.addEventListener('click', acceptQuest));
}

export function showCodex() {
    let content = `
        <div class="modal-title">Codex do Dao</div>
        <div style="display:grid;grid-template-columns:200px 1fr;gap:20px;height:500px;">
            <div style="border-right:1px solid var(--accent-color);padding-right:15px;">
                <h3>Categorias</h3>
                <div class="codex-category active" data-category="realms">Reinos de Cultivo</div>
                <div class="codex-category" data-category="runes">Runas</div>
                <div class="codex-category" data-category="flora">Flora</div>
                <div class="codex-category" data-category="fauna">Fauna</div>
                <div class="codex-category" data-category="factions">Facções</div>
            </div>
            <div id="codex-content" style="overflow-y:auto;"></div>
        </div>`;
    showModal(content);

    const categories = document.querySelectorAll('.codex-category');
    categories.forEach(el => el.addEventListener('click', showCodexTab));
    
    // Show initial tab
    showCodexTab({ target: categories[0] });
}


export function showApertureManagement() {
    if (!gameState.aperture.unlocked) {
        log('Você ainda não desbloqueou sua Abertura Imortal.', 'danger');
        return;
    }
    const a = gameState.aperture;
    let content = `<div class="modal-title">Gerenciamento da Abertura Imortal</div>`;
    content += '<h3>Status</h3>';
    content += `<div class="stat-bar"><span class="stat-name">Tamanho:</span> <span class="stat-value">${a.size * a.size} km²</span></div>`;
    // ... add other stats ...

    showModal(content);
}
