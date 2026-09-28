// Chapter 2: voice to current and back again.
// Carbon transmitter: sound pressure squeezes carbon granules between two electrodes; pressed harder, the
// granules touch at more points and the resistance falls (Carbon microphone, Wikipedia). At rest this box
// takes 100 Ω, a typical order for telephone transmitter capsules (roughly 50–150 Ω); how far loud speech
// swings it (±3%, ±10%, ±25% for whisper, talk and shout) is a teaching assumption, not a measured spec.
// Loop: 48 V through 400 Ω of feed, 175 Ω per km of copper loop and the phone (phone.js).
// Earpiece: a coil on a permanent magnet pulls a thin steel diaphragm. Pull ∝ B², so with a steady field B0
// and a signal field b, pull ∝ B0² + 2·B0·b + b²: the magnet makes the pull follow b in step. Without it,
// the pull is ∝ b² and comes out at double the frequency (a garbled sound). See MagnetismClear.
import { THREE, M, box, clamp, latheX, swarm } from '../kit.js';
import {
  LINE, loopR, voice, bandLimit, player, board, panelBg, title, text, COL, HEX, fitNarrow, reelBoards,
  wire, pathOf, sphere, rng, TAU,
} from '../phone.js';

const LOUD = { whisper: { name: 'Whisper', k: 0.03 }, talk: { name: 'Talk', k: 0.1 }, shout: { name: 'Shout', k: 0.25 } };
const SLOW = 40;                    // the 3D model and the traces run 40 times slower than real time
const WIN = 0.03;                   // the traces show a 30 ms window
const X_T = -3.3, X_R = 3.3, Y0 = 1.6;

export default {
  id: 'voice',
  short: 'Voice to current',
  title: 'Turning a voice into a current',
  subtitle: 'Carbon granules squeezed by sound, and an electromagnet that pulls it back into sound.',
  view: { pos: [0.4, 3.6, 11.0], target: [0.4, 3.0, 0] },
  learn: `<p>Sound is a wave of tiny pushes and pulls in the air (see WaveClear). In the mouthpiece, those pushes hit a thin <b>diaphragm</b>. Behind it sits a little cup of <b>carbon granules</b>, like coarse black sand, between two metal plates.</p>
    <p>The exchange's battery drives a steady current through the granules and round the loop. When your voice pushes the diaphragm in, the granules are squeezed together, they touch at more points, and their <b>resistance falls</b>. More current flows. When the air pulls back, the granules loosen and less current flows. So the current in the wire rises and falls <b>in exactly the same pattern as your voice</b>. That copy is called an <b>analogue</b> signal. Thomas Edison's carbon transmitter of 1877 made this work well, and phones used carbon microphones for about a hundred years.</p>
    <p>At the far end, the changing current flows through a coil in the <b>earpiece</b>. The coil is an <b>electromagnet</b> (see MagnetismClear and CurrentClear) wound on a permanent magnet. More current, a stronger pull on a steel diaphragm; less current, a weaker pull. The diaphragm shakes the air, and your ear hears the voice again (see EarClear). The permanent magnet matters: without it, the pull would be the same whichever way the signal swung, and the voice would come out garbled.</p>
    <p>In between, the exchange feeds each line from its 48-volt battery and passes only the <b>changes</b> across to the other line, through a transformer.</p>
    <p class="tip"><b>Try it:</b> switch from whisper to shout and watch the current trace grow. Stretch the line to 5 km and see the swing shrink. Then turn off the earpiece magnet and look at the pull.</p>`,
  terms: [
    { t: 'Diaphragm', d: 'A thin, springy disc that moves back and forth with the sound.' },
    { t: 'Carbon transmitter', d: 'A microphone whose carbon granules change their resistance when sound squeezes them.' },
    { t: 'Resistance', d: 'How hard it is for current to flow, measured in ohms (Ω).' },
    { t: 'Analogue signal', d: 'A current or voltage that rises and falls in the same shape as the sound it copies.' },
    { t: 'Electromagnet', d: 'A coil of wire that becomes a magnet when current flows through it.' },
    { t: 'Loop current', d: 'The steady current, about 20 to 60 mA, that flows round the line while the phone is off hook.' },
  ],
  defaults: { loud: 'talk', km: 2, magnet: true },
  controls: [
    { key: 'loud', type: 'seg', label: 'Your voice', options: Object.entries(LOUD).map(([v, o]) => ({ v, label: o.name })) },
    { key: 'km', type: 'range', label: 'Line length', min: 0.5, max: 5, step: 0.1, ends: ['0.5 km', '5 km'], fmt: (v) => v.toFixed(1) + ' km' },
    { key: 'magnet', type: 'toggle', label: 'Permanent magnet in the earpiece' },
    { key: 'hear', type: 'buttons', label: 'Listen', items: [
      { label: 'Hear the voice', act: (s, inst) => inst.listen?.(false) },
      { label: 'Hear it on the line', act: (s, inst) => inst.listen?.(true) },
    ] },
  ],
  quiz: [
    { q: 'What happens to the carbon granules when a sound wave pushes the diaphragm in?', options: ['They heat up and glow', 'They are squeezed, so their resistance falls and more current flows', 'They are pushed out of the cup', 'They turn into a magnet'], answer: 1, why: 'Squeezed granules touch at more points, so current flows more easily. The current copies the sound.' },
    { q: 'What makes the earpiece diaphragm move?', options: ['Air blown down the wire', 'An electromagnet whose pull changes with the current', 'A tiny motor', 'Static electricity from your ear'], answer: 1, why: 'The changing current changes the strength of an electromagnet, which pulls a steel diaphragm more or less.' },
    { q: 'Why does a longer line make the voice quieter?', options: ['The sound gets tired', 'More copper means more resistance, so the same squeeze changes the current less', 'Long lines are thinner', 'It does not change anything'], answer: 1, why: 'The granules are a smaller part of a bigger total resistance, so their changes move the current less.' },
  ],
  reel: [
    { ms: 5400, caption: 'Your voice squeezes carbon granules, and the current in the wire copies the sound.', set: { loud: 'talk', km: 2, magnet: true }, anim: {}, spin: 0, view: { pos: [-2.2, 2.6, 6.4], target: [-2.4, 1.9, 0] } },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const V = voice(2.4, 5);
    const VL = normalizeTo(bandLimit(V, 300, 3400), V);
    const Vlen = V.length, SRv = 22050;
    const brass = M.metal(0xd9b36c, { roughness: 0.3 }), copper = M.plastic(HEX.copper, { metalness: 0.5, roughness: 0.35 });
    // ---------------------------------------------------------------- carbon transmitter (cutaway)
    const tx = new THREE.Group(); tx.position.set(X_T, Y0, 0); root.add(tx);
    const can = latheX([[-0.6, 0.0], [-0.6, 0.95], [0.5, 0.95], [0.5, 0.0]], M.metal(0x8a919c, { side: THREE.DoubleSide }), { phiStart: Math.PI * 0.5, phiLength: Math.PI });
    tx.add(can);
    const diaphragm = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.88, 0.035, 48), M.metal(0xd6dde8, { roughness: 0.25 }));
    diaphragm.rotation.z = Math.PI / 2; tx.add(diaphragm);
    const front = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 40), brass); front.rotation.z = Math.PI / 2; tx.add(front);
    const back = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 40), brass); back.rotation.z = Math.PI / 2; back.position.x = 0.42; tx.add(back);
    const cup = latheX([[-0.46, 0.53], [0.46, 0.53]], M.ghost(0xffffff, 0.12), { phiStart: Math.PI * 0.5, phiLength: Math.PI }); tx.add(cup);
    // granules: fixed places inside a unit cylinder, stretched between the moving front and fixed back plates
    const NG = 260, r = rng(7), home = [];
    for (let i = 0; i < NG; i++) { const a = r() * TAU, rr = 0.47 * Math.sqrt(r()); home.push([r(), Math.cos(a) * rr, Math.sin(a) * rr, r() * TAU]); }
    const gran = swarm(NG, new THREE.IcosahedronGeometry(0.045, 0), M.matte(0x2a2a2a, { roughness: 0.9 }));
    tx.add(gran);
    // sound arriving from the left: flat ripples moving towards the diaphragm
    const ringMat = (c) => M.glow(c, { transparent: true, opacity: 0.5 });
    const inRings = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.018, 6, 48), ringMat(HEX.voice)); m.rotation.y = Math.PI / 2; root.add(m); return m; });
    // ---------------------------------------------------------------- exchange: battery and transformer
    const ex = new THREE.Group(); root.add(ex);
    const exBox = box(2.2, 2.9, 1.2, M.ghost(0x7fa7ff, 0.07)); exBox.position.set(0, 1.55, 0); ex.add(exBox);
    const batt = new THREE.Group(); batt.position.set(-0.45, 2.1, 0); ex.add(batt);
    const cell = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.6, 28), M.plastic(0x3b6fd8)); batt.add(cell);
    const capT = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.08, 16), M.metal()); capT.position.y = 0.34; batt.add(capT);
    const core = box(1.2, 0.12, 0.3, M.metal(0x6b7280)); core.position.set(0, 1.1, 0); ex.add(core);
    for (const x of [-0.45, 0.45]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.62, 28), copper); c.position.set(x, 1.1, 0); ex.add(c); const k = box(0.12, 0.8, 0.3, M.metal(0x6b7280)); k.position.set(x, 1.1, 0); ex.add(k); }
    // ---------------------------------------------------------------- earpiece (cutaway)
    const rx = new THREE.Group(); rx.position.set(X_R, Y0, 0); root.add(rx);
    const rcan = latheX([[-0.55, 0.0], [-0.55, 0.95], [0.45, 0.95], [0.45, 0.0]], M.metal(0x6b7280, { side: THREE.DoubleSide }), { phiStart: Math.PI * 0.5, phiLength: Math.PI });
    rx.add(rcan);
    const magnet = new THREE.Group(); rx.add(magnet);
    const mBase = box(0.18, 1.1, 0.35, M.plastic(0xff5a5a)); mBase.position.x = -0.35; magnet.add(mBase);
    const poles = [-0.35, 0.35].map((y) => { const p = box(0.55, 0.16, 0.25, M.metal(0x9aa3b2)); p.position.set(-0.02, y, 0); rx.add(p); return p; });
    const rcoils = [-0.35, 0.35].map((y) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.34, 24), copper); c.rotation.z = Math.PI / 2; c.position.set(0.0, y, 0); rx.add(c); return c; });
    const rdia = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.88, 0.03, 48), M.metal(0x9aa3b2, { roughness: 0.3 })); rdia.rotation.z = Math.PI / 2; rx.add(rdia);
    const outRings = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.018, 6, 48), ringMat(HEX.voice)); m.rotation.y = Math.PI / 2; root.add(m); return m; });
    // ---------------------------------------------------------------- wires and electrons
    const cu = M.plastic(HEX.copper, { metalness: 0.5, roughness: 0.4 });
    const loopA = [[X_T + 0.42, Y0 + 0.5, 0], [X_T + 0.42, 3.4, 0], [-0.45, 3.4, 0], [-0.45, 2.45, 0], [-0.45, 1.75, 0], [-0.45, 0.45, 0], [-0.45, 0.1, 0.0], [X_T - 0.45, 0.1, 0], [X_T - 0.45, Y0 - 0.45, 0]];
    const loopB = [[0.45, 1.45, 0], [0.45, 3.4, 0], [X_R + 0.1, 3.4, 0], [X_R + 0.1, Y0 + 0.6, 0], [X_R + 0.1, Y0 - 0.6, 0], [X_R + 0.1, 0.1, 0], [0.45, 0.1, 0], [0.45, 0.75, 0]];
    root.add(wire(loopA.slice(0, 4), cu, 0.035), wire(loopA.slice(5), cu, 0.035), wire(loopB.slice(0, 4), cu, 0.035), wire(loopB.slice(4), cu, 0.035));
    const pathA = pathOf([...loopA, [X_T + 0.42, Y0 - 0.45, 0], loopA[0]]), pathB = pathOf([...loopB, loopB[0]]);
    const NE = 70;
    const eMat = M.glow(HEX.current);
    const eA = swarm(NE, new THREE.SphereGeometry(0.055, 8, 6), eMat), eB = swarm(NE, new THREE.SphereGeometry(0.055, 8, 6), eMat);
    root.add(eA, eB);
    // ---------------------------------------------------------------- labels
    const L = {
      dia: stage.label('Diaphragm', [X_T - 0.1, Y0 + 1.25, 0], root),
      carbon: stage.label('Carbon granules', [X_T + 0.2, Y0 - 1.25, 0], root, 'hot'),
      batt: stage.label('Exchange battery 48 V', [-0.45, 2.75, 0.3], root),
      xf: stage.label('Transformer: passes the changes', [0, 0.55, 0.4], root),
      mag: stage.label('Electromagnet on a magnet', [X_R - 0.3, Y0 - 1.25, 0], root, 'hot'),
      rdia: stage.label('Steel diaphragm', [X_R + 0.5, Y0 + 1.25, 0], root),
      mouth: stage.label('Your voice', [X_T - 2.0, Y0 + 0.95, 0], root),
      earL: stage.label('To the ear', [X_R + 2.0, Y0 + 0.95, 0], root),
    };
    // ---------------------------------------------------------------- the model at slowed time tv (seconds of voice)
    let tv = 0.3, s0 = null, uA = 0;
    const k = () => LOUD[s0.loud].k;
    const pAt = (tt) => V[Math.floor(((tt % (Vlen / SRv)) + Vlen / SRv) % (Vlen / SRv) * SRv) % Vlen];
    const Rc = (p) => LINE.carbon * (1 - k() * p);
    const Iof = (p) => LINE.battery / (LINE.feed + LINE.perKm * s0.km + (LINE.phone - LINE.carbon) + Rc(p));
    const I0 = () => Iof(0);
    // the far-end pull, in units where the magnet's steady field is 1 and the signal field b follows ΔI
    // b is the signal field as a fraction of its peak; the magnet's steady field is taken as 4 times that peak.
    const pull = (dI, mag) => { const [lo, hi] = swingCache || [0, 1], m = Math.max(1e-6, Math.max(hi - I0(), I0() - lo)), b = clamp(dI / m, -1, 1); return mag ? ((4 + b) ** 2 - 16) / 9 : b * b; };
    const swing = () => { let lo = 1, hi = 0; for (let i = 0; i < Vlen; i += 7) { const I = Iof(V[i]); if (I < lo) lo = I; if (I > hi) hi = I; } return [lo, hi]; };
    let swingCache = null, swingKey = '';

    const traceB = board(root, 4.4, 1.63, 1080, 400, (g, w, h) => {
      panelBg(g, w, h);
      if (!s0) return;
      const I00 = I0(), [lo, hi] = swingCache;
      title(g, 'Inside the loop, 40 times slower', `a 30 ms slice of the voice · steady current ${(I00 * 1000).toFixed(1)} mA`);
      const x0 = 150, pw = w - 180, rowH = 92;
      const rows = [
        ['SOUND', COL.voice, (tt) => pAt(tt) * k() / 0.25, 'pressure on the diaphragm'],
        ['CURRENT', COL.current, (tt) => ((Iof(pAt(tt)) - I00) / Math.max(1e-6, I00 * 0.06)), `${(lo * 1000).toFixed(1)} to ${(hi * 1000).toFixed(1)} mA`],
        ['PULL', s0.magnet ? COL.good : COL.bad, (tt) => pull(Iof(pAt(tt)) - I00, s0.magnet) * 0.8, s0.magnet ? 'earpiece pull: follows the voice' : 'no magnet: pull doubles up, voice garbled'],
      ];
      rows.forEach(([lab, col, f, note], j) => {
        const y = 92 + j * rowH, mid = y + rowH / 2 - 6;
        g.strokeStyle = COL.grid; g.lineWidth = 1; g.beginPath(); g.moveTo(x0, mid); g.lineTo(x0 + pw, mid); g.stroke();
        text(g, lab, 22, mid + 6, { font: 'bold 18px sans-serif', col });
        g.strokeStyle = col; g.lineWidth = 2.4; g.beginPath();
        for (let px = 0; px <= pw; px += 2) { const tt = tv - WIN + (px / pw) * WIN; const v = clamp(f(tt), -1.2, 1.2); const yy = mid - v * (rowH / 2 - 10); px ? g.lineTo(x0 + px, yy) : g.moveTo(x0 + px, yy); }
        g.stroke();
        text(g, note, x0 + pw, y + 14, { font: '15px sans-serif', col: 'rgba(255,255,255,.6)', align: 'right' });
      });
    }, [2.5, 5.3, -0.6]);

    const inst = {
      listen(line) {
        player.stopAll();
        const gain = line ? clamp(0.5 * (LOUD[s0.loud].k / 0.1) * (loopR(2) / loopR(s0.km)) ** 2, 0.05, 1) : 0.4 * Math.sqrt(LOUD[s0.loud].k / 0.1);
        let a = line ? VL : V;
        if (line && !s0.magnet) { a = new Float32Array(VL.length); for (let i = 0; i < a.length; i++) a[i] = Math.abs(VL[i]) * 1.4 - 0.3; }
        player.play(a, { gain });
      },
      update(dt, s) {
        dt = Math.max(0, dt); s0 = s;
        player.sync();
        const narrow = fitNarrow(stage, [L.batt, L.xf, L.mouth, L.earL, L.dia, L.rdia], -0.2);
        reelBoards([[traceB, [0, 4.5, -0.6], 0.8]], narrow);
        tv += dt / SLOW;
        const key = `${s.loud}|${s.km}`;
        if (key !== swingKey) { swingKey = key; swingCache = swing(); }
        const p = pAt(tv), kk = k();
        const I00 = I0(), I = Iof(p), dI = I - I00;
        // transmitter: the diaphragm and front plate move in with pressure (exaggerated for the eye)
        const xd = -0.47 + p * kk * 0.5;
        diaphragm.position.x = xd - 0.05; front.position.x = xd;
        const x0 = xd + 0.05, x1 = back.position.x - 0.06;
        for (let i = 0; i < NG; i++) { const [u, y, z, a] = home[i]; gran.place(i, [x0 + u * (x1 - x0), y, z], [a, a * 1.3, 0], 1); }
        gran.done();
        // sound in and out
        const env = V.env[Math.floor(((tv % (Vlen / SRv)) / (Vlen / SRv)) * (Vlen - 1))] || 0;
        inRings.forEach((m, i) => { const q = (tv * SLOW * 0.35 + i / 4) % 1; m.position.set(X_T - 2.4 + q * 1.8, Y0, 0); m.material.opacity = 0.6 * env * Math.min(1, kk / 0.1) * (1 - q * 0.5); m.scale.setScalar(0.6 + 0.4 * q); });
        const pl = pull(dI, s.magnet);
        rdia.position.x = 0.38 - clamp(pl, -1.2, 1.2) * 0.08;
        outRings.forEach((m, i) => { const q = (tv * SLOW * 0.35 + i / 4) % 1; m.position.set(X_R + 0.5 + q * 1.8, Y0, 0); m.material.opacity = 0.6 * env * clamp(Math.abs(dI) / 0.0015 + 0.2, 0, 1) * (1 - q) * (s.magnet ? 1 : 0.7); m.scale.setScalar(1 + q * 0.5); m.material.color.setHex(s.magnet ? HEX.voice : HEX.bad); });
        magnet.visible = s.magnet;
        // electrons: loop A drifts with the current (DC plus the voice); loop B only jiggles with the changes
        const drift = (I / 0.05) * 0.018;
        uA += drift * dt;
        const jig = clamp(dI / 0.002, -1, 1) * 0.02;
        const v = new THREE.Vector3();
        for (let i = 0; i < NE; i++) {
          pathA.at(i / NE + uA, v); eA.place(i, [v.x, v.y, v.z]);
          pathB.at(i / NE + jig, v); eB.place(i, [v.x, v.y, v.z]);
        }
        eA.done(); eB.done();
        if (!narrow) { L.carbon.element.textContent = `Carbon granules: ${Rc(p).toFixed(1)} Ω`; }
        traceB.redraw();
      },
      readout(s) {
        s0 = s;
        const [lo, hi] = swingCache || swing(), I00 = I0();
        return `<div class="big">${(I00 * 1000).toFixed(1)} mA, wobbling with your voice</div>
          <div class="row"><span>Carbon at rest</span><b>${LINE.carbon} Ω</b></div>
          <div class="row"><span>Squeezed by ${LOUD[s.loud].name.toLowerCase()}</span><b>±${Math.round(LOUD[s.loud].k * 100)}%</b></div>
          <div class="row"><span>Loop resistance</span><b>${Math.round(loopR(s.km))} Ω</b></div>
          <div class="row"><span>Current swings</span><b>${(lo * 1000).toFixed(1)} to ${(hi * 1000).toFixed(1)} mA</b></div>
          ${s.magnet ? '<div class="ok">The earpiece follows the current in step.</div>' : '<div class="no">No magnet: the pull doubles the frequency. Garbled!</div>'}`;
      },
      dispose() { player.stopAll(); },
    };
    return inst;
  },
};

function normalizeTo(a, ref) {
  let ma = 0, mr = 0; for (const v of a) ma = Math.max(ma, Math.abs(v)); for (const v of ref) mr = Math.max(mr, Math.abs(v));
  if (ma > 0) for (let i = 0; i < a.length; i++) a[i] *= mr / ma;
  return a;
}
