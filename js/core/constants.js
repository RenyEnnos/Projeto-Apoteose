// ===== GAME DATA =====
export const GameData = {
    realms: [
        { 
            name: "Refinamento de Qi", 
            expToNext: 800, 
            maxQi: 100,
            unlocks: [],
            description: "O estágio inicial da jornada de cultivo, onde o cultivador aprende a manipular a energia Qi básica."
        },
        { 
            name: "Estabelecimento da Fundação", 
            expToNext: 2000, 
            maxQi: 250,
            unlocks: ["aperture"],
            description: "O cultivador fortalece sua base espiritual, preparando-se para criar sua própria Abertura Imortal."
        },
        { 
            name: "Núcleo Dourado", 
            expToNext: 5000, 
            maxQi: 600,
            unlocks: ["advanced_aperture"],
            description: "A energia Qi condensa-se em um núcleo dourado no centro do corpo espiritual."
        },
        { 
            name: "Alma Nascente", 
            expToNext: 12000, 
            maxQi: 1500,
            unlocks: ["subordinates"],
            description: "A alma do cultivador desperta e ganha consciência própria."
        },
        { 
            name: "Imortal Ascendente", 
            expToNext: Infinity, 
            maxQi: 4000,
            unlocks: ["grotto_heaven"],
            description: "O cultivador transcende as limitações mortais e alcança a imortalidade."
        }
    ],
    
    runes: {
        base: [
            { id: 'b1', name: 'Pulso de Força', tags: ['força'], power: 10, cost: 5 },
            { id: 'b2', name: 'Bola de Fogo', tags: ['fogo', 'projétil'], power: 15, cost: 8, insight: 'i1' },
            { id: 'b3', name: 'Lança de Gelo', tags: ['água', 'frio', 'projétil'], power: 15, cost: 8, insight: 'i2' },
            { id: 'b4', name: 'Toque Curativo', tags: ['vida', 'luz'], power: -20, cost: 12 }
        ],
        
        modifier: [
            { id: 'm1', name: 'Explosivo', tags: ['aoe'], powerMult: 1.5, costMult: 1.8 },
            { id: 'm2', name: 'Em Cadeia', tags: ['multi-alvo'], powerMult: 0.7, maxTargets: 3, costMult: 2.0 },
            { id: 'm3', name: 'Drenar Vida', tags: ['sangue'], powerMult: 0.8, lifesteal: 0.2, costMult: 1.5 }
        ],
        
        vector: [
            { id: 'v1', name: 'Projétil', tags: ['distância'], costMult: 1.0 },
            { id: 'v2', name: 'Aura', tags: ['pessoal', 'aoe'], costMult: 2.5 },
            { id: 'v3', name: 'Feixe', tags: ['canalizado'], costMult: 1.8 }
        ],
        
        trigger: [
            { id: 't1', name: 'Ao Ser Atingido', tags: ['reativo'], costMult: 1.2 },
            { id: 't2', name: 'Na Morte do Alvo', tags: ['consequência'], costMult: 1.1 }
        ]
    },
    
    insights: [
        { id: 'i1', name: 'Princípio do Calor', source: 'dissect_fire_beast', unlocks: 'b2', description: "O conhecimento fundamental da essência do fogo." },
        { id: 'i2', name: 'Princípio da Geada', source: 'meditate_glacier', unlocks: 'b3', description: "A compreensão da natureza do frio e do gelo." },
        { id: 'i3', name: 'Essência Vital', source: 'cultivate_life_plant', unlocks: 'b4', description: "O entendimento da energia vital presente em todas as coisas." },
        { id: 'i4', name: 'Vórtice de Força', source: 'study_force_rune', unlocks: 'b1', description: "A manipulação da energia bruta em forma de força." }
    ],
    
    enemies: [
        { id: 'e1', name: 'Lobo Espiritual', hp: 50, power: 10, loot: [{ item: 'insight_fragment', chance: 0.1, type: 'i_beast' }] },
        { id: 'e2', name: 'Salamandra de Fogo', hp: 80, power: 20, loot: [
            { item: 'dao_mark', type: 'fogo', amount: 1, chance: 0.5 }, 
            { item: 'insight_fragment', chance: 0.2, type: 'i1' }
        ]},
        { id: 'e3', name: 'Guardião das Geadas', hp: 120, power: 30, loot: [
            { item: 'dao_mark', type: 'gelo', amount: 1, chance: 0.5 }, 
            { item: 'insight_fragment', chance: 0.3, type: 'i2' }
        ]}
    ],
    
    flora: [
        { id: 'f1', name: 'Erva Espiritual Comum', biome: 'forest', growthTime: 10, resource: 'qi', amount: 5 },
        { id: 'f2', name: 'Flor da Chama Dançante', biome: 'volcanic', growthTime: 20, resource: 'dao_mark', type: 'fogo', amount: 1 },
        { id: 'f3', name: 'Lótus Gélido', biome: 'mountain', growthTime: 25, resource: 'dao_mark', type: 'gelo', amount: 1 }
    ],
    
    fauna: [
        { id: 'fa1', name: 'Coelho de Jade', type: 'herbivore', consumes: 'f1', reproducesIn: 20, resource: 'qi', amount: 10 },
        { id: 'fa2', name: 'Leão de Fogo', type: 'carnivore', consumes: 'fa1', reproducesIn: 50, resource: 'dao_mark', type: 'fogo', amount: 5 },
        { id: 'fa3', name: 'Fênix de Gelo', type: 'carnivore', consumes: 'fa1', reproducesIn: 60, resource: 'dao_mark', type: 'gelo', amount: 5 }
    ],
    
    biomes: [
        { id: 'forest', name: 'Floresta Espiritual', color: '#2ed573', description: "Uma floresta repleta de energia vital e flora espiritual." },
        { id: 'volcanic', name: 'Montanhas Vulcânicas', color: '#ff6b35', description: "Terras áridas dominadas por vulcões e energia ígnea." },
        { id: 'mountain', name: 'Picos Gélidos', color: '#a0d2eb', description: "Montanhas cobertas de neve eterna e energia glacial." },
        { id: 'desert', name: 'Deserto da Alma', color: '#ffa502', description: "Uma vastidão árida que testa a resistência espiritual." },
        { id: 'ocean', name: 'Oceano Primordial', color: '#3742fa', description: "Águas profundas contendo segredos ancestrais." }
    ]
};

