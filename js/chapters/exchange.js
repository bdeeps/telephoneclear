// Chapter 4: the exchange. Four ways to connect two lines, and the ring that tells the other phone.
// - Manual switchboards: the first commercial exchange opened in New Haven, Connecticut, in January 1878
//   (George W. Coy). An operator answered a lamp, plugged in a cord and asked "Number, please?".
// - Strowger step-by-step: patented by Almon Strowger on 10 March 1891; first used in La Porte, Indiana,
//   on 3 November 1892. Each dial pulse kicks a magnet that lifts the wiper one level (first digit), then
//   another magnet turns it one contact per pulse (second digit). 10 levels × 10 contacts = 100 lines.
// - Crossbar: Betulander's design in service in Sweden from 1926; the US No. 1 crossbar from 1938. A
//   "marker" stores the digits, then one horizontal and one vertical bar move to close a single crosspoint.
// - Digital: the first fully digital local exchanges (Alcatel E10) served customers in Brittany, France, from
//   1972; India's C-DOT built its own digital exchanges from the mid-1980s. Voice arrives as 8-bit samples,
//   8,000 frames a second (125 µs), and the switch copies each call's time slot to the other line's slot.
// - Ringing: about 75 V rms at 25 Hz on top of 48 V DC, in the double-ring cadence 0.4 on, 0.2 off, 0.4 on,
//   2 off (India, UK); North America uses about 90 V, 20 Hz, 2 s on, 4 s off. (phone.js)
// Sources: Telephone exchange, Crossbar switch, Almon Strowger, Ringing signal (Wikipedia).
import { THREE, M, box, clamp, approach, smooth, swarm } from '../kit.js';
import {
  makeDeskPhone, LINE, CADENCE, ringOn, bells, click, dtmf, dtmfOf, pulsesOf, phoneV, player, board, panelBg,
  title, text, COL, HEX, fitNarrow, reelBoards, stick, wire, beam, sphere, D2R,
} from '../phone.js';

const ERAS = {
  operator: { name: 'Operator', year: '1878', what: 'A person plugs a cord into your jack and the other line.' },
  strowger: { name: 'Step-by-step', year: '1892', what: 'Each pulse kicks a magnet: up one level, then round one contact.' },
  crossbar: { name: 'Crossbar', year: '1926', what: 'A marker stores the digits, then two bars close one crosspoint.' },
  digital: { name: 'Digital', year: '1972', what: 'A chip copies your voice samples into the other line’s time slot.' },
};
const NUMBERS = ['25', '47', '63', '90'];
const LEVEL = 0.26, R_BANK = 1.3, BANK_Y = 1.2, SHAFT_Z = 0.35;
const theta = (k) => (150 - (k - 1) * (120 / 9)) * D2R;     // contact k (1…10) on the arc
const HOME = 168 * D2R;

export default {
  id: 'exchange',
  short: 'The exchange',
  title: 'The exchange connects the call',
  subtitle: 'Operators with plugs, then switches that step with every pulse, then chips.',
  view: { pos: [0.8, 4.4, 11.8], target: [0, 2.3, 0] },
  learn: `<p>Every phone line in a town runs to a building called the <b>exchange</b>. Its job is to join your pair of wires to the pair of the person you are calling, and then to <b>ring</b> their phone.</p>
    <p>The first exchanges were <b>manual switchboards</b>, from 1878. Lifting your handset lit a lamp. An <b>operator</b> plugged a cord into your jack, asked "Number, please?", and plugged the other end into the jack of the line you wanted. Thousands of young women did this job, in Mumbai and Kolkata as in Boston.</p>
    <p>In 1891 an undertaker called <b>Almon Strowger</b> patented a switch that needed no operator. In his <b>step-by-step</b> switch, each pulse from your dial kicks an electromagnet. Dial 4 and the wiper climbs 4 levels. Dial 7 and it turns round 7 contacts. It lands on line 47. Bigger towns chained these selectors, one per digit.</p>
    <p>Later <b>crossbar</b> switches stored the whole number first and then closed one crosspoint in a grid of bars. Today's exchanges are <b>digital</b>: your voice arrives as numbers (next chapter), and a chip simply copies them into the other line's time slot, 8,000 times a second. Whatever the switch, the called line gets a ringing current, about 75 volts at 25 hertz in India, in a <b>ring-ring… ring-ring</b> rhythm.</p>
    <p class="tip"><b>Try it:</b> pick an era and press "Place the call". Watch the Strowger wiper climb and turn with each pulse. Then compare the Indian double ring with the long North American ring.</p>`,
  terms: [
    { t: 'Exchange', d: 'The building where every line in an area meets and calls are switched.' },
    { t: 'Switchboard', d: 'A panel of jacks where an operator connected calls with plug-in cords.' },
    { t: 'Strowger switch', d: 'An electromechanical switch that steps up and round, one step per dial pulse.' },
    { t: 'Crossbar switch', d: 'A grid of horizontal and vertical bars that connects any input to any output at one crosspoint.' },
    { t: 'Ringing current', d: 'A high AC voltage the exchange sends to make the other phone’s bells ring.' },
    { t: 'Cadence', d: 'The on-off rhythm of the ringing, different from country to country.' },
  ],
  defaults: { era: 'strowger', to: '47', cad: 'in' },
  controls: [
    { key: 'era', type: 'seg', label: 'Exchange', options: Object.entries(ERAS).map(([v, e]) => ({ v, label: e.name })), fmt: (v) => ERAS[v].what },
    { key: 'to', type: 'seg', label: 'Number to call', options: NUMBERS.map((n) => ({ v: n, label: n })) },
    { key: 'cad', type: 'seg', label: 'Ring rhythm', options: Object.entries(CADENCE).map(([v, c]) => ({ v, label: c.name })) },
    { key: 'go', type: 'buttons', label: 'Call', items: [
      { label: 'Place the call', act: (s, inst) => inst.call?.(false, s) },
      { label: 'Hang up', act: (s, inst) => inst.hangup?.() },
    ] },
  ],
  quiz: [
    { q: 'On a Strowger switch you dial 4 then 7. What does the wiper do?', options: ['It turns 47 steps', 'It climbs 4 levels, then turns round 7 contacts', 'It climbs 7 levels, then turns 4', 'Nothing, an operator connects it'], answer: 1, why: 'The first digit’s pulses step it up; the second digit’s pulses step it round. It lands on line 47.' },
    { q: 'What did the first telephone exchanges use to connect calls?', options: ['Computer chips', 'Operators with plug-in cords', 'Radio waves', 'Crossbar grids'], answer: 1, why: 'From 1878, operators answered a lamp and joined two lines with a cord and two plugs.' },
    { q: 'What makes the called phone ring?', options: ['The caller’s voice', 'A ringing current of about 75 V AC from the exchange', 'A battery inside the phone', 'The internet'], answer: 1, why: 'The exchange sends an alternating voltage down the line, which swings the clapper between the bells.' },
  ],
  reel: [
    { ms: 5600, caption: 'In 1892 the Strowger switch replaced operators: each dial pulse steps a wiper up, then round.', set: { era: 'strowger', to: '47', cad: 'in' }, act: (s, inst) => inst.call(false, s), anim: {}, spin: 0, view: { pos: [2.2, 4.0, 7.4], target: [0, 2.4, -0.3] } },
    { ms: 5000, caption: 'Then the exchange rings the other phone: about 75 volts at 25 hertz, ring-ring, ring-ring.', set: { era: 'digital', to: '47', cad: 'in' }, act: (s, inst) => inst.call(true, s), anim: {}, spin: 0, view: { pos: [2.6, 4.2, 10.4], target: [2.4, 2.4, 0] } },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    // ---------------------------------------------------------------- the two phones and their lines
    const A = makeDeskPhone(), B = makeDeskPhone({ body: 0x3a4a5c });
    A.group.scale.setScalar(0.6); A.group.position.set(-5.3, 0, 1.4); A.group.rotation.y = 0.5; root.add(A.group);
    B.group.scale.setScalar(0.6); B.group.position.set(5.3, 0, 1.4); B.group.rotation.y = -0.5; root.add(B.group);
    A.cords.visible = B.cords.visible = false;
    const cu = M.plastic(HEX.copper, { metalness: 0.5, roughness: 0.4 });
    root.add(wire([[-5.0, 0.08, 0.5], [-4.2, 0.08, 0.1], [-3.2, 0.08, 0.0]], cu, 0.03), wire([[5.0, 0.08, 0.5], [4.2, 0.08, 0.1], [3.2, 0.08, 0.0]], cu, 0.03));
    // ---------------------------------------------------------------- era 1: manual switchboard
    const op = new THREE.Group(); root.add(op);
    const panel = box(4.4, 2.9, 0.3, M.plastic(0x5b3a26, { roughness: 0.6 })); panel.position.set(0, 2.55, -0.55); op.add(panel);
    const shelf = box(4.4, 0.14, 1.1, M.plastic(0x6b4630, { roughness: 0.6 })); shelf.position.set(0, 1.1, 0.25); op.add(shelf);
    const legs = [-2, 2].map((x) => { const l = box(0.14, 1.1, 0.9, M.plastic(0x4a2f1f)); l.position.set(x, 0.55, 0.2); op.add(l); return l; });
    const jackPos = (r, c) => [-1.75 + c * 0.5, 3.6 - r * 0.46, -0.38];
    const jackMat = M.matte(0x111111), lampOff = M.plastic(0x5a4a3a);
    const lamps = {};
    for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++) {
      const [x, y, z] = jackPos(r, c);
      const j = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 14), jackMat); j.rotation.x = Math.PI / 2; j.position.set(x, y, z); op.add(j);
      const lm = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), lampOff.clone()); lm.position.set(x, y + 0.17, z); op.add(lm); lamps[r + ',' + c] = lm;
    }
    const CALLER_JACK = [4, 0];
    const calleeJack = (num) => [(+num[0]) % 5, 2 + (pulsesOf(num[1]) % 6)];
    const plugMat = M.metal(0xd9b36c), cordMat = M.matte(0xc0443a);
    const makePlug = () => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.3, 12), M.plastic(0xf2eee4)); g.add(b); const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.16, 10), plugMat); tip.position.y = 0.2; g.add(tip); op.add(g); return g; };
    const plugs = [makePlug(), makePlug()];
    const cordSegs = [0, 1].map(() => [stick(0.035, cordMat), stick(0.035, cordMat)]); cordSegs.flat().forEach((c) => op.add(c));
    const rest = [[-0.3, 1.33, 0.6], [0.3, 1.33, 0.6]];
    const operator = new THREE.Group(); operator.position.set(2.7, 0, 1.9); operator.rotation.y = -2.6; op.add(operator);
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.7, 6, 14), M.matte(0x7a5cc4)); torso.position.y = 1.35; operator.add(torso);
    const head = sphere(0.26, M.matte(0x8d5a3b)); head.position.y = 2.2; operator.add(head);
    const hair = sphere(0.27, M.matte(0x1d1410)); hair.scale.set(1, 0.7, 1); hair.position.set(0, 2.28, 0.04); operator.add(hair);
    const headset = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.025, 6, 24, Math.PI), M.matte(0x222222)); headset.position.y = 2.2; headset.rotation.y = Math.PI / 2; operator.add(headset);
    const stool = box(0.7, 0.8, 0.7, M.matte(0x3a3f4b)); stool.position.y = 0.4; operator.add(stool);
    // ---------------------------------------------------------------- era 2: Strowger two-motion selector
    const st = new THREE.Group(); root.add(st);
    const bank = swarm(100, new THREE.BoxGeometry(0.12, 0.05, 0.08), M.metal(0xd9b36c));
    const bankPos = (l, k) => [Math.cos(theta(k)) * R_BANK, BANK_Y + (l - 1) * LEVEL, SHAFT_Z - Math.sin(theta(k)) * R_BANK];
    for (let l = 1; l <= 10; l++) for (let k = 1; k <= 10; k++) bank.place((l - 1) * 10 + (k - 1), bankPos(l, k), [0, theta(k), 0]);
    bank.done(); st.add(bank);
    const bankFrame = [-1, 1].map((sgn) => { const p = beam([Math.cos(sgn > 0 ? 30 * D2R : 150 * D2R) * (R_BANK + 0.15), 0.4, SHAFT_Z - Math.sin(30 * D2R) * (R_BANK + 0.15)], [Math.cos(sgn > 0 ? 30 * D2R : 150 * D2R) * (R_BANK + 0.15), BANK_Y + 9 * LEVEL + 0.2, SHAFT_Z - Math.sin(30 * D2R) * (R_BANK + 0.15)], 0.05, M.metal(0x6b7280)); st.add(p); return p; });
    const lit = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), M.glow(HEX.good)); st.add(lit);
    const shaft = new THREE.Group(); shaft.position.set(0, 0, SHAFT_Z); st.add(shaft);
    const rodMesh = beam([0, 0.3, 0], [0, 4.0, 0], 0.06, M.metal(0xb9bec8)); shaft.add(rodMesh);
    for (let i = 0; i < 12; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.018, 6, 16), M.metal(0x9aa3b2)); t.rotation.x = Math.PI / 2; t.position.y = 0.45 + i * LEVEL; shaft.add(t); }
    const wiper = new THREE.Group(); wiper.position.y = BANK_Y - LEVEL; shaft.add(wiper);
    wiper.add(beam([0, 0, 0], [R_BANK - 0.08, 0, 0], 0.035, M.metal(0xe0c080)));
    const wtip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), M.metal(0xffffff)); wtip.position.x = R_BANK - 0.08; wiper.add(wtip);
    const mkMagnet = (x, label) => {
      const g = new THREE.Group(); g.position.set(x, 0, 1.0); st.add(g);
      const yoke = box(0.5, 0.12, 0.4, M.metal(0x6b7280)); yoke.position.y = 0.2; g.add(yoke);
      const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.45, 20), cu); coil.position.y = 0.5; g.add(coil);
      const halo = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12), M.glow(HEX.current, { transparent: true, opacity: 0 })); halo.position.y = 0.5; g.add(halo);
      return { g, halo, label };
    };
    const vMag = mkMagnet(-0.75, 'Vertical magnet'), rMag = mkMagnet(0.75, 'Rotary magnet');
    // ---------------------------------------------------------------- era 3: crossbar
    const xb = new THREE.Group(); root.add(xb);
    const xbFrame = box(3.9, 3.0, 0.1, M.plastic(0x2b2f38)); xbFrame.position.set(0, 2.45, -0.35); xb.add(xbFrame);
    const hY = (i) => 1.25 + i * 0.26, vX = (j) => -1.55 + j * 0.345;
    const hBars = Array.from({ length: 10 }, (_, i) => { const b = beam([-1.8, hY(i), 0.05], [1.8, hY(i), 0.05], 0.03, M.metal(0xb9bec8)); xb.add(b); return b; });
    const vBars = Array.from({ length: 10 }, (_, j) => { const b = beam([vX(j), 1.05, 0.2], [vX(j), 3.75, 0.2], 0.035, M.metal(0xd9b36c)); xb.add(b); return b; });
    const dots = swarm(100, new THREE.SphereGeometry(0.035, 8, 6), M.metal(0x6b7280));
    for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) dots.place(i * 10 + j, [vX(j), hY(i), -0.2]);
    dots.done(); xb.add(dots);
    const xLit = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), M.glow(HEX.good)); xb.add(xLit);
    const marker = box(0.9, 0.7, 0.6, M.plastic(0x3b6fd8)); marker.position.set(2.55, 0.45, 0.4); xb.add(marker);
    // ---------------------------------------------------------------- era 4: digital time-slot interchange
    const dg = new THREE.Group(); root.add(dg);
    const chip = box(2.4, 2.0, 0.22, M.plastic(0x1b1e25, { roughness: 0.3 })); chip.position.set(0, 2.4, 0); dg.add(chip);
    for (let i = 0; i < 10; i++) for (const sy of [-1, 1]) { const p = box(0.08, 0.2, 0.05, M.metal()); p.position.set(-1.05 + i * 0.233, 2.4 + sy * 1.08, 0); dg.add(p); }
    const cells = swarm(32, new THREE.BoxGeometry(0.2, 0.24, 0.06), M.plastic(0x3a3f4b));
    const cellPos = (n) => [-0.91 + (n % 8) * 0.26, 2.95 - Math.floor(n / 8) * 0.36, 0.14];
    for (let n = 0; n < 32; n++) cells.place(n, cellPos(n));
    cells.done(); dg.add(cells);
    const cellA = box(0.2, 0.24, 0.07, M.glow(HEX.voice)); dg.add(cellA);
    const slotsIn = swarm(32, new THREE.BoxGeometry(0.16, 0.24, 0.16), M.plastic(0x5b6b80)), slotsOut = swarm(32, new THREE.BoxGeometry(0.16, 0.24, 0.16), M.plastic(0x5b6b80));
    dg.add(slotsIn, slotsOut);
    const slotA = box(0.17, 0.25, 0.17, M.glow(HEX.voice)), slotB = box(0.17, 0.25, 0.17, M.glow(HEX.voice)); dg.add(slotA, slotB);
    const IN_SLOT = 5;
    const outSlot = (num) => 8 + (+num % 24);
    // ---------------------------------------------------------------- labels
    const Ls = {
      a: stage.label('Your phone', [-5.3, 1.3, 1.4], root),
      b: stage.label('Their phone', [5.3, 1.3, 1.4], root),
      op1: stage.label('Jacks, one per line', [0, 4.25, -0.4], op),
      op2: stage.label('Operator', [2.7, 2.8, 1.9], op, 'hot'),
      st1: stage.label('Bank: 10 levels × 10 lines', [-1.5, 3.9, -0.4], st),
      st2: stage.label('Wiper', [0, 0, 0], wiper, 'hot'),
      st3: stage.label('Up magnet', [-1.2, 0.75, 1.0], st),
      st4: stage.label('Round magnet', [1.3, 0.75, 1.0], st),
      xb1: stage.label('Crosspoint', [0, 0, 0.1], xLit, 'hot'),
      xb2: stage.label('Marker stores the digits', [2.55, 1.1, 0.4], xb),
      dg1: stage.label('Your time slot', [0, 0.3, 0], slotA, 'hot'),
      dg2: stage.label('Copied into their slot', [0, -0.3, 0], slotB),
      dg3: stage.label('Switching chip: 8,000 frames a second', [0, 1.1, 0.2], dg),
    };
    // ---------------------------------------------------------------- the line-voltage board
    let s0 = null, t = 0;
    const hist = [];                                          // [time, state] where state: 'idle' | 'ring' | 'talk'
    const volts = board(root, 4.4, 1.18, 1080, 290, (g, w, h) => {
      panelBg(g, w, h);
      const cad = s0?.cad || 'in', Vr = LINE.ringV[cad], Hz = LINE.ringHz[cad];
      title(g, 'Voltage on their line', `${LINE.battery} V DC; ringing adds about ${Vr} V at ${Hz} Hz (${CADENCE[cad].name})`);
      const x0 = 80, y0 = 76, pw = w - 110, ph = 170, span = 6, vmax = 170;
      const X = (tt) => x0 + ((tt - (t - span)) / span) * pw, Y = (v) => y0 + ph / 2 - (v / vmax) * (ph / 2);
      g.strokeStyle = COL.grid; g.lineWidth = 1;
      for (const v of [-150, -48, 0, 100]) { g.beginPath(); g.moveTo(x0, Y(v)); g.lineTo(x0 + pw, Y(v)); g.stroke(); text(g, v + ' V', 8, Y(v) + 5, { font: '14px sans-serif', col: 'rgba(255,255,255,.45)' }); }
      const stateAt = (tt) => { let sN = 'idle'; for (const [a, b] of hist) if (a <= tt) sN = b; return sN; };
      const pk = Vr * Math.SQRT2;
      for (let px = 0; px <= pw; px += 2) {
        const tt = t - span + (px / pw) * span, sN = stateAt(tt);
        if (sN === 'ring' && ringOn(tt - ringStart, cad)) { g.fillStyle = 'rgba(255,122,89,.75)'; g.fillRect(x0 + px, Y(-48 + pk), 2, Y(-48 - pk) - Y(-48 + pk)); }
        else { const v = sN === 'talk' ? -phoneV(2) : -48; g.fillStyle = sN === 'talk' ? COL.good : COL.current; g.fillRect(x0 + px, Y(v) - 1.5, 2, 3); }
      }
      text(g, 'now', x0 + pw - 30, y0 + ph + 20, { font: '14px sans-serif', col: 'rgba(255,255,255,.5)' });
      text(g, '6 s ago', x0, y0 + ph + 20, { font: '14px sans-serif', col: 'rgba(255,255,255,.5)' });
    }, [3.3, 4.7, -0.8]);

    // ---------------------------------------------------------------- the call
    let call = null, ringStart = 0, ringSnd = {}, clickSnd = null;
    const setState = (x) => { if (!hist.length || hist[hist.length - 1][1] !== x) hist.push([t, x]); };
    const pulseTimes = (d, t0) => Array.from({ length: pulsesOf(d) }, (_, i) => t0 + i * 0.1);
    const plan = (num, era, skip, S) => {
      const d1 = num[0], d2 = num[1], n1 = pulsesOf(d1), n2 = pulsesOf(d2);
      const c = { num, era, t0: t, lift: 0.4 };
      if (era === 'operator') { c.route = 4.4; }
      else if (era === 'digital') { c.route = 0.5 + 0.25 * 2 + 0.3; }
      else { c.p1 = pulseTimes(d1, 0.8); c.p2 = pulseTimes(d2, 0.8 + n1 * 0.1 + 0.7); c.route = 0.8 + (n1 + n2) * 0.1 + 0.7 + (era === 'crossbar' ? 0.9 : 0.4); }
      c.ringFor = CADENCE[S.cad].parts.reduce((a, b) => a + b, 0) + 1.0;       // one full cycle, then the first ring again
      if (skip) c.t0 = t - c.route - 0.05;
      return c;
    };
    const inst = {
      call(skip = false, S = s0) { if (!S) return; s0 = S; player.stopAll(); call = plan(S.to, S.era, skip, S); setState('idle'); },
      hangup() { call = null; player.stopAll(); setState('idle'); },
      update(dt, s) {
        dt = Math.max(0, dt); t += dt; s0 = s;
        player.sync();
        const narrow = fitNarrow(stage, [Ls.op1, Ls.st1, Ls.st3, Ls.st4, Ls.xb2, Ls.dg3], -0.2);
        reelBoards([[volts, [0, 5.6, -0.8], 1.0]], narrow);
        op.visible = s.era === 'operator'; st.visible = s.era === 'strowger'; xb.visible = s.era === 'crossbar'; dg.visible = s.era === 'digital';
        if (call && call.era !== s.era) call = null;
        const e = call ? t - call.t0 : -1;
        const route = call ? call.route : 0, ringEnd = call ? call.route + call.ringFor : 0;
        // caller: lifts at once and holds the handset; the callee answers after the ring
        A.setLift(smooth(call ? e / call.lift : 0));
        const answered = call && e > ringEnd;
        B.setLift(answered ? smooth((e - ringEnd) / 0.5) : 0);
        const ringing = call && e > route && e <= ringEnd;
        if (ringing && !call.rang) { call.rang = true; ringStart = call.t0 + route; const key = s.cad; ringSnd[key] ||= bells(CADENCE[key].parts.reduce((a, b) => a + b, 0), key, LINE.ringHz[key]); player.play(ringSnd[key], { gain: 0.45, loop: true }); }
        if (call && call.rang && !ringing && !call.stopped) { call.stopped = true; player.stopAll(); }
        setState(!call ? 'idle' : answered ? 'talk' : ringing ? 'ring' : 'idle');
        const ringOnNow = ringing && ringOn(t - ringStart, s.cad);
        B.setClapper(ringOnNow ? Math.sin(t * TAU5) : 0);
        if (ringOnNow) B.handset.position.y += 0.02 * Math.sin(t * 90);
        A.updateCord(); B.updateCord();
        // caller's dial turns during pulse eras
        let pulsesDone1 = 0, pulsesDone2 = 0, pulseNow = null;
        if (call && call.p1) {
          pulsesDone1 = call.p1.filter((x) => e >= x).length; pulsesDone2 = call.p2.filter((x) => e >= x).length;
          for (const x of [...call.p1, ...call.p2]) if (e >= x && e < x + 0.06) pulseNow = call.p1.includes(x) ? 'v' : 'r';
          if (pulseNow && call.lastPulse !== Math.floor(e * 10)) { call.lastPulse = Math.floor(e * 10); clickSnd ||= click(5); player.play(clickSnd, { gain: 0.35 }); }
          // the dial is wound before each digit and unwinds one step per pulse
          const in1 = e > call.p1[0] - 0.4 && e < call.p1.at(-1) + 0.1, in2 = e > call.p2[0] - 0.4 && e < call.p2.at(-1) + 0.1;
          const left = in1 ? call.p1.length - pulsesDone1 : in2 ? call.p2.length - pulsesDone2 : 0;
          A.dial.setTurn(left * 30 * D2R);
        } else A.dial.setTurn(0);
        if (call && call.era === 'digital' && !call.toned && e > 0.5) { call.toned = true; const f1 = dtmfOf(call.num[0]), f2 = dtmfOf(call.num[1]); player.play(dtmf(f1[0], f1[1], 0.15), { gain: 0.3 }); player.play(dtmf(f2[0], f2[1], 0.15), { gain: 0.3, at: 0.25 }); }
        const num = call ? call.num : s.to;
        // --- operator
        if (op.visible) {
          const [cr, cc] = CALLER_JACK, [tr, tc] = calleeJack(num);
          Object.entries(lamps).forEach(([k, m]) => m.material.color.setHex(0x5a4a3a));
          if (call && e > 0.3 && e < 1.6) lamps[cr + ',' + cc].material.color.setHex(0xffd166);
          if (ringing) lamps[tr + ',' + tc].material.color.setHex(ringOnNow ? 0xff7a59 : 0x7a3a2a);
          const kA = call ? smooth((e - 0.8) / 0.9) : 0, kB = call ? smooth((e - 2.9) / 1.1) : 0;
          [[plugs[0], kA, jackPos(cr, cc), rest[0], cordSegs[0]], [plugs[1], kB, jackPos(tr, tc), rest[1], cordSegs[1]]].forEach(([p, k, j, r0, segs]) => {
            const tgt = [j[0], j[1], j[2] + 0.28];
            const hop = Math.sin(Math.PI * k) * 0.5;
            const pos = [r0[0] + (tgt[0] - r0[0]) * k, r0[1] + (tgt[1] - r0[1]) * k + hop, r0[2] + (tgt[2] - r0[2]) * k];
            p.position.set(...pos); p.rotation.set(k * -Math.PI / 2, 0, 0);
            const hole = [r0[0], 1.18, r0[2] - 0.1], mid = [(hole[0] + pos[0]) / 2, Math.min(hole[1], pos[1]) - 0.35 * k, (hole[2] + pos[2]) / 2 + 0.3 * k];
            segs[0].between(hole, mid); segs[1].between(mid, [pos[0], pos[1] - (1 - k) * 0.14, pos[2] + k * 0.14]);
          });
          Ls.op2.element.textContent = call && e > 1.6 && e < 2.9 ? 'Operator: "Number, please?"' : 'Operator';
        }
        // --- Strowger
        if (st.visible) {
          const lv = call && call.p1 ? pulsesDone1 : 0, rk = call && call.p2 ? pulsesDone2 : 0;
          const released = !call;
          shaft.position.y = approach(shaft.position.y, released ? 0 : lv * LEVEL, 30, dt);
          const th = rk ? theta(rk) : HOME;
          wiper.rotation.y = approach(wiper.rotation.y, released ? HOME : th, 30, dt);
          vMag.halo.material.opacity = pulseNow === 'v' ? 0.6 : 0; rMag.halo.material.opacity = pulseNow === 'r' ? 0.6 : 0;
          const got = call && e > route - 0.3;
          lit.visible = !!got;
          if (got) { const [l, k] = [pulsesOf(num[0]), pulsesOf(num[1])]; lit.position.set(...bankPos(l, k)); }
          Ls.st2.element.textContent = call && call.p1 ? `Wiper: level ${lv}, contact ${rk}` : 'Wiper';
        }
        // --- crossbar
        if (xb.visible) {
          const i = pulsesOf(num[0]) - 1, j = pulsesOf(num[1]) - 1;
          const kSel = call ? smooth((e - (route - 0.9)) / 0.3) : 0, kHold = call ? smooth((e - (route - 0.55)) / 0.3) : 0;
          hBars.forEach((b, n) => { b.position.z = n === i ? 0.12 * kSel : 0; b.material = n === i && kSel > 0.5 ? mHot : mBar; });
          vBars.forEach((b, n) => { b.position.z = n === j ? -0.1 * kHold : 0; b.material = n === j && kHold > 0.5 ? mHot : mBarV; });
          xLit.visible = kHold > 0.9; xLit.position.set(vX(j), hY(i), -0.15);
          Ls.xb2.element.textContent = call ? `Marker stores: ${pulsesOf(num[0]) > 0 && e > (call.p1?.at(-1) ?? 0) ? num[0] : '…'} ${e > (call.p2?.at(-1) ?? 99) ? num[1] : '…'}` : 'Marker stores the digits';
        }
        // --- digital: frames stream in at the top and out at the bottom, slowed about 20,000 times
        if (dg.visible) {
          const connected = call && e > route - 0.2;
          const shift = (t * 0.9) % 1, W = 0.26;
          const o = outSlot(num);
          for (let n = 0; n < 32; n++) {
            const xi = -4.2 + ((n + shift) % 32) * W, xo = -4.2 + ((n + shift) % 32) * W;
            slotsIn.place(n, [xi, 3.75, 0.1], null, n === IN_SLOT && connected ? 0.001 : 1);
            slotsOut.place(n, [xo, 0.75, 0.1], null, n === o && connected ? 0.001 : 1);
            if (n === IN_SLOT) slotA.position.set(xi, 3.75, 0.1);
            if (n === o) slotB.position.set(xo, 0.75, 0.1);
          }
          slotsIn.done(); slotsOut.done();
          slotA.visible = slotB.visible = !!connected; cellA.visible = !!connected;
          cellA.position.set(...cellPos(IN_SLOT)); cellA.position.z = 0.16;
          Ls.dg2.element.textContent = `Copied into their slot, no. ${o}`;
        }
        volts.redraw();
      },
      readout(s) {
        const E = ERAS[s.era], cad = CADENCE[s.cad];
        const d1 = pulsesOf(s.to[0]), d2 = pulsesOf(s.to[1]);
        const how = s.era === 'strowger' ? `<div class="row"><span>Dial ${s.to[0]}</span><b>${d1} steps up</b></div><div class="row"><span>Dial ${s.to[1]}</span><b>${d2} steps round</b></div>`
          : s.era === 'crossbar' ? `<div class="row"><span>Crosspoint</span><b>row ${d1}, column ${d2}</b></div>`
          : s.era === 'digital' ? `<div class="row"><span>Voice samples</span><b>8,000 a second</b></div>`
          : `<div class="row"><span>Cords</span><b>two plugs, one per line</b></div>`;
        const ph = !call ? 'Ready' : (t - call.t0) > call.route + call.ringFor ? 'Connected: talk!' : (t - call.t0) > call.route ? 'Ringing…' : 'Switching…';
        return `<div class="big">${E.name} (from ${E.year}): ${ph}</div>${how}
          <div class="row"><span>Ringing</span><b>${LINE.ringV[s.cad]} V, ${LINE.ringHz[s.cad]} Hz</b></div>
          <div class="row"><span>Rhythm</span><b>${cad.parts.map((x) => x + ' s').join(' · ')}</b></div>`;
      },
      dispose() { player.stopAll(); },
    };
    const mBar = M.metal(0xb9bec8), mBarV = M.metal(0xd9b36c), mHot = M.glow(HEX.good);
    return inst;
  },
};
const TAU5 = (2 * Math.PI * 25) / 5;
