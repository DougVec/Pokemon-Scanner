// Pokédex: cards dos 151 Pokémon e a ficha que abre ao clicar num card.
import { TRAITS, POKEMON, artwork } from './pokemon.js';
import { INFO, TYPES, typeBadges } from './info.js';

const list = document.getElementById('dex');
const sheet = document.getElementById('sheet');
const byId = Object.fromEntries(POKEMON.map(p => [p[0], p]));

list.innerHTML = POKEMON.map(([id, name]) => `
  <li id="dex-${id}" style="--i:${id}" tabindex="0" role="button" aria-label="Ver ficha de ${name}">
    <img src="${artwork(id)}" alt="${name}" loading="lazy">
    <span class="num">#${String(id).padStart(3, '0')}</span>
    <strong>${name}</strong>
    <span class="types">${typeBadges(id)}</span>
    <small>${INFO[id][1]}</small>
  </li>`).join('');

// Altura, peso e habilidades vêm da PokeAPI (guardados para não buscar de novo)
const cache = {};
async function details(id) {
  if (!cache[id]) {
    const r = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (!r.ok) throw new Error(r.status);
    const d = await r.json();
    cache[id] = {
      height: (d.height / 10).toLocaleString('pt-BR') + ' m',
      weight: (d.weight / 10).toLocaleString('pt-BR') + ' kg',
      abilities: d.abilities.map(a => a.ability.name.replace('-', ' ')).join(', '),
    };
  }
  return cache[id];
}

export async function openSheet(id) {
  const [, name, profile, face] = byId[id];
  const [types, personality] = INFO[id];
  sheet.style.setProperty('--main', TYPES[types[0]][1]); // cor do tipo principal
  sheet.querySelector('.sheet-body').innerHTML = `
    <img src="${artwork(id)}" alt="${name}" class="sheet-img">
    <span class="num">#${String(id).padStart(3, '0')}</span>
    <h2>${name}</h2>
    <div class="types">${typeBadges(id)}</div>
    <dl>
      <dt>Personalidade</dt><dd>${personality}</dd>
      <dt>Rosto típico</dt><dd>${face}</dd>
    </dl>
    <div class="stats" id="stats"><span>Carregando altura, peso e habilidades…</span></div>
    <h3>Perfil facial</h3>
    ${TRAITS.map(([, label], i) => `
      <div class="metric"><label>${label}<span>${Math.round(profile[i] * 100)}%</span></label>
      <div class="bar"><i style="width:${profile[i] * 100}%"></i></div></div>`).join('')}`;
  sheet.showModal();

  const stats = sheet.querySelector('#stats');
  try {
    const d = await details(id);
    stats.innerHTML = `
      <div><b>Altura</b>${d.height}</div>
      <div><b>Peso</b>${d.weight}</div>
      <div class="wide"><b>Habilidades</b>${d.abilities}</div>`;
  } catch {
    stats.innerHTML = '<span>Sem conexão com a PokeAPI para altura e peso.</span>';
  }
}

list.addEventListener('click', e => {
  const card = e.target.closest('li');
  if (card) openSheet(Number(card.id.slice(4)));
});
list.addEventListener('keydown', e => {
  const card = e.target.closest('li');
  if (card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openSheet(Number(card.id.slice(4))); }
});

// fecha no botão ✕ ou clicando fora da ficha
sheet.addEventListener('click', e => {
  if (e.target === sheet || e.target.closest('.sheet-close')) sheet.close();
});
