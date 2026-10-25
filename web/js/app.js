import { FaceLandmarker, FilesetResolver, DrawingUtils } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs';
import { TRAITS, POKEMON, artwork, bestMatch } from './pokemon.js';
import './effects.js';

const WASM  = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const SCAN_MS = 3000;   // duração do scan
const MIN_FACE = 0.25;  // largura mínima do rosto (fração da imagem)

const $ = id => document.getElementById(id);
const video = $('video'), canvas = $('canvas'), ctx = canvas.getContext('2d');
const cue = $('cue'), btn = $('scan'), result = $('result'), progress = $('progress');

$('metrics').innerHTML = TRAITS.map(([k, label]) => `
  <div class="metric">
    <label>${label}<span id="v-${k}">–</span></label>
    <div class="bar"><i id="b-${k}"></i></div>
  </div>`).join('');

// Pokédex: lista de todos os Pokémon possíveis, em ordem de número
$('dex').innerHTML = [...POKEMON].sort((a, b) => a[0] - b[0]).map(([id, name, , why]) => `
  <li id="dex-${id}" style="--i:${id}">
    <img src="${artwork(id)}" alt="${name}" loading="lazy">
    <span class="num">#${String(id).padStart(3, '0')}</span>
    <strong>${name}</strong>
    <small>${why}</small>
  </li>`).join('');

const clamp = v => Math.max(0, Math.min(1, v));

function say(text) {
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'pt-BR';
  speechSynthesis.speak(u);
}

// Converte os pontos do rosto + blendshapes do MediaPipe nos 5 traços
function measure(lm, blendshapes) {
  const b = Object.fromEntries(blendshapes.categories.map(c => [c.categoryName, c.score]));
  const aspect = video.videoHeight / video.videoWidth;
  const d = (i, j) => Math.hypot(lm[i].x - lm[j].x, (lm[i].y - lm[j].y) * aspect);
  return {
    smile: clamp((b.mouthSmileLeft + b.mouthSmileRight) / 2 * 1.3),
    eyes:  clamp(1 - (b.eyeBlinkLeft + b.eyeBlinkRight) / 2 * 1.5),
    brow:  clamp(b.browInnerUp * 1.4),
    jaw:   clamp(b.jawOpen * 2),
    // largura (234–454) / altura (10–152) do rosto: ~0.75 alongado, ~1.0 redondo
    round: clamp((d(234, 454) / d(10, 152) - 0.75) / 0.25),
  };
}

function drawMesh(lm) {
  const draw = new DrawingUtils(ctx);
  draw.drawConnectors(lm, FaceLandmarker.FACE_LANDMARKS_TESSELATION, { color: '#ffffff30', lineWidth: 1 });
  draw.drawConnectors(lm, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, { color: '#ffcb05', lineWidth: 2 });
  for (const part of ['LEFT_EYE', 'RIGHT_EYE', 'LIPS', 'LEFT_EYEBROW', 'RIGHT_EYEBROW'])
    draw.drawConnectors(lm, FaceLandmarker['FACE_LANDMARKS_' + part], { color: '#3ddc84', lineWidth: 2 });
}

function showMetrics(m) {
  for (const [k] of TRAITS) {
    $('v-' + k).textContent = Math.round(m[k] * 100) + '%';
    $('b-' + k).style.width = m[k] * 100 + '%';
  }
}

let landmarker;
let scanning = null; // { t0, n, sum } enquanto escaneia

async function init() {
  try {
    const files = await FilesetResolver.forVisionTasks(WASM);
    landmarker = await FaceLandmarker.createFromOptions(files, {
      baseOptions: { modelAssetPath: MODEL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numFaces: 1,
      outputFaceBlendshapes: true,
    });
    cue.textContent = 'Permita o acesso à câmera';
    video.srcObject = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
    await video.play();
    btn.disabled = false;
    loop();
  } catch (e) {
    cue.textContent = e.name === 'NotAllowedError' ? 'Câmera bloqueada' : 'Erro ao carregar';
    console.error(e);
  }
}

function loop() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const res = landmarker.detectForVideo(video, performance.now());
  const lm = res.faceLandmarks[0];

  if (!lm) {
    cue.textContent = 'Olhe para a câmera';
  } else {
    drawMesh(lm);
    const m = measure(lm, res.faceBlendshapes[0]);
    showMetrics(m);

    const close = Math.abs(lm[454].x - lm[234].x) >= MIN_FACE;
    cue.textContent = !close ? 'Chegue mais perto' : scanning ? 'Escaneando… fique parado' : 'Rosto detectado ✓';

    if (scanning && close) {
      scanning.n++;
      for (const [k] of TRAITS) scanning.sum[k] += m[k];
    }
  }

  if (scanning) {
    const p = Math.min(1, (performance.now() - scanning.t0) / SCAN_MS);
    progress.style.width = p * 100 + '%';
    if (p >= 1) finish();
  }
  requestAnimationFrame(loop);
}

btn.onclick = () => {
  result.style.display = 'none';
  btn.disabled = true;
  scanning = { t0: performance.now(), n: 0, sum: Object.fromEntries(TRAITS.map(([k]) => [k, 0])) };
  $('stage').classList.add('scanning');
  say('Escaneando. Fique parado e faça sua cara natural.');
};

function finish() {
  const { n, sum } = scanning;
  scanning = null;
  btn.disabled = false;
  btn.textContent = 'Escanear de novo';
  progress.style.width = '0';
  $('stage').classList.remove('scanning');

  if (n < 10) {
    say('Não consegui ver seu rosto direito. Chegue mais perto e tente de novo.');
    return;
  }

  const { id, name, why, match } = bestMatch(TRAITS.map(([k]) => sum[k] / n));
  result.innerHTML = `
    <img src="${artwork(id)}" alt="${name}">
    <p class="result-label">Você seria…</p>
    <h2>${name}</h2>
    <p>Compatibilidade: <b>${match}%</b></p>
    <p>Seu rosto tem ${why}.</p>`;
  result.style.display = 'block';
  document.querySelector('#dex .match')?.classList.remove('match');
  $('dex-' + id).classList.add('match');
  say(`Scan completo! Você seria um ${name}. Seu rosto tem ${why}.`);
}

init();
