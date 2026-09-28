// Chapter 3: dialling. Rotary pulses and touch-tone pairs.
// Rotary: the dial is wound by hand and a spring turns it back at a speed held steady by a small governor,
// about 10 pulses per second. Each pulse breaks the loop for about 60 ms and makes it for 40 ms (Bell
// practice 61/39; British 66/33). Digit n sends n pulses, 0 sends ten. Between digits the exchange needs a
// pause of several hundred milliseconds (the finger's trip back is plenty). (Pulse dialing, Wikipedia.)
// Touch-tone (DTMF): each key sends one low tone (row: 697, 770, 852, 941 Hz) plus one high tone
// (column: 1209, 1336, 1477, 1633 Hz) at once (ITU-T Q.23; Bell System, first offered 18 Nov 1963).
// No key's pair is a whole-number multiple of another, so speech rarely fakes one.
import { THREE, M, box, clamp, approach } from '../kit.js';
import {
  makeDial, holeAngle, pulsesOf, loopI, DTMF_ROWS, DTMF_COLS, KEYS, dtmfOf, dtmf, click, spectrum,
  player, board, panelBg, title, text, rrect, COL, HEX, fitNarrow, reelBoards, stick, D2R, SR,
} from '../phone.js';

const BREAK = 0.06, MAKE = 0.04, PULSE = BREAK + MAKE;   // seconds
const WIND_RATE = 360 * D2R;                             // a finger winds the dial about one turn per second
const PAUSE = 0.35;                                      // finger moves to the next hole
const DIAL_X = -2.4, PAD_X = 2.9, CY = 1.75, BY = 0.5;
const I_OFF = loopI(2) * 1000;                           // mA with the handset lifted, 2 km line

export default {
  id: 'dialling',
  short: 'Dialling',
  title: 'Sending a number down two wires',
  subtitle: 'A rotary dial breaks the current in pulses. A keypad sings two notes at once.',
  view: { pos: [0.8, 3.1, 9.8], target: [0.8, 2.55, 0] },
  learn: `<p>A phone line has only two wires, and they already carry your voice. So how do you tell the exchange which number you want? The first answer was to <b>switch the current off and on</b>.</p>
    <p>Put your finger in a hole of a <b>rotary dial</b> and turn it to the metal <b>finger stop</b>. Let go, and a spring turns it back. As it returns, a cam flicks a pair of contacts open and shut, <b>breaking the loop</b> once for each step: 3 breaks for a 3, 9 for a 9 and 10 for a 0. A small <b>governor</b> keeps the speed steady at about <b>10 pulses a second</b>. The exchange simply counts the breaks. That is why a 0 took the longest to dial!</p>
    <p><b>Touch-tone</b> dialling, first offered in 1963, sends <b>sounds</b> instead. Each key plays two notes at once: a low note for its row and a high note for its column. Press 5 and you send 770 Hz and 1,336 Hz together. The exchange listens for the pair. No pair is a simple multiple of another, so ordinary speech almost never fakes one. It is called <b>DTMF</b>, dual-tone multi-frequency, and it still works today when a helpline asks you to "press 1".</p>
    <p class="tip"><b>Try it:</b> pick Rotary and dial 9, then 0, and count the pulses in the current trace. Switch to Touch-tone and press keys in the same row: the low note stays, the high note changes. Tap the dial holes or keys on the stage too.</p>`,
  terms: [
    { t: 'Pulse dialling', d: 'Sending a digit by breaking the line current that many times, about 10 times a second.' },
    { t: 'Finger stop', d: 'The metal hook on a rotary dial where your finger stops before you let go.' },
    { t: 'Governor', d: 'A little spinning brake that makes the dial return at a steady speed.' },
    { t: 'DTMF', d: 'Dual-tone multi-frequency: each key sends one low and one high tone at the same time.' },
    { t: 'Frequency', d: 'How many times a second a wave repeats, in hertz (Hz).' },
    { t: 'Spectrum', d: 'A chart of how much of each frequency a sound contains.' },
  ],
  defaults: { mode: 'rotary', last: '' },
  controls: [
    { key: 'mode', type: 'seg', label: 'Phone', options: [{ v: 'rotary', label: 'Rotary' }, { v: 'tone', label: 'Touch-tone' }] },
    { key: 'keys', type: 'buttons', label: 'Dial a digit', items: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '*', '#'].map((k) => ({ label: k, act: (s, inst) => inst.press?.(k) })) },
    { key: 'num', type: 'buttons', label: 'Dial a number', items: [
      { label: 'Emergency: 112', act: (s, inst) => inst.number?.('112') },
      { label: 'Clear', act: (s, inst) => inst.clear?.() },
    ] },
  ],
  quiz: [
    { q: 'How does a rotary phone send the digit 7?', options: ['It plays a note of 7 kHz', 'It breaks the loop current 7 times as the dial returns', 'It sends 7 volts', 'An operator listens for it'], answer: 1, why: 'The exchange counts the breaks in the current. Seven breaks means 7; ten means 0.' },
    { q: 'Touch-tone key 5 sends which pair of tones?', options: ['697 Hz and 1,209 Hz', '770 Hz and 1,336 Hz', '852 Hz and 1,477 Hz', 'One tone of 5,000 Hz'], answer: 1, why: '5 is in the second row (770 Hz) and the middle column (1,336 Hz).' },
    { q: 'Why is 0 slow to dial on a rotary phone?', options: ['It is the heaviest digit', 'It sends ten pulses, the most of any digit', 'The exchange checks it twice', 'It needs a special tone'], answer: 1, why: 'At 10 pulses a second, the ten pulses of a 0 take a full second.' },
  ],
  reel: [
    { ms: 5600, caption: 'A rotary dial counts out your number by breaking the current: 7 breaks for a 7.', set: { mode: 'rotary' }, act: (s, inst) => { inst.clear(); inst.press('7'); }, anim: {}, spin: 0, view: { pos: [-0.8, 3.0, 9.0], target: [-0.4, 2.6, 0] } },
    { ms: 5000, caption: 'Touch-tone keys send two notes at once: 5 is 770 hertz plus 1,336 hertz.', set: { mode: 'tone' }, act: (s, inst) => { inst.clear(); inst.number('159'); }, anim: {}, spin: 0, view: { pos: [2.2, 3.0, 9.0], target: [2.0, 2.6, 0] } },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    // ---------------------------------------------------------------- rotary dial on a stand, with its pulse contacts
    const dial = makeDial(1.0);
    dial.group.position.set(DIAL_X, CY, 0.12); root.add(dial.group);
    const stand = box(2.5, 2.55, 0.2, M.plastic(0xe6dcc3, { roughness: 0.35 })); stand.position.set(DIAL_X, CY - 0.18, -0.05); root.add(stand);
    const foot = box(2.5, 0.2, 1.4, M.plastic(0xe6dcc3)); foot.position.set(DIAL_X, 0.1, 0.4); root.add(foot);
    const cam = new THREE.Group(); cam.position.set(DIAL_X + 0.6, BY, 0.55); root.add(cam);
    for (let i = 0; i < 4; i++) { const lobe = box(0.36, 0.08, 0.08, M.metal(0xd6dde8)); lobe.rotation.z = (i / 4) * Math.PI; cam.add(lobe); }
    const gov = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.2, 18), M.metal(0x9aa3b2)); gov.rotation.x = Math.PI / 2; gov.position.set(DIAL_X + 1.0, BY, 0.55); root.add(gov);
    const leafMat = M.metal(0xe0c080);
    const leafA = stick(0.035, leafMat), leafB = stick(0.035, leafMat); root.add(leafA, leafB);
    const tipA = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), M.metal(0xffffff)), tipB = tipA.clone(); root.add(tipA, tipB);
    const spark = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), M.glow(HEX.current, { transparent: true, opacity: 0.8 })); root.add(spark);
    const finger = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), M.plastic(0xd9a47e)); root.add(finger);
    // ---------------------------------------------------------------- touch-tone keypad (4 × 4 including A–D)
    const pad = new THREE.Group(); pad.position.set(PAD_X, CY, 0); pad.scale.setScalar(0.8); root.add(pad);
    const padBody = box(3.0, 3.1, 0.25, M.plastic(0x2b2f38, { roughness: 0.4 })); padBody.position.set(0, -0.2, -0.1); pad.add(padBody);
    const padFoot = box(3.0, 0.2, 1.4, M.plastic(0x2b2f38)); padFoot.position.set(0, (0.1 - CY) / 0.8, 0.4); pad.add(padFoot);
    const keyTex = (k) => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#f3efe4'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#1b1e25'; g.font = 'bold 72px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(k, 64, 70); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
    const keyMeshes = {};
    KEYS.forEach((row, r) => row.forEach((k, c) => {
      const extra = c === 3;                         // A–D: on the standard, on few home phones
      const mats = [M.plastic(0xd8d2c4), M.plastic(0xd8d2c4), M.plastic(0xd8d2c4), M.plastic(0xd8d2c4), new THREE.MeshStandardMaterial({ map: keyTex(k), roughness: 0.5, transparent: extra, opacity: extra ? 0.45 : 1 }), M.plastic(0xd8d2c4)];
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.46, 0.16), mats);
      m.position.set(-0.96 + c * 0.64, 0.75 - r * 0.58, 0.1); m.castShadow = true; m.userData.key = k; pad.add(m); keyMeshes[k] = m;
    }));
    // ---------------------------------------------------------------- boards
    let labels = [], s0 = { mode: 'rotary' }, t = 0, shownKey = null, spec = null;
    const breaks = [];                                 // [start, end] times of loop breaks
    let dialled = '', counted = [];                   // digits the exchange has counted
    const pulseB = board(root, 4.8, 1.83, 720, 275, (g, w, h) => {
      panelBg(g, w, h);
      title(g, 'Line current (rotary)', `${I_OFF.toFixed(0)} mA while off hook; each break drops it to zero`);
      const x0 = 64, y0 = 82, pw = w - 84, ph = 128, span = 3;
      const X = (tt) => x0 + ((tt - (t - span)) / span) * pw, Y = (mA) => y0 + ph - (mA / 60) * ph;
      g.strokeStyle = COL.grid; g.lineWidth = 1;
      for (const mA of [0, 20, 40, 60]) { g.beginPath(); g.moveTo(x0, Y(mA)); g.lineTo(x0 + pw, Y(mA)); g.stroke(); text(g, mA + ' mA', 8, Y(mA) + 5, { font: '14px sans-serif', col: 'rgba(255,255,255,.45)' }); }
      g.strokeStyle = COL.current; g.lineWidth = 3; g.beginPath();
      const on = (tt) => !breaks.some(([a, b]) => tt >= a && tt < b);
      for (let px = 0; px <= pw; px++) { const tt = t - span + (px / pw) * span; const y = Y(on(tt) ? I_OFF : 0); px ? g.lineTo(x0 + px, y) : g.moveTo(x0 + px, y); }
      g.stroke();
      for (let k = 0; k <= 3; k++) text(g, `${k - 3} s`, X(t - 3 + k) - 12, y0 + ph + 22, { font: '14px sans-serif', col: 'rgba(255,255,255,.45)' });
      text(g, `Exchange has counted: ${counted.join(' ') || '…'}`, 22, h - 18, { font: 'bold 20px sans-serif', col: COL.current });
    }, [2.8, 4.1, -0.3]);
    const toneB = board(root, 4.8, 1.83, 720, 275, (g, w, h) => {
      panelBg(g, w, h);
      const f = shownKey ? dtmfOf(shownKey) : null;
      title(g, 'Touch-tone: two notes per key', f ? `key ${shownKey}: ${f[0]} Hz + ${f[1]} Hz` : 'press a key');
      // grid
      const gx = 80, gy = 100, cw = 50, chh = 38;
      DTMF_COLS.forEach((hz, c) => text(g, String(hz), gx + c * cw + cw / 2, gy - 12, { font: `${f && f[3] === c ? 'bold ' : ''}13px sans-serif`, col: f && f[3] === c ? COL.tone : 'rgba(255,255,255,.55)', align: 'center' }));
      DTMF_ROWS.forEach((hz, r) => text(g, String(hz), gx - 12, gy + r * chh + chh / 2 + 5, { font: `${f && f[2] === r ? 'bold ' : ''}13px sans-serif`, col: f && f[2] === r ? COL.current : 'rgba(255,255,255,.55)', align: 'right' }));
      KEYS.forEach((row, r) => row.forEach((k, c) => {
        const hit = f && f[2] === r && f[3] === c, lit = f && (f[2] === r || f[3] === c);
        g.fillStyle = hit ? '#ffffff' : lit ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,.06)'; rrect(g, gx + c * cw + 3, gy + r * chh + 3, cw - 6, chh - 6, 6); g.fill();
        text(g, k, gx + c * cw + cw / 2, gy + r * chh + chh / 2 + 7, { font: 'bold 19px sans-serif', col: hit ? '#111' : c === 3 ? 'rgba(255,255,255,.35)' : '#e8eef8', align: 'center' });
      }));
      // spectrum 500–1800 Hz
      const sx = 305, sw = w - sx - 20, sy = 80, sh = 140, f0 = 550, f1 = 1750;
      const X = (hz) => sx + ((hz - f0) / (f1 - f0)) * sw, Y = (db) => sy + sh - clamp((db + 70) / 70, 0, 1) * sh;
      g.strokeStyle = COL.grid; g.lineWidth = 1; g.beginPath(); g.moveTo(sx, sy + sh); g.lineTo(sx + sw, sy + sh); g.stroke();
      [...DTMF_ROWS, ...DTMF_COLS].forEach((hz, i) => { g.strokeStyle = i < 4 ? 'rgba(255,209,102,.22)' : 'rgba(196,155,255,.22)'; g.setLineDash([4, 5]); g.beginPath(); g.moveTo(X(hz), sy); g.lineTo(X(hz), sy + sh); g.stroke(); g.setLineDash([]); });
      if (spec) {
        g.beginPath(); g.moveTo(sx, sy + sh);
        for (let k = 1; k < spec.length; k++) { const hz = k * spec.hz; if (hz < f0) continue; if (hz > f1) break; g.lineTo(X(hz), Y(spec[k])); }
        g.lineTo(sx + sw, sy + sh); g.closePath(); g.fillStyle = 'rgba(196,155,255,.3)'; g.fill(); g.strokeStyle = COL.tone; g.lineWidth = 2; g.stroke();
      }
      for (const hz of [600, 800, 1000, 1200, 1400, 1600]) text(g, hz + '', X(hz), sy + sh + 18, { font: '13px sans-serif', col: 'rgba(255,255,255,.45)', align: 'center' });
      text(g, 'spectrum (Hz)', sx + sw, sy + sh + 38, { font: '14px sans-serif', col: 'rgba(255,255,255,.45)', align: 'right' });
      text(g, `Dialled: ${dialled || '…'}`, w - 22, 36, { font: 'bold 20px sans-serif', col: COL.tone, align: 'right' });
    }, [2.8, 4.1, -0.3]);

    // ---------------------------------------------------------------- dialling engine
    const queue = [];
    let job = null, turn = 0, pressT = 0, pressedKey = null, clicks = null;
    const start = (d) => {
      if (s0.mode === 'rotary') {
        if (d === '*' || d === '#') return;
        const n = pulsesOf(d), travel = (n + 1) * 30 * D2R;
        job = { kind: 'rotary', d, n, travel, t0: t, tw: travel / WIND_RATE, done: false };
      } else {
        const f = dtmfOf(d); if (!f) return;
        job = { kind: 'tone', d, t0: t, dur: 0.25 };
        shownKey = d; dialled += d;
        const a = dtmf(f[0], f[1], 0.2);
        spec = spectrum(a, 2048);
        player.play(a, { gain: 0.35 });
        toneB.redraw();
      }
    };
    const inst = {
      press(k) { queue.push(String(k)); },
      number(str) { for (const c of str) queue.push(c); },
      clear() { queue.length = 0; job = null; dialled = ''; counted = []; breaks.length = 0; shownKey = null; spec = null; turn = 0; toneB.redraw(); pulseB.redraw(); },
      pick(o) {
        if (o.userData.key) { if (s0.mode !== 'tone') pressSeg('tone'); inst.press(o.userData.key); return; }
        if (o === dial.wheel || o === dial.plate) {
          if (s0.mode !== 'rotary') pressSeg('rotary');
          // which hole is nearest the click? Use the last pointer ray hit point.
          const p = lastHit || new THREE.Vector3();
          const local = dial.group.worldToLocal(p.clone());
          const a = Math.atan2(local.y, local.x) / D2R, n = Math.round((((a % 360) + 360) % 360) / 30);
          if (n >= 1 && n <= 10) inst.press(n === 10 ? '0' : String(n));
        }
      },
      update(dt, s) {
        dt = Math.max(0, dt); t += dt; s0 = s;
        player.sync();
        const narrow = fitNarrow(stage, labels, -0.2);
        reelBoards([[pulseB, [0, 4.4, -0.3], 0.95], [toneB, [0, 4.4, -0.3], 0.95]], narrow);
        pulseB.mesh.visible = s.mode === 'rotary'; toneB.mesh.visible = s.mode === 'tone';
        if (!job && queue.length) start(queue.shift());
        let breaking = false;
        if (job && job.kind === 'rotary') {
          const e = t - job.t0, tr = (job.n + 1) * PULSE, tHold = 0.12;
          if (e < job.tw) turn = (e / job.tw) * job.travel;
          else if (e < job.tw + tHold) turn = job.travel;
          else if (e < job.tw + tHold + tr) {
            const r = e - job.tw - tHold; turn = job.travel * (1 - r / tr);
            const k = Math.floor(r / PULSE);
            if (k < job.n) {
              breaking = r - k * PULSE < BREAK;
              const t0 = job.t0 + job.tw + tHold + k * PULSE;
              if (!breaks.length || breaks[breaks.length - 1][0] < t0 - 1e-6) { breaks.push([t0, t0 + BREAK]); clicks ||= click(3); player.play(clicks, { gain: 0.5 }); }
            }
          } else if (!job.done) { job.done = true; turn = 0; counted.push(job.d === '0' ? '0' : job.d); dialled += job.d; if (counted.length > 8) counted.shift(); }
          else if (e > job.tw + tHold + tr + PAUSE) job = null;
        } else if (job && job.kind === 'tone') {
          pressedKey = job.d; pressT = 0.2;
          if (t - job.t0 > job.dur + 0.12) job = null;
        }
        while (breaks.length && breaks[0][1] < t - 3.2) breaks.shift();
        dial.setTurn(turn);
        cam.rotation.z = -turn * 4; gov.rotation.y += (job && job.kind === 'rotary' && t - job.t0 > job.tw ? 40 : 0) * dt;
        // the finger rides in the hole while winding
        const winding = job && job.kind === 'rotary' && t - job.t0 < job.tw + 0.12;
        finger.visible = !!winding;
        if (winding) { const a = holeAngle(job.d) - turn, R = dial.ringR; finger.position.set(DIAL_X + Math.cos(a) * R, CY + Math.sin(a) * R, 0.45); }
        // pulse contacts: two leaf springs; the cam pushes one away during each break
        const gap = breaking ? 0.16 : 0;
        const bx = DIAL_X + 0.1, by = BY, bz = 0.62;
        leafA.between([bx - 0.9, by + 0.12, bz], [bx, by + 0.06, bz]); tipA.position.set(bx, by + 0.06, bz);
        leafB.between([bx - 0.9, by - 0.12, bz], [bx, by - 0.06 - gap, bz]); tipB.position.set(bx, by - 0.06 - gap, bz);
        spark.visible = !breaking; spark.position.set(bx + 0.02, by, bz); spark.scale.setScalar(0.5);
        // keys
        pressT = Math.max(0, pressT - dt);
        for (const [k, m] of Object.entries(keyMeshes)) { const down = k === pressedKey && pressT > 0; m.position.z = approach(m.position.z, down ? 0.02 : 0.1, 30, dt); }
        dial.group.scale.setScalar(s.mode === 'rotary' ? 1 : 0.96); pad.scale.setScalar(s.mode === 'tone' ? 0.8 : 0.77);
        pulseB.redraw();
      },
      readout(s) {
        if (s.mode === 'rotary') {
          const n = job && job.kind === 'rotary' ? job.n : null;
          return `<div class="big">Rotary: counting breaks</div>
            <div class="row"><span>Dialled</span><b>${dialled || '…'}</b></div>
            <div class="row"><span>Pulse rate</span><b>10 per second</b></div>
            <div class="row"><span>Each pulse</span><b>60 ms off, 40 ms on</b></div>
            ${n ? `<div class="row"><span>This digit</span><b>${n} pulses, ${(n * PULSE).toFixed(1)} s</b></div>` : ''}
            <div class="row"><span>A 0 takes</span><b>10 pulses, 1 s</b></div>`;
        }
        const f = shownKey ? dtmfOf(shownKey) : null;
        return `<div class="big">Touch-tone: two notes</div>
          <div class="row"><span>Dialled</span><b>${dialled || '…'}</b></div>
          ${f ? `<div class="row"><span>Key ${shownKey}: row tone</span><b>${f[0]} Hz</b></div><div class="row"><span>column tone</span><b>${f[1]} Hz</b></div>` : '<div class="row"><span>Press a key</span><b>…</b></div>'}
          <div class="row"><span>Each key takes</span><b>about 0.1 s</b></div>`;
      },
      dispose() { player.stopAll(); },
    };
    // remember where on the dial a click landed, to pick the hole
    let lastHit = null;
    const ray = new THREE.Raycaster(), v2 = new THREE.Vector2();
    const onDown = (e) => { const b = stage.renderer.domElement.getBoundingClientRect(); v2.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1); ray.setFromCamera(v2, stage.camera); const h = ray.intersectObjects([dial.wheel, dial.plate], false)[0]; lastHit = h ? h.point : null; };
    stage.renderer.domElement.addEventListener('pointerup', onDown, true);
    const dispose0 = inst.dispose;
    inst.dispose = () => { stage.renderer.domElement.removeEventListener('pointerup', onDown, true); dispose0(); };
    stage.pickables = [dial.wheel, dial.plate, ...Object.values(keyMeshes)];
    stage.label('Pulse contacts', [DIAL_X - 0.6, 0.85, 0.7], root, 'hot');
    labels = [stage.label('Finger stop', [DIAL_X + 1.0, CY - 0.55, 0.3], root), stage.label('Governor', [DIAL_X + 1.0, 0.15, 0.6], root)];
    return inst;
  },
};

function pressSeg(value) {
  const b = [...document.querySelectorAll('#panel .ctl-seg .seg button')].find((x) => x.dataset.v === String(value));
  if (b) b.click();
}
