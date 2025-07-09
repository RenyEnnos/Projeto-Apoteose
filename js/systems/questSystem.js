export { generateQuests };
import { GameData } from '../core/constants.js';

function randomElement(arr){return arr[Math.floor(Math.random()*arr.length)];}

function generateQuests(gameState){
    const templates=[
        gs=>({
            id:`q${Date.now()}`,
            title:'Caçada Regional',
            description:'Derrote algumas criaturas que ameaçam os arredores.',
            type:'hunt',
            target:randomElement(GameData.enemies).id,
            amount:3+Math.floor(Math.random()*3),
            reward:{exp:200+gs.time.day*10},
            completed:0,
            faction:randomElement(gs.factions).id
        }),
        gs=>({
            id:`q${Date.now()}b`,
            title:'Coleta de Recursos',
            description:'Reúna materiais raros para a facção aliada.',
            type:'gather',
            target:randomElement(GameData.flora).id,
            amount:2+Math.floor(Math.random()*4),
            reward:{daoMarks:{life:1},exp:150},
            completed:0,
            faction:randomElement(gs.factions).id
        })
    ];
    gameState.quests=templates.map(t=>t(gameState));
}
