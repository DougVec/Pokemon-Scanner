// Efeitos visuais: paralaxe dos Pokémon do topo e inclinação 3D que segue o mouse.
// Só CSS variables; o CSS faz o resto (style.css).

const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hero = document.getElementById('hero');
const device = document.getElementById('device');
const dex = document.getElementById('dex');

// posição do ponteiro dentro de um elemento, de -1 a 1
function pointer(e, el) {
  const r = el.getBoundingClientRect();
  return [((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1];
}

if (!calm) {
  // Pokémon gigantes do topo seguem o mouse, cada um numa profundidade
  hero.addEventListener('pointermove', e => {
    const [x, y] = pointer(e, hero);
    hero.style.setProperty('--px', x.toFixed(3));
    hero.style.setProperty('--py', y.toFixed(3));
  });

  // aparelho inclina levemente (pouco, para não atrapalhar a câmera)
  device.addEventListener('pointermove', e => {
    const [x, y] = pointer(e, device);
    device.style.setProperty('--ry', `${x * 4}deg`);
    device.style.setProperty('--rx', `${4 - y * 3}deg`);
  });
  device.addEventListener('pointerleave', () => {
    device.style.removeProperty('--ry');
    device.style.removeProperty('--rx');
  });

  // cards da Pokédex inclinam em 3D sob o mouse
  dex.addEventListener('pointermove', e => {
    const card = e.target.closest('li');
    if (!card) return;
    const [x, y] = pointer(e, card);
    card.style.setProperty('--ry', `${x * 14}deg`);
    card.style.setProperty('--rx', `${-y * 14}deg`);
  });
  dex.addEventListener('pointerout', e => {
    const card = e.target.closest('li');
    if (card && !card.contains(e.relatedTarget)) {
      card.style.removeProperty('--ry');
      card.style.removeProperty('--rx');
    }
  });
}
