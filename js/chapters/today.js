// Chapter 6: the landline today. VoIP over fibre, the narrow "telephone" band, power cuts and 112.
// - Classic channel: 300–3,400 Hz (ITU-T G.712), sampled at 8 kHz, 64 kbit/s (G.711).
// - "HD voice": 50–7,000 Hz, sampled at 16 kHz, also 64 kbit/s (ITU-T G.722).
// - VoIP packet with G.711 and 20 ms per packet: 160 bytes of voice + 12 (RTP) + 8 (UDP) + 20 (IPv4) = 200 bytes,
//   50 packets a second = 80 kbit/s before the link layer.
// - Copper lines are powered from the exchange's batteries; a fibre line's box (ONT) needs mains power or a
//   battery backup at home (a common point in regulators' advice on switching landlines to fibre, e.g. Ofcom).
// - Landlines worldwide: 20 per 100 people in 2005, 11 per 100 in 2023, about 861 million lines (ITU Facts and
//   Figures 2023). India: 37.04 million wireline subscribers in March 2025, growing again with fibre (TRAI).
// - 112: India's single emergency number (Emergency Response Support System, launched 19 February 2019); also
//   the emergency number across the EU.
// - "Missing fundamental": a man's voice has its pitch near 100–150 Hz, below the 300 Hz cut, yet we still hear
//   the pitch from the spacing of its harmonics (see EarClear).
import { THREE, M, box, approach, clamp, swarm } from '../kit.js';
import {
  makeDeskPhone, voice, bandLimit, spectrum, dtmf, dtmfOf, player, board, panelBg, title, text, COL, HEX,
  fitNarrow, reelBoards, wire, pathOf, sphere, SR,
} from '../phone.js';

const BANDS = {
  full: { name: 'Full voice', lo: 0, hi: 0, note: 'everything the microphone heard' },
  pots: { name: 'Landline', lo: 300, hi: 3400, note: '300–3,400 Hz: the classic phone sound' },
  hd: { name: 'HD voice', lo: 50, hi: 7000, note: '50–7,000 Hz: wideband calls' },
};

export default {
  id: 'today',
  short: 'Landlines today',
  title: 'The landline today',
  subtitle: 'Your voice in packets over fibre, why calls sound "telephone-y", and 112.',
  view: { pos: [0.8, 5.6, 13.4], target: [0.5, 2.5, -0.6] },
  learn: `<p>Most "landlines" today are not copper all the way. In many homes the phone plugs into a small box, an <b>ONT</b>, at the end of a <b>fibre-optic</b> cable, and your voice travels as <b>VoIP</b>: voice over internet protocol. The phone still samples your voice 8,000 times a second, but now it packs 20 milliseconds of it into each <b>packet</b> and sends 50 packets a second, mixed in with web pages and videos.</p>
    <p>Why does a phone call sound <b>"telephone-y"</b>? The classic channel only carries sounds from <b>300 to 3,400 Hz</b>. That was enough to understand words, and it kept each call cheap: 8,000 samples a second can only describe sounds below 4,000 Hz. It cuts off the deep part of a voice and the hiss of <i>s</i> and <i>f</i>. Oddly, you still hear a man's low pitch, even though it is below 300 Hz: your brain works it out from the spacing of the harmonics. Newer <b>HD voice</b> calls carry 50 to 7,000 Hz and sound far more natural. The same narrow channel also carried fax machines, which turned pages into tones (see FaxClear), and the dial-up modems of the early internet.</p>
    <p>There are trade-offs. An old copper phone is powered by the exchange's batteries, so it works in a <b>power cut</b>. A fibre box needs power at home, or a <b>battery backup</b>. Landlines are fading worldwide, from 20 per 100 people in 2005 to 11 in 2023, as mobiles take over (see MobileClear). Whatever phone you have, remember <b>112</b>: it reaches police, fire and ambulance anywhere in India, and across Europe too.</p>
    <p class="tip"><b>Try it:</b> press "Hear it" on each band and watch the spectrum. Then switch to fibre and cut the power, with and without the battery backup.</p>`,
  terms: [
    { t: 'VoIP', d: 'Voice over internet protocol: phone calls sent as data packets, like any other internet traffic.' },
    { t: 'Fibre optic', d: 'A thin glass thread that carries data as flashes of light.' },
    { t: 'ONT', d: 'Optical network terminal: the box at home where the fibre ends and your phone and router plug in.' },
    { t: 'Packet', d: 'A small bundle of data with an address, here carrying 20 ms of your voice.' },
    { t: 'Voice band', d: 'The 300 to 3,400 Hz range a classic phone line carries.' },
    { t: 'HD voice', d: 'Wideband calls that carry 50 to 7,000 Hz, so voices sound fuller and clearer.' },
    { t: '112', d: 'The single emergency number in India and across Europe, for police, fire and ambulance.' },
  ],
  defaults: { line: 'fibre', band: 'pots', power: true, ups: false },
  controls: [
    { key: 'band', type: 'seg', label: 'What the call carries', options: Object.entries(BANDS).map(([v, b]) => ({ v, label: b.name })), fmt: (v) => BANDS[v].note },
    { key: 'hear', type: 'buttons', label: 'Listen', items: [
      { label: 'Hear it', act: (s, inst) => inst.listen?.() },
      { label: 'Dial 112', act: (s, inst) => inst.sos?.() },
    ] },
    { key: 'line', type: 'seg', label: 'Your line', options: [{ v: 'copper', label: 'Copper' }, { v: 'fibre', label: 'Fibre (VoIP)' }] },
    { key: 'power', type: 'toggle', label: 'Mains power on' },
    { key: 'ups', type: 'toggle', label: 'Battery backup for the fibre box' },
  ],
  quiz: [
    { q: 'Why do classic phone calls sound thin?', options: ['The wires are too long', 'They only carry about 300 to 3,400 Hz', 'The microphone is broken', 'Voices are made quieter on purpose'], answer: 1, why: 'The channel was designed for words, not music: it cuts the deep and the very high parts of the voice.' },
    { q: 'In a power cut, which phone is more likely to still work?', options: ['A fibre VoIP phone with no battery backup', 'An old copper landline phone', 'Both stop at once', 'Neither ever works'], answer: 1, why: 'The copper line is powered by batteries at the exchange. A fibre box needs power at home.' },
    { q: 'What single number reaches police, fire and ambulance in India?', options: ['100', '101', '112', '911'], answer: 2, why: 'India launched 112 as its single emergency number in 2019. It works across Europe too.' },
  ],
  reel: [
    { ms: 5000, caption: 'A classic call carries only 300 to 3,400 hertz, which is why it sounds so "telephone-y".', set: { line: 'fibre', power: true }, anim: { band: ['full', 'pots'] }, spin: 0, view: { pos: [-1.6, 4.0, 8.0], target: [-1.4, 3.0, -1.2] } },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    // ---------------------------------------------------------------- the home
    const floor = box(5.4, 0.1, 4.2, M.matte(0x5b4633)); floor.position.set(-3.1, 0.05, 0); root.add(floor);
    const wallB = box(5.4, 3.2, 0.12, M.matte(0xd9d2c3)); wallB.position.set(-3.1, 1.6, -2.1); root.add(wallB);
    const wallL = box(0.12, 3.2, 4.2, M.matte(0xcfc7b6)); wallL.position.set(-5.8, 1.6, 0); root.add(wallL);
    const desk = box(1.8, 0.08, 1.0, M.matte(0x8a6a4a)); desk.position.set(-3.6, 0.85, -0.6); root.add(desk);
    for (const x of [-4.4, -2.8]) { const l = box(0.08, 0.8, 0.9, M.matte(0x6b5038)); l.position.set(x, 0.42, -0.6); root.add(l); }
    const old = makeDeskPhone(); old.group.scale.setScalar(0.45); old.group.position.set(-3.6, 0.89, -0.6); old.cords.visible = false; root.add(old.group);
    const cordless = new THREE.Group(); cordless.position.set(-3.6, 0.89, -0.6); root.add(cordless);
    const cBase = box(0.7, 0.12, 0.55, M.plastic(0x2b2f38)); cBase.position.y = 0.06; cordless.add(cBase);
    const cHand = box(0.2, 0.75, 0.1, M.plastic(0x3a3f4b)); cHand.position.set(0, 0.45, -0.1); cHand.rotation.x = -0.25; cordless.add(cHand);
    const cScreen = box(0.15, 0.16, 0.02, M.glow(0x8ef0ff)); cScreen.position.set(0, 0.62, -0.03); cScreen.rotation.x = -0.25; cordless.add(cScreen);
    const ont = box(0.7, 0.5, 0.18, M.plastic(0xf2eee4)); ont.position.set(-2.0, 1.9, -1.98); root.add(ont);
    const leds = [0, 1, 2, 3].map((i) => { const l = sphere(0.035, M.glow(HEX.good)); l.position.set(-2.22 + i * 0.15, 1.75, -1.88); root.add(l); return l; });
    const ups = box(0.45, 0.35, 0.3, M.plastic(0x1b1e25)); ups.position.set(-1.4, 0.3, -1.8); root.add(ups);
    const upsLed = sphere(0.035, M.glow(0xffd166)); upsLed.position.set(-1.4, 0.4, -1.64); root.add(upsLed);
    const socket = box(0.3, 0.3, 0.06, M.plastic(0xf2eee4)); socket.position.set(-4.6, 0.45, -2.02); root.add(socket);
    const bulb = sphere(0.14, M.glow(0xfff2c0)); bulb.position.set(-3.2, 3.0, -0.4); root.add(bulb);
    const bulbCord = box(0.02, 0.3, 0.02, M.matte(0x111111)); bulbCord.position.set(-3.2, 3.25, -0.4); root.add(bulbCord);
    root.add(wire([[-3.3, 0.95, -0.9], [-3.0, 0.9, -1.6], [-2.2, 1.2, -1.95], [-2.0, 1.65, -1.95]], M.matte(0x3a3f4b), 0.02));
    // ---------------------------------------------------------------- outside: cabinet and exchange
    const cab = box(0.9, 1.4, 0.6, M.plastic(0x4a7a5a)); cab.position.set(1.2, 0.7, -1.4); root.add(cab);
    const exch = box(2.4, 2.6, 1.8, M.plastic(0x7f8796)); exch.position.set(5.0, 1.3, -1.6); root.add(exch);
    for (let i = 0; i < 4; i++) { const w = box(0.4, 0.3, 0.02, M.glow(0xfff2c0)); w.position.set(4.2 + i * 0.55, 1.9, -0.69); root.add(w); }
    const battMat = M.plastic(0x3b6fd8);
    const batts = [0, 1, 2].map((i) => { const b = box(0.35, 0.5, 0.3, battMat); b.position.set(4.3 + i * 0.45, 0.25, -0.5); root.add(b); return b; });
    const fibrePts = [[-2.0, 1.9, -2.1], [-1.4, 1.9, -2.4], [0.2, 0.05, -2.2], [1.2, 0.05, -1.8], [1.2, 1.2, -1.75], [2.4, 0.05, -1.9], [3.8, 0.05, -1.8], [3.8, 1.0, -1.6]];
    const copperPts = [[-4.6, 0.45, -2.1], [-4.6, 0.05, -2.4], [0.2, 0.02, -2.6], [1.2, 0.02, -2.0], [1.2, 1.0, -1.7], [2.6, 0.02, -2.3], [3.8, 0.02, -2.2], [3.8, 0.6, -1.9]];
    const fibre = wire(fibrePts, M.ghost(0x8ef0ff, 0.6), 0.05), copper = wire(copperPts, M.plastic(HEX.copper, { metalness: 0.5 }), 0.04);
    root.add(fibre, copper);
    const fPath = pathOf(fibrePts), cPath = pathOf(copperPts);
    const NP = 26;
    const packets = swarm(NP, new THREE.BoxGeometry(0.14, 0.1, 0.1), M.glow(HEX.voice)); root.add(packets);
    const electrons = swarm(NP, new THREE.SphereGeometry(0.05, 8, 6), M.glow(HEX.current)); root.add(electrons);
    // ---------------------------------------------------------------- sounds and the spectrum board
    const V = voice(2.4, 8, 115);
    const bandArr = {}, bandSpec = {};
    const peak = (a) => { let m = 0; for (const v of a) m = Math.max(m, Math.abs(v)); return m; };
    for (const [k, b] of Object.entries(BANDS)) { const a = k === 'full' ? V : bandLimit(V, b.lo, b.hi); const g = 0.8 / peak(a); const n = Float32Array.from(a, (v) => v * g); bandArr[k] = n; bandSpec[k] = spectrum(a, 2048); }
    let s0 = { band: 'pots', line: 'fibre', power: true, ups: false }, t = 0, sosT = -99;
    const specB = board(root, 4.6, 2.2, 920, 440, (g, w, h) => {
      panelBg(g, w, h);
      const b = BANDS[s0.band];
      title(g, 'The voice’s spectrum', `${b.name}: ${b.note}`);
      const x0 = 60, y0 = 90, pw = w - 90, ph = 260, f0 = 50, f1 = 10000;
      const X = (f) => x0 + (Math.log(f / f0) / Math.log(f1 / f0)) * pw, Y = (d) => y0 + ph - clamp((d + 90) / 70, 0, 1) * ph;
      if (b.hi) { g.fillStyle = 'rgba(142,240,255,.1)'; g.fillRect(X(Math.max(f0, b.lo)), y0, X(b.hi) - X(Math.max(f0, b.lo)), ph); }
      g.strokeStyle = COL.grid; g.lineWidth = 1;
      for (const [f, l] of [[100, '100'], [300, '300'], [1000, '1k'], [3400, '3.4k'], [7000, '7k']]) { g.beginPath(); g.moveTo(X(f), y0); g.lineTo(X(f), y0 + ph); g.stroke(); text(g, l, X(f), y0 + ph + 22, { font: '15px sans-serif', col: 'rgba(255,255,255,.5)', align: 'center' }); }
      const draw = (sp, col, fill) => { g.beginPath(); g.moveTo(x0, y0 + ph); for (let k = 1; k < sp.length; k++) { const f = k * sp.hz; if (f < f0) continue; if (f > f1) break; g.lineTo(X(f), Y(sp[k])); } g.lineTo(x0 + pw, y0 + ph); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } g.strokeStyle = col; g.lineWidth = 2; g.stroke(); };
      draw(bandSpec.full, 'rgba(255,255,255,.35)', null);
      draw(bandSpec[s0.band], COL.voice, 'rgba(142,240,255,.28)');
      text(g, 'pitch ~115 Hz', X(115), y0 + 18, { font: '14px sans-serif', col: s0.band === 'pots' ? COL.bad : 'rgba(255,255,255,.6)', align: 'center' });
      text(g, 's, f, t hiss', X(5500), y0 + 18, { font: '14px sans-serif', col: s0.band === 'pots' ? COL.bad : 'rgba(255,255,255,.6)', align: 'center' });
      text(g, 'Hz (log scale) · grey: the full voice', x0 + pw, h - 16, { font: '14px sans-serif', col: 'rgba(255,255,255,.5)', align: 'right' });
    }, [3.3, 4.7, -2.3]);

    let lastKey = '';
    const works = (s) => s.line === 'copper' || s.power || s.ups;
    const inst = {
      listen() { player.stopAll(); player.play(bandArr[s0.band], { gain: 0.45 }); },
      sos() { sosT = t; if (!works(s0)) return; player.stopAll(); ['1', '1', '2'].forEach((k, i) => { const f = dtmfOf(k); player.play(dtmf(f[0], f[1], 0.15), { gain: 0.3, at: i * 0.25 }); }); },
      update(dt, s) {
        dt = Math.max(0, dt); t += dt; s0 = s;
        player.sync();
        const narrow = fitNarrow(stage, [], -0.2);
        reelBoards([[specB, [-0.6, 5.2, -2.3], 0.9]], narrow);
        const fibreLine = s.line === 'fibre', ok = works(s);
        old.group.visible = !fibreLine; cordless.visible = fibreLine;
        fibre.visible = ont.visible = fibreLine; copper.visible = socket.visible = !fibreLine;
        ups.visible = upsLed.visible = fibreLine && s.ups;
        upsLed.visible = ups.visible && !s.power && Math.sin(t * 6) > 0;
        leds.forEach((l, i) => { l.visible = fibreLine && (s.power || s.ups) && (i < 3 || Math.sin(t * 9 + i) > 0); });
        cScreen.visible = fibreLine && ok;
        bulb.material.color.setHex(s.power ? 0xfff2c0 : 0x333333);
        const v = new THREE.Vector3();
        for (let i = 0; i < NP; i++) {
          const u = (i / NP + t * 0.08) % 1;
          if (fibreLine && ok) { fPath.at(i % 2 ? u : 1 - u, v); packets.place(i, [v.x, v.y + 0.02, v.z]); } else packets.place(i, [0, -5, 0], null, 0.001);
          if (!fibreLine) { cPath.at(u, v); electrons.place(i, [v.x, v.y + 0.02, v.z]); } else electrons.place(i, [0, -5, 0], null, 0.001);
        }
        packets.done(); electrons.done();
        const key = s.band;
        if (key !== lastKey) { lastKey = key; specB.redraw(); }
      },
      readout(s) {
        const ok = works(s);
        const sos = t - sosT < 6;
        const band = BANDS[s.band];
        const line = s.line === 'fibre'
          ? `<div class="row"><span>Line</span><b>fibre, voice over IP</b></div><div class="row"><span>Packets</span><b>50 a second</b></div><div class="row"><span>Data rate</span><b>about 80 kbit/s</b></div>`
          : `<div class="row"><span>Line</span><b>copper pair to the exchange</b></div><div class="row"><span>Powered by</span><b>the exchange’s 48 V batteries</b></div>`;
        const pw = ok ? (s.power ? '' : `<div class="ok">Power cut, still working (${s.line === 'copper' ? 'exchange batteries' : 'battery backup'}).</div>`) : '<div class="no">Power cut: fibre box off, phone dead.</div>';
        const sosMsg = sos ? (ok ? '<div class="ok">112: police, fire and ambulance, anywhere in India.</div>' : '<div class="no">No line for 112! Use a mobile: 112 works on any mobile too.</div>') : '';
        return `<div class="big">${band.name}: ${band.hi ? `${band.lo}–${band.hi.toLocaleString('en')} Hz` : 'nothing cut'}</div>${line}${pw}${sosMsg}`;
      },
      dispose() { player.stopAll(); },
    };
    stage.label('Fibre box (ONT)', [-2.0, 2.4, -1.9], root, 'hot');
    stage.label('Street cabinet', [1.2, 1.7, -1.4], root);
    stage.label('Exchange', [5.0, 2.95, -1.6], root);
    stage.label('Exchange batteries', [4.75, 0.75, -0.5], root);
    return inst;
  },
};
