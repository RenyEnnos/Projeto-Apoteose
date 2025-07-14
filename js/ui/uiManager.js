export {
    showResearch,
    allowDrop,
    dragRune,
    dropRune,
    craftAbility,
    showPlantingMenu,
    plantFlora,
    showQuests,
    acceptQuest,
    showCodex,
    showCodexTab,
    showPlantInfo,
    showFactionDialog,
    showApertureManagement,
    setRuneMap,
    chooseAbility
};
import { GameData } from '../core/constants.js';
import { gameState } from '../core/gameState.js';
import { createAbility } from '../systems/combatSystem.js';
import { showModal, closeModal } from '../rendering/modal.js';
import { log } from '../utils/helpers.js';

let runeMap = {};
function setRuneMap(map){ runeMap = map; }

function showResearch(){
    let content = `<div class="modal-title">Mente do Dao</div><p>Combine fragmentos de insight para desbloquear novas runas e forjar habilidades.</p><h3>Fragmentos Desbloqueados</h3><div class="research-grid">`;
    gameState.player.discoveredInsights.forEach(id=>{
        const insight=GameData.insights.find(i=>i.id===id);
        if(insight){content+=`<div class="research-node unlocked draggable-rune" draggable="true" ondragstart="dragRune(event)" data-type="insight" data-id="${insight.id}">${insight.name}</div>`;}
    });
    content+=`</div><h3>Runas Desbloqueadas</h3><div class="research-grid">`;
    gameState.player.unlockedRunes.forEach(id=>{const r=runeMap[id];if(r){content+=`<div class="research-node unlocked draggable-rune" draggable="true" ondragstart="dragRune(event)" data-type="rune" data-id="${r.id}">${r.name}</div>`;}});
    content+=`</div><div class="rune-combiner"><h3>Combinador de Runas</h3><p>Arraste runas para os slots abaixo para criar novas habilidades:</p><div style="display:flex;justify-content:center;gap:20px;margin:20px 0;"><div class="rune-slot" id="base-slot" ondrop="dropRune(event)" ondragover="allowDrop(event)">Base</div><div class="rune-slot" id="modifier-slot" ondrop="dropRune(event)" ondragover="allowDrop(event)">Modificador</div><div class="rune-slot" id="vector-slot" ondrop="dropRune(event)" ondragover="allowDrop(event)">Vetor</div></div><button class="button button-success" onclick="craftAbility()">Forjar Habilidade</button></div>`;
    showModal(content);
}
function allowDrop(ev){ev.preventDefault();}
function dragRune(ev){ev.dataTransfer.setData('type',ev.target.dataset.type);ev.dataTransfer.setData('id',ev.target.dataset.id);}
function dropRune(ev){ev.preventDefault();const type=ev.dataTransfer.getData('type');const id=ev.dataTransfer.getData('id');const slot=ev.target;slot.classList.add('highlight');setTimeout(()=>slot.classList.remove('highlight'),500);const name=type==='insight'?GameData.insights.find(i=>i.id===id)?.name:runeMap[id]?.name;slot.textContent=name||'';slot.dataset.type=type;slot.dataset.id=id;}
function craftAbility(){const b=document.getElementById('base-slot').dataset.id;const m=document.getElementById('modifier-slot').dataset.id;const v=document.getElementById('vector-slot').dataset.id;if(!b||!m||!v){log('Preencha todos os slots para forjar uma habilidade!','danger',gameState.time.day);return;}const base=runeMap[b];const mod=runeMap[m];const vec=runeMap[v];if(!base||!mod||!vec){log('Combinação inválida de runas!','danger',gameState.time.day);return;}const ability=createAbility(base,mod,vec);gameState.player.craftedAbilities.push(ability);log(`Habilidade forjada: ${ability.name}! Estabilidade ${ability.stability}%`,'success',gameState.time.day);['base','modifier','vector'].forEach(s=>{const el=document.getElementById(`${s}-slot`);el.textContent=s.charAt(0).toUpperCase()+s.slice(1);el.dataset.id='';});}
function showPlantingMenu(x,y){let content=`<div class="modal-title">Plantar na Abertura</div><p>Selecione uma planta para plantar na posição (${x}, ${y}):</p><div class="research-grid">`;GameData.flora.forEach(p=>{content+=`<div class="research-node" onclick="plantFlora('${p.id}', ${x}, ${y})">${p.name}</div>`;});content+='</div>';showModal(content);}
function plantFlora(id,x,y){const plant=GameData.flora.find(p=>p.id===id);if(!plant)return;const existing=gameState.aperture.flora.find(p=>p.position.x===x&&p.position.y===y);if(existing){log('Já há uma planta nesta posição!','danger');closeModal();return;}gameState.aperture.flora.push({id,position:{x,y},growthProgress:0});log(`Você plantou ${plant.name} em (${x}, ${y}).`,'success');closeModal();}
function showQuests(){let content=`<div class="modal-title">Quadro de Missões</div><div style="max-height:400px;overflow-y:auto;">`;if(gameState.quests.length>0){gameState.quests.forEach(q=>{const f=gameState.factions.find(fc=>fc.id===q.faction);const progress=q.completed>=q.amount?' (Completa)':` (${q.completed}/${q.amount})`;content+=`<div class="quest-item" style="margin-bottom:15px;padding:15px;border:1px solid var(--accent-color);border-radius:var(--border-radius);"><div style="font-weight:bold;color:${f.color}">${q.title}${progress}</div><p>${q.description}</p><div>Recompensa: ${formatReward(q.reward)}</div><button class="button" style="margin-top:10px;" onclick="acceptQuest('${q.id}')">${q.completed>=q.amount?'Reivindicar':'Aceitar'}</button></div>`;});}else{content+='<p>Não há missões disponíveis no momento.</p>';}content+='</div>';showModal(content);}
function formatReward(r){if(r.spiritStones)return`${r.spiritStones} Pedras Espirituais`;if(r.daoMarks)return Object.entries(r.daoMarks).map(([t,a])=>`${a} Marcas de Dao ${t}`).join(', ');if(r.exp)return`${r.exp} EXP`;return'Recompensa desconhecida';}
function acceptQuest(id){const q=gameState.quests.find(qs=>qs.id===id);if(!q)return;if(q.completed>=q.amount){if(q.reward.spiritStones)gameState.player.inventory.spiritStones+=q.reward.spiritStones;if(q.reward.daoMarks)Object.entries(q.reward.daoMarks).forEach(([t,a])=>{gameState.player.daoMarks[t]=(gameState.player.daoMarks[t]||0)+a;});if(q.reward.exp)gameState.player.exp+=q.reward.exp;const f=gameState.factions.find(fc=>fc.id===q.faction);if(f)f.relation+=10;log(`Missão "${q.title}" completada! Recompensa recebida.`,'success');gameState.quests=gameState.quests.filter(qs=>qs.id!==id);closeModal();}else{log(`Missão "${q.title}" aceita!`,'important');closeModal();}}
function showCodex(){let content=`<div class="modal-title">Codex do Dao</div><div style="display:grid;grid-template-columns:200px 1fr;gap:20px;height:500px;"><div style="border-right:1px solid var(--accent-color);padding-right:15px;"><h3>Categorias</h3><div class="codex-category active" onclick="showCodexTab('realms')">Reinos de Cultivo</div><div class="codex-category" onclick="showCodexTab('runes')">Runas</div><div class="codex-category" onclick="showCodexTab('flora')">Flora</div><div class="codex-category" onclick="showCodexTab('fauna')">Fauna</div><div class="codex-category" onclick="showCodexTab('factions')">Facções</div></div><div id="codex-content" style="overflow-y:auto;"></div></div>`;showModal(content);showCodexTab('realms');}
function showCodexTab(cat){const el=document.getElementById('codex-content');let html='';document.querySelectorAll('.codex-category').forEach(e=>e.classList.remove('active'));event.target.classList.add('active');switch(cat){case'realms':html='<h3>Reinos de Cultivo</h3>';GameData.realms.forEach((r,i)=>{const u=i<=gameState.player.realmIndex;html+=`<div class="codex-entry" style="margin-bottom:15px;${!u?'opacity:0.6;':''}"><h4>${u?r.name:'???'}</h4>${u?`<p>${r.description}</p>`:'<p>Conhecimento bloqueado</p>'}<div>EXP necessário: ${r.expToNext}</div>${u?`<div>Qi máximo: ${r.maxQi}</div>`:''}</div>`;});break;case'runes':html='<h3>Runas Conhecidas</h3><div class="research-grid">';Object.values(runeMap).forEach(r=>{const u=gameState.player.unlockedRunes.includes(r.id);html+=`<div class="research-node ${u?'unlocked':''}">${u?r.name:'???'}${u?`<div><small>${r.tags.join(', ')}</small></div>`:''}</div>`;});html+='</div>';break;case'flora':html='<h3>Flora Espiritual</h3><div class="research-grid">';GameData.flora.forEach(p=>{const d=gameState.aperture.flora.some(f=>f.id===p.id);html+=`<div class="research-node ${d?'unlocked':''}">${d?p.name:'???'}</div>`;});html+='</div>';break;case'factions':html='<h3>Facções do Mundo</h3>';gameState.factions.forEach(f=>{html+=`<div class="codex-entry" style="margin-bottom:15px;"><h4 style="color:${f.color}">${f.name}</h4><div>Poder: ${f.power}</div><div>Relação: ${getRelationStatus(f.relation)}</div><div>Objetivo: ${f.goal==='dominance'?'Domínio':f.goal==='wealth'?'Riqueza':'Conhecimento'}</div></div>`;});break;}el.innerHTML=html;}
function showPlantInfo(id){const p=GameData.flora.find(pl=>pl.id===id);if(!p)return;const c=`<div class="modal-title">${p.name}</div><div style="text-align:center;margin-bottom:20px;"><div style="display:inline-block;width:100px;height:100px;background:${p.biome==='forest'?'#2ed573':p.biome==='volcanic'?'#ff6b35':'#a0d2eb'};border-radius:50%;"></div></div><p>${p.description||'Descrição não disponível.'}</p><div class="stat-bar"><span class="stat-name">Bioma:</span> <span class="stat-value">${p.biome}</span></div><div class="stat-bar"><span class="stat-name">Tempo de Crescimento:</span> <span class="stat-value">${p.growthTime} dias</span></div><div class="stat-bar"><span class="stat-name">Recurso:</span> <span class="stat-value">${p.resource==='qi'?'Qi':'Marca de Dao ('+p.type+')'} +${p.amount}</span></div>`;showModal(c);}
function showFactionDialog(faction){const c=`<div class="modal-title">${faction.name}</div><p>Poder: ${faction.power}</p><p>Relação: ${faction.relation}</p>`;showModal(c);}
function getRelationStatus(v){if(v<-50)return'Inimigo Mortal';if(v<0)return'Hostil';if(v<30)return'Neutro';if(v<70)return'Amigável';return'Aliado';}

function showApertureManagement(){
    if(!gameState.aperture.unlocked){
        log('Você ainda não desbloqueou sua Abertura Imortal.','danger');
        return;
    }
    const a = gameState.aperture;
    let c = '<div class="modal-title">Gerenciamento da Abertura Imortal</div>';
    c += '<h3>Status</h3>';
    c += `<div class="stat-bar"><span class="stat-name">Tamanho:</span> <span class="stat-value">${a.size*a.size} km²</span></div>`;
    c += `<div class="stat-bar"><span class="stat-name">Estabilidade:</span> <span class="stat-value">${a.stability.toFixed(1)}%</span></div>`;
    c += `<div class="stat-bar"><span class="stat-name">Fund. da Alma:</span> <span class="stat-value">${a.soulFoundation}</span></div>`;
    c += '<h3>Flora</h3>';
    if(a.flora.length===0){
        c += '<p>Nenhuma planta cultivada.</p>';
    }else{
        c += '<ul>';
        a.flora.forEach(p=>{
            const data = GameData.flora.find(f=>f.id===p.id);
            c += `<li>${data.name} (${p.position.x},${p.position.y}) - ${p.growthProgress}/${data.growthTime}</li>`;
        });
        c += '</ul>';
    }
    c += '<h3>Fauna</h3>';
    if(a.fauna.length===0){
        c += '<p>Nenhuma criatura.</p>';
    }else{
        c += '<ul>';
        a.fauna.forEach(f=>{
            const spec = GameData.fauna.find(s=>s.id===f.id);
            c += `<li>${spec.name} (${f.position.x},${f.position.y}) - HP ${f.health}</li>`;
        });
        c += '</ul>';
    }
    if(a.fissures.length>0){
        c += '<h3>Fissuras</h3><ul>';
        a.fissures.forEach(f=>{ c += `<li>(${f.x},${f.y})</li>`; });
        c += '</ul>';
    }
    showModal(c);
}

function chooseAbility(){
    if(gameState.player.craftedAbilities.length===0) return null;
    const options = gameState.player.craftedAbilities
        .map((a,i)=>`${i+1}. ${a.name} (Custo ${a.cost})`)
        .join('\n');
    const idx = parseInt(prompt('Escolha uma habilidade:\n'+options)) - 1;
    if(idx>=0 && idx<gameState.player.craftedAbilities.length){
        return gameState.player.craftedAbilities[idx];
    }
    return null;
}
