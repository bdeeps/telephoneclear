// Chapter 5: long distance. Trunks, multiplexing and delay.
// - Digital voice: 8,000 samples a second × 8 bits = 64 kbit/s per call (ITU-T G.711, pulse-code modulation,
//   Alec Reeves 1937–38). An E1 trunk (ITU-T G.704, used in India and Europe) carries 32 time slots of
//   64 kbit/s = 2.048 Mbit/s: 30 calls, one slot for framing and one for signalling. A frame lasts 125 µs.
// - Speeds: signals travel at about 2/3 of the speed of light in copper and glass fibre, about 200,000 km/s,
//   so 5 µs per km. Radio to a satellite travels at c = 299,792 km/s.
// - Geostationary orbit: 35,786 km above the equator. Up and down is at least 71,572 km, so at least 239 ms
//   one way (more away from the sub-satellite point). ITU-T G.114 advises keeping one-way delay under
//   about 150 ms for natural conversation.
// - Distances (rounded, route lengths are estimates): a call across town about 10 km of copper; Delhi to Mumbai
//   about 1,150 km as the crow flies, taken as about 1,400 km of fibre; Mumbai to London about 7,200 km great
//   circle, taken as about 11,000 km of undersea cable via the Red Sea and the Mediterranean.
// - TAT-1, the first transatlantic telephone cable (25 September 1956), carried 35 calls plus a telegraph channel.
import { THREE, M, box, swarm } from '../kit.js';
import { player, voice, bandLimit, board, panelBg, title, text, COL, HEX, fitNarrow, reelBoards, wire, beam, sphere, rrect, pathOf } from '../phone.js';

const ROUTES = {
  town: { name: 'Across town', km: 10, medium: 'copper pair', v: 200000 },
  dm: { name: 'Delhi–Mumbai', km: 1400, medium: 'fibre trunk', v: 200000 },
  lon: { name: 'Mumbai–London', km: 11000, medium: 'undersea fibre cable', v: 200000 },
  sat: { name: 'By satellite', km: 71572, medium: 'geostationary satellite', v: 299792 },
};
export const delayMs = (key) => (ROUTES[key].km / ROUTES[key].v) * 1000;
const CALL_COLS = [0x8ef0ff, 0xffd166, 0xff7a59, 0x7be08c, 0xc49bff, 0xff5a8a, 0x7fa7ff, 0xf2eee4];
const X0 = -2.5, X1 = 2.5, TY = 1.3;

export default {
  id: 'distance',
  short: 'Long distance',
  title: 'Many calls, one line, across the world',
  subtitle: 'Voices chopped into numbers, taking turns on trunks, cables and satellites.',
  view: { pos: [0.6, 4.4, 12.6], target: [0.6, 3.1, 0] },
  learn: `<p>Between exchanges run <b>trunk lines</b>. Laying a separate pair of wires for every call between two cities would be absurd, so engineers learned to share one line among many calls: <b>multiplexing</b>.</p>
    <p>Modern trunks are digital. Your voice is measured <b>8,000 times a second</b>, and each measurement is stored as an 8-bit number. That is <b>64,000 bits a second</b> per call. A multiplexer then lets the calls take turns: one number from call 1, one from call 2, one from call 3, and so on, then round again. This is <b>time-division multiplexing</b>. One round, a <b>frame</b>, lasts just 125 millionths of a second, so every call gets its turn 8,000 times a second and nobody notices the sharing. An E1 trunk carries 30 calls this way, and a single glass fibre today carries millions.</p>
    <p>Across oceans, calls first went by radio (1927), then by undersea cable: <b>TAT-1</b> in 1956 carried just 35 calls across the Atlantic. Satellites came next, but they sit 35,786 km up. Even at the speed of light, the trip up and down takes about a quarter of a second, and people talked over each other. Fibre cables won.</p>
    <p>In India, <b>STD</b> (subscriber trunk dialling) began between Lucknow and Kanpur in 1960. In the late 1980s and 1990s, yellow <b>STD/ISD/PCO booths</b> sprang up in every town and village, many run by young or disabled owners, and for the first time millions of people could dial any city, or any country, themselves.</p>
    <p class="tip"><b>Try it:</b> add calls and watch the frame fill up. Then compare the routes, and press "Hear the delay" for the satellite.</p>`,
  terms: [
    { t: 'Trunk line', d: 'A line between two exchanges, shared by many calls.' },
    { t: 'Multiplexing', d: 'Sending many signals down one line at once, by sharing time or frequency.' },
    { t: 'Sampling', d: 'Measuring a wave many times a second and keeping each measurement as a number.' },
    { t: 'Time slot', d: 'One call’s turn in each frame: 8 bits, 8,000 times a second.' },
    { t: 'Latency', d: 'The delay between speaking and being heard at the other end.' },
    { t: 'STD / ISD', d: 'Subscriber trunk dialling and international subscriber dialling: calling other cities or countries without an operator.' },
  ],
  defaults: { calls: 6, route: 'dm' },
  controls: [
    { key: 'calls', type: 'range', label: 'Calls sharing the trunk', min: 1, max: 30, step: 1, ends: ['1', '30 (a full E1)'], fmt: (v) => `${v} call${v > 1 ? 's' : ''}` },
    { key: 'route', type: 'seg', label: 'Route', options: Object.entries(ROUTES).map(([v, r]) => ({ v, label: r.name })) },
    { key: 'hear', type: 'buttons', label: 'Listen', items: [{ label: 'Hear the delay', act: (s, inst) => inst.listen?.() }] },
  ],
  quiz: [
    { q: 'How many bits per second does one digital phone call use?', options: ['8', '8,000', '64,000', '2 million'], answer: 2, why: '8,000 samples a second, each 8 bits long, is 64,000 bits a second.' },
    { q: 'What is time-division multiplexing?', options: ['Using a different wire for each call', 'Calls taking turns on one line, a few bits each, very fast', 'Sending calls only at night', 'Splitting one call into two lines'], answer: 1, why: 'Each call gets a short time slot in every frame, 8,000 frames a second.' },
    { q: 'Why did satellite calls feel awkward?', options: ['Space is noisy', 'The signal takes about a quarter of a second to go up and come down', 'Satellites only carry one call', 'The voice is louder'], answer: 1, why: 'A geostationary satellite is 35,786 km up. Up and down at light speed takes about 0.24 s, so replies arrive late.' },
  ],
  reel: [
    { ms: 5200, caption: 'Your voice becomes 8,000 numbers a second, 64 kilobits, and takes turns with other calls.', set: { route: 'dm' }, anim: { calls: [1, 30] }, spin: 0, view: { pos: [0.2, 3.2, 8.6], target: [0, 1.8, 0] } },
    { ms: 4800, caption: 'A satellite is 35,786 km up, so your voice arrives about a quarter of a second late.', set: { route: 'sat', calls: 8 }, anim: {}, spin: 0, view: { pos: [0.8, 4.6, 10.4], target: [0, 3.4, 0] } },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    // ---------------------------------------------------------------- multiplexer, trunk, demultiplexer
    const muxMat = M.plastic(0x2f3a4a, { roughness: 0.4 });
    const mux = box(1.0, 1.6, 1.0, muxMat); mux.position.set(X0 - 0.5, TY, 0); root.add(mux);
    const demux = box(1.0, 1.6, 1.0, muxMat); demux.position.set(X1 + 0.5, TY, 0); root.add(demux);
    for (const m of [mux, demux]) { const led = box(0.6, 0.08, 0.02, M.glow(HEX.good)); led.position.set(0, 0.55, 0.51); m.add(led); }
    const trunkCopper = wire([[X0, TY, 0], [X1, TY, 0]], M.plastic(0xd08a4a, { metalness: 0.5 }), 0.07);
    const trunkFibre = wire([[X0, TY, 0], [X1, TY, 0]], M.ghost(0x8ef0ff, 0.35), 0.09);
    const sea = box(3.2, 0.9, 2.2, M.ghost(0x2a6bd8, 0.22)); sea.position.set(0, 0.45, 0); root.add(sea);
    const cableUnder = wire([[X0, TY, 0], [-1.6, 0.35, 0], [1.6, 0.35, 0], [X1, TY, 0]], M.ghost(0x8ef0ff, 0.35), 0.09);
    root.add(trunkCopper, trunkFibre, cableUnder);
    // satellite: a body, two panels and a dish, with up and down beams
    const sat = new THREE.Group(); sat.position.set(0, 3.4, -0.6); root.add(sat);
    sat.add(box(0.5, 0.5, 0.5, M.metal(0xd9b36c)));
    for (const sx of [-1, 1]) { const p = box(1.1, 0.04, 0.45, M.plastic(0x2b4fa0, { metalness: 0.3 })); p.position.x = sx * 0.85; sat.add(p); }
    const dish = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 10, 0, Math.PI * 2, 0, Math.PI / 3), M.metal(0xeeeeee, { side: THREE.DoubleSide })); dish.rotation.x = Math.PI; dish.position.y = -0.4; sat.add(dish);
    const beamMat = M.glow(0x8ef0ff, { transparent: true, opacity: 0.5 });
    const upBeam = beam([X0 - 0.5, TY + 0.8, 0], [0, 3.0, -0.6], 0.025, beamMat), downBeam = beam([0, 3.0, -0.6], [X1 + 0.5, TY + 0.8, 0], 0.025, beamMat);
    root.add(upBeam, downBeam);
    // slots: one frame after another along the trunk; slot 0 of each frame is the framing word
    const NS = 64;
    const slotGeo = new THREE.BoxGeometry(0.1, 0.22, 0.22);
    const slots = swarm(NS, slotGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));
    root.add(slots);
    const col = new THREE.Color(), tmpV = new THREE.Vector3();
    const PATHS = {
      line: pathOf([[X0, TY, 0], [X1, TY, 0]]),
      lon: pathOf([[X0, TY, 0], [-1.6, 0.35, 0], [1.6, 0.35, 0], [X1, TY, 0]]),
      sat: pathOf([[X0 - 0.5, TY + 0.8, 0], [0, 3.0, -0.6], [X1 + 0.5, TY + 0.8, 0]]),
    };
    // input and output lines: up to 8 drawn phones' worth of wires fanning in and out
    const fanIn = [], fanOut = [], dotsIn = [], dotsOut = [];
    for (let i = 0; i < 8; i++) {
      const y = TY + 0.7 - i * 0.2, c = CALL_COLS[i];
      const mat = M.plastic(c, { roughness: 0.5 });
      const a = wire([[-5.8, 0.3 + i * 0.36, 0.4], [-4.4, 0.3 + i * 0.36, 0.3], [X0 - 1.0, y, 0]], mat, 0.025);
      const b = wire([[X1 + 1.0, y, 0], [4.4, 0.3 + i * 0.36, 0.3], [5.8, 0.3 + i * 0.36, 0.4]], mat, 0.025);
      root.add(a, b); fanIn.push(a); fanOut.push(b);
      const di = sphere(0.07, M.glow(c)), dd = sphere(0.07, M.glow(c)); root.add(di, dd); dotsIn.push(di); dotsOut.push(dd);
    }
    // an STD/ISD/PCO booth: a generic yellow kiosk with a hand-lettered sign
    const booth = new THREE.Group(); booth.position.set(-5.4, 0, -2.2); booth.rotation.y = 0.45; root.add(booth);
    const yellow = M.plastic(0xf2c230, { roughness: 0.5 });
    const bBase = box(1.4, 0.9, 1.0, yellow); bBase.position.y = 0.45; booth.add(bBase);
    for (const x of [-0.65, 0.65]) { const p = box(0.1, 1.5, 0.1, yellow); p.position.set(x, 1.65, 0.45); booth.add(p); const q = p.clone(); q.position.z = -0.45; booth.add(q); }
    const roof = box(1.6, 0.12, 1.2, yellow); roof.position.y = 2.45; booth.add(roof);
    const signTex = (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#f2c230'; g.fillRect(0, 0, 512, 128); g.fillStyle = '#1b1e25'; g.font = 'bold 64px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('STD · ISD · PCO', 256, 68); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ map: signTex, toneMapped: false })); sign.position.set(0, 2.75, 0.5); booth.add(sign);
    const bPhone = box(0.5, 0.2, 0.4, M.plastic(0xd8d2c4)); bPhone.position.set(-0.2, 1.0, 0.1); booth.add(bPhone);
    const meter = box(0.34, 0.24, 0.05, M.glow(0xff5a5a)); meter.position.set(0.35, 1.25, 0.3); booth.add(meter);
    // ---------------------------------------------------------------- route board (to scale for the satellite)
    let s0 = { calls: 6, route: 'dm' }, t = 0;
    const routeB = board(root, 3.0, 2.09, 660, 460, (g, w, h) => {
      panelBg(g, w, h);
      const R = ROUTES[s0.route], ms = delayMs(s0.route);
      title(g, R.name, `${R.km.toLocaleString('en-IN')} km by ${R.medium}`);
      const cx = w / 2, cy = 300, re = s0.route === 'sat' ? 22 : 120;
      g.fillStyle = '#1f4f8f'; g.beginPath(); g.arc(cx, cy, re, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 1; g.stroke();
      if (s0.route === 'sat') {
        const rg = re * 6.62;                       // geostationary orbit radius ÷ Earth radius = 42,164 ÷ 6,371
        g.setLineDash([4, 6]); g.beginPath(); g.arc(cx, cy, rg, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.setLineDash([]);
        const sx = cx, sy = cy - rg, a1 = [cx - re * 0.6, cy - re * 0.8], a2 = [cx + re * 0.6, cy - re * 0.8];
        g.strokeStyle = COL.voice; g.lineWidth = 2; g.beginPath(); g.moveTo(...a1); g.lineTo(sx, sy); g.lineTo(...a2); g.stroke();
        g.fillStyle = '#ffd166'; g.fillRect(sx - 6, sy - 6, 12, 12);
        text(g, 'satellite, 35,786 km up (to scale)', sx + 12, sy + 4, { font: '15px sans-serif', col: 'rgba(255,255,255,.7)' });
        text(g, 'Earth', cx, cy + 5, { font: '13px sans-serif', col: '#fff', align: 'center' });
      } else {
        const span = { town: 0.04, dm: 0.18, lon: 1.0 }[s0.route] * Math.PI * 0.5;
        g.strokeStyle = COL.voice; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, re + 3, -Math.PI / 2 - span, -Math.PI / 2 + span); g.stroke();
        for (const sg of [-1, 1]) { const a = -Math.PI / 2 + sg * span; g.fillStyle = '#ffd166'; g.beginPath(); g.arc(cx + Math.cos(a) * (re + 3), cy + Math.sin(a) * (re + 3), 6, 0, Math.PI * 2); g.fill(); }
        text(g, 'Earth', cx, cy + 5, { font: '15px sans-serif', col: '#fff', align: 'center' });
      }
      const col2 = ms > 150 ? COL.bad : ms > 50 ? COL.current : COL.good;
      text(g, `One way: ${ms < 1 ? ms.toFixed(2) : ms.toFixed(0)} ms`, 22, h - 22, { font: 'bold 24px sans-serif', col: col2 });
      text(g, ms > 150 ? 'too slow for easy chat' : 'feels instant', w - 22, h - 22, { font: '17px sans-serif', col: col2, align: 'right' });
    }, [4.8, 4.25, -1.2]);
    routeB.mesh.rotation.y = -0.25;
    const frameB = board(root, 4.2, 1.05, 960, 240, (g, w, h) => {
      panelBg(g, w, h);
      const n = Math.round(s0.calls);
      title(g, 'One frame: 125 µs, 32 time slots', `${n} × 64 kbit/s = ${(n * 64).toLocaleString('en')} kbit/s of voice on a 2,048 kbit/s E1`);
      const x0 = 22, y0 = 92, sw = (w - 44) / 32;
      for (let k = 0; k < 32; k++) {
        const used = k === 0 || k === 16 || (k > 0 && k !== 16 && (k < 16 ? k : k - 1) <= n);
        const callIdx = k < 16 ? k - 1 : k - 2;
        g.fillStyle = k === 0 ? '#ffffff' : k === 16 ? '#7f8796' : used ? '#' + CALL_COLS[callIdx % 8].toString(16).padStart(6, '0') : 'rgba(255,255,255,.07)';
        rrect(g, x0 + k * sw + 2, y0, sw - 4, 64, 5); g.fill();
        if (k === 0 || k === 16) text(g, k === 0 ? 'F' : 'S', x0 + k * sw + sw / 2, y0 + 40, { font: 'bold 16px sans-serif', col: '#111', align: 'center' });
      }
      text(g, 'F = framing, S = signalling, 8 bits per slot', 22, h - 20, { font: '15px sans-serif', col: 'rgba(255,255,255,.55)' });
    }, [2.2, 6.0, -1.0]);

    let lastKey = '', V = null;
    const inst = {
      listen() {
        player.stopAll();
        V ||= normalize(bandLimit(voice(1.2, 11, 120), 300, 3400));
        const ms = delayMs(s0.route);
        // you speak; your words reach them one delay later, and their reply reaches you one more delay later
        player.play(V, { gain: 0.35 });
        player.play(V, { gain: 0.25, at: V.length / 22050 + (2 * ms) / 1000 });
      },
      update(dt, s) {
        dt = Math.max(0, dt); t += dt; s0 = s;
        player.sync();
        const narrow = fitNarrow(stage, [], -0.2);
        reelBoards([[routeB, [1.4, 5.2, -1.2], 0.9, 0], [frameB, [-0.2, 6.9, -1.0], 0.72]], narrow);
        const n = Math.round(s.calls), R = s.route;
        trunkCopper.visible = R === 'town'; trunkFibre.visible = R === 'dm'; cableUnder.visible = sea.visible = R === 'lon';
        sat.visible = upBeam.visible = downBeam.visible = R === 'sat';
        // slots move along the trunk (shown about a million times slower): framing word, then calls 1…n
        const per = n + 1, speed = 0.9;
        for (let i = 0; i < NS; i++) {
          const u = ((i / NS) + t * speed * 0.12) % 1;
          const k = i % per;
          const p = PATHS[R === 'lon' ? 'lon' : R === 'sat' ? 'sat' : 'line'].at(u, tmpV).toArray();
          slots.place(i, p, null, 1);
          col.setHex(k === 0 ? 0xffffff : CALL_COLS[(k - 1) % 8]);
          slots.setColorAt(i, col);
        }
        slots.done(); if (slots.instanceColor) slots.instanceColor.needsUpdate = true;
        // voice samples flowing in on the active lines
        for (let i = 0; i < 8; i++) {
          const on = i < n;
          fanIn[i].visible = fanOut[i].visible = dotsIn[i].visible = dotsOut[i].visible = on;
          const q = (t * 0.6 + i * 0.13) % 1, y = TY + 0.7 - i * 0.2;
          dotsIn[i].position.set(-5.8 + q * (X0 - 1.0 + 5.8), 0.3 + i * 0.36 + (y - 0.3 - i * 0.36) * q, 0.4 - 0.4 * q);
          dotsOut[i].position.set(X1 + 1.0 + q * (5.8 - X1 - 1.0), y + (0.3 + i * 0.36 - y) * q, 0.4 * q);
        }
        meter.material.color.setHex(Math.sin(t * 3) > 0 ? 0xff5a5a : 0xaa3030);
        const key = `${n}|${R}`;
        if (key !== lastKey) { lastKey = key; routeB.redraw(); frameB.redraw(); }
      },
      readout(s) {
        const R = ROUTES[s.route], ms = delayMs(s.route), n = Math.round(s.calls);
        return `<div class="big">${R.name}: ${ms < 1 ? ms.toFixed(2) : ms.toFixed(0)} ms one way</div>
          <div class="row"><span>Path</span><b>${R.km.toLocaleString('en-IN')} km</b></div>
          <div class="row"><span>Round trip</span><b>${(2 * ms).toFixed(ms < 1 ? 2 : 0)} ms</b></div>
          <div class="row"><span>${n} call${n > 1 ? 's' : ''} on the trunk</span><b>${(n * 64).toLocaleString('en')} kbit/s</b></div>
          ${ms > 150 ? '<div class="no">Over 150 ms: people talk over each other.</div>' : '<div class="ok">Under 150 ms: feels like a normal chat.</div>'}`;
      },
      dispose() { player.stopAll(); },
    };
    stage.label('Multiplexer', [X0 - 0.5, TY + 1.05, 0], root, 'hot');
    stage.label('Demultiplexer', [X1 + 0.5, TY + 1.05, 0], root);
    stage.label('STD/ISD booth', [-5.4, 3.2, -2.2], root);
    return inst;
  },
};
function normalize(a) { let m = 0; for (const v of a) m = Math.max(m, Math.abs(v)); if (m) for (let i = 0; i < a.length; i++) a[i] *= 0.8 / m; return a; }
