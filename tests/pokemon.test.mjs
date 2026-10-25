// Rodar: node tests/pokemon.test.mjs
import assert from 'node:assert';
import { POKEMON, bestMatch } from '../web/js/pokemon.js';

assert.deepStrictEqual(POKEMON.map(p => p[0]), Array.from({ length: 151 }, (_, i) => i + 1), 'números 1 a 151');
const perfis = new Set(POKEMON.map(p => p[2].join()));
assert.strictEqual(perfis.size, 151, 'nenhum perfil repetido');
// cada Pokémon é o resultado quando o rosto bate exatamente com o seu perfil
for (const [id, , perfil] of POKEMON) assert.strictEqual(bestMatch(perfil).id, id);
console.log('ok: 151 Pokémon, todos alcançáveis');
