'use strict';
// OkiRa Stüdyo — arayüz ve uygulama mantığı
const $ = s => document.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const uid = () => Math.random().toString(36).slice(2, 10);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const COLORS = ['#e8534a', '#f0a030', '#e8d23a', '#5fd17a', '#3ac0c8', '#4f8fff', '#9b6bff', '#e060c0', '#c08a5a'];
const noteName = n => Lib.NOTE_NAMES[((n % 12) + 12) % 12] + (Math.floor(n / 12) - 1);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const App = {
  ctx: null, eng: null, tr: null, p: null, audio: new Map(), peaks: new Map(),
  selTrackId: null, selClipId: null, selNote: null, recording: false, pos: 0, playFrom: 0,
  undoStack: [], redoStack: [], ppb: 28, trackH: 60, dirty: true, saveDirty: false, focus: 'arr',
  barBeats(p = this.p) { const [n, d] = p.sig; return n * 4 / d; },
  songEnd() { let e = 0; for (const t of this.p.tracks) for (const c of t.clips) e = Math.max(e, c.start + c.len); return Math.max(e, this.barBeats()); },
  spb() { return 60 / this.p.bpm; },
  track(id = this.selTrackId) { return this.p.tracks.find(t => t.id === id) || null; },
  clip(id = this.selClipId) { for (const t of this.p.tracks) for (const c of t.clips) if (c.id === id) return c; return null; },
  clipTrack(id = this.selClipId) { return this.p.tracks.find(t => t.clips.some(c => c.id === id)) || null; },
  curBeat() { return this.tr.playing ? Math.max(0, this.tr.beat() ?? this.pos) : this.pos; },
};

function msg(t) { $('#msg').textContent = t; }

// ---------------- Proje modeli ----------------
function newTrack(o = {}) {
  return Object.assign({ id: uid(), name: 'Parça', type: 'inst', inst: 'piyano', color: COLORS[(App.p ? App.p.tracks.length : 0) % COLORS.length],
    vol: 0.8, pan: 0, mute: false, solo: false, arm: false, eq: { lo: 0, mid: 0, hi: 0 }, comp: 0, rev: 0.15, dly: 0, clips: [] }, o);
}
function blankProject() {
  return { v: 1, name: 'Yeni Şarkı', bpm: 100, sig: [4, 4], root: 0, tuning: 'esit', swing: 0, metro: false, countIn: true,
    loop: { on: false, start: 0, end: 16 }, master: { vol: 0.9, lo: 0, mid: 0, hi: 0, comp: 0.3, limit: true, dlyBeats: 0.75, dlyFb: 0.35 }, tracks: [] };
}
function patternNotes(rh, bars, bb) {
  const notes = [];
  for (let bar = 0; bar < bars; bar++) for (const r in rh.rows) {
    const s = rh.rows[r], sd = bb / s.length;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i]; if (ch === '.') continue;
      notes.push({ s: bar * bb + i * sd, d: sd, p: +r, v: ch === 'X' ? 125 : ch === 'o' ? 60 : 100 });
    }
  }
  return notes;
}
function demoProject() {
  const p = blankProject(); p.name = 'Örnek Şarkı'; p.bpm = 96; p.tuning = 'minor'; p.root = 9;
  App.p = p;
  const bb = 4, bars = 4;
  const dr = newTrack({ name: 'Davul', inst: 'kit_akustik', rev: 0.1 });
  dr.clips.push({ id: uid(), start: 0, len: bars * bb, notes: patternNotes(Rhythms.find(r => r.name === 'Pop'), bars, bb) }); p.tracks.push(dr);
  const ch = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]; // Am F C G
  const bs = newTrack({ name: 'Bas', inst: 'basgitar', rev: 0.05 }); const bn = [];
  ch.forEach((c, i) => { [0, 1.5, 2, 3].forEach(o => bn.push({ s: i * 4 + o, d: o === 0 ? 1.4 : 0.9, p: c[0] - 24, v: 105 })); });
  bs.clips.push({ id: uid(), start: 0, len: 16, notes: bn }); p.tracks.push(bs);
  const pn = newTrack({ name: 'Piyano', inst: 'piyano', rev: 0.25 }); const pnn = [];
  ch.forEach((c, i) => c.forEach(n => { pnn.push({ s: i * 4, d: 1.9, p: n, v: 80 }); pnn.push({ s: i * 4 + 2, d: 1.9, p: n, v: 70 }); }));
  pn.clips.push({ id: uid(), start: 0, len: 16, notes: pnn }); p.tracks.push(pn);
  const bg = newTrack({ name: 'Bağlama', inst: 'baglama', rev: 0.3, pan: -0.2 });
  const mel = [[76, 0, 1], [74, 1, .5], [72, 1.5, .5], [71, 2, 1], [72, 3, 1], [69, 4, 2], [72, 6, 1], [74, 7, 1], [76, 8, 1.5], [77, 9.5, .5], [76, 10, 1], [74, 11, 1], [71, 12, 1], [72, 13, .5], [74, 13.5, .5], [76, 14, 2]];
  bg.clips.push({ id: uid(), start: 0, len: 16, notes: mel.map(([p_, s, d]) => ({ s, d, p: p_, v: 100 })) }); p.tracks.push(bg);
  return p;
}

// ---------------- Geri al / yinele ----------------
function snap() { App.undoStack.push(JSON.stringify(App.p)); if (App.undoStack.length > 150) App.undoStack.shift(); App.redoStack = []; App.saveDirty = true; }
function restore(json) { App.p = JSON.parse(json); App.eng.syncAll(App.p); refreshAll(); App.saveDirty = true; }
function undo() { if (!App.undoStack.length) return msg('Geri alınacak işlem yok'); App.redoStack.push(JSON.stringify(App.p)); restore(App.undoStack.pop()); msg('Geri alındı'); }
function redo() { if (!App.redoStack.length) return; App.undoStack.push(JSON.stringify(App.p)); restore(App.redoStack.pop()); msg('Yinelendi'); }

// ---------------- Pencere (modal) yardımcıları ----------------
function modal(html, buttons = [{ t: 'Tamam', v: true, pri: true }]) {
  return new Promise(res => {
    $('#mBody').innerHTML = html; const bx = $('#mBtns'); bx.innerHTML = '';
    for (const b of buttons) {
      const e = el('button', b.pri ? 'pri' : '', b.t);
      e.onclick = () => { if (b.keep) { b.keep(); return; } close(b.v); }; bx.appendChild(e);
    }
    const close = v => { $('#modal').classList.add('hidden'); App.modalClose = null; res(v); };
    App.modalClose = close; $('#modal').classList.remove('hidden');
    const inp = $('#mBody input'); if (inp) { inp.focus(); inp.select && inp.select(); inp.onkeydown = e => { if (e.key === 'Enter') close(true); }; }
  });
}
async function ask(title, val) {
  const ok = await modal(`<h3>${esc(title)}</h3><input id="askIn" style="width:100%;padding:6px" value="${esc(val)}">`, [{ t: 'Vazgeç', v: false }, { t: 'Tamam', v: true, pri: true }]);
  return ok ? $('#askIn').value : null;
}
const confirmBox = (t, yes = 'Evet') => modal(`<p>${t}</p>`, [{ t: 'Vazgeç', v: false }, { t: yes, v: true, pri: true }]);
function download(blob, name) {
  const a = el('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}
const safeName = s => (s || 'sarki').replace(/[\\/:*?"<>|]+/g, '_').trim() || 'sarki';

// ---------------- Ses ve canlı çalma ----------------
function initAudio() {
  App.ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
  App.eng = new Engine(App.ctx);
  App.tr = new Transport(App);
  const resume = () => { if (App.ctx.state !== 'running') App.ctx.resume(); };
  window.addEventListener('pointerdown', resume, true); window.addEventListener('keydown', resume, true);
}
const preview = { id: '__preview', inst: 'piyano', vol: 0.8, pan: 0, eq: {}, comp: 0, rev: 0.15, dly: 0 };
function previewInst(id) {
  const inst = Lib.INST[id]; if (!inst) return;
  preview.inst = id; App.eng.strip(preview); App.eng.update(preview, false, App.ctx.currentTime);
  const t = App.ctx.currentTime + 0.05;
  if (inst.type === 'kit') { [0, 1, 2, 3].forEach((n, i) => { if (inst.pads[n]) App.eng.play(App.p, preview, t + i * 0.22, n, 100); }); return; }
  const low = /bas|tuba|fagot|didger|kontrbas|808|sub/i.test(id + inst.name);
  const base = low ? 40 : 60;
  [0, 4, 7, 12].forEach((o, i) => { const v = App.eng.play(App.p, preview, t + i * 0.28, base + o, 100); if (v) v.release(t + i * 0.28 + 0.5); });
}
const held = new Map();
function liveTrack() { const t = App.track(); return t && t.type === 'inst' ? t : App.p.tracks.find(x => x.type === 'inst') || null; }
function noteDown(note, vel = 100, src = 'k') {
  const tr = liveTrack(); if (!tr) return msg('Önce bir enstrüman parçası ekleyin');
  if (App.ctx.state !== 'running') App.ctx.resume();
  const key = src + note; if (held.has(key)) return;
  const inst = Lib.INST[tr.inst]; if (inst && inst.type === 'kit' && !inst.pads[note]) return;
  const v = App.eng.play(App.p, tr, App.ctx.currentTime, note, vel);
  held.set(key, { v, note, vel, tr, b: App.recording ? App.curBeat() : null });
  kbLight(note, true);
}
function noteUp(note, src = 'k') {
  const key = src + note, h = held.get(key); if (!h) return; held.delete(key);
  if (h.v) h.v.release(App.ctx.currentTime);
  kbLight(note, false);
  if (h.b !== null && App.recording && App.rec && App.rec.midi.has(h.tr.id)) {
    const e = App.curBeat();
    if (e > App.rec.from) App.rec.midi.get(h.tr.id).push({ s: Math.max(App.rec.from, h.b), d: Math.max(0.05, e - Math.max(App.rec.from, h.b)), p: h.note, v: h.vel });
  }
}
const KEYMAP = { a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12, o: 13, l: 14, p: 15, 'ş': 16, 'ç': 17 };
App.kbOct = 4;
function keyNote(k) {
  const tr = liveTrack(); const inst = tr && Lib.INST[tr.inst];
  if (inst && inst.type === 'kit') return KEYMAP[k];
  return (App.kbOct + 1) * 12 + KEYMAP[k];
}
function initMidi() {
  if (!navigator.requestMIDIAccess) return;
  navigator.requestMIDIAccess().then(acc => {
    const bind = () => { let n = 0; for (const i of acc.inputs.values()) { n++; i.onmidimessage = onMidi; } if (n) msg(`MIDI klavye bağlandı (${n})`); };
    bind(); acc.onstatechange = bind;
  }).catch(() => {});
}
function onMidi(e) {
  const [st, d1, d2] = e.data, cmd = st & 0xf0;
  const tr = liveTrack(), kit = tr && Lib.INST[tr.inst] && Lib.INST[tr.inst].type === 'kit';
  const n = kit ? ((d1 - 36) % 24 + 24) % 24 : d1;
  if (cmd === 0x90 && d2 > 0) noteDown(n, d2, 'm'); else if (cmd === 0x80 || (cmd === 0x90 && d2 === 0)) noteUp(n, 'm');
}

// ---------------- Çalma / kayıt ----------------
App.stop = function () {
  const was = this.tr.playing;
  if (was) this.pos = Math.max(0, this.curBeat());
  this.tr.stopAll(false);
  if (this.recording) finishRecording();
  $('#bPlay').textContent = '▶'; $('#bPlay').classList.remove('on');
  this.dirty = true;
};
function play() {
  if (App.tr.playing) return App.stop();
  App.eng.syncAll(App.p);
  App.playFrom = App.pos;
  App.tr.start(App.pos);
  $('#bPlay').textContent = '⏸'; $('#bPlay').classList.add('on');
}
let micStream = null;
async function startRecording() {
  if (App.tr.playing) App.stop();
  let targets = App.p.tracks.filter(t => t.arm);
  if (!targets.length) { const t = App.track(); if (t) targets = [t]; }
  if (!targets.length) return msg('Kayıt için bir parça seçin');
  const audioT = targets.filter(t => t.type === 'audio'), midiT = targets.filter(t => t.type === 'inst');
  App.rec = { from: App.pos, midi: new Map(midiT.map(t => [t.id, []])), audio: audioT, chunks: [], t0: null };
  if (audioT.length) {
    try {
      if (!micStream) micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    } catch (e) { App.rec = null; return modal('<h3>Mikrofon açılamadı</h3><p>Mikrofon izni verilmedi veya bağlı mikrofon yok. Windows Ayarlar → Gizlilik → Mikrofon bölümünden izin verip tekrar deneyin.</p>'); }
    const ctx = App.ctx, src = ctx.createMediaStreamSource(micStream), sp = ctx.createScriptProcessor(4096, 2, 2), z = ctx.createGain(); z.gain.value = 0;
    sp.onaudioprocess = e => {
      if (!App.recording) return;
      const ib = e.inputBuffer;
      if (App.rec.t0 === null) App.rec.t0 = e.playbackTime - ib.length / ctx.sampleRate * 2 - (ctx.baseLatency || 0) - (ctx.outputLatency || 0);
      App.rec.chunks.push([ib.getChannelData(0).slice(), ib.getChannelData(ib.numberOfChannels > 1 ? 1 : 0).slice()]);
    };
    src.connect(sp); sp.connect(z); z.connect(ctx.destination); App.rec.nodes = [src, sp, z];
  }
  App.eng.syncAll(App.p);
  App.recording = true; App.playFrom = App.pos;
  App.tr.start(App.pos, { countIn: App.p.countIn ? App.barBeats() : 0 });
  App.rec.startT = App.tr.timeOfBeat(App.pos);
  $('#bRec').classList.add('on'); $('#bPlay').textContent = '⏸'; $('#bPlay').classList.add('on');
  msg(App.p.countIn ? 'Sayım... sonra kayıt başlıyor' : 'Kayıt yapılıyor');
}
function finishRecording() {
  const r = App.rec;
  for (const [k, v] of [...held]) if (v.b !== null) noteUp(v.note, k[0]);
  App.recording = false; $('#bRec').classList.remove('on');
  if (!r) return;
  const end = App.pos, bb = App.barBeats(); let made = 0;
  snap();
  for (const [id, notes] of r.midi) {
    if (!notes.length) continue;
    const tr = App.track(id); if (!tr) continue;
    const s = Math.floor(r.from / bb) * bb, e = Math.max(s + bb, Math.ceil(Math.max(end, ...notes.map(n => n.s + n.d)) / bb) * bb);
    const c = { id: uid(), start: s, len: e - s, notes: notes.map(n => ({ s: n.s - s, d: n.d, p: n.p, v: n.v })) };
    tr.clips.push(c); App.selClipId = c.id; made++;
  }
  if (r.nodes) { r.nodes.forEach(n => { try { n.disconnect(); } catch (e) {} }); }
  if (r.audio.length && r.chunks.length) {
    const sr = App.ctx.sampleRate, total = r.chunks.reduce((a, c) => a + c[0].length, 0);
    let skip = Math.max(0, Math.round((r.startT - r.t0) * sr)); const lead = r.t0 > r.startT ? (r.t0 - r.startT) : 0;
    const n = total - skip;
    if (n > sr * 0.1) {
      const buf = App.ctx.createBuffer(2, n, sr), L = buf.getChannelData(0), R = buf.getChannelData(1); let o = -skip;
      for (const [a, b] of r.chunks) { for (let i = 0; i < a.length; i++, o++) if (o >= 0 && o < n) { L[o] = a[i]; R[o] = b[i]; } }
      for (const t0 of r.audio) {
        const tr = App.track(t0.id); if (!tr) continue;
        const id = addBuffer(buf), c = { id: uid(), start: r.from + lead / App.spb(), len: buf.duration / App.spb(), durS: buf.duration, off: 0, buf: id, gain: 0, name: 'Kayıt' };
        tr.clips.push(c); App.selClipId = c.id; made++;
      }
    }
  }
  App.rec = null;
  if (!made) App.undoStack.pop();
  msg(made ? 'Kayıt tamamlandı' : 'Kayıt durdu (kaydedilen bir şey yok)');
  refreshAll();
}
function addBuffer(buf, id = uid()) { App.audio.set(id, buf); App.peaks.delete(id); return id; }
function peaksOf(id) {
  let pk = App.peaks.get(id); if (pk) return pk;
  const b = App.audio.get(id); if (!b) return null;
  const step = 256, n = Math.ceil(b.length / step), d0 = b.getChannelData(0), d1 = b.getChannelData(b.numberOfChannels > 1 ? 1 : 0);
  pk = new Float32Array(n);
  for (let i = 0; i < n; i++) { let m = 0; for (let j = i * step, e = Math.min(b.length, j + step); j < e; j++) { const a = Math.abs(d0[j]) + Math.abs(d1[j]); if (a > m) m = a; } pk[i] = m / 2; }
  App.peaks.set(id, pk); return pk;
}

// ---------------- Enstrüman kütüphanesi ----------------
function buildLibrary() {
  const q = $('#libSearch').value.trim().toLocaleLowerCase('tr'), box = $('#libList'); box.innerHTML = '';
  App.openCats = App.openCats || new Set(['Türk & Anadolu']);
  for (const c of Lib.CATS) {
    const items = c.items.filter(i => !q || i.name.toLocaleLowerCase('tr').includes(q) || c.name.toLocaleLowerCase('tr').includes(q));
    if (!items.length) continue;
    const open = q || App.openCats.has(c.name);
    const h = el('div', 'cat' + (open ? ' open' : ''), esc(c.name) + ` <small style="color:#888">(${items.length})</small>`);
    h.onclick = () => { App.openCats.has(c.name) ? App.openCats.delete(c.name) : App.openCats.add(c.name); buildLibrary(); };
    box.appendChild(h);
    if (!open) continue;
    for (const i of items) {
      const tr = App.track(), it = el('div', 'item' + (tr && tr.inst === i.id ? ' sel' : ''));
      it.innerHTML = `<span title="${esc(i.name)}">${esc(i.name)}</span><button title="Seçili parçaya ata">⇄</button><button title="Bu enstrümanla yeni parça">＋</button>`;
      it.querySelector('span').onclick = () => previewInst(i.id);
      it.ondblclick = () => addInstTrack(i.id);
      const [bA, bN] = it.querySelectorAll('button');
      bA.onclick = () => { const t = App.track(); if (!t || t.type !== 'inst') return msg('Önce bir enstrüman parçası seçin'); snap(); t.inst = i.id; if (/^Parça|^Enstrüman/.test(t.name)) t.name = i.name; refreshAll(); previewInst(i.id); };
      bN.onclick = () => addInstTrack(i.id);
      box.appendChild(it);
    }
  }
}
function addInstTrack(instId) {
  snap(); const i = Lib.INST[instId];
  const t = newTrack({ name: i.name, inst: instId, rev: i.type === 'kit' ? 0.08 : 0.18 });
  App.p.tracks.push(t); App.selTrackId = t.id; App.selClipId = null;
  refreshAll(); previewInst(instId); msg(`"${i.name}" parçası eklendi. Piyano rulosuna tıklayarak nota yazabilir veya klavyeyle çalabilirsiniz.`);
  if (i.type === 'kit') showTab('steps'); else showTab('piano');
  return t;
}
function addAudioTrack(name = 'Ses Kaydı') {
  const t = newTrack({ name, type: 'audio', inst: null, rev: 0.1 }); App.p.tracks.push(t); App.selTrackId = t.id; return t;
}
async function addTrackDialog() {
  const v = await modal(`<h3>Yeni parça</h3><p>Ne tür bir parça eklemek istiyorsunuz?</p>`, [
    { t: '🎹 Enstrüman', v: 'inst', pri: true }, { t: '🥁 Ritim / Davul', v: 'kit' }, { t: '🎤 Mikrofon Kaydı', v: 'audio' }, { t: '📁 Ses Dosyası', v: 'file' }, { t: 'Vazgeç', v: null }]);
  if (v === 'inst') addInstTrack('piyano');
  else if (v === 'kit') { const t = addInstTrack('kit_akustik'); applyPreset(t, Rhythms[1]); }
  else if (v === 'audio') { snap(); const t = addAudioTrack('Mikrofon'); t.arm = true; refreshAll(); msg('Mikrofon parçası eklendi: ⏺ ile kayda başlayın'); }
  else if (v === 'file') $('#fileAudio').click();
}
async function importAudioFile(file) {
  msg('Ses dosyası açılıyor...');
  try {
    const buf = await App.ctx.decodeAudioData(await file.arrayBuffer());
    snap(); const t = addAudioTrack(file.name.replace(/\.[^.]+$/, ''));
    const c = { id: uid(), start: App.pos, len: buf.duration / App.spb(), durS: buf.duration, off: 0, buf: addBuffer(buf), gain: 0, name: t.name };
    t.clips.push(c); App.selClipId = c.id; refreshAll(); msg('Ses dosyası eklendi: ' + file.name);
  } catch (e) { modal('<h3>Dosya açılamadı</h3><p>Bu ses dosyası biçimi desteklenmiyor. MP3, WAV, OGG, M4A veya FLAC deneyin.</p>'); }
}

// ---------------- Parça başlıkları ----------------
function buildHeads() {
  const box = $('#headList'); box.innerHTML = '';
  App.p.tracks.forEach((t, idx) => {
    const inst = t.type === 'audio' ? '🎤 Ses kaydı' : (Lib.INST[t.inst] ? Lib.INST[t.inst].name : '?');
    const h = el('div', 'th' + (t.id === App.selTrackId ? ' sel' : ''));
    h.innerHTML = `<div class="col" style="background:${esc(t.color)}"></div><div class="in">
      <div class="row"><span class="nm" title="Çift tık: yeniden adlandır">${esc(t.name)}</span><span style="flex:1"></span>
      <button class="b-up" title="Yukarı taşı">▲</button><button class="b-x" title="Parçayı sil">✕</button></div>
      <div class="ins" title="Enstrümanı değiştirmek için soldaki listeden ⇄ düğmesine basın">${esc(inst)}</div>
      <div class="row"><button class="b-m${t.mute ? ' on' : ''}" title="Sessize al">M</button><button class="b-s${t.solo ? ' on' : ''}" title="Solo">S</button><button class="b-r${t.arm ? ' on' : ''}" title="Kayda hazırla">⏺</button>
      <input type="range" min="0" max="1" step="0.01" value="${+t.vol || 0}" title="Ses seviyesi"></div></div>`;
    h.onmousedown = e => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return; selectTrack(t.id); };
    h.querySelector('.nm').ondblclick = async () => { const n = await ask('Parça adı', t.name); if (n) { snap(); t.name = n; refreshAll(); } };
    const q = s => h.querySelector(s);
    q('.b-m').onclick = () => { t.mute = !t.mute; App.eng.syncAll(App.p); buildHeads(); buildMixer(); App.saveDirty = true; };
    q('.b-s').onclick = () => { t.solo = !t.solo; App.eng.syncAll(App.p); buildHeads(); buildMixer(); App.saveDirty = true; };
    q('.b-r').onclick = () => { t.arm = !t.arm; buildHeads(); App.saveDirty = true; };
    q('.b-up').onclick = () => { if (!idx) return; snap(); const a = App.p.tracks; [a[idx - 1], a[idx]] = [a[idx], a[idx - 1]]; refreshAll(); };
    q('.b-x').onclick = async () => { if (await confirmBox(`"${esc(t.name)}" parçası silinsin mi?`, 'Sil')) { snap(); App.p.tracks = App.p.tracks.filter(x => x !== t); if (App.selTrackId === t.id) App.selTrackId = App.p.tracks[0]?.id || null; refreshAll(); } };
    const r = q('input'); r.onpointerdown = () => snap(); r.oninput = () => { t.vol = +r.value; App.eng.syncAll(App.p); syncMixerVals(); };
    box.appendChild(h);
  });
  box.scrollTop = $('#tl').scrollTop;
}
function selectTrack(id, clipId) {
  App.selTrackId = id;
  const t = App.track();
  if (clipId !== undefined) App.selClipId = clipId;
  else if (!t.clips.some(c => c.id === App.selClipId)) App.selClipId = t.clips.find(c => c.start <= App.pos && c.start + c.len > App.pos)?.id || t.clips[0]?.id || null;
  App.selNote = null;
  buildHeads(); buildLibrary(); refreshEditor(); App.dirty = true;
  const inst = t.type === 'inst' && Lib.INST[t.inst];
  if (inst && inst.type === 'kit' && App.tab === 'piano') showTab('steps');
  else if (inst && inst.type !== 'kit' && App.tab === 'steps') showTab('piano');
}

// ---------------- Düzenleme alanı (zaman çizelgesi) ----------------
const RULER = 30;
function fitCanvas(cv, wrap) {
  const r = wrap.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, Math.floor(r.width)), h = Math.max(1, Math.floor(r.height));
  if (cv.width !== w * dpr || cv.height !== h * dpr) { cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + 'px'; cv.style.height = h + 'px'; }
  const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); return { g, w, h };
}
function drawArrange() {
  const tl = $('#tl'), { g, w, h } = fitCanvas($('#tlCanvas'), $('#tlWrap'));
  const sx = tl.scrollLeft, sy = tl.scrollTop, ppb = App.ppb, H = App.trackH, bb = App.barBeats(), p = App.p;
  $('#tlSpacer').style.width = ((App.songEnd() + 64) * ppb) + 'px'; $('#tlSpacer').style.height = (RULER + p.tracks.length * H + 120) + 'px';
  g.fillStyle = '#1e2024'; g.fillRect(0, 0, w, h);
  const b0 = Math.floor(sx / ppb), b1 = Math.ceil((sx + w) / ppb);
  // ızgara
  p.tracks.forEach((t, i) => { const y = RULER + i * H - sy; g.fillStyle = t.id === App.selTrackId ? '#262c36' : (i % 2 ? '#202226' : '#1c1e22'); g.fillRect(0, y, w, H); });
  for (let b = b0; b <= b1; b++) {
    const x = b * ppb - sx, bar = b % bb === 0;
    if (!bar && ppb < 10) continue;
    g.fillStyle = bar ? '#3a3e46' : '#2a2d33'; g.fillRect(x, RULER, 1, h);
  }
  // bölgeler
  p.tracks.forEach((t, i) => {
    const y = RULER + i * H - sy + 3, ch = H - 6;
    if (y > h || y + ch < 0) return;
    const inst = Lib.INST[t.inst];
    for (const c of t.clips) {
      const x = c.start * ppb - sx, cw = c.len * ppb; if (x > w || x + cw < 0) continue;
      const sel = c.id === App.selClipId;
      g.fillStyle = t.color + (t.mute ? '44' : '99'); g.fillRect(x, y, cw, ch);
      g.fillStyle = t.color; g.fillRect(x, y, cw, 13);
      g.strokeStyle = sel ? '#fff' : '#0008'; g.lineWidth = sel ? 2 : 1; g.strokeRect(x + 0.5, y + 0.5, cw - 1, ch - 1);
      g.save(); g.beginPath(); g.rect(x, y, cw, ch); g.clip();
      g.fillStyle = '#000'; g.font = '11px system-ui'; g.fillText(t.type === 'audio' ? (c.name || 'Ses') : t.name, x + 4, y + 10);
      if (t.type === 'audio') {
        const pk = peaksOf(c.buf), buf = App.audio.get(c.buf);
        if (pk && buf) {
          g.fillStyle = '#0009'; const mid = y + 13 + (ch - 13) / 2, amp = (ch - 15) / 2, sps = buf.sampleRate * App.spb() / ppb / 256;
          for (let px = Math.max(0, -x); px < Math.min(cw, w - x); px++) {
            const k = Math.floor(((c.off || 0) * buf.sampleRate / 256) + px * sps); if (k >= pk.length) break;
            const a = Math.min(1, pk[k] * 1.4) * amp; g.fillRect(x + px, mid - a, 1, a * 2 + 1);
          }
        }
      } else if (c.notes.length) {
        let lo = 127, hi = 0; for (const n of c.notes) { lo = Math.min(lo, n.p); hi = Math.max(hi, n.p); }
        const span = Math.max(8, hi - lo + 1), nh = Math.max(1.5, (ch - 18) / span);
        g.fillStyle = '#000b';
        for (const n of c.notes) { if (n.s >= c.len) continue; const ny = y + 15 + (hi - n.p) * ((ch - 18 - nh) / Math.max(1, span - 1)); g.fillRect(x + n.s * ppb, ny, Math.max(1.5, Math.min(n.d, c.len - n.s) * ppb - 1), nh); }
      }
      g.restore();
    }
  });
  // cetvel
  g.fillStyle = '#2a2c31'; g.fillRect(0, 0, w, RULER); g.fillStyle = '#000'; g.fillRect(0, RULER - 1, w, 1);
  const L = p.loop;
  if (L && L.end > L.start) { g.fillStyle = L.on ? '#d9a40088' : '#ffffff22'; g.fillRect(L.start * ppb - sx, 16, (L.end - L.start) * ppb, 13); }
  g.font = '11px system-ui'; const every = ppb * bb < 40 ? Math.ceil(40 / (ppb * bb)) : 1;
  for (let b = Math.floor(b0 / bb) * bb; b <= b1; b += bb) {
    const bar = b / bb; if (bar % every) continue; const x = b * ppb - sx;
    g.fillStyle = '#888'; g.fillRect(x, 8, 1, RULER - 8); g.fillStyle = '#ccc'; g.fillText(String(bar + 1), x + 3, 13);
  }
  // çalma çizgisi
  const px = App.curBeat() * ppb - sx;
  g.fillStyle = App.recording ? '#ff4d4d' : '#fff'; g.fillRect(px, 0, 1.5, h);
  g.beginPath(); g.moveTo(px - 6, 0); g.lineTo(px + 7, 0); g.lineTo(px + 0.5, 9); g.fill();
}
function arrHit(e) {
  const tl = $('#tl'), r = tl.getBoundingClientRect();
  const vx = e.clientX - r.left, vy = e.clientY - r.top, x = vx + tl.scrollLeft, y = vy - RULER + tl.scrollTop;
  const beat = x / App.ppb, ti = Math.floor(y / App.trackH), t = vy > RULER ? App.p.tracks[ti] : null;
  let clip = null, edge = null;
  if (t) for (const c of t.clips) {
    const cx = c.start * App.ppb, cw = c.len * App.ppb;
    if (x >= cx && x <= cx + cw) { clip = c; if (x > cx + cw - 7) edge = 'r'; else if (x < cx + 6) edge = 'l'; }
  }
  return { vx, vy, beat, ruler: vy <= RULER, t, ti, clip, edge };
}
function snapBeat(b, e) { if (e && e.altKey) return Math.max(0, Math.round(b * 4) / 4); const g = App.ppb > 40 ? 1 : App.barBeats(); return Math.max(0, Math.round(b / g) * g); }
function initArrange() {
  const tl = $('#tl');
  tl.addEventListener('scroll', () => { $('#headList').scrollTop = tl.scrollTop; App.dirty = true; });
  tl.addEventListener('wheel', e => {
    if (!e.ctrlKey) return; e.preventDefault();
    const hit = arrHit(e); App.ppb = clamp(App.ppb * (e.deltaY < 0 ? 1.15 : 0.87), 4, 200);
    tl.scrollLeft = hit.beat * App.ppb - hit.vx; App.dirty = true;
  }, { passive: false });
  tl.addEventListener('mousemove', e => { if (App.drag) return; const h = arrHit(e); tl.style.cursor = h.ruler ? 'pointer' : h.edge ? 'ew-resize' : h.clip ? 'grab' : 'default'; });
  tl.addEventListener('dblclick', e => {
    const h = arrHit(e); if (!h.t || h.clip) return;
    if (h.t.type === 'audio') { App.selTrackId = h.t.id; App.pos = snapBeat(h.beat); $('#fileAudio').click(); return; }
    snap(); const bb = App.barBeats(), s = Math.floor(h.beat / bb) * bb, kit = Lib.INST[h.t.inst]?.type === 'kit';
    const c = { id: uid(), start: s, len: bb * (kit ? 1 : 4), notes: [] }; h.t.clips.push(c); selectTrack(h.t.id, c.id); refreshAll();
  });
  tl.addEventListener('mousedown', e => {
    if (e.button !== 0 || e.target !== tl && e.target !== $('#tlSpacer')) { if (e.button !== 0) return; }
    App.focus = 'arr';
    const h = arrHit(e), tlr = tl.getBoundingClientRect();
    if (e.clientX - tlr.left > tl.clientWidth || e.clientY - tlr.top > tl.clientHeight) return; // kaydırma çubuğu
    if (h.ruler) {
      if (e.shiftKey || h.vy > 16) { // döngü bölgesi çiz
        const st = snapBeat(h.beat, e); App.drag = { type: 'loop', st, moved: false };
        return;
      }
      setPos(Math.max(0, h.beat)); App.drag = { type: 'pos' }; return;
    }
    if (!h.t) { App.selClipId = null; App.dirty = true; refreshEditor(); return; }
    if (!h.clip) { setPos(snapBeat(h.beat, e)); selectTrack(h.t.id, null); return; }
    selectTrack(h.t.id, h.clip.id);
    let c = h.clip;
    if (e.ctrlKey && !h.edge) { snap(); c = dupClip(h.t, c, c.start); App.selClipId = c.id; App.dragSnapped = true; }
    App.drag = { type: h.edge ? 'edge' + h.edge : 'move', c, t: h.t, b0: h.beat, start: c.start, len: c.len, off: c.off || 0, durS: c.durS, snapped: !!App.dragSnapped, ti: h.ti };
    App.dragSnapped = false;
  });
  window.addEventListener('mousemove', e => {
    const d = App.drag; if (!d) return;
    if (d.type === 'pos') { setPos(Math.max(0, arrHit(e).beat)); return; }
    const h = arrHit(e);
    if (d.type === 'loop') { const b = snapBeat(h.beat, e); App.p.loop = { on: true, start: Math.min(d.st, b), end: Math.max(d.st, b) }; d.moved = true; $('#bLoop').classList.add('on'); App.dirty = true; return; }
    const db = h.beat - d.b0; if (!d.snapped && Math.abs(db * App.ppb) > 3) { snap(); d.snapped = true; }
    if (!d.snapped) return;
    const c = d.c, g = e.altKey ? 0.25 : (App.ppb > 40 ? 1 : App.barBeats() / (App.ppb < 14 ? 1 : 4)), q = b => Math.round(b / g) * g;
    if (d.type === 'move') {
      c.start = Math.max(0, d.start + q(db));
      const nt = App.p.tracks[clamp(h.ti, 0, App.p.tracks.length - 1)];
      if (h.vy > RULER && nt && nt !== d.t && nt.type === d.t.type) { d.t.clips = d.t.clips.filter(x => x !== c); nt.clips.push(c); d.t = nt; App.selTrackId = nt.id; buildHeads(); }
    } else if (d.type === 'edger') {
      let nl = Math.max(g, d.len + q(db));
      if (d.t.type === 'audio') { const buf = App.audio.get(c.buf); nl = Math.min(nl, (buf.duration - c.off) / App.spb()); c.durS = nl * App.spb(); }
      c.len = nl;
    } else if (d.type === 'edgel') {
      let ds = clamp(q(db), -d.start, d.len - g);
      if (d.t.type === 'audio') { ds = Math.max(ds, -d.off / App.spb()); c.off = d.off + ds * App.spb(); c.durS = (d.len - ds) * App.spb(); }
      else { const sh = ds; c.notes = c.notes.map(n => n); App.drag.shift = sh; }
      c.start = d.start + ds; c.len = d.len - ds;
      if (d.t.type !== 'audio') { if (!d.orig) d.orig = c.notes.map(n => n.s); c.notes.forEach((n, i) => n.s = d.orig[i] - ds); }
    }
    App.dirty = true; refreshEditor();
  });
  window.addEventListener('mouseup', () => {
    const d = App.drag; App.drag = null; if (!d) return;
    if (d.type === 'loop' && !d.moved) { setPos(d.st); }
    if (d.c && d.type === 'edgel' && d.t.type !== 'audio') { d.c.notes = d.c.notes.filter(n => n.s >= -1e-6); }
    if (d.snapped || d.type === 'loop') App.saveDirty = true;
    App.dirty = true;
  });
}
function dupClip(t, c, start) { const n = JSON.parse(JSON.stringify(c)); n.id = uid(); n.start = start; t.clips.push(n); return n; }
function setPos(b) {
  if (App.tr.playing) { App.pos = b; App.tr.start(b); App.playFrom = b; } else App.pos = b;
  App.dirty = true;
}
function deleteSelClip() {
  const c = App.clip(), t = App.clipTrack(); if (!c) return;
  snap(); t.clips = t.clips.filter(x => x !== c); App.selClipId = null; refreshAll(); msg('Bölge silindi');
}
function duplicateSelClip() { const c = App.clip(), t = App.clipTrack(); if (!c) return; snap(); const n = dupClip(t, c, c.start + c.len); App.selClipId = n.id; refreshAll(); }
function splitSelClip() {
  const c = App.clip(), t = App.clipTrack(), b = App.pos; if (!c || b <= c.start || b >= c.start + c.len) return msg('Bölmek için çalma çizgisini bölgenin üzerine getirin');
  snap(); const k = b - c.start, n = JSON.parse(JSON.stringify(c)); n.id = uid(); n.start = b; n.len = c.len - k; c.len = k;
  if (t.type === 'audio') { n.off = (c.off || 0) + k * App.spb(); n.durS = n.len * App.spb(); c.durS = c.len * App.spb(); }
  else { n.notes = c.notes.filter(x => x.s >= k).map(x => Object.assign({}, x, { s: x.s - k })); c.notes = c.notes.filter(x => x.s < k); }
  t.clips.push(n); refreshAll(); msg('Bölge ikiye bölündü');
}

// ---------------- Piyano rulosu ----------------
const KEYW = 64, PR_TOP = 108, PR_BOT = 21;
App.ppbR = 90;
function prInfo() {
  const t = App.track(), c = App.clip(), inst = t && t.type === 'inst' ? Lib.INST[t.inst] : null, kit = inst && inst.type === 'kit';
  const rows = kit ? inst.pads.length : PR_TOP - PR_BOT + 1, rh = kit ? 20 : 13;
  return { t, c: c && t && t.clips.includes(c) ? c : null, inst, kit, rows, rh, rowNote: r => kit ? r : PR_TOP - r, noteRow: n => kit ? n : PR_TOP - n };
}
function drawPiano() {
  const pr = $('#pr'), { g, w, h } = fitCanvas($('#prCanvas'), $('#prWrap')), I = prInfo(), ppb = App.ppbR;
  const sx = pr.scrollLeft, sy = pr.scrollTop;
  g.fillStyle = '#1c1e22'; g.fillRect(0, 0, w, h);
  if (!I.t || I.t.type !== 'inst') {
    g.fillStyle = '#888'; g.font = '14px system-ui';
    g.fillText(I.t ? 'Bu bir ses kaydı parçası. Bölgeleri yukarıdaki zaman çizelgesinde taşıyıp kırpabilirsiniz.' : 'Soldaki listeden bir enstrüman seçip ＋ ile parça ekleyin.', 20, 40); return;
  }
  const len = I.c ? I.c.len : App.barBeats() * 4;
  $('#prSpacer').style.width = (KEYW + len * ppb + 200) + 'px'; $('#prSpacer').style.height = (I.rows * I.rh) + 'px';
  for (let r = 0; r < I.rows; r++) {
    const y = r * I.rh - sy; if (y > h || y + I.rh < 0) continue; const n = I.rowNote(r);
    const black = !I.kit && [1, 3, 6, 8, 10].includes(n % 12);
    g.fillStyle = black ? '#191b1f' : (I.kit && r % 2 ? '#202227' : '#24262b'); g.fillRect(KEYW, y, w, I.rh);
    if (!I.kit && n % 12 === 0) { g.fillStyle = '#3a3d44'; g.fillRect(KEYW, y + I.rh - 1, w, 1); }
  }
  const grid = +$('#grid').value, bb = App.barBeats();
  for (let b = 0; b <= len + 1e-6; b += grid) {
    const x = KEYW + b * ppb - sx; if (x < KEYW || x > w) continue;
    const bar = Math.abs(b / bb - Math.round(b / bb)) < 1e-6, beat = Math.abs(b - Math.round(b)) < 1e-6;
    g.fillStyle = bar ? '#5a5f69' : beat ? '#3a3d44' : '#2a2c31'; g.fillRect(x, 0, 1, h);
  }
  const ex = KEYW + len * ppb - sx; g.fillStyle = '#0007'; g.fillRect(ex, 0, w, h);
  if (I.c) for (const n of I.c.notes) {
    const r = I.noteRow(n.p); if (r < 0 || r >= I.rows) continue;
    const x = KEYW + n.s * ppb - sx, y = r * I.rh - sy, nw = Math.max(3, n.d * ppb - 1);
    if (x + nw < KEYW || x > w) continue;
    const a = 0.45 + 0.55 * n.v / 127;
    g.fillStyle = n === App.selNote ? '#ffffff' : `rgba(${I.kit ? '255,179,71' : '95,178,255'},${a})`;
    g.fillRect(x, y + 1, nw, I.rh - 2); g.strokeStyle = '#000'; g.strokeRect(x + 0.5, y + 1.5, nw - 1, I.rh - 3);
    if (!I.kit && nw > 28 && I.rh > 11) { g.fillStyle = '#000'; g.font = '9px system-ui'; g.fillText(noteName(n.p), x + 2, y + I.rh - 3); }
  }
  // tuşlar
  for (let r = 0; r < I.rows; r++) {
    const y = r * I.rh - sy; if (y > h || y + I.rh < 0) continue; const n = I.rowNote(r);
    const black = !I.kit && [1, 3, 6, 8, 10].includes(n % 12);
    g.fillStyle = I.kit ? '#33363d' : black ? '#111' : '#e8e8e8'; g.fillRect(0, y, KEYW, I.rh);
    g.fillStyle = '#000'; g.fillRect(0, y + I.rh - 1, KEYW, 1);
    g.font = '10px system-ui';
    if (I.kit) { g.fillStyle = '#ddd'; g.fillText(I.inst.pads[r].name.slice(0, 11), 3, y + 14); }
    else if (n % 12 === 0) { g.fillStyle = '#333'; g.fillText(noteName(n), 30, y + 10); }
  }
  // çalma çizgisi
  if (I.c) { const b = App.curBeat() - I.c.start; if (b >= 0 && b <= I.c.len) { g.fillStyle = '#fff'; g.fillRect(KEYW + b * ppb - sx, 0, 1.5, h); } }
  else { g.fillStyle = '#aaa'; g.font = '13px system-ui'; g.fillText('Nota yazmak için ızgaraya tıklayın (yeni bölge otomatik oluşur).', KEYW + 20, 30); }
}
function prHit(e) {
  const pr = $('#pr'), r = pr.getBoundingClientRect(), I = prInfo();
  const vx = e.clientX - r.left, x = vx - KEYW + pr.scrollLeft, y = e.clientY - r.top + pr.scrollTop;
  const beat = x / App.ppbR, row = Math.floor(y / I.rh), note = I.rowNote(row);
  let hit = null, edge = false;
  if (I.c) for (let i = I.c.notes.length - 1; i >= 0; i--) { const n = I.c.notes[i]; if (I.noteRow(n.p) === row && beat >= n.s && beat <= n.s + n.d) { hit = n; edge = (n.s + n.d - beat) * App.ppbR < 6 && n.d * App.ppbR > 10; break; } }
  return { I, vx, beat, row, note, hit, edge, keys: vx < KEYW };
}
function ensureClip(t, atBeat) {
  let c = App.clip(); if (c && t.clips.includes(c)) return c;
  const bb = App.barBeats(), s = Math.floor((atBeat ?? App.pos) / bb) * bb, kit = Lib.INST[t.inst]?.type === 'kit';
  c = t.clips.find(x => x.start <= s && x.start + x.len > s);
  if (!c) { c = { id: uid(), start: s, len: bb * (kit ? 1 : 4), notes: [] }; t.clips.push(c); }
  App.selClipId = c.id; App.dirty = true; return c;
}
App.lastLen = 0.5;
function initPiano() {
  const pr = $('#pr');
  pr.addEventListener('scroll', () => App.dirty = true);
  pr.addEventListener('wheel', e => { if (!e.ctrlKey) return; e.preventDefault(); App.ppbR = clamp(App.ppbR * (e.deltaY < 0 ? 1.15 : 0.87), 15, 600); App.dirty = true; }, { passive: false });
  pr.addEventListener('contextmenu', e => e.preventDefault());
  pr.addEventListener('mousemove', e => { if (App.prDrag) return; const h = prHit(e); pr.style.cursor = h.keys ? 'pointer' : h.edge ? 'ew-resize' : h.hit ? 'move' : 'crosshair'; });
  pr.addEventListener('mousedown', e => {
    const h = prHit(e), I = h.I; App.focus = 'pr';
    if (!I.t || I.t.type !== 'inst' || h.row < 0 || h.row >= I.rows) return;
    const r = pr.getBoundingClientRect(); if (e.clientX - r.left > pr.clientWidth || e.clientY - r.top > pr.clientHeight) return;
    if (h.keys) { noteDown(h.note, 100, 'p'); const up = () => { noteUp(h.note, 'p'); window.removeEventListener('mouseup', up); }; window.addEventListener('mouseup', up); return; }
    const grid = +$('#grid').value;
    if (e.button === 2) { if (h.hit) { snap(); I.c.notes = I.c.notes.filter(n => n !== h.hit); App.dirty = true; } return; }
    if (h.hit) {
      App.selNote = h.hit; snap();
      let n = h.hit; if (e.ctrlKey || e.altKey) { n = Object.assign({}, h.hit); I.c.notes.push(n); App.selNote = n; }
      App.prDrag = { type: h.edge ? 'len' : 'move', n, b0: h.beat, s0: n.s, d0: n.d, p0: n.p, row0: h.row, grid };
      const v = App.eng.play(App.p, I.t, App.ctx.currentTime, n.p, n.v); v && v.release(App.ctx.currentTime + 0.25);
    } else {
      if (h.beat < 0) return;
      snap(); const c = ensureClip(I.t);
      const s = Math.floor(h.beat / grid) * grid; if (s >= c.len) { c.len = Math.ceil((s + grid) / App.barBeats()) * App.barBeats(); }
      const n = { s, d: I.kit ? grid : Math.min(App.lastLen, c.len - s), p: h.note, v: 100 };
      c.notes.push(n); App.selNote = n;
      App.prDrag = { type: 'len', n, b0: h.beat, s0: n.s, d0: n.d, grid, fresh: true };
      const v = App.eng.play(App.p, I.t, App.ctx.currentTime, n.p, n.v); v && v.release(App.ctx.currentTime + 0.25);
    }
    App.dirty = true; refreshArrangeOnly();
  });
  pr.addEventListener('dblclick', e => { const h = prHit(e); if (h.hit) { h.I.c.notes = h.I.c.notes.filter(n => n !== h.hit); App.selNote = null; App.dirty = true; } });
  window.addEventListener('mousemove', e => {
    const d = App.prDrag; if (!d) return; const h = prHit(e), q = b => Math.round(b / d.grid) * d.grid, c = App.clip();
    if (d.type === 'len') { d.n.d = Math.max(d.grid / (e.altKey ? 4 : 1), q(d.d0 + h.beat - d.b0) || d.grid); if (d.fresh) d.n.d = Math.max(d.grid, q(h.beat - d.s0 + d.grid / 2) || d.grid); }
    else {
      d.n.s = Math.max(0, d.s0 + q(h.beat - d.b0));
      const I = h.I, nr = clamp(h.row, 0, I.rows - 1), np = I.rowNote(nr);
      if (np !== d.n.p) { d.n.p = np; const v = App.eng.play(App.p, I.t, App.ctx.currentTime, np, d.n.v); v && v.release(App.ctx.currentTime + 0.2); }
    }
    if (c && d.n.s + d.n.d > c.len) c.len = Math.ceil((d.n.s + d.n.d) / App.barBeats()) * App.barBeats();
    App.dirty = true;
  });
  window.addEventListener('mouseup', () => { const d = App.prDrag; if (!d) return; App.prDrag = null; if (!prInfo().kit) App.lastLen = d.n.d; App.saveDirty = true; refreshEditor(); });
  $('#bQuant').onclick = () => { const c = App.clip(); if (!c) return; snap(); const g = +$('#grid').value; c.notes.forEach(n => { n.s = Math.round(n.s / g) * g; n.d = Math.max(g, Math.round(n.d / g) * g); }); App.dirty = true; msg('Notalar ızgaraya hizalandı'); };
  const tp = k => { const c = App.clip(); if (!c || prInfo().kit) return; snap(); c.notes.forEach(n => n.p = clamp(n.p + k, 0, 127)); App.dirty = true; };
  $('#bTrUp').onclick = () => tp(12); $('#bTrDn').onclick = () => tp(-12); $('#bSemiUp').onclick = () => tp(1); $('#bSemiDn').onclick = () => tp(-1);
  $('#bClearClip').onclick = () => { const c = App.clip(); if (!c) return; snap(); c.notes = []; App.dirty = true; refreshEditor(); };
  $('#clipLen').onchange = () => { const c = App.clip(); if (!c) return; snap(); setClipLen(c, +$('#clipLen').value, false); };
  $('#grid').onchange = () => App.dirty = true;
}
function setClipLen(c, bars, repeat) {
  const bb = App.barBeats(), nl = clamp(Math.round(bars), 1, 64) * bb, t = App.clipTrack(c.id);
  if (t && t.type === 'audio') return;
  if (repeat && nl > c.len && c.notes.length) {
    const src = c.notes.filter(n => n.s < c.len), L = c.len;
    for (let k = 1; k * L < nl; k++) for (const n of src) if (n.s + k * L < nl) c.notes.push(Object.assign({}, n, { s: n.s + k * L }));
  }
  c.len = nl; refreshAll();
}
function scrollPianoToNotes() {
  const I = prInfo(), pr = $('#pr'); $('#prSpacer').style.height = (I.rows * I.rh) + 'px'; if (I.kit) { pr.scrollTop = 0; return; }
  const ns = I.c && I.c.notes.length ? I.c.notes : null;
  const center = ns ? ns.reduce((a, n) => a + n.p, 0) / ns.length : 64;
  pr.scrollTop = Math.max(0, I.noteRow(Math.round(center)) * I.rh - pr.clientHeight / 2); pr.scrollLeft = 0;
}

// ---------------- Ritim makinesi (adım sıralayıcı) ----------------
function applyPreset(t, rh) {
  snap();
  if (rh.sig[0] !== App.p.sig[0] || rh.sig[1] !== App.p.sig[1]) { App.p.sig = rh.sig.slice(); msg(`Ölçü ${rh.sig[0]}/${rh.sig[1]} olarak ayarlandı`); }
  t.inst = rh.kit; if (/^Ritim|^Davul|Vurmalı|Davul Seti|kit/i.test(t.name) || Lib.INST[t.name]) t.name = 'Ritim: ' + rh.name; else if (t.name.startsWith('Ritim: ')) t.name = 'Ritim: ' + rh.name;
  const bb = App.barBeats(); let c = App.clip();
  if (!c || !t.clips.includes(c)) { c = { id: uid(), start: Math.floor(App.pos / bb) * bb, len: bb, notes: [] }; t.clips.push(c); App.selClipId = c.id; }
  const bars = Math.max(1, Math.round(c.len / bb)); c.len = bars * bb;
  c.notes = patternNotes(rh, bars, bb);
  const res = bb / Math.max(...Object.values(rh.rows).map(s => s.length));
  $('#stepRes').value = [0.25, 0.5, 0.3333].reduce((a, v) => Math.abs(v - res) < Math.abs(a - res) ? v : a, 0.25);
  refreshAll();
}
function buildSteps() {
  const box = $('#steps'); box.innerHTML = '';
  const I = prInfo();
  if (!I.t || !I.kit) {
    box.innerHTML = '<p style="color:#999;padding:10px">Ritim makinesi davul/vurmalı parçalarla çalışır. <button id="bMkDrum">🥁 Yeni ritim parçası ekle</button></p>';
    $('#bMkDrum').onclick = () => { const t = addInstTrack('kit_akustik'); applyPreset(t, Rhythms[1]); };
    return;
  }
  if (!I.c) { box.innerHTML = '<p style="color:#999;padding:10px"><button id="bMkClip">＋ Bu parçaya ritim bölgesi oluştur</button></p>'; $('#bMkClip').onclick = () => { snap(); ensureClip(I.t); refreshAll(); }; return; }
  let res = +$('#stepRes').value; if (Math.abs(res - 0.3333) < 1e-3) res = 1 / 3;
  const n = Math.round(I.c.len / res);
  $('#stepLen').value = Math.round(I.c.len / App.barBeats());
  I.inst.pads.forEach((pad, pi) => {
    const row = el('div', 'srow'), nm = el('div', 'pn', esc(pad.name)); nm.title = 'Dinle';
    nm.onclick = () => { App.eng.play(App.p, I.t, App.ctx.currentTime, pi, 110); };
    row.appendChild(nm);
    for (let i = 0; i < n; i++) {
      const s = i * res, note = I.c.notes.find(x => x.p === pi && Math.abs(x.s - s) < res / 2 - 1e-6);
      const beatStart = Math.abs(s - Math.round(s)) < 1e-6;
      const st = el('div', 'st' + (beatStart && i ? ' g' : '') + (Math.floor(s) % 2 ? '' : ' beat') + (note ? (note.v > 115 ? ' v3' : note.v < 75 ? ' v1' : ' v2') : ''));
      st.dataset.i = i;
      st.onmousedown = e => {
        e.preventDefault(); snap();
        if (e.button === 2) { if (note) note.v = note.v > 115 ? 60 : note.v < 75 ? 100 : 125; else I.c.notes.push({ s, d: res, p: pi, v: 125 }); }
        else if (note) I.c.notes = I.c.notes.filter(x => x !== note);
        else { I.c.notes.push({ s, d: res, p: pi, v: 100 }); App.eng.play(App.p, I.t, App.ctx.currentTime, pi, 100); }
        buildSteps(); App.dirty = true;
      };
      st.oncontextmenu = e => e.preventDefault();
      row.appendChild(st);
    }
    box.appendChild(row);
  });
}
function stepPlayhead() {
  if (App.tab !== 'steps') return; const c = App.clip(); if (!c) return;
  let res = +$('#stepRes').value; if (Math.abs(res - 0.3333) < 1e-3) res = 1 / 3;
  const b = App.curBeat() - c.start, k = b >= 0 && b < c.len && App.tr.playing ? Math.floor(b / res + 1e-6) : -1;
  if (k === App.lastStep) return; App.lastStep = k;
  document.querySelectorAll('#steps .st.play').forEach(e => e.classList.remove('play'));
  if (k >= 0) document.querySelectorAll(`#steps .st[data-i="${k}"]`).forEach(e => e.classList.add('play'));
}
function initSteps() {
  const sel = $('#preset'); sel.innerHTML = '<option value="">— Seçin —</option>';
  let lastKit = null, og = null;
  Rhythms.forEach((r, i) => {
    if (r.kit !== lastKit) { og = el('optgroup'); og.label = Lib.INST[r.kit]?.name || r.kit; sel.appendChild(og); lastKit = r.kit; }
    const o = el('option', '', esc(`${r.name}  (${r.sig[0]}/${r.sig[1]})`)); o.value = i; og.appendChild(o);
  });
  sel.onchange = () => {
    if (sel.value === '') return; let t = App.track();
    if (!t || t.type !== 'inst' || Lib.INST[t.inst]?.type !== 'kit') t = addInstTrack(Rhythms[sel.value].kit);
    applyPreset(t, Rhythms[sel.value]); sel.value = '';
  };
  $('#stepRes').onchange = buildSteps;
  $('#stepLen').onchange = () => { const c = App.clip(); if (!c || !prInfo().kit) return; snap(); setClipLen(c, +$('#stepLen').value, true); };
  $('#bStepClear').onclick = () => { const c = App.clip(); if (!c || !prInfo().kit) return; snap(); c.notes = []; refreshAll(); };
}

// ---------------- Mikser ----------------
function knob(label, val, min, max, step, fn, fmt) {
  const w = el('div', 'kn'), i = el('input'), sp = el('span', '', fmt(val));
  i.type = 'range'; i.min = min; i.max = max; i.step = step; i.value = val; i.title = label + ' (çift tık: sıfırla)';
  i.onpointerdown = () => snap(); i.oninput = () => { fn(+i.value); sp.textContent = fmt(+i.value); App.eng.syncAll(App.p); };
  i.ondblclick = () => { snap(); i.value = min < 0 ? 0 : 0; i.oninput(); };
  w.append(el('span', '', label), i, sp); return w;
}
const dB = v => (v > 0 ? '+' : '') + Math.round(v) + 'dB', pct = v => Math.round(v * 100) + '%', panF = v => Math.abs(v) < 0.02 ? 'C' : (v < 0 ? 'L' : 'R') + Math.round(Math.abs(v) * 100);
function buildMixer() {
  const box = $('#mixer'); if (!box) return; box.innerHTML = '';
  App.meters = [];
  for (const t of App.p.tracks) {
    const ch = el('div', 'ch'); ch.onmousedown = e => { if (e.target === ch || e.target.classList.contains('nm')) selectTrack(t.id); };
    const nm = el('div', 'nm', esc(t.name)); nm.style.borderColor = t.color; nm.title = t.name; ch.appendChild(nm);
    ch.append(knob('Bas', t.eq.lo, -15, 15, 0.5, v => t.eq.lo = v, dB), knob('Orta', t.eq.mid, -15, 15, 0.5, v => t.eq.mid = v, dB), knob('Tiz', t.eq.hi, -15, 15, 0.5, v => t.eq.hi = v, dB),
      knob('Kompr.', t.comp, 0, 1, 0.01, v => t.comp = v, pct), knob('Yankı', t.rev, 0, 1, 0.01, v => t.rev = v, pct), knob('Eko', t.dly, 0, 1, 0.01, v => t.dly = v, pct), knob('Pan', t.pan, -1, 1, 0.01, v => t.pan = v, panF));
    const fad = el('div', 'fad'), f = el('input'); f.type = 'range'; f.min = 0; f.max = 1; f.step = 0.01; f.value = t.vol; f.title = 'Ses seviyesi';
    f.onpointerdown = () => snap(); f.oninput = () => { t.vol = +f.value; App.eng.syncAll(App.p); buildHeadsSoon(); }; f.dataset.tid = t.id;
    const cv = el('canvas'); cv.width = 10; cv.height = 92; fad.append(f, cv); ch.appendChild(fad);
    App.meters.push({ cv, id: t.id });
    const bt = el('div', 'btns'), m = el('button', 'b-m' + (t.mute ? ' on' : ''), 'M'), s = el('button', 'b-s' + (t.solo ? ' on' : ''), 'S');
    m.onclick = () => { t.mute = !t.mute; App.saveDirty = true; App.eng.syncAll(App.p); buildMixer(); buildHeads(); }; s.onclick = () => { t.solo = !t.solo; App.saveDirty = true; App.eng.syncAll(App.p); buildMixer(); buildHeads(); };
    bt.append(m, s); ch.appendChild(bt); box.appendChild(ch);
  }
  const M = App.p.master, ch = el('div', 'ch master'); ch.appendChild(el('div', 'nm', 'ANA ÇIKIŞ'));
  ch.append(knob('Bas', M.lo, -12, 12, 0.5, v => M.lo = v, dB), knob('Orta', M.mid, -12, 12, 0.5, v => M.mid = v, dB), knob('Tiz', M.hi, -12, 12, 0.5, v => M.hi = v, dB),
    knob('Kompr.', M.comp, 0, 1, 0.01, v => M.comp = v, pct), knob('Tekrar', M.dlyFb, 0, 0.85, 0.01, v => M.dlyFb = v, pct));
  const ds = el('select'); [['0.25', '1/16'], ['0.5', '1/8'], ['0.75', '1/8 noktalı'], ['1', '1/4'], ['1.5', '1/4 noktalı'], ['2', '1/2']].forEach(([v, n]) => { const o = el('option', '', 'Eko: ' + n); o.value = v; ds.appendChild(o); });
  ds.value = String(M.dlyBeats); ds.onchange = () => { snap(); M.dlyBeats = +ds.value; App.eng.syncAll(App.p); }; ch.appendChild(ds);
  const fad = el('div', 'fad'), f = el('input'); f.type = 'range'; f.min = 0; f.max = 1.2; f.step = 0.01; f.value = M.vol; f.onpointerdown = () => snap(); f.oninput = () => { M.vol = +f.value; App.eng.syncAll(App.p); };
  const cv = el('canvas'); cv.width = 10; cv.height = 92; fad.append(f, cv); ch.appendChild(fad); App.meters.push({ cv, id: '__master' });
  const lim = el('button', M.limit !== false ? 'on' : '', 'Limiter'); lim.title = 'Ana çıkışta sesin patlamasını (clip) engeller';
  lim.onclick = () => { snap(); M.limit = M.limit === false; App.eng.syncAll(App.p); buildMixer(); }; ch.appendChild(lim);
  box.appendChild(ch);
}
let headsT = 0; function buildHeadsSoon() { clearTimeout(headsT); headsT = setTimeout(buildHeads, 150); }
function syncMixerVals() { document.querySelectorAll('#mixer .fad input[data-tid]').forEach(f => { const t = App.track(f.dataset.tid); if (t) f.value = t.vol; }); }
const meterBuf = new Float32Array(2048);
function levelOf(an) { const n = an.fftSize; an.getFloatTimeDomainData(meterBuf.subarray(0, n)); let m = 0; for (let i = 0; i < n; i++) { const a = Math.abs(meterBuf[i]); if (a > m) m = a; } return m; }
function drawMeter(cv, lv) {
  const g = cv.getContext('2d'), h = cv.height, w = cv.width; g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  const db = 20 * Math.log10(lv + 1e-6), k = clamp((db + 48) / 48, 0, 1), y = h * (1 - k);
  const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, '#2fb35a'); gr.addColorStop(0.75, '#e8d23a'); gr.addColorStop(1, '#ff4d4d');
  g.fillStyle = gr; g.fillRect(0, y, w, h - y);
}
function drawMeters() {
  const ml = levelOf(App.eng.analyser); drawMeter($('#mMeter'), ml);
  if (App.tab !== 'mixer' || !App.meters) return;
  for (const m of App.meters) {
    if (m.id === '__master') { drawMeter(m.cv, ml); continue; }
    const s = App.eng.strips.get(m.id); drawMeter(m.cv, s ? levelOf(s.meter) : 0);
  }
}

// ---------------- Ekran klavyesi ----------------
function buildKeyboard() {
  const kb = $('#kb'); kb.innerHTML = ''; const start = (App.kbOct + 1) * 12 - 12, wkeys = [];
  for (let n = start; n < start + 36; n++) if (![1, 3, 6, 8, 10].includes(n % 12)) wkeys.push(n);
  const ww = 100 / wkeys.length; let wi = 0;
  for (let n = start; n < start + 36; n++) {
    const black = [1, 3, 6, 8, 10].includes(n % 12), k = el('div', black ? 'bk' : 'wk'); k.dataset.n = n;
    if (black) { k.style.left = (wi * ww - ww * 0.3) + '%'; k.style.width = (ww * 0.6) + '%'; }
    else { k.style.left = (wi * ww) + '%'; k.style.width = ww + '%'; if (n % 12 === 0) k.innerHTML = `<small>${noteName(n)}</small>`; wi++; }
    k.onpointerdown = e => { e.preventDefault(); k.setPointerCapture(e.pointerId); noteDown(n, 100, 'v'); };
    k.onpointerup = k.onpointercancel = () => noteUp(n, 'v');
    kb.appendChild(k);
  }
  $('#kbOct').textContent = 'Oktav ' + App.kbOct;
}
function kbLight(n, on) { const k = document.querySelector(`#kb [data-n="${n}"]`); if (k) k.classList.toggle('on', on); }

// ---------------- Sekmeler ve yenileme ----------------
function showTab(t) {
  App.tab = t;
  const st = App.track(), isKit = st && st.type === 'inst' && Lib.INST[st.inst]?.type === 'kit';
  const want = t === 'steps' ? (x => x.type === 'inst' && Lib.INST[x.inst]?.type === 'kit') : t === 'piano' ? (x => x.type === 'inst' && Lib.INST[x.inst]?.type !== 'kit') : null;
  if (want && st && !want(st) && (t === 'steps' ? !isKit : isKit)) { const o = App.p.tracks.find(want); if (o) { App.selTrackId = o.id; App.selClipId = o.clips[0]?.id || null; buildHeads(); buildLibrary(); } }
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
  document.querySelectorAll('.pane').forEach(p => p.classList.toggle('on', p.id === 'pane-' + t));
  refreshEditor(); if (t === 'piano') setTimeout(scrollPianoToNotes, 0);
}
function refreshEditor() {
  const t = App.track(), c = App.clip();
  $('#clipInfo').textContent = t ? `${t.name}${c ? ` · bölge ${(c.start / App.barBeats() + 1).toFixed(0)}. ölçü, ${Math.round(c.len / App.barBeats())} ölçü` : ''}` : '';
  if (c) $('#clipLen').value = Math.round(c.len / App.barBeats());
  if (App.tab === 'steps') buildSteps();
  if (App.tab === 'mixer') buildMixer();
  if (App.tab === 'keys') buildKeyboard();
  App.dirty = true;
}
function refreshArrangeOnly() { App.dirty = true; }
function refreshTop() {
  const p = App.p;
  $('#bpm').value = p.bpm; $('#sig').value = p.sig.join('/'); $('#root').value = p.root; $('#tuning').value = p.tuning; $('#swing').value = p.swing;
  $('#bLoop').classList.toggle('on', !!p.loop.on); $('#bMetro').classList.toggle('on', !!p.metro); $('#bCount').classList.toggle('on', !!p.countIn);
  document.title = `${p.name} — OkiRa Stüdyo`;
}
function refreshAll() {
  if (App.selTrackId && !App.track()) App.selTrackId = null;
  if (!App.selTrackId && App.p.tracks.length) App.selTrackId = App.p.tracks[0].id;
  if (App.selClipId && !App.clip()) App.selClipId = null;
  App.eng.syncAll(App.p); buildHeads(); buildLibrary(); refreshTop(); refreshEditor(); App.dirty = true;
}
function updateLcd() {
  const b = App.curBeat(), bb = App.barBeats(), [, d] = App.p.sig, unit = 4 / d;
  const bar = Math.floor(b / bb) + 1, inBar = b - (bar - 1) * bb, beat = Math.floor(inBar / unit) + 1, sub = Math.floor((inBar / unit - beat + 1) * 4) + 1;
  $('#pos').textContent = `${bar}.${beat}.${Math.min(4, sub)}`;
  const s = b * App.spb(); $('#tim').textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${(s % 60).toFixed(1).padStart(4, '0')}`;
}
function loop() {
  const playing = App.tr.playing;
  if (playing || App.dirty || App.drag || App.prDrag) {
    drawArrange(); if (App.tab === 'piano') drawPiano(); App.dirty = false;
    if (playing && App.follow !== false) { const tl = $('#tl'), x = App.curBeat() * App.ppb; if (x > tl.scrollLeft + tl.clientWidth - 40 || x < tl.scrollLeft) tl.scrollLeft = Math.max(0, x - 60); }
  }
  updateLcd(); stepPlayhead(); drawMeters();
  requestAnimationFrame(loop);
}

// ---------------- Kaydetme / açma ----------------
const blobToDataUrl = b => new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
function usedBuffers(p) { const s = new Set(); p.tracks.forEach(t => t.type === 'audio' && t.clips.forEach(c => s.add(c.buf))); return s; }
async function saveFile() {
  const name = await ask('Proje adı', App.p.name); if (!name) return;
  App.p.name = name; refreshTop(); msg('Kaydediliyor...');
  const audio = {}; for (const id of usedBuffers(App.p)) { const b = App.audio.get(id); if (b) audio[id] = await blobToDataUrl(encodeWav(b)); }
  download(new Blob([JSON.stringify({ app: 'OkiRa Stüdyo', v: 1, project: App.p, audio })], { type: 'application/json' }), safeName(name) + '.okst');
  App.saveDirty = false; msg('Proje kaydedildi: ' + safeName(name) + '.okst (İndirilenler klasörü)');
}
async function openFile(file) {
  try {
    const d = JSON.parse(await file.text()); if (!d.project) throw new Error('biçim');
    App.stop(); msg('Proje açılıyor...');
    const audio = new Map();
    for (const id in d.audio || {}) {
      const u = d.audio[id]; if (typeof u !== 'string' || !u.startsWith('data:audio/')) throw new Error('ses verisi');
      audio.set(id, await App.ctx.decodeAudioData(await (await fetch(u)).arrayBuffer()));
    }
    const prev = { p: App.p, audio: App.audio, undo: App.undoStack, redo: App.redoStack, t: App.selTrackId, c: App.selClipId };
    try { loadProject(d.project, audio); } catch (e) {
      Object.assign(App, { p: prev.p, audio: prev.audio, undoStack: prev.undo, redoStack: prev.redo, selTrackId: prev.t, selClipId: prev.c });
      App.peaks.clear(); refreshAll(); throw e;
    }
    msg('Proje açıldı: ' + d.project.name);
  } catch (e) { modal('<h3>Proje açılamadı</h3><p>Dosya bozuk veya bir OkiRa Stüdyo projesi (.okst) değil.</p>'); }
}
function loadProject(p, audio) {
  const def = blankProject();
  p = Object.assign(def, p); p.master = Object.assign(blankProject().master, p.master); p.loop = Object.assign({ on: false, start: 0, end: 16 }, p.loop);
  const num = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);
  p.tracks.forEach((t, i) => {
    t.eq = Object.assign({ lo: 0, mid: 0, hi: 0 }, t.eq); t.clips = Array.isArray(t.clips) ? t.clips : [];
    if (!/^#[0-9a-f]{3,8}$/i.test(t.color)) t.color = COLORS[i % COLORS.length];
    t.vol = num(t.vol, 0.8); t.pan = num(t.pan, 0); t.name = String(t.name ?? 'Parça'); t.id = String(t.id ?? uid());
  });
  App.p = p; App.audio = audio || new Map(); App.peaks.clear(); App.undoStack = []; App.redoStack = []; App.pos = 0;
  App.selTrackId = p.tracks[0]?.id || null; App.selClipId = p.tracks[0]?.clips[0]?.id || null;
  refreshAll(); setTimeout(scrollPianoToNotes, 0);
}
// otomatik kayıt (IndexedDB)
let idbP = null;
function idb() { return idbP || (idbP = new Promise((res, rej) => { const r = indexedDB.open('okira-studyo', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => { const db = r.result; db.onclose = db.onversionchange = () => { try { db.close(); } catch (e) {} idbP = null; }; res(db); }; r.onerror = e => { idbP = null; rej(e); }; })); }
async function idbPut(k, v) {
  const db = await idb();
  return new Promise(r => {
    let tx; try { tx = db.transaction('kv', 'readwrite'); } catch (e) { idbP = null; App.saveDirty = true; return r(); }
    tx.objectStore('kv').put(v, k); tx.oncomplete = r; tx.onerror = tx.onabort = () => { App.saveDirty = true; r(); };
  });
}
async function idbGet(k) { const db = await idb(); return new Promise(r => { const q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => r(q.result); q.onerror = () => r(null); }); }
async function autosave() {
  if (!App.saveDirty || App.drag || App.prDrag || App.recording) return; App.saveDirty = false;
  const audio = {}; for (const id of usedBuffers(App.p)) { const b = App.audio.get(id); if (b) { audio[id] = { sr: b.sampleRate, ch: [] }; for (let c = 0; c < b.numberOfChannels; c++) audio[id].ch.push(b.getChannelData(c)); } }
  try { await idbPut('autosave', { project: JSON.stringify(App.p), audio }); } catch (e) {}
}
async function loadAutosave() {
  try {
    const d = await idbGet('autosave'); if (!d) return false;
    const audio = new Map();
    for (const id in d.audio) { const a = d.audio[id], b = App.ctx.createBuffer(a.ch.length, a.ch[0].length, a.sr); a.ch.forEach((x, i) => b.copyToChannel(x, i)); audio.set(id, b); }
    loadProject(JSON.parse(d.project), audio); return true;
  } catch (e) { return false; }
}

// ---------------- WAV dışa aktarma ----------------
function safePeak(b) {
  let m = 0; for (let c = 0; c < b.numberOfChannels; c++) m = Math.max(m, DSP.peak(b.getChannelData(c)));
  if (m > 0.98) { const k = 0.98 / m; for (let c = 0; c < b.numberOfChannels; c++) { const d = b.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] *= k; } }
  return b;
}
async function exportDialog() {
  if (!App.p.tracks.length) return msg('Dışa aktarılacak parça yok');
  const v = await modal(`<h3>Şarkıyı WAV olarak kaydet</h3><p>Yüksek kaliteli WAV dosyası oluşturulur ve İndirilenler klasörüne kaydedilir.</p>`, [
    { t: 'Tüm şarkı', v: 'all', pri: true }, { t: 'Yalnızca döngü bölgesi', v: 'loop' }, { t: 'Her parça ayrı dosya', v: 'stems' }, { t: 'Vazgeç', v: null }]);
  if (!v) return; App.stop();
  const name = safeName(App.p.name);
  const prog = t => modal(`<h3>Hazırlanıyor...</h3><p>${t}</p><div class="prog"><div style="width:60%"></div></div>`, []);
  try {
    if (v === 'stems') {
      for (const t of App.p.tracks) { prog(esc(t.name)); const b = await renderOffline(App, { onlyTrack: t.id }); download(encodeWav(safePeak(b)), `${name} - ${safeName(t.name)}.wav`); }
    } else {
      prog('Şarkı oluşturuluyor'); const o = v === 'loop' ? { from: App.p.loop.start, to: App.p.loop.end, tail: 1 } : {};
      const b = await renderOffline(App, o); download(encodeWav(safePeak(b)), name + '.wav');
    }
    App.modalClose && App.modalClose(); msg('WAV dosyası İndirilenler klasörüne kaydedildi');
  } catch (e) { console.error(e); App.modalClose && App.modalClose(); modal('<h3>Hata</h3><p>Dışa aktarma başarısız: ' + esc(e.message) + '</p>'); }
}

// ---------------- Şarkıdan ses ayırma ----------------
async function separateDialog() {
  const go = await modal(`<h3>🎚 Şarkıdan ses ayırma</h3>
    <p>Bir şarkı dosyası seçin (MP3, WAV, M4A...). Program şarkıyı 4 parçaya ayırır:</p>
    <ul><li><b>Vokal</b> (şarkıcının sesi)</li><li><b>Davul / Ritim</b></li><li><b>Bas</b></li><li><b>Diğer enstrümanlar</b></li></ul>
    <p>Ayrıca vokalsiz <b>Karaoke (enstrümantal)</b> sürüm de hazırlanır. Parçalar projeye ayrı kanallar olarak eklenir; mikserden her birinin sesini açıp kısabilir, sessize alabilir veya WAV olarak kaydedebilirsiniz.</p>
    <p style="color:#e8b040">Not: İnternetsiz çalışan klasik yöntem kullanılır. En iyi sonuç, vokali ortada olan stereo şarkılarda alınır. Yapay zekâ tabanlı ücretli araçlar kadar temiz ayrım beklemeyin.</p>`,
    [{ t: 'Vazgeç', v: false }, { t: '📁 Şarkı dosyası seç', v: true, pri: true }]);
  if (!go) return;
  const f = await new Promise(r => { const i = $('#fileAudio'); App.fileForSep = r; i.value = ''; i.click(); });
  if (!f) return;
  App.stop();
  modal(`<h3>Ses ayrılıyor...</h3><p>${esc(f.name)}</p><div class="prog"><div id="sepBar"></div></div><p id="sepTxt" style="color:#999">Dosya okunuyor</p>`, []);
  try {
    const buf = await App.ctx.decodeAudioData(await f.arrayBuffer());
    if (buf.duration > 900) throw new Error('Şarkı 15 dakikadan uzun olamaz');
    $('#sepTxt').textContent = 'Analiz ediliyor (birkaç dakika sürebilir)';
    const stems = await Separator.separate(buf, pr => { const b = $('#sepBar'); if (b) b.style.width = Math.round(pr * 100) + '%'; const t = $('#sepTxt'); if (t) t.textContent = 'İşleniyor: %' + Math.round(pr * 100); });
    const sr = buf.sampleRate, mk = arr => { const b = App.ctx.createBuffer(2, arr[0].length, sr); b.copyToChannel(arr[0], 0); b.copyToChannel(arr[1], 1); return b; };
    const bufs = stems.map(mk);
    const kar = App.ctx.createBuffer(2, buf.length, sr);
    for (let c = 0; c < 2; c++) { const o = kar.getChannelData(c); for (let s = 1; s < 4; s++) { const x = stems[s][c]; for (let i = 0; i < o.length; i++) o[i] += x[i]; } }
    snap();
    const base = f.name.replace(/\.[^.]+$/, ''), cols = ['#e060c0', '#f0a030', '#4f8fff', '#5fd17a'];
    if (!App.p.tracks.length) App.pos = 0;
    const start = App.pos;
    bufs.forEach((b, i) => {
      const t = addAudioTrack(Separator.NAMES[i]); t.color = cols[i]; t.rev = 0;
      t.clips.push({ id: uid(), start, len: b.duration / App.spb(), durS: b.duration, off: 0, buf: addBuffer(b), gain: 0, name: `${Separator.NAMES[i]} — ${base}` });
    });
    refreshAll(); App.modalClose && App.modalClose();
    const box = `<h3>✅ Ayırma tamamlandı</h3><p>4 parça projeye eklendi. İsterseniz ayrı WAV dosyaları olarak da indirebilirsiniz:</p><div id="sepDl" style="display:flex;flex-direction:column;gap:6px"></div>`;
    const p = modal(box, [{ t: 'Kapat', v: true, pri: true }]);
    const dl = $('#sepDl');
    [...Separator.NAMES.map((n, i) => [n, bufs[i]]), ['Karaoke (vokalsiz)', kar]].forEach(([n, b]) => {
      const bt = el('button', '', '⬇ ' + esc(n) + '.wav'); bt.onclick = () => download(encodeWav(b), `${safeName(base)} - ${safeName(n)}.wav`); dl.appendChild(bt);
    });
    await p; msg('Ses ayırma tamamlandı');
  } catch (e) { console.error(e); App.modalClose && App.modalClose(); modal('<h3>Ses ayrılamadı</h3><p>' + esc(e.message || 'Dosya okunamadı') + '</p>'); }
}

// ---------------- Yardım ----------------
function help() {
  modal(`<h3>OkiRa Stüdyo — Nasıl kullanılır?</h3>
  <ul>
  <li><b>Enstrüman eklemek:</b> Soldaki listeden bir bölge açın, enstrümanın adına tıklayıp dinleyin, <b>＋</b> ile yeni parça ekleyin.</li>
  <li><b>Nota yazmak:</b> Alttaki <b>Piyano Rulosu</b>'nda ızgaraya tıklayın. Notayı sürükleyerek taşıyın, sağ kenarından çekerek uzatın, sağ tık ile silin.</li>
  <li><b>Ritim yapmak:</b> <b>Ritim Makinesi</b> sekmesinde "Hazır ritim" listesinden bir ritim seçin (Maksum, Çiftetelli, Rock, Trap...) veya kutucuklara tıklayarak kendiniz yapın.</li>
  <li><b>Canlı çalmak:</b> Bilgisayar klavyesinde <kbd>A W S E D F T G Y H U J K</kbd> tuşları notaları çalar. <kbd>Z</kbd>/<kbd>X</kbd> oktav değiştirir. USB MIDI klavye takarsanız otomatik çalışır.</li>
  <li><b>Kayıt:</b> Parçanın <b>⏺</b> düğmesine basıp (kayda hazırla) üstteki kırmızı <b>⏺</b> ile kaydı başlatın. Mikrofon kaydı için "＋ Parça → Mikrofon Kaydı" ekleyin.</li>
  <li><b>Makam / akort:</b> Üstteki "Makam/Akort" listesinden Hicaz, Rast, Uşşak, Saba gibi makamları seçince notalar koma sesleriyle (mikrotonal) çalar. "Kök" makamın karar sesidir.</li>
  <li><b>Mikser:</b> Her parçanın ses seviyesi, pan, bas/orta/tiz ekolayzır, kompresör, yankı ve eko ayarları. Ana çıkışta limiter vardır.</li>
  <li><b>Ses ayırma:</b> Üstteki <b>🎚 Ses Ayır</b> ile bir şarkıyı vokal, davul, bas ve diğer enstrümanlara ayırın.</li>
  <li><b>Kaydetme:</b> 💾 projeyi .okst dosyası olarak kaydeder, 📂 ile açarsınız. ⬇ WAV şarkıyı ses dosyası olarak verir. Çalışmanız ayrıca otomatik olarak saklanır.</li>
  </ul>
  <p><b>Kısayollar:</b> <kbd>Boşluk</kbd> çal/durdur · <kbd>R</kbd> kayıt · <kbd>C</kbd> döngü · <kbd>M</kbd> metronom · <kbd>Del</kbd> sil · <kbd>Ctrl+D</kbd> kopyala · <kbd>Ctrl+B</kbd> böl · <kbd>Ctrl+Z</kbd> geri al · <kbd>Ctrl+S</kbd> kaydet · <kbd>Ctrl+tekerlek</kbd> yakınlaştır</p>
  <p><b>Zaman çizelgesi:</b> Boş satıra çift tık yeni bölge oluşturur. Bölgeyi sürükleyerek taşıyın, kenarından çekerek uzatın, Ctrl ile sürükleyerek kopyalayın. Cetvelin alt yarısında sürükleyerek döngü bölgesi seçin.</p>`, [{ t: 'Kapat', v: true, pri: true }]);
}

// ---------------- Başlangıç ----------------
function initTop() {
  const sig = $('#sig'); ['4/4', '3/4', '2/4', '5/4', '6/8', '7/8', '8/8', '9/8', '10/8', '12/8', '5/8'].forEach(s => { const o = el('option', '', s); o.value = s; sig.appendChild(o); });
  const root = $('#root'); Lib.NOTE_NAMES.forEach((n, i) => { const o = el('option', '', n); o.value = i; root.appendChild(o); });
  const tu = $('#tuning'); Lib.TUNINGS.forEach(t => { const o = el('option', '', esc(t.name)); o.value = t.id; tu.appendChild(o); });
  $('#bpm').onchange = () => {
    const v = clamp(+$('#bpm').value || 100, 30, 300); snap(); App.p.bpm = v;
    App.p.tracks.forEach(t => t.type === 'audio' && t.clips.forEach(c => { if (c.durS) c.len = c.durS / App.spb(); }));
    App.tr.tempoChanged(); App.eng.syncAll(App.p); refreshAll();
  };
  sig.onchange = () => { snap(); App.p.sig = sig.value.split('/').map(Number); refreshAll(); };
  root.onchange = () => { snap(); App.p.root = +root.value; };
  tu.onchange = () => { snap(); App.p.tuning = tu.value; const t = Lib.TUNINGS.find(x => x.id === tu.value); msg('Akort: ' + t.name); };
  $('#swing').onchange = () => { snap(); App.p.swing = +$('#swing').value; };
  $('#bPlay').onclick = play; $('#bStop').onclick = () => { if (!App.tr.playing) App.pos = 0; App.stop(); };
  $('#bHome').onclick = () => setPos(0);
  $('#bRec').onclick = () => App.recording ? App.stop() : startRecording();
  $('#bLoop').onclick = toggleLoop;
  $('#bMetro').onclick = () => { App.p.metro = !App.p.metro; refreshTop(); App.saveDirty = true; };
  $('#bCount').onclick = () => { App.p.countIn = !App.p.countIn; refreshTop(); App.saveDirty = true; };
  $('#bNew').onclick = async () => {
    const v = await modal('<h3>Yeni proje</h3><p>Mevcut çalışma kapanacak. Kaydetmediyseniz önce 💾 ile kaydedin.</p>', [{ t: 'Vazgeç', v: null }, { t: 'Örnek şarkı', v: 'demo' }, { t: 'Boş proje', v: 'blank', pri: true }]);
    if (!v) return; App.stop(); loadProject(v === 'demo' ? demoProject() : blankProject()); if (v === 'blank') msg('Boş proje: soldan enstrüman ekleyerek başlayın');
  };
  $('#bOpen').onclick = () => { $('#fileProj').value = ''; $('#fileProj').click(); };
  $('#fileProj').onchange = e => e.target.files[0] && openFile(e.target.files[0]);
  $('#fileAudio').onchange = e => { const f = e.target.files[0]; if (App.fileForSep) { const r = App.fileForSep; App.fileForSep = null; r(f || null); } else if (f) importAudioFile(f); };
  $('#fileAudio').addEventListener('cancel', () => { if (App.fileForSep) { const r = App.fileForSep; App.fileForSep = null; r(null); } });
  $('#bSave').onclick = saveFile; $('#bUndo').onclick = undo; $('#bRedo').onclick = redo;
  $('#bExport').onclick = exportDialog; $('#bSep').onclick = separateDialog; $('#bHelp').onclick = help;
  $('#bAddTrack').onclick = addTrackDialog;
  $('#libSearch').oninput = buildLibrary;
  document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => showTab(b.dataset.tab));
  $('#kbDn').onclick = () => { App.kbOct = clamp(App.kbOct - 1, 0, 7); buildKeyboard(); }; $('#kbUp').onclick = () => { App.kbOct = clamp(App.kbOct + 1, 0, 7); buildKeyboard(); };
  $('#modal').onmousedown = e => { if (e.target.id === 'modal' && $('#mBtns').children.length) App.modalClose && App.modalClose(null); };
  // sürükle-bırak ile ses / proje dosyası
  window.addEventListener('dragover', e => e.preventDefault());
  window.addEventListener('drop', e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (!f) return; if (/\.(okst|json)$/i.test(f.name)) openFile(f); else importAudioFile(f); });
  window.addEventListener('resize', () => App.dirty = true);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') autosave(); });
  window.addEventListener('beforeunload', () => { autosave(); });
}
function toggleLoop() {
  const L = App.p.loop;
  if (!L.on && !(L.end > L.start)) { const c = App.clip(); App.p.loop = c ? { on: true, start: c.start, end: c.start + c.len } : { on: true, start: 0, end: App.barBeats() * 4 }; }
  else L.on = !L.on;
  refreshTop(); App.dirty = true; App.saveDirty = true; msg(App.p.loop.on ? 'Döngü açık (cetvelin alt yarısında sürükleyerek bölgeyi değiştirin)' : 'Döngü kapalı');
}
function initKeys() {
  const typing = e => { const t = e.target; return t && (t.tagName === 'INPUT' && t.type !== 'range' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA'); };
  window.addEventListener('keydown', e => {
    if (!$('#modal').classList.contains('hidden')) { if (e.key === 'Escape' && App.modalClose && $('#mBtns').children.length) App.modalClose(null); return; }
    if (typing(e)) return;
    const k = e.key.toLocaleLowerCase('tr'), ctrl = e.ctrlKey || e.metaKey;
    if (ctrl) {
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); } else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
      else if (k === 's') { e.preventDefault(); saveFile(); } else if (k === 'd') { e.preventDefault(); duplicateSelClip(); } else if (k === 'b') { e.preventDefault(); splitSelClip(); }
      return;
    }
    if (e.repeat && KEYMAP[k] !== undefined) { e.preventDefault(); return; }
    if (e.code === 'Space') { e.preventDefault(); play(); return; }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      if (App.focus === 'pr' && App.selNote) { const c = App.clip(); if (c) { snap(); c.notes = c.notes.filter(n => n !== App.selNote); App.selNote = null; App.dirty = true; } }
      else deleteSelClip();
      return;
    }
    if (e.key === 'Home' || e.key === 'Enter') { setPos(0); return; }
    if (k === 'z') { App.kbOct = clamp(App.kbOct - 1, 0, 7); msg('Oktav ' + App.kbOct); if (App.tab === 'keys') buildKeyboard(); return; }
    if (k === 'x') { App.kbOct = clamp(App.kbOct + 1, 0, 7); msg('Oktav ' + App.kbOct); if (App.tab === 'keys') buildKeyboard(); return; }
    if (k === 'r') { $('#bRec').click(); return; }
    if (k === 'c') { toggleLoop(); return; }
    if (k === 'm') { $('#bMetro').click(); return; }
    if (KEYMAP[k] !== undefined) { e.preventDefault(); const n = keyNote(k); App.keyHeld = App.keyHeld || {}; App.keyHeld[k] = n; noteDown(n, 100, 'k'); }
  });
  window.addEventListener('keyup', e => { const k = e.key.toLocaleLowerCase('tr'); if (App.keyHeld && App.keyHeld[k] !== undefined) { noteUp(App.keyHeld[k], 'k'); delete App.keyHeld[k]; } });
  window.addEventListener('blur', () => { for (const [key, h] of [...held]) noteUp(h.note, key[0]); App.keyHeld = {}; });
}
async function main() {
  initAudio(); initTop(); initArrange(); initPiano(); initSteps(); initKeys(); initMidi();
  App.tab = 'piano';
  if (!(await loadAutosave())) { loadProject(demoProject()); msg('Hoş geldiniz! Örnek şarkıyı dinlemek için ▶ düğmesine basın. Yardım için ?'); }
  else msg('Son çalışmanız açıldı');
  const ft = App.track(); showTab(ft && ft.type === 'inst' && Lib.INST[ft.inst]?.type === 'kit' ? 'steps' : 'piano');
  idb().catch(() => {});
  setInterval(autosave, 2000);
  requestAnimationFrame(loop);
}
main();
