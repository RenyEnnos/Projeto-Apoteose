// js/ai/combatAI.js
import { groqService } from './groqService.js';
import { getGameState } from '../core/gameState.js';
import { GameData } from '../core/constants.js';
import { log } from '../utils/helpers.js';

class CombatAI {
    constructor() {
        this.analysisCache = new Map();
        this.runeMap = {};
        this.lastAnalysis = null;
    }

    setRuneMap(runeMap) {
        this.runeMap = runeMap;
    }

    // Análise rápida sem IA para casos simples
    getQuickSuggestion(enemy, playerState) {
        const suggestions = [];

        // Heurística baseada no tipo de inimigo e recursos do jogador
        const playerPower = this.estimatePlayerPower(playerState);
        const enemyThreat = enemy.hp + enemy.power;
        
        if (enemyThreat > playerPower * 1.5) {
            // Inimigo forte - estratégia defensiva
            suggestions.push({
                combo: 'b4+m3+v2', // Cura com drenar vida
                reason: 'Inimigo forte: foco em sustentação',
                priority: 1,
                confidence: 0.8
            });
        } else if (playerState.qi > 80) {
            // Muito Qi - estratégia agressiva
            suggestions.push({
                combo: 'b2+m1+v1', // Fogo explosivo
                reason: 'Qi alto: máximo dano',
                priority: 1,
                confidence: 0.7
            });
        } else {
            // Balanceado
            suggestions.push({
                combo: 'b1+m2+v1', // Força em cadeia
                reason: 'Abordagem equilibrada',
                priority: 2,
                confidence: 0.6
            });
        }

        return {
            suggestions: suggestions.slice(0, 1),
            strategy: 'Análise rápida local',
            confidence: suggestions[0]?.confidence || 0.5,
            source: 'quick'
        };
    }

    // Análise completa com IA
    async getAISuggestion(enemy, playerState, availableRunes) {
        try {
            log('🤖 Consultando IA de combate...', 'info');
            
            const aiResult = await groqService.analyzeCombat(enemy, playerState, availableRunes);
            
            // Enriquece as sugestões com dados locais
            const enrichedSuggestions = aiResult.suggestions.map(suggestion => {
                const runeIds = this.parseCombo(suggestion.combo);
                const runeData = runeIds.map(id => this.runeMap[id]).filter(Boolean);
                
                return {
                    ...suggestion,
                    runeIds,
                    runeData,
                    estimatedDamage: this.calculateComboDamage(runeData),
                    qiCost: this.calculateComboCost(runeData),
                    viable: this.isComboViable(runeIds, playerState)
                };
            });

            this.lastAnalysis = {
                ...aiResult,
                suggestions: enrichedSuggestions,
                source: 'ai',
                timestamp: Date.now()
            };

            log(`💡 IA sugeriu ${enrichedSuggestions.length} estratégias`, 'success');
            
            return this.lastAnalysis;
        } catch (error) {
            console.error('AI analysis failed:', error);
            log('⚠️ IA indisponível, usando análise local', 'warning');
            return this.getQuickSuggestion(enemy, playerState);
        }
    }

    parseCombo(comboString) {
        // Parsea "b2+m1+v1" para ["b2", "m1", "v1"]
        return comboString.split('+').map(s => s.trim());
    }

    calculateComboDamage(runeData) {
        if (runeData.length < 2) return 0;
        
        const base = runeData[0];
        const modifier = runeData[1];
        
        if (!base || !modifier) return 0;
        
        return Math.round(base.power * (modifier.powerMult || 1));
    }

    calculateComboCost(runeData) {
        if (runeData.length === 0) return 0;
        
        const base = runeData[0];
        if (!base) return 0;
        
        let cost = base.cost;
        
        // Aplica multiplicadores dos modificadores
        for (let i = 1; i < runeData.length; i++) {
            const rune = runeData[i];
            if (rune && rune.costMult) {
                cost *= rune.costMult;
            }
        }
        
        return Math.round(cost);
    }

    isComboViable(runeIds, playerState) {
        // Verifica se o jogador possui todas as runas
        return runeIds.every(id => playerState.unlockedRunes.includes(id));
    }

    estimatePlayerPower(playerState) {
        const basePower = GameData.realms[playerState.realmIndex]?.maxQi || 100;
        const qiRatio = playerState.qi / basePower;
        const runeBonus = playerState.unlockedRunes.length * 5;
        
        return basePower * qiRatio + runeBonus;
    }

    // Sistema de sugestões adaptativo
    async getSuggestions(enemy, options = {}) {
        const playerState = getGameState().player;
        const availableRunes = this.getAvailableRunes(playerState);
        
        // Decide se usar IA ou análise rápida
        const useAI = options.useAI !== false && 
                     availableRunes.length >= 3 && 
                     (enemy.hp > 50 || enemy.power > 15);

        if (useAI) {
            return await this.getAISuggestion(enemy, playerState, availableRunes);
        } else {
            return this.getQuickSuggestion(enemy, playerState);
        }
    }

    getAvailableRunes(playerState) {
        const available = [];
        
        // Coleta runas desbloqueadas
        for (const category of ['base', 'modifier', 'vector']) {
            const categoryRunes = GameData.runes[category] || [];
            categoryRunes.forEach(rune => {
                if (playerState.unlockedRunes.includes(rune.id)) {
                    available.push(rune);
                }
            });
        }
        
        return available;
    }

    // Cache de análises recentes
    getCachedAnalysis() {
        return this.lastAnalysis;
    }

    clearCache() {
        this.analysisCache.clear();
        this.lastAnalysis = null;
    }
}

export const combatAI = new CombatAI();