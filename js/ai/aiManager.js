// js/ai/aiManager.js
import { groqService } from './groqService.js';
import { combatAI } from './combatAI.js';
import { log } from '../utils/helpers.js';

class AIManager {
    constructor() {
        this.isInitialized = false;
        this.settings = {
            enabled: false,
            autoSuggest: true,
            maxSuggestions: 3,
            cacheTime: 5 // minutos
        };
        this.loadSettings();
    }

    // Inicialização com API key
    initialize(apiKey) {
        if (!apiKey || apiKey.trim().length === 0) {
            log('⚠️ Chave da API Groq não fornecida', 'warning');
            return false;
        }

        try {
            groqService.setApiKey(apiKey.trim());
            this.settings.enabled = true;
            this.isInitialized = true;
            this.saveSettings();
            log('🤖 IA de combate ativada!', 'success');
            return true;
        } catch (error) {
            log('❌ Erro ao configurar IA', 'danger');
            console.error('AI initialization error:', error);
            return false;
        }
    }

    // Configurações persistentes
    loadSettings() {
        try {
            const saved = localStorage.getItem('apoteose_ai_settings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('Error loading AI settings:', error);
        }
    }

    saveSettings() {
        try {
            // Não salva a API key por segurança
            const settingsToSave = { ...this.settings };
            localStorage.setItem('apoteose_ai_settings', JSON.stringify(settingsToSave));
        } catch (error) {
            console.error('Error saving AI settings:', error);
        }
    }

    // Interface principal para combate
    async getCombatSuggestions(enemy, options = {}) {
        if (!this.isInitialized || !this.settings.enabled) {
            return combatAI.getQuickSuggestion(enemy, options.playerState);
        }

        try {
            return await combatAI.getSuggestions(enemy, {
                useAI: true,
                ...options
            });
        } catch (error) {
            log('⚠️ IA temporariamente indisponível', 'warning');
            return combatAI.getQuickSuggestion(enemy, options.playerState);
        }
    }

    // Configurações da IA
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
    }

    getSettings() {
        return { ...this.settings };
    }

    // Status da IA
    isAvailable() {
        return this.isInitialized && this.settings.enabled;
    }

    getStatus() {
        return {
            available: this.isAvailable(),
            initialized: this.isInitialized,
            enabled: this.settings.enabled,
            cacheSize: groqService.cache.size
        };
    }

    // Limpeza de cache
    clearCache() {
        groqService.cache.clear();
        combatAI.clearCache();
        log('🧹 Cache da IA limpo', 'info');
    }

    // Teste da API
    async testConnection() {
        if (!this.isInitialized) {
            return { success: false, message: 'IA não inicializada' };
        }

        try {
            // Teste simples
            const testResult = await groqService.analyzeCombat(
                { id: 'test', name: 'Test Enemy', hp: 50, power: 10 },
                { qi: 100, realmIndex: 0, unlockedRunes: ['b1', 'm1', 'v1'], daoMarks: {} },
                [{ id: 'b1', name: 'Test', power: 10 }]
            );

            if (testResult && testResult.suggestions) {
                return { success: true, message: 'IA funcionando corretamente' };
            } else {
                return { success: false, message: 'Resposta inválida da IA' };
            }
        } catch (error) {
            return { 
                success: false, 
                message: `Erro de conexão: ${error.message}` 
            };
        }
    }

    // Estatísticas de uso
    getStats() {
        return {
            cacheHits: groqService.cache.size,
            initialized: this.isInitialized,
            enabled: this.settings.enabled
        };
    }
}

// Instância global
export const aiManager = new AIManager();

// Função de conveniência para inicialização
export function initializeAI(apiKey) {
    return aiManager.initialize(apiKey);
}

// Função para prompt de configuração
export function promptForAPIKey() {
    const key = prompt(`
🤖 Configure a IA de Combate

Para ativar sugestões inteligentes de combate, você precisa de uma chave da API Groq (gratuita).

1. Vá em: https://console.groq.com/keys
2. Crie uma conta (gratuita)
3. Gere uma API Key
4. Cole aqui:

Sua chave API Groq:`);

    if (key && key.trim()) {
        if (initializeAI(key)) {
            return true;
        } else {
            alert('❌ Erro ao configurar IA. Verifique sua chave.');
            return false;
        }
    }
    return false;
}