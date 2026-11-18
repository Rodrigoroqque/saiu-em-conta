/* Cena 3D do topo: cupom com check (a marca) e produtos reais flutuando atrás do celular.
   Carregado só quando o aparelho aguenta WebGL e a pessoa não pediu menos movimento. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

const palco = document.querySelector('.palco');
const tela = palco && palco.querySelector('canvas.cena3d');
const fone = palco && palco.querySelector('.fone');
const DADOS = window.SEC_DADOS;
if (!palco || !tela || !DADOS) throw new Error('cena3d: faltou o palco');

const COR = { cupom: 0xFFF6E6, grafite: 0x18201C, caneta: 0x2D4BFF };
const brl = (n) => 'R$ ' + (Number.isInteger(n) ? n.toLocaleString('pt-BR')
  : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

const renderer = new THREE.WebGLRenderer({ canvas: tela, antialias: true, alpha: true, powerPreference: 'low-power' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const cena = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
camera.position.set(0, 0, 9);
cena.add(new THREE.AmbientLight(0xffffff, 1.7));
const sol = new THREE.DirectionalLight(0xffffff, 2.2);
sol.position.set(-3, 4, 6);
cena.add(sol);

const mundo = new THREE.Group();
cena.add(mundo);

/* ---------- cupom serrilhado com check ---------- */
function formaCupom(l, a, dentes, prof) {
  const s = new THREE.Shape(); const r = 0.16; const x0 = -l / 2, x1 = l / 2, y1 = a / 2, y0 = -a / 2;
  s.moveTo(x0 + r, y1); s.lineTo(x1 - r, y1); s.quadraticCurveTo(x1, y1, x1, y1 - r); s.lineTo(x1, y0);
  const passo = l / dentes;
  for (let i = 0; i < dentes; i++) { s.lineTo(x1 - passo * (i + 0.5), y0 - prof); s.lineTo(x1 - passo * (i + 1), y0); }
  s.lineTo(x0, y1 - r); s.quadraticCurveTo(x0, y1, x0 + r, y1);
  return s;
}
const cupom = new THREE.Group();
const corpo = new THREE.Mesh(
  new THREE.ExtrudeGeometry(formaCupom(2.3, 2.7, 8, 0.2), { depth: 0.1, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.035, bevelSegments: 3, curveSegments: 6 }),
  new THREE.MeshStandardMaterial({ color: COR.cupom, roughness: 0.55, metalness: 0.02 }));
corpo.geometry.translate(0, 0, -0.05);
cupom.add(corpo);
const tinta = new THREE.MeshStandardMaterial({ color: COR.grafite, roughness: 0.7 });
[[1.45, 0.86, -0.05], [0.95, 0.58, -0.3]].forEach(([w, y, dx]) => {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.13, 0.03), tinta);
  b.position.set(dx, y, 0.1); cupom.add(b);
});
const curva = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-0.62, -0.18, 0.12), new THREE.Vector3(-0.3, -0.42, 0.14), new THREE.Vector3(-0.12, -0.72, 0.15),
  new THREE.Vector3(0.22, -0.1, 0.14), new THREE.Vector3(0.68, 0.36, 0.12)]);
const check = new THREE.Mesh(new THREE.TubeGeometry(curva, 48, 0.1, 10, false),
  new THREE.MeshStandardMaterial({ color: COR.caneta, roughness: 0.35, emissive: COR.caneta, emissiveIntensity: 0.15 }));
cupom.add(check);
mundo.add(cupom);

/* ---------- produtos reais (recorte da Adobe) com etiqueta que cai ---------- */
const carregador = new THREE.TextureLoader();
function etiqueta() {
  const c = document.createElement('canvas'); c.width = 320; c.height = 150;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return { c, t };
}
function caixa(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
function desenhar(e, antes, agora, caiu) {
  const g = e.c.getContext('2d'); const W = e.c.width, H = e.c.height;
  g.clearRect(0, 0, W, H);
  g.fillStyle = '#FFF6E6'; g.strokeStyle = '#18201C'; g.lineWidth = 5;
  caixa(g, 6, 6, W - 12, H - 12, 22); g.fill(); g.stroke();
  g.fillStyle = '#18201C'; g.beginPath(); g.arc(34, H / 2, 9, 0, 7); g.fill();
  g.textBaseline = 'middle';
  if (!caiu) {
    g.font = '700 22px "JetBrains Mono", monospace'; g.fillStyle = '#6B6257'; g.fillText('PREÇO DE ANTES', 58, 40);
    g.font = '800 50px Archivo, sans-serif'; g.fillStyle = '#18201C'; g.fillText(brl(antes), 58, 96);
  } else {
    g.font = '700 30px "JetBrains Mono", monospace'; g.fillStyle = '#6B6257'; g.fillText(brl(antes), 60, 42);
    const w = g.measureText(brl(antes)).width; g.strokeStyle = '#D83A2E'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(56, 46); g.lineTo(64 + w, 38); g.stroke();
    g.font = '900 54px Archivo, sans-serif'; g.fillStyle = '#0B7A55'; g.fillText(brl(agora), 58, 100);
  }
  e.t.needsUpdate = true;
}

const itens = DADOS.celular.slice(0, 4).map((o, i) => {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.04, depthWrite: false });
  const plano = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  carregador.load('img/home/' + o.foto + '-recorte.webp', (tx) => {
    tx.colorSpace = THREE.SRGBColorSpace; mat.map = tx; mat.needsUpdate = true;
    const r = tx.image.width / tx.image.height; const s = 1.2;
    plano.scale.set(r >= 1 ? s : s * r, r >= 1 ? s / r : s, 1);
  });
  g.add(plano);
  const e = etiqueta(); desenhar(e, o.preco_antes, o.preco, false);
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.42), new THREE.MeshBasicMaterial({ map: e.t, transparent: true, depthWrite: false }));
  tag.position.set(0.12, -0.55, 0.05); tag.renderOrder = 2;
  g.add(tag);
  mundo.add(g);
  return { g, plano, tag, e, o, fase: [0, 0.25, 0.75, 0.5][i], caiu: false };
});

/* ---------- layout: produtos dos lados do celular ---------- */
function medir() {
  const r = palco.getBoundingClientRect();
  const largura = Math.max(1, r.width), altura = Math.max(1, r.height);
  renderer.setSize(largura, altura, false);
  camera.aspect = largura / altura; camera.updateProjectionMatrix();
  const meiaAltura = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
  const porPx = (meiaAltura * 2) / altura;
  const fr = fone.getBoundingClientRect();
  const meiaFone = (fr.width / 2) * porPx;
  const meiaLarg = meiaAltura * camera.aspect;
  const centro = r.top + r.height / 2;
  const sobra = meiaLarg - meiaFone;               // espaço de cada lado do celular, em unidades
  if (sobra < 1.0) {
    /* celular: faixa 3D em cima do aparelho (cupom no meio, produtos em volta) */
    const yFaixa = (centro - (r.top + (fr.top - r.top) * 0.58)) * porPx;
    const ex = Math.min(1.05, meiaLarg - 0.34), ix = ex * 0.58;
    const pos = [[-ex, yFaixa - 0.05, 0.3], [-ix, yFaixa + 0.3, -0.5], [ix, yFaixa + 0.3, -0.5], [ex, yFaixa - 0.05, 0.3]];
    itens.forEach((it, i) => {
      it.base = pos[i]; it.g.position.set(...pos[i]); it.g.scale.setScalar(0.5);
      it.tag.scale.setScalar(1.45); it.tag.position.x = pos[i][0] > 0 ? -0.3 : 0.3; it.tag.visible = (i === 0 || i === 3);
    });
    cupom.position.set(0, yFaixa + 0.1, -1.4);
    cupom.scale.setScalar(0.36);
  } else {
    /* computador: produtos dos lados do celular, cupom grande atrás */
    const lado = Math.min(meiaFone + 0.62, meiaLarg - 0.62);
    const yTopo = (centro - (fr.top + fr.height * 0.14)) * porPx;
    const yPe = (centro - (fr.top + fr.height * 0.8)) * porPx;
    const pos = [[-lado, yTopo - 0.1, 0.3], [lado, yTopo - 1.2, 0.4], [-lado - 0.1, yPe + 0.9, 0.2], [lado + 0.05, yPe, 0.3]];
    itens.forEach((it, i) => { it.base = pos[i]; it.g.position.set(...pos[i]); it.g.scale.setScalar(0.8); it.tag.scale.setScalar(1.1); it.tag.position.x = pos[i][0] > 0 ? 0.12 : -0.12; it.tag.visible = true; });
    cupom.position.set(meiaFone * 0.55, yTopo - 0.9, -2.4);
    cupom.scale.setScalar(Math.max(1.3, meiaFone * 1.3));
  }
}
medir();
window.addEventListener('resize', medir);

/* ---------- dedo, mouse e giroscópio ---------- */
const alvo = { x: 0, y: 0 }; const atual = { x: 0, y: 0 };
window.addEventListener('pointermove', (ev) => {
  const r = palco.getBoundingClientRect();
  alvo.x = Math.max(-1, Math.min(1, (ev.clientX - (r.left + r.width / 2)) / (r.width / 2)));
  alvo.y = Math.max(-1, Math.min(1, (ev.clientY - (r.top + r.height / 2)) / (r.height / 2)));
}, { passive: true });
window.addEventListener('deviceorientation', (ev) => {
  if (ev.gamma == null) return;
  alvo.x = Math.max(-1, Math.min(1, ev.gamma / 30));
  alvo.y = Math.max(-1, Math.min(1, ((ev.beta || 45) - 45) / 30));
}, { passive: true });
palco.addEventListener('pointerup', function pedir() {
  const D = window.DeviceOrientationEvent;
  if (D && typeof D.requestPermission === 'function') D.requestPermission().catch(() => {});
  palco.removeEventListener('pointerup', pedir);
});

/* ---------- laço: só desenha quando o topo está na tela ---------- */
let visivel = true;
new IntersectionObserver((e) => { visivel = e[0].isIntersecting; }, { threshold: 0.01 }).observe(palco);
const CICLO = 6.4;
let t = 0, antes = null;
function quique(x) { const n = 7.5625, d = 2.75; if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75; if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375; return n * (x -= 2.625 / d) * x + 0.984375; }
function quadro(agora) {
  requestAnimationFrame(quadro);
  const dt = antes == null ? 0 : Math.min(0.1, (agora - antes) / 1000); antes = agora;
  if (!visivel || document.hidden) return;
  t += dt;
  atual.x += (alvo.x - atual.x) * 0.06; atual.y += (alvo.y - atual.y) * 0.06;
  mundo.rotation.y = atual.x * 0.28; mundo.rotation.x = atual.y * 0.18;
  palco.style.setProperty('--rx', (-atual.y * 6).toFixed(2) + 'deg');
  palco.style.setProperty('--ry', (atual.x * 8).toFixed(2) + 'deg');
  cupom.rotation.set(0.12 + Math.sin(t * 0.5) * 0.06, -0.35 + Math.sin(t * 0.37) * 0.12, -0.14);
  itens.forEach((it, i) => {
    if (!it.base) return;
    it.g.position.y = it.base[1] + Math.sin(t * 0.9 + i * 1.7) * 0.08;
    it.g.rotation.y = Math.sin(t * 0.6 + i) * 0.25; it.g.rotation.z = Math.sin(t * 0.5 + i * 2) * 0.05;
    const f = ((t / CICLO) + it.fase) % 1;            // 0..1 do ciclo da etiqueta
    let y = 0.78, op = 1;
    if (f < 0.12) op = f / 0.12;
    if (f >= 0.42 && f < 0.6) y = 0.78 - 1.33 * quique((f - 0.42) / 0.18);
    if (f >= 0.6) y = -0.55;
    if (f > 0.9) op = 1 - (f - 0.9) / 0.1;
    const caiu = f >= 0.42;
    if (caiu !== it.caiu) { it.caiu = caiu; desenhar(it.e, it.o.preco_antes, it.o.preco, caiu); }
    it.tag.position.y = y; it.tag.material.opacity = op;
    it.tag.rotation.z = caiu ? -0.08 : Math.sin(t * 2 + i) * 0.12;
  });
  renderer.render(cena, camera);
}
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  itens.forEach((it) => desenhar(it.e, it.o.preco_antes, it.o.preco, false));
  palco.classList.add('com-3d');
  requestAnimationFrame(quadro);
});
