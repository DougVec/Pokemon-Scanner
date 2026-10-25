// Rodar: node tests/info.test.mjs
import assert from 'node:assert';
import { INFO, TYPES, typeBadges } from '../web/js/info.js';

// todos os 151 têm 1 ou 2 tipos válidos e uma personalidade
for (let id = 1; id <= 151; id++) {
  const [types, personality] = INFO[id] ?? [];
  assert.ok(types && types.length >= 1 && types.length <= 2, `#${id} tipos`);
  for (const t of types) assert.ok(TYPES[t], `#${id} tipo desconhecido: ${t}`);
  assert.ok(personality?.length > 10, `#${id} personalidade`);
}
assert.strictEqual(Object.keys(INFO).length, 151);

// tipos conferidos com a Pokédex oficial
assert.deepStrictEqual(INFO[6][0], ['fire', 'flying']);    // Charizard
assert.deepStrictEqual(INFO[25][0], ['electric']);         // Pikachu
assert.deepStrictEqual(INFO[94][0], ['ghost', 'poison']);  // Gengar
assert.deepStrictEqual(INFO[130][0], ['water', 'flying']); // Gyarados
assert.deepStrictEqual(INFO[81][0], ['electric', 'steel']);// Magnemite

// badges mostram os nomes em português
const html = typeBadges(6);
assert.match(html, />Fogo</);
assert.match(html, />Voador</);

console.log('ok: tipos e personalidade dos 151');
