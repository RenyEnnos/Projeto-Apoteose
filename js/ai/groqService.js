// js/ai/groqService.js
class GroqService {
    constructor() {
        this.apiKey = null;
        this.baseURL = 'https://api.groq.com/openai/v1/chat/completions';
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutos
    }

    setApiKey(key) {
        this.apiKey = key;
    }

    // Cache key baseado no contexto essencial
    getCacheKey(enemy, playerState, availableRunes) {
        return `combat_${enemy.id}_${playerState.realmIndex}_${playerState.qi}_${availableRunes.length}`;
    }

    async analyzeCombat(enemy, playerState, availableRunes) {
        if (!this.apiKey) {
            throw new Error('Groq API key não configurada');
        }

        const cacheKey = this.getCacheKey(enemy, playerState, availableRunes);
        
        // Verifica cache
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.data;
            }
            this.cache.delete(cacheKey);
        }

        // Prepara contexto ultra-compacto
        const context = this.buildCompactContext(enemy, playerState, availableRunes);
        
        try {
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama3-70b-8192', // Modelo rápido e eficiente
                    messages: [{
                        role: 'system',
                        content: this.getSystemPrompt()
                    }, {
                        role: 'user',
                        content: context
                    }],
                    max_tokens: 200, // Limite rigoroso
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error(`Groq API error: ${response.status}`);
            }

            const data = await response.json();
            const result = this.parseAIResponse(data.choices[0].message.content);
            
            // Cache resultado
            this.cache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });

            return result;
        } catch (error) {
            console.error('Groq API error:', error);
            return this.getFallbackSuggestion(enemy, playerState, availableRunes);
        }
    }

    buildCompactContext(enemy, playerState, availableRunes) {
        const runeList = availableRunes.map(r => `${r.id}:${r.name}(${r.power})`).join(',');
        
        return `E:${enemy.name}(${enemy.hp}/${enemy.power}) P:Qi${playerState.qi},R${playerState.realmIndex} Runes:[${runeList}] Marks:${JSON.stringify(playerState.daoMarks)}`;
    }

    getSystemPrompt() {
        return `Cultivation game combat advisor. Enemy format: Name(HP/DMG). Player format: Qi=energy, R=realm(0-4). Respond with JSON: {"suggestions":[{"combo":"base+mod+vector","reason":"why","priority":1-3}],"strategy":"brief tactic","confidence":0.1-1.0}. Max 3 combos. Be concise.`;
    }

    parseAIResponse(content) {
        try {
            const parsed = JSON.parse(content);
            
            // Valida estrutura
            if (!parsed.suggestions || !parsed.strategy) {
                throw new Error('Invalid AI response structure');
            }

            // Sanitiza e valida sugestões
            parsed.suggestions = parsed.suggestions.slice(0, 3).map(s => ({
                combo: s.combo || 'b1+m1+v1',
                reason: s.reason || 'Balanced approach',
                priority: Math.max(1, Math.min(3, s.priority || 2))
            }));

            parsed.confidence = Math.max(0.1, Math.min(1.0, parsed.confidence || 0.5));

            return parsed;
        } catch (error) {
            console.error('Error parsing AI response:', error);
            return this.getDefaultResponse();
        }
    }

    getFallbackSuggestion(enemy, playerState, availableRunes) {
        // Sistema de fallback inteligente baseado em heurísticas
        const suggestions = [];

        // Sugestão baseada no HP do inimigo
        if (enemy.hp > 100) {
            suggestions.push({
                combo: 'b2+m1+v1', // Fogo explosivo projétil
                reason: 'Alta explosão para inimigo resistente',
                priority: 1
            });
        } else {
            suggestions.push({
                combo: 'b1+m2+v1', // Força em cadeia
                reason: 'Eficiente para inimigo mais fraco',
                priority: 2
            });
        }

        // Sugestão baseada no Qi disponível
        if (playerState.qi > 50) {
            suggestions.push({
                combo: 'b4+m3+v2', // Cura com drenar vida em aura
                reason: 'Sustentação com Qi alto',
                priority: 2
            });
        }

        return {
            suggestions,
            strategy: 'Estratégia baseada em análise local',
            confidence: 0.6
        };
    }

    getDefaultResponse() {
        return {
            suggestions: [{
                combo: 'b1+m1+v1',
                reason: 'Combinação equilibrada padrão',
                priority: 2
            }],
            strategy: 'Abordagem conservadora',
            confidence: 0.3
        };
    }

    // Limpa cache antigo
    cleanCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp >= this.cacheExpiry) {
                this.cache.delete(key);
            }
        }
    }
}

export const groqService = new GroqService();