// Chapter 1: take a rotary desk phone apart.
// Line numbers come from phone.js: 48 V on hook, loop current from 48 V / (400 Ω feed + line + 200 Ω phone).
// Ringing 75 V rms at 25 Hz in the India/UK double-ring cadence.
import { exploder, approach, clamp } from '../kit.js';
import { makeDeskPhone, loopI, phoneV, LINE, ringOn, bells, player, fitNarrow } from '../phone.js';

export default {
  id: 'anatomy',
  short: 'Inside a phone',
  title: 'Inside a rotary desk phone',
  subtitle: 'A handset, a hook switch, a dial, two bells and a pair of copper wires.',
  view: { pos: [4.4, 4.2, 6.6], target: [-0.9, 1.5, 0] },
  learn: `<p>A classic desk phone has very few parts, and none of them is a computer. You hold the <b>handset</b>. Its <b>mouthpiece</b> holds a <b>microphone</b> that turns your voice into a changing electric current, and its <b>earpiece</b> holds a tiny <b>speaker</b> that turns current back into sound.</p>
    <p>When the handset rests on the <b>cradle</b>, it presses down two plungers. They work the <b>hook switch</b>. Lift the handset, the plungers pop up, the switch closes, and current starts to flow from the exchange. That current is how the exchange knows you want to make a call.</p>
    <p>On the front is the <b>rotary dial</b>. Inside are two metal <b>bells</b> and a clapper worked by an electromagnet, and a small <b>network</b>: a coil and a capacitor that stop your own voice from roaring back into your ear. The whole phone hangs on a <b>line cord</b>: just two copper wires that run all the way to the <b>exchange</b>, which also powers the phone. That is why an old landline still works in a power cut.</p>
    <p class="tip"><b>Try it:</b> lift the handset and watch the line current jump from zero. Then take the phone apart, turn on X-ray, and press "Ring it".</p>`,
  terms: [
    { t: 'Handset', d: 'The part you hold, with the mouthpiece at one end and the earpiece at the other.' },
    { t: 'Hook switch', d: 'The switch under the cradle that connects the phone to the line when you lift the handset.' },
    { t: 'Off hook', d: 'Handset lifted, switch closed, current flowing: the phone is in use.' },
    { t: 'Rotary dial', d: 'A finger wheel that sends a number by breaking the line current in quick pulses.' },
    { t: 'Ringer', d: 'Two bells and a clapper, swung by an electromagnet when the exchange sends a ringing current.' },
    { t: 'Network', d: 'A small coil and capacitor inside the phone that keep your own voice quiet in your ear.' },
    { t: 'Local loop', d: 'The pair of copper wires that runs from your phone to the exchange and back.' },
  ],
  defaults: { explode: 0, lift: false, xray: false, ringing: false, km: 2 },
  controls: [
    { key: 'lift', type: 'toggle', label: 'Lift the handset' },
    { key: 'explode', type: 'range', label: 'Take it apart', min: 0, max: 1, step: 0.01, ends: ['together', 'exploded'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'xray', type: 'toggle', label: 'X-ray the case' },
    { key: 'km', type: 'range', label: 'Distance to the exchange', min: 0.5, max: 5, step: 0.1, ends: ['0.5 km', '5 km'], fmt: (v) => v.toFixed(1) + ' km' },
    { key: 'ring', type: 'buttons', label: 'Incoming call', items: [
      { label: 'Ring it', act: (s, inst) => { s.lift = false; s.ringing = true; inst.ring?.(); } },
      { label: 'Stop', act: (s, inst) => { s.ringing = false; inst.stop?.(); } },
    ] },
  ],
  quiz: [
    { q: 'What happens when you lift the handset?', options: ['A battery in the phone switches on', 'The hook switch closes and current flows round the loop from the exchange', 'The bells start ringing', 'The dial unlocks'], answer: 1, why: 'Lifting lets the plungers rise and close the hook switch. The exchange sees current flowing and gives you a dial tone.' },
    { q: 'Where does an old landline phone get its power?', options: ['From a battery inside it', 'From the wall socket', 'From the exchange, down the phone line', 'From the sound of your voice'], answer: 2, why: 'The exchange puts about 48 volts on the line from its own batteries, so the phone works even in a power cut.' },
    { q: 'What is the network inside the phone for?', options: ['Connecting to the internet', 'Keeping your own voice from being too loud in your earpiece', 'Storing phone numbers', 'Making the bells ring'], answer: 1, why: 'Its coil and capacitor balance the line so only a little of your own voice, the sidetone, reaches your ear.' },
  ],
  reel: [
    { ms: 5200, caption: 'A classic phone is a handset, a hook switch, a dial, two bells and two copper wires.', set: { lift: false, xray: false, ringing: false }, anim: { explode: [0, 1] }, spin: 0.6, view: { pos: [5.6, 4.6, 7.0], target: [0, 1.8, 0] } },
    { ms: 4600, caption: 'Lift the handset, the hook switch closes, and current flows from the exchange.', set: { explode: 0, xray: true, ringing: false, lift: false }, anim: { lift: [false, true] }, spin: 0.2, view: { pos: [3.6, 3.0, 5.0], target: [0, 1.5, 0] } },
  ],

  build({ stage }) {
    const P = makeDeskPhone();
    stage.root.add(P.group);
    const setExplode = exploder([
      { obj: P.handsetHome, off: [0, 2.3, 0] },
      { obj: P.shell, off: [0, 1.35, 0] },
      { obj: P.dialMount, off: [0, 1.0, 1.6] },
      { obj: P.ringer, off: [0, 0.3, -1.6] },
      { obj: P.network, off: [1.5, 0, 0.6] },
      { obj: P.hook, off: [-1.5, 0.2, 0.5] },
      { obj: P.dialMech, off: [0.6, 1.0, 1.1] },
      { obj: P.transmitter, off: [0.45, -0.55, 0] },
      { obj: P.receiver, off: [-0.45, -0.55, 0] },
    ]);
    const L = (text, obj, pos, cls) => stage.label(text, pos, obj, cls);
    const outer = [
      L('Handset', P.handset, [0, 0.62, 0], 'hot'),
      L('Rotary dial', P.dialMount, [0, -0.72, 0.1]),
      L('Cradle and hook switch', P.shell, [0, 1.3, -0.95]),
    ];
    const inner = [
      L('Bells and clapper', P.ringer, [0, 1.0, -0.55]),
      L('Network: coil and capacitor', P.network, [0.1, 0.55, 0.45]),
      L('Hook switch contacts', P.hook, [-0.78, 0.9, -0.46]),
      L('Dial pulse contacts', P.dialMech, [-0.1, 0.72, 0.4]),
      L('Microphone (carbon)', P.transmitter, [0.35, -0.3, 0]),
      L('Earpiece (electromagnet)', P.receiver, [-0.35, -0.3, 0]),
    ];
    const minor = [outer[2]];

    let lift = 0, t = 0, ringT = 0, clap = 0;
    let snd = null;
    const inst = {
      ring() { ringT = 0; player.stopAll(); snd ||= bells(3, 'in', 25); player.play(snd, { gain: 0.5, loop: true }); },
      stop() { player.stopAll(); },
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        player.sync();
        const narrow = fitNarrow(stage, minor, -0.12);
        setExplode(s.explode);
        inner.forEach((l) => { l.visible = s.explode > 0.35 && !(narrow && l !== inner[0]); });
        P.coilHolder.visible = s.explode < 0.05;
        lift = approach(lift, s.lift ? 1 : 0, 5, dt);
        P.setLift(lift);
        P.updateCord();
        P.setXray(s.xray || s.explode > 0.05);
        if (s.lift && s.ringing) { s.ringing = false; player.stopAll(); }
        // ringing: the clapper swings at 25 Hz during the "on" parts of the cadence (shown slowed 5 times)
        if (s.ringing) {
          ringT += dt;
          const on = ringOn(ringT, 'in');
          clap = on ? Math.sin(TAU5 * ringT) : approach(clap, 0, 12, dt);
        } else { ringT = 0; clap = approach(clap, 0, 12, dt); }
        P.setClapper(clamp(clap, -1, 1));
        if (s.ringing && ringOn(ringT, 'in')) P.handset.position.y += 0.012 * Math.sin(t * 90);   // the handset rattles
      },
      readout(s) {
        if (s.ringing) return `<div class="big">Ringing</div>
          <div class="row"><span>Ringing current</span><b>about ${LINE.ringV.in} V at ${LINE.ringHz.in} Hz</b></div>
          <div class="row"><span>Pattern</span><b>0.4 s on, 0.2 s off, 0.4 s on, 2 s off</b></div>
          <div class="row"><span>Line current</span><b>0 mA (on hook)</b></div>`;
        if (!s.lift) return `<div class="big">On hook: waiting</div>
          <div class="row"><span>Voltage on the line</span><b>${LINE.battery} V DC</b></div>
          <div class="row"><span>Line current</span><b>0 mA</b></div>
          <div class="row"><span>Hook switch</span><b>open</b></div>`;
        const I = loopI(s.km) * 1000, V = phoneV(s.km);
        return `<div class="big">Off hook: ${I.toFixed(0)} mA flowing</div>
          <div class="row"><span>Line current</span><b>${I.toFixed(1)} mA</b></div>
          <div class="row"><span>Voltage at the phone</span><b>${V.toFixed(1)} V</b></div>
          <div class="row"><span>Copper to the exchange</span><b>${(s.km * 2).toFixed(1)} km of wire</b></div>
          <div class="ok">The exchange sees the current and sends a dial tone.</div>`;
      },
      dispose() { player.stopAll(); },
    };
    return inst;
  },
};
// the clapper's swing, 25 Hz shown 5 times slower so the eye can follow it
const TAU5 = (2 * Math.PI * 25) / 5;
