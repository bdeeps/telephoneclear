// TelephoneClear's shared parts.
//
// 1. Line physics. A landline is a loop of two copper wires fed by a battery at the exchange.
//    Numbers used across chapters, with sources:
//    - Exchange battery: nominal 48 V DC between the two wires, on hook (Plain old telephone service,
//      Wikipedia; Bell System practice, -48 V "talk battery").
//    - Feed resistance: the exchange feeds each line through feed resistors or relay coils of about
//      200 Ω per wire (typical range 200–800 Ω in total, US patent 5,619,567 background). This box uses 2 × 200 Ω.
//    - Copper loop: 0.5 mm copper, ρ = 1.72e-8 Ω·m → 87.6 Ω per km per wire, 175 Ω per km of loop.
//    - Off-hook DC resistance of the phone: about 200 Ω (carbon transmitter about 100 Ω plus the network).
//    - Resulting loop current 20–60 mA: 48 V / (400 + 175·L + 200) Ω gives 58 mA at 0.5 km and 23 mA at
//      5 km, inside the 20–60 mA range lines are designed for (15–80 mA extremes, computer.rip
//      "electrical characteristics of telephone lines"; 1,700 Ω maximum loop, POTS article).
//    - Ringing: about 75 V rms at 25 Hz in India and much of Europe (60–90 V, 25 Hz), about 90 V rms at 20 Hz
//      in North America, laid on top of the 48 V DC (Ringing signal, Wikipedia).
//    - Cadence: India and the UK "double ring" 0.4 s on, 0.2 s off, 0.4 s on, 2 s off; North America 2 s on,
//      4 s off (Ringing signal, Wikipedia).
//    - Pulse dialling: 10 pulses per second, the loop broken for about 60–66% of each 100 ms pulse
//      (British standard 66%, Bell 61%); digit n sends n pulses, 0 sends ten (Pulse dialing, Wikipedia).
//    - DTMF: rows 697, 770, 852, 941 Hz; columns 1209, 1336, 1477, 1633 Hz (ITU-T Q.23).
//    - Voice band: 300–3,400 Hz (ITU-T G.712 channel), sampled 8,000 times a second with 8 bits,
//      so 64 kbit/s per call (ITU-T G.711).
// 2. A tiny sound lab: a synthetic babbling voice (no real words, nobody's voice), ringer bells,
//    dial clicks, DTMF tones and an offline band-pass filter. The same sample arrays drive both the
//    speaker and the boards, so the pictures are the real signal even when the sound is muted.
// 3. A Web Audio player that starts only after a real click or key press, obeys the kit's mute button,
//    and never makes a sound while the Glassbox studio records a video (pattern from FilmSoundClear).
// 4. Boards, labels and a generic rotary desk phone built from primitives (no logos).
import { THREE, M, rod, beam, box, torus, tube, spring, sphere, clamp } from './kit.js';
import { audio } from './ui.js';

export const TAU = Math.PI * 2;
export const D2R = Math.PI / 180;

// ---------------------------------------------------------------- line physics
export const LINE = {
  battery: 48,            // V
  feed: 400,              // Ω, 2 × 200 Ω feed
  perKm: 175,             // Ω per km of loop, 0.5 mm copper
  phone: 200,             // Ω, off-hook phone
  carbon: 100,            // Ω, the carbon transmitter's share of it at rest
  ringV: { in: 75, na: 90 },      // V rms
  ringHz: { in: 25, na: 20 },
};
export const loopR = (km, phone = LINE.phone) => LINE.feed + LINE.perKm * km + phone;
export const loopI = (km, phone = LINE.phone) => LINE.battery / loopR(km, phone);            // A
export const phoneV = (km) => loopI(km) * LINE.phone;                                         // V across the phone
// Ring cadences: [on, off, on, off...] in seconds.
export const CADENCE = {
  in: { name: 'India and UK', parts: [0.4, 0.2, 0.4, 2.0] },
  na: { name: 'North America', parts: [2.0, 4.0] },
};
export function ringOn(t, key = 'in') {
  const p = CADENCE[key].parts, T = p.reduce((a, b) => a + b, 0);
  let x = ((t % T) + T) % T;
  for (let i = 0; i < p.length; i++) { if (x < p[i]) return i % 2 === 0; x -= p[i]; }
  return false;
}
export const DTMF_ROWS = [697, 770, 852, 941];
export const DTMF_COLS = [1209, 1336, 1477, 1633];
export const KEYS = [['1', '2', '3', 'A'], ['4', '5', '6', 'B'], ['7', '8', '9', 'C'], ['*', '0', '#', 'D']];
export function dtmfOf(k) {
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (KEYS[r][c] === k) return [DTMF_ROWS[r], DTMF_COLS[c], r, c];
  return null;
}
export const pulsesOf = (d) => (d === '0' || d === 0 ? 10 : +d);

// ---------------------------------------------------------------- random numbers and DSP
export const SR = 22050;
export function rng(seed = 1) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const N = (sec) => Math.max(1, Math.round(sec * SR));
function white(n, seed) { const r = rng(seed), a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = r() * 2 - 1; return a; }
function hp1(x, fc) { const k = 1 - Math.exp((-TAU * fc) / SR); let y = 0; for (let i = 0; i < x.length; i++) { y += k * (x[i] - y); x[i] = x[i] - y; } return x; }
function reson(x, f, bw, out = new Float32Array(x.length)) {
  const F = typeof f === 'function' ? f : () => f;
  let y1 = 0, y2 = 0, a1 = 0, a2 = 0, g = 0;
  for (let i = 0; i < x.length; i++) {
    if ((i & 31) === 0) { const r = Math.exp((-Math.PI * bw) / SR); a1 = 2 * r * Math.cos((TAU * F(i)) / SR); a2 = -r * r; g = 1 - r; }
    const y = g * x[i] + a1 * y1 + a2 * y2; y2 = y1; y1 = y; out[i] += y;
  }
  return out;
}
export function normalize(a, peak = 0.9) { let m = 0; for (const v of a) m = Math.max(m, Math.abs(v)); if (m > 0) for (let i = 0; i < a.length; i++) a[i] *= peak / m; return a; }
function fade(a, inS = 0.005, outS = 0.02) { const ni = N(inS), no = N(outS); for (let i = 0; i < ni && i < a.length; i++) a[i] *= i / ni; for (let i = 0; i < no && i < a.length; i++) a[a.length - 1 - i] *= i / no; return a; }

// Vowel formants F1, F2, F3 of an adult voice (Peterson & Barney, JASA 1952).
const VOWELS = [[730, 1090, 2440], [270, 2290, 3010], [300, 870, 2240], [530, 1840, 2480], [570, 840, 2410]];
// A generic synthetic voice (after FilmSoundClear): a glottal pulse train through three moving formant
// resonators, in syllables of 4–5 per second like real speech, with hissy consonants. It says no words.
export function voice(sec = 2.4, seed = 3, f0 = 130) {
  const n = N(sec), r = rng(seed), src = new Float32Array(n), env = new Float32Array(n), fm = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
  const syl = []; let t = 0.05;
  while (t < sec - 0.25) { const d = 0.14 + r() * 0.12; syl.push({ t, d, v: VOWELS[Math.floor(r() * 5)], cons: r() < 0.7, p: 0.9 + r() * 0.3 }); t += d + 0.04 + (r() < 0.15 ? 0.25 : 0.02); }
  let ph = 0, last = 0;
  for (let i = 0; i < n; i++) {
    const tt = i / SR;
    let e = 0, v = VOWELS[0], p = 1;
    for (const s of syl) { if (tt >= s.t - 0.03 && tt < s.t + s.d + 0.05) { const k = (tt - s.t) / s.d; e = Math.max(e, Math.sin(Math.PI * clamp(k, 0, 1)) ** 0.6); v = s.v; p = s.p; } }
    env[i] = e;
    const f = f0 * p * (1 - 0.12 * (tt / sec)) * (1 + 0.02 * Math.sin(TAU * 5.3 * tt));
    ph += f / SR; if (ph >= 1) ph -= 1;
    const g = ph < 0.4 ? 0.5 * (1 - Math.cos((Math.PI * ph) / 0.4)) : ph < 0.56 ? Math.cos((Math.PI * (ph - 0.4)) / 0.32) : 0;
    src[i] = (g - last) * e; last = g;
    for (let k = 0; k < 3; k++) fm[k][i] = i ? fm[k][i - 1] + (v[k] - fm[k][i - 1]) * 0.004 : v[k];
  }
  const hiss = hp1(white(n, seed + 9), 3000);
  for (const s of syl) if (s.cons) { const a = N(s.t - 0.03), b = N(s.t + 0.03); for (let i = Math.max(0, a); i < b && i < n; i++) src[i] += hiss[i] * 0.09 * Math.sin((Math.PI * (i - a)) / (b - a)); }
  const out = new Float32Array(n);
  reson(src, (i) => fm[0][i], 80, out); reson(src, (i) => fm[1][i], 100, out);
  const o3 = reson(src, (i) => fm[2][i], 140); for (let i = 0; i < n; i++) out[i] += o3[i] * 0.5;
  // keep the raw source's high hiss too, so there is energy above 3.4 kHz to cut away
  for (let i = 0; i < n; i++) out[i] += src[i] * 0.02;
  hp1(out, 60);
  out.env = env; out.syllables = syl;
  return fade(normalize(out, 0.8));
}

// RBJ biquad (Audio EQ Cookbook), run offline. type 'lp' or 'hp', Q = 0.707.
function biquad(x, type, f, Q = 0.7071) {
  const w = (TAU * f) / SR, cs = Math.cos(w), al = Math.sin(w) / (2 * Q);
  let b0, b1, b2; const a0 = 1 + al, a1 = -2 * cs, a2 = 1 - al;
  if (type === 'lp') { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = (1 - cs) / 2; } else { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = (1 + cs) / 2; }
  const y = new Float32Array(x.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) { const v = (b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v; }
  return y;
}
// A 4th-order band-pass (two 2nd-order stages each side), like the channel filter in a phone line card.
export function bandLimit(x, lo, hi) {
  let y = x;
  if (lo > 0) { y = biquad(y, 'hp', lo); y = biquad(y, 'hp', lo); }
  if (hi > 0 && hi < SR / 2) { y = biquad(y, 'lp', hi); y = biquad(y, 'lp', hi); }
  return y;
}

// Two sine tones, as a touch-tone key makes them (ITU-T Q.23; levels a few dB apart in practice, equal here).
export function dtmf(fLo, fHi, sec = 0.22) {
  const n = N(sec), a = new Float32Array(n);
  for (let i = 0; i < n; i++) a[i] = 0.4 * Math.sin((TAU * fLo * i) / SR) + 0.4 * Math.sin((TAU * fHi * i) / SR);
  return fade(a, 0.004, 0.01);
}
// The click of the dial contacts breaking the loop.
export function click(seed = 1) {
  const n = N(0.018), r = rng(seed), a = new Float32Array(n);
  for (let i = 0; i < n; i++) a[i] = (r() * 2 - 1) * Math.exp(-i / SR / 0.003) * 0.7 + Math.sin((TAU * 2200 * i) / SR) * Math.exp(-i / SR / 0.002) * 0.3;
  return a;
}
// A mechanical ringer: a clapper hits two gongs alternately at the ringing frequency, during the cadence.
// Gong partials follow a bell's inharmonic ratios (about 1, 2.76, 5.40 for a thin dome).
export function bells(sec = 3, cad = 'in', hz = 25) {
  const n = N(sec), a = new Float32Array(n);
  const hit = (at, f) => { const i0 = N(at); for (let i = 0; i < N(0.5) && i0 + i < n; i++) { const t = i / SR; a[i0 + i] += Math.exp(-t / 0.18) * (Math.sin(TAU * f * t) + 0.5 * Math.sin(TAU * f * 2.76 * t) * Math.exp(-t / 0.05) + 0.25 * Math.sin(TAU * f * 5.4 * t) * Math.exp(-t / 0.03)); } };
  for (let k = 0, t = 0; t < sec; k++, t = k / hz / 2) if (ringOn(t, cad)) hit(t, k % 2 ? 1180 : 1320);
  return fade(normalize(a, 0.6), 0.002, 0.05);
}
export function silence(sec) { return new Float32Array(N(sec)); }

// FFT and a magnitude spectrum (dB re full scale), Hann-windowed blocks.
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -TAU / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const a = i + k, b = a + len / 2, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr; re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti; const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr; } }
  }
}
export function spectrum(a, size = 2048) {
  const out = new Float32Array(size / 2), re = new Float32Array(size), im = new Float32Array(size), w = new Float32Array(size);
  let ws = 0; for (let i = 0; i < size; i++) { w[i] = 0.5 - 0.5 * Math.cos((TAU * i) / (size - 1)); ws += w[i]; }
  let blocks = 0;
  for (let s = 0; s + size <= Math.max(a.length, size); s += size / 2) {
    for (let i = 0; i < size; i++) { re[i] = (a[s + i] || 0) * w[i]; im[i] = 0; }
    fft(re, im); for (let k = 0; k < size / 2; k++) out[k] += re[k] ** 2 + im[k] ** 2; blocks++;
    if (blocks > 40) break;
  }
  for (let k = 0; k < size / 2; k++) out[k] = 10 * Math.log10(Math.max(1e-12, out[k] / blocks)) - 20 * Math.log10(ws / 2);
  out.hz = SR / size;
  return out;
}

// ---------------------------------------------------------------- the player
let ctx = null, master = null, gestured = false;
const live = new Set(), cache = new WeakMap();
if (typeof window !== 'undefined') ['pointerdown', 'keydown', 'touchstart'].forEach((t) => window.addEventListener(t, () => { gestured = true; }, { capture: true, passive: true }));
export const recording = () => document.body.classList.contains('gb-reel') || /[?&]reel=1/.test(location.search);
function ready() {
  if (audio.muted || recording()) return null;
  if (!gestured && !navigator.userActivation?.hasBeenActive) return null;
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    if (!master) { master = ctx.createGain(); master.gain.value = 0.8; const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -10; comp.ratio.value = 4; master.connect(comp).connect(ctx.destination); }
    return ctx;
  } catch { return null; }
}
function bufferOf(a) {
  let b = cache.get(a);
  if (!b) { b = ctx.createBuffer(1, a.length, SR); b.copyToChannel(a, 0); cache.set(a, b); }
  return b;
}
export const player = {
  canPlay() { return !audio.muted && !recording(); },
  play(a, { gain = 1, at = 0, loop = false } = {}) {
    const ac = ready(); if (!ac || !a?.length) return null;
    try {
      const src = ac.createBufferSource(); src.buffer = bufferOf(a); src.loop = loop;
      const g = ac.createGain(); g.gain.value = gain; src.connect(g).connect(master);
      const when = ac.currentTime + Math.max(0, at);
      src.start(when); const item = { src }; live.add(item); src.onended = () => live.delete(item);
      return item;
    } catch { return null; }
  },
  stopAll() { live.forEach((it) => { try { it.src.stop(); } catch { /* already stopped */ } }); live.clear(); },
  // Keep the master in step with the mute button, so a ringing phone falls silent too.
  sync() { if (master && ctx) { const want = audio.muted || recording() ? 0 : 0.8; if (Math.abs(master.gain.value - want) > 0.01) master.gain.setTargetAtTime(want, ctx.currentTime, 0.02); if (want === 0 && live.size) this.stopAll(); } },
};

// ---------------------------------------------------------------- boards and stage helpers
export function panelBg(g, w, h) { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.92)'; g.fillRect(0, 0, w, h); }
export function board(root, w, h, pxW, pxH, draw, pos) {
  const c = document.createElement('canvas'); c.width = pxW; c.height = pxH;
  const g = c.getContext('2d'), tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const redraw = () => { draw(g, pxW, pxH); tex.needsUpdate = true; };
  redraw();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
  m.position.set(...pos); root.add(m);
  return { tex, redraw, canvas: c, mesh: m };
}
export function title(g, s, sub = '', y = 36) {
  g.fillStyle = '#e8eef8'; g.font = 'bold 26px sans-serif'; g.textAlign = 'left'; g.fillText(s, 22, y);
  if (sub) { g.font = '18px sans-serif'; g.fillStyle = 'rgba(255,255,255,.62)'; g.fillText(sub, 22, y + 26); }
}
export function text(g, s, x, y, { font = '18px sans-serif', col = 'rgba(255,255,255,.8)', align = 'left' } = {}) { g.font = font; g.fillStyle = col; g.textAlign = align; g.fillText(s, x, y); g.textAlign = 'left'; }
export function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
export const COL = { current: '#ffd166', voice: '#8ef0ff', ring: '#ff7a59', tone: '#c49bff', good: '#7be08c', bad: '#ff5a8a', soft: 'rgba(255,255,255,.55)', grid: 'rgba(255,255,255,.1)' };
export const HEX = { current: 0xffd166, voice: 0x8ef0ff, ring: 0xff7a59, tone: 0xc49bff, good: 0x7be08c, bad: 0xff5a8a, copper: 0xd08a4a };
export const inReel = () => document.body.classList.contains('gb-reel');
export function fitNarrow(stage, minor = [], y0 = -0.14) {
  const narrow = stage.host.clientWidth < 560;
  minor.forEach((l) => { if (l) l.visible = !narrow; });
  const y = narrow && !inReel() ? y0 : 0;
  if (!stage.shift || stage.shift[1] !== y) stage.setShift(0, y);
  return narrow;
}
// Boards sit beside the model on a wide screen; in the tall reel video they move to reelPos.
// On a phone-width stage (force) they take the same compact places.
export function reelBoards(list, force = false) {
  const r = inReel() || force;
  list.forEach(([b, pos, scale = 1, rotY = 0]) => {
    if (!b.home) b.home = { p: b.mesh.position.clone(), r: b.mesh.rotation.clone(), s: b.mesh.scale.x };
    if (r) { b.mesh.position.set(...pos); b.mesh.scale.setScalar(scale); b.mesh.rotation.set(0, rotY, 0); }
    else { b.mesh.position.copy(b.home.p); b.mesh.scale.setScalar(b.home.s); b.mesh.rotation.copy(b.home.r); }
  });
}
// A rod that can be re-aimed every frame: between([x,y,z], [x,y,z]).
export function stick(r, mat, seg = 8) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, seg), mat);
  const up = new THREE.Vector3(0, 1, 0), A = new THREE.Vector3(), B = new THREE.Vector3();
  m.between = (a, b) => {
    A.set(...a); B.set(...b); const len = A.distanceTo(B);
    m.visible = len > 1e-4; if (!m.visible) return m;
    m.position.copy(A).add(B).multiplyScalar(0.5); m.scale.set(1, len, 1);
    m.quaternion.setFromUnitVectors(up, B.clone().sub(A).normalize());
    return m;
  };
  return m;
}
// A wire as a smooth tube through points (static).
export const wire = (pts, mat, r = 0.03) => tube(pts, r, mat, false, Math.max(24, pts.length * 12));
// Points spaced evenly along a polyline, for electrons flowing round a circuit.
export function pathOf(pts) {
  const P = pts.map((p) => new THREE.Vector3(...p)), seg = [];
  let L = 0; for (let i = 0; i < P.length - 1; i++) { const d = P[i].distanceTo(P[i + 1]); seg.push([L, d]); L += d; }
  return {
    length: L,
    at(u, out = new THREE.Vector3()) {
      let x = ((u % 1) + 1) % 1 * L;
      for (let i = 0; i < seg.length; i++) { const [s0, d] = seg[i]; if (x <= s0 + d || i === seg.length - 1) return out.copy(P[i]).lerp(P[i + 1], d ? (x - s0) / d : 0); }
      return out.copy(P[0]);
    },
  };
}

// ---------------------------------------------------------------- a generic rotary desk phone
// Units: about 1 unit = 10 cm. The base sits on the floor, its front faces +Z, the handset lies along X
// on the cradle. Receiver (ear) end at -X, transmitter (mouth) end at +X.
export const SLOPE = Math.atan2(0.6, 1.15);          // the dial face's slope from horizontal (about 27.5°)
export const DIAL_ANG = { stop: -30 * D2R, step: 30 * D2R };
export const holeAngle = (d) => pulsesOf(d) * 30 * D2R; // digit 1 at 30° (2 o'clock), 0 at 300° (5 o'clock)

// Number plate texture: digits by each hole, and a blank card in the middle (no brand, no number).
function plateTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#f4f1e8'; g.beginPath(); g.arc(256, 256, 256, 0, TAU); g.fill();
  g.fillStyle = '#1b1e25'; g.font = 'bold 44px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let d = 1; d <= 10; d++) { const a = d * 30 * D2R, R = 0.745 * 256; g.fillText(String(d % 10), 256 + Math.cos(a) * R, 256 - Math.sin(a) * R); }
  g.fillStyle = '#e8e0cc'; g.beginPath(); g.arc(256, 256, 70, 0, TAU); g.fill();
  g.strokeStyle = '#b8ac90'; g.lineWidth = 3; g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
// A finger wheel: a transparent disc with ten holes. Local frame: faces +Z, centre at the origin.
export function makeDial(R = 0.62, { color = 0x1b1e25 } = {}) {
  const g = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.CircleGeometry(R * 0.98, 64), new THREE.MeshStandardMaterial({ map: plateTexture(), roughness: 0.6 }));
  g.add(plate);
  const shape = new THREE.Shape(); shape.absarc(0, 0, R, 0, TAU, false);
  const holeR = R * 0.14, ringR = R * 0.745;
  for (let d = 1; d <= 10; d++) { const a = d * 30 * D2R, h = new THREE.Path(); h.absarc(Math.cos(a) * ringR, Math.sin(a) * ringR, holeR, 0, TAU, true); shape.holes.push(h); }
  const inner = new THREE.Path(); inner.absarc(0, 0, R * 0.28, 0, TAU, true); shape.holes.push(inner);
  const wheelGeo = new THREE.ExtrudeGeometry(shape, { depth: R * 0.06, bevelEnabled: true, bevelThickness: R * 0.015, bevelSize: R * 0.015, bevelSegments: 2, curveSegments: 40 });
  const wheel = new THREE.Mesh(wheelGeo, M.plastic(color, { transparent: true, opacity: 0.55, roughness: 0.25 }));
  wheel.position.z = R * 0.03; wheel.castShadow = true;
  g.add(wheel);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.08, R * 0.08, R * 0.14, 24), M.metal()); hub.rotation.x = Math.PI / 2; hub.position.z = R * 0.08; g.add(hub);
  // the finger stop: a curved metal hook just outside the wheel at 4 o'clock
  const stopA = DIAL_ANG.stop, stop = new THREE.Group();
  const sBar = box(R * 0.07, R * 0.34, R * 0.07, M.metal(0xd6dde8)); sBar.position.set(0, R * 0.12, 0); stop.add(sBar);
  stop.position.set(Math.cos(stopA) * R * 0.98, Math.sin(stopA) * R * 0.98, R * 0.16); stop.rotation.z = stopA - Math.PI / 2;
  g.add(stop);
  return { group: g, wheel, plate, stop, R, ringR, holeR, setTurn(a) { wheel.rotation.z = -a; } };
}

export function makeDeskPhone({ body = 0xe6dcc3, dark = 0x1b1e25 } = {}) {
  const group = new THREE.Group();
  const bodyMat = M.plastic(body, { transparent: true, opacity: 1, roughness: 0.35 });
  // shell: a side profile (z, y) extruded across X, rounded by a bevel
  const s = new THREE.Shape();
  s.moveTo(1.1, 0); s.lineTo(1.1, 0.34); s.lineTo(0.0, 0.94); s.lineTo(-0.95, 0.94); s.quadraticCurveTo(-1.1, 0.94, -1.1, 0.8); s.lineTo(-1.1, 0); s.lineTo(1.1, 0);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 1.9, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.1, bevelSegments: 4, curveSegments: 12 });
  geo.translate(0, 0.1, -0.95); geo.rotateY(-Math.PI / 2);      // profile x → world z (front +Z), extrusion → world x
  geo.computeVertexNormals();
  const shellMesh = new THREE.Mesh(geo, bodyMat); shellMesh.castShadow = true; shellMesh.receiveShadow = true;
  const shell = new THREE.Group(); shell.add(shellMesh);
  // cradle forks on the top, one at each end, and hook-switch plungers between their prongs
  const forkMat = M.plastic(body, { roughness: 0.3 });
  const plungers = [];
  for (const x of [-0.78, 0.78]) {
    for (const z of [-0.2, -0.72]) { const p = box(0.2, 0.34, 0.12, forkMat); p.position.set(x, 1.1, z); shell.add(p); }
    const pl = box(0.12, 0.14, 0.22, M.plastic(0xf6f2e6)); pl.position.set(x, 1.1, -0.46); shell.add(pl); plungers.push(pl);
  }
  // dial on the front slope
  const dial = makeDial(0.5);
  const dialMount = new THREE.Group();
  dialMount.position.set(0, 0.83, 0.6); dialMount.rotation.x = -(Math.PI / 2 - SLOPE);
  dialMount.add(dial.group); dial.group.position.z = 0.04;
  // base plate and feet
  const base = new THREE.Group();
  const plate = box(2.1, 0.05, 2.25, M.metal(0x6b7280)); plate.position.y = 0.025; base.add(plate);
  for (const x of [-0.9, 0.9]) for (const z of [-0.95, 0.95]) { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 12), M.matte(0x111216)); f.position.set(x, 0.0, z); base.add(f); }
  // ringer: two gongs and a clapper between them, driven by an electromagnet
  const ringer = new THREE.Group();
  const gongMat = M.metal(0xd9b36c, { roughness: 0.25 });
  const gongs = [-0.18, 0.18].map((x) => {
    const pts = []; for (let i = 0; i <= 12; i++) { const k = i / 12; pts.push(new THREE.Vector2(0.3 * Math.sin(k * Math.PI * 0.5) + 0.01, 0.2 * Math.cos(k * Math.PI * 0.5))); }
    const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), gongMat); m.material.side = THREE.DoubleSide; m.castShadow = true;
    m.rotation.z = x < 0 ? Math.PI / 2 : -Math.PI / 2; m.position.set(x, 0.42, -0.55); ringer.add(m);
    const post = beam([x * 2.05, 0.05, -0.55], [x * 2.05, 0.42, -0.55], 0.025, M.metal()); ringer.add(post);
    return m;
  });
  // the clapper's ball sits between the gongs' top rims (y = 0.42 + 0.3)
  const clapper = new THREE.Group(); clapper.position.set(0, 0.3, -0.55);
  clapper.add(beam([0, 0, 0], [0, 0.44, 0], 0.02, M.metal()));
  const ball = sphere(0.055, M.metal(0x9aa3b2)); ball.position.y = 0.45; clapper.add(ball);
  ringer.add(clapper);
  const ringCoils = [-0.13, 0.13].map((x) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.2, 20), M.plastic(HEX.copper, { roughness: 0.4, metalness: 0.4 })); c.position.set(x, 0.16, -0.25); ringer.add(c); return c; });
  const ringMagnet = box(0.42, 0.05, 0.12, M.metal(0x8a919c)); ringMagnet.position.set(0, 0.28, -0.25); ringer.add(ringMagnet);
  // network: the induction coil and capacitor that separate your own voice from the incoming one
  const network = new THREE.Group();
  const netBox = box(0.62, 0.3, 0.32, M.plastic(0x2f3a4a)); netBox.position.set(0.35, 0.2, 0.42); network.add(netBox);
  const netCoil = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.3, 24), M.plastic(HEX.copper, { roughness: 0.4, metalness: 0.4 })); netCoil.rotation.z = Math.PI / 2; netCoil.position.set(-0.35, 0.2, 0.42); network.add(netCoil);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.26, 16), M.plastic(0x5b6bd8)); cap.rotation.x = Math.PI / 2; cap.position.set(-0.7, 0.14, 0.2); network.add(cap);
  // hook switch contacts under the cradle: leaf springs that close when the plungers rise
  const hook = new THREE.Group();
  const leafMat = M.metal(0xe0c080);
  const leaves = [0, 1, 2].map((i) => { const l = box(0.5, 0.02, 0.08, leafMat); l.position.set(-0.78, 0.55 + i * 0.07, -0.46); hook.add(l); return l; });
  // dial mechanism behind the dial: a governor and the pulse contacts
  const dialMech = new THREE.Group();
  const gov = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.22, 20), M.metal(0x9aa3b2)); gov.position.set(0.2, 0.45, 0.35); dialMech.add(gov);
  const cam = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 10), M.metal(0xd6dde8)); cam.rotation.x = Math.PI / 2; cam.position.set(-0.2, 0.45, 0.4); dialMech.add(cam);
  const pulseLeaf = box(0.04, 0.3, 0.02, leafMat); pulseLeaf.position.set(-0.35, 0.45, 0.4); dialMech.add(pulseLeaf);
  // handset: a grip with an earpiece cup and a mouthpiece cup
  const handset = new THREE.Group();
  const hsMat = M.plastic(body, { transparent: true, opacity: 1, roughness: 0.3 });
  const grip = tube([[-0.95, 0.12, 0], [-0.72, 0.3, 0], [0, 0.36, 0], [0.72, 0.3, 0], [0.95, 0.12, 0]], 0.12, hsMat, false, 60);
  grip.scale.z = 1.25; handset.add(grip);
  const cupGeo = new THREE.CylinderGeometry(0.2, 0.3, 0.3, 36);
  const ear = new THREE.Mesh(cupGeo, hsMat); ear.position.set(-0.98, 0.0, 0); ear.castShadow = true; handset.add(ear);
  const mouth = new THREE.Mesh(cupGeo, hsMat); mouth.position.set(0.98, 0.0, 0); mouth.castShadow = true; handset.add(mouth);
  const grille = (x) => { const d = new THREE.Mesh(new THREE.CircleGeometry(0.27, 32), M.matte(0x2a2d34)); d.rotation.x = Math.PI / 2; d.position.set(x, -0.155, 0); handset.add(d); return d; };
  grille(-0.98); grille(0.98);
  // inside the handset: a carbon transmitter capsule and a receiver capsule
  const transmitter = new THREE.Group();
  const tCan = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 28), M.metal(0x9aa3b2)); transmitter.add(tCan);
  const tCarbon = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.125, 20), M.matte(0x111111)); transmitter.add(tCarbon);
  transmitter.position.set(0.98, -0.02, 0); handset.add(transmitter);
  const receiver = new THREE.Group();
  const rCan = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 28), M.metal(0x6b7280)); receiver.add(rCan);
  const rCoil = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 20), M.plastic(HEX.copper, { metalness: 0.4 })); rCoil.position.y = 0.06; receiver.add(rCoil);
  receiver.position.set(-0.98, -0.02, 0); handset.add(receiver);
  const handsetHome = new THREE.Group(); handsetHome.position.set(0, 1.4, -0.46); handsetHome.add(handset);
  // cords: the coiled handset cord (re-aimed each frame) and the line cord to a wall socket
  const cordMat = M.plastic(body, { roughness: 0.5 });
  const coil = spring(0, 1, 0.07, 0.022, 18, cordMat);
  const coilHolder = new THREE.Group(); coilHolder.add(coil);
  const lineCord = tube([[-0.9, 0.12, -1.1], [-1.0, 0.03, -1.6], [-1.4, 0.03, -2.2], [-1.6, 0.03, -2.8], [-1.7, 0.3, -3.0]], 0.035, M.matte(0x3a3f4b));
  const socket = box(0.4, 0.5, 0.08, M.plastic(0xf2eee4)); socket.position.set(-1.7, 0.35, -3.05);
  const cords = new THREE.Group(); cords.add(lineCord, socket);
  group.add(base, ringer, network, hook, dialMech, shell, dialMount, handsetHome, coilHolder, cords);

  const inner = [base, ringer, network, hook, dialMech];
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), X1 = new THREE.Vector3(1, 0, 0);
  const api = {
    group, shell, shellMesh, bodyMat, hsMat, dial, dialMount, base, ringer, gongs, clapper, network, hook, leaves, dialMech, gov,
    handset, handsetHome, transmitter, receiver, ear, mouth, plungers, coilHolder, cords, inner,
    lift: 0,
    // 0 = on the cradle, 1 = lifted to the ear. The plungers rise and the hook switch closes.
    setLift(k) {
      api.lift = k;
      const e = k * k * (3 - 2 * k);
      handset.position.set(0, e * 0.8, e * 0.9); handset.rotation.set(0, 0, e * 0.2);
      plungers.forEach((p) => { p.position.y = 1.1 + 0.08 * Math.min(1, k * 4); });
      leaves[1].position.y = 0.62 + 0.035 * Math.min(1, k * 4);
    },
    // the clapper swings between the gongs (x = -1…1)
    setClapper(x) { clapper.rotation.z = -x * 0.28; },
    setXray(on, k = 0.22) {
      for (const m of [bodyMat, hsMat]) { m.opacity = on ? k : 1; m.depthWrite = !on; }
    },
    // the handset cord runs from the base's right side to the mouth end of the handset
    updateCord() {
      group.updateMatrixWorld(true);
      const a = tmp.set(1.12, 0.35, 0.25); group.localToWorld(a);
      const b = tmp2.set(0.98, -0.05, 0.12); handset.localToWorld(b);
      group.worldToLocal(a); group.worldToLocal(b);
      const d = b.clone().sub(a), L = d.length();
      coilHolder.position.copy(a); coilHolder.quaternion.setFromUnitVectors(X1, d.normalize()); coil.scale.set(L, 1, 1);
    },
  };
  api.setLift(0);
  return api;
}

// A small house or building marker, for maps of calls across town.
export function makeHouse(color = 0xe6dcc3, roof = 0xb8574a, s = 1) {
  const g = new THREE.Group();
  const b = box(1.2 * s, 0.9 * s, 1 * s, M.matte(color)); b.position.y = 0.45 * s; g.add(b);
  const r = new THREE.Mesh(new THREE.ConeGeometry(0.95 * s, 0.6 * s, 4), M.matte(roof)); r.position.y = 1.2 * s; r.rotation.y = Math.PI / 4; r.castShadow = true; g.add(r);
  const d = box(0.26 * s, 0.46 * s, 0.03 * s, M.matte(0x5b4633)); d.position.set(0, 0.23 * s, 0.51 * s); g.add(d);
  return g;
}
export { rod, beam, box, torus, tube, spring, sphere };
