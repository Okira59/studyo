'use strict';
// Ses motoru: kanal şeritleri, efektler, ana çıkış, zamanlayıcı (transport) ve WAV dışa aktarma
function makeIR(ctx, secs = 2.6, decay = 3) {
  const sr = ctx.sampleRate, n = Math.floor(sr * secs), b = ctx.createBuffer(2, n, sr);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c); let lp = 0;
    for (let i = 0; i < n; i++) {
      const t = i / n; lp += (0.25 + 0.6 * (1 - t)) * ((Math.random() * 2 - 1) - lp);
      d[i] = lp * Math.pow(1 - t, decay) * (i < sr * 0.01 ? i / (sr * 0.01) : 1);
    }
  }
  return b;
}

function tuneFreq(project, note) {
  const tu = Lib.TUNINGS.find(t => t.id === project.tuning) || Lib.TUNINGS[0];
  const c = tu.c[((note - (project.root || 0)) % 12 + 12) % 12] || 0;
  return 440 * Math.pow(2, (note - 69 + c / 100) / 12);
}

class Engine {
  constructor(ctx) {
    this.ctx = ctx;
    const c = ctx;
    this.masterIn = c.createGain();
    this.mLow = c.createBiquadFilter(); this.mLow.type = 'lowshelf'; this.mLow.frequency.value = 110;
    this.mMid = c.createBiquadFilter(); this.mMid.type = 'peaking'; this.mMid.frequency.value = 1200; this.mMid.Q.value = 0.7;
    this.mHigh = c.createBiquadFilter(); this.mHigh.type = 'highshelf'; this.mHigh.frequency.value = 7000;
    this.mComp = c.createDynamicsCompressor();
    this.master = c.createGain();
    this.limiter = c.createDynamicsCompressor();
    this.limiter.threshold.value = -1.5; this.limiter.knee.value = 0; this.limiter.ratio.value = 20; this.limiter.attack.value = 0.002; this.limiter.release.value = 0.12;
    this.analyser = c.createAnalyser(); this.analyser.fftSize = 2048;
    this.masterIn.connect(this.mLow); this.mLow.connect(this.mMid); this.mMid.connect(this.mHigh); this.mHigh.connect(this.mComp);
    this.mComp.connect(this.master); this.master.connect(this.limiter); this.limiter.connect(this.analyser); this.limiter.connect(c.destination);
    // yankı (reverb) ve eko (delay) dönüşleri
    this.revIn = c.createGain(); this.conv = c.createConvolver(); this.conv.buffer = makeIR(c);
    this.revIn.connect(this.conv); this.conv.connect(this.masterIn);
    this.dlyIn = c.createGain(); this.dly = c.createDelay(4); this.dlyFb = c.createGain(); this.dlyFb.gain.value = 0.35;
    this.dlyLp = c.createBiquadFilter(); this.dlyLp.type = 'lowpass'; this.dlyLp.frequency.value = 4500;
    this.dlyIn.connect(this.dly); this.dly.connect(this.dlyLp); this.dlyLp.connect(this.dlyFb); this.dlyFb.connect(this.dly); this.dlyLp.connect(this.masterIn);
    this.strips = new Map();
    this.metroBufs = null;
  }

  setMaster(m, bpm) {
    const t = this.ctx.currentTime, s = (p, v) => p.setTargetAtTime(v, t, 0.02);
    s(this.master.gain, m.vol ?? 0.9);
    s(this.mLow.gain, m.lo || 0); s(this.mMid.gain, m.mid || 0); s(this.mHigh.gain, m.hi || 0);
    const k = m.comp || 0;
    s(this.mComp.threshold, -k * 24); s(this.mComp.ratio, 1 + k * 4); this.mComp.attack.value = 0.01; this.mComp.release.value = 0.2; this.mComp.knee.value = 10;
    this.limiter.threshold.value = m.limit === false ? 0 : -1.5; this.limiter.ratio.value = m.limit === false ? 1 : 20;
    s(this.dly.delayTime, Math.min(3.9, (60 / (bpm || 120)) * (m.dlyBeats || 0.75)));
    s(this.dlyFb.gain, m.dlyFb ?? 0.35);
  }

  strip(tr) {
    let s = this.strips.get(tr.id);
    if (s) return s;
    const c = this.ctx;
    s = { input: c.createGain(), lo: c.createBiquadFilter(), mid: c.createBiquadFilter(), hi: c.createBiquadFilter(), comp: c.createDynamicsCompressor(),
      fader: c.createGain(), pan: c.createStereoPanner(), rev: c.createGain(), dly: c.createGain(), meter: c.createAnalyser() };
    s.lo.type = 'lowshelf'; s.lo.frequency.value = 120; s.mid.type = 'peaking'; s.mid.frequency.value = 1000; s.mid.Q.value = 0.8;
    s.hi.type = 'highshelf'; s.hi.frequency.value = 6000; s.meter.fftSize = 512;
    s.input.connect(s.lo); s.lo.connect(s.mid); s.mid.connect(s.hi); s.hi.connect(s.comp); s.comp.connect(s.fader);
    s.fader.connect(s.pan); s.pan.connect(this.masterIn); s.pan.connect(s.meter);
    s.fader.connect(s.rev); s.rev.connect(this.revIn); s.fader.connect(s.dly); s.dly.connect(this.dlyIn);
    this.strips.set(tr.id, s);
    return s;
  }

  update(tr, anySolo, now) {
    const s = this.strip(tr), t = now ? 0 : this.ctx.currentTime;
    const set = (p, v) => { if (now) p.value = v; else p.setTargetAtTime(v, t, 0.02); };
    const audible = !tr.mute && (!anySolo || tr.solo);
    set(s.fader.gain, audible ? Math.pow(tr.vol ?? 0.8, 2) * 1.5 : 0);
    set(s.pan.pan, tr.pan || 0);
    set(s.lo.gain, tr.eq?.lo || 0); set(s.mid.gain, tr.eq?.mid || 0); set(s.hi.gain, tr.eq?.hi || 0);
    const k = tr.comp || 0;
    set(s.comp.threshold, -k * 30); set(s.comp.ratio, 1 + k * 6); s.comp.attack.value = 0.005; s.comp.release.value = 0.15;
    set(s.rev.gain, (tr.rev || 0) * 0.6); set(s.dly.gain, (tr.dly || 0) * 0.5);
  }

  syncAll(project, now) {
    const anySolo = project.tracks.some(t => t.solo);
    project.tracks.forEach(t => this.update(t, anySolo, now));
    for (const [id, s] of this.strips) if (!project.tracks.find(t => t.id === id)) { try { s.pan.disconnect(); s.fader.disconnect(); } catch (e) {} this.strips.delete(id); }
    this.setMaster(project.master || {}, project.bpm);
  }

  play(project, tr, t, note, vel) {
    const inst = Lib.INST[tr.inst]; if (!inst) return null;
    return Synth.noteOn(this.ctx, this.strip(tr).input, t, inst, note, tuneFreq(project, note), vel);
  }

  click(t, accent) {
    if (!this.metroBufs) {
      const sr = this.ctx.sampleRate;
      this.metroBufs = [1600, 1000].map(f => Synth.toBuffer(Synth.renderPerc(sr, { parts: [{ t: 'tone', f, d: 0.03, a: 1 }], dur: 0.1, g: 0.6 }), sr));
    }
    const s = this.ctx.createBufferSource(); s.buffer = this.metroBufs[accent ? 0 : 1];
    const g = this.ctx.createGain(); g.gain.value = 0.5; s.connect(g); g.connect(this.ctx.destination); s.start(t);
  }

  playAudio(tr, buf, t, offset, dur, clip) {
    const c = this.ctx, src = c.createBufferSource(); src.buffer = buf;
    const g = c.createGain(), base = Math.pow(10, (clip.gain || 0) / 20);
    const clipDurSec = clip.lenSec, fi = clip.fi || 0, fo = clip.fo || 0;
    // giriş/çıkış geçişleri (fade)
    const posStart = offset - (clip.off || 0); // klip içindeki konum (sn)
    const envAt = p => { let v = 1; if (fi > 0 && p < fi) v = Math.min(v, p / fi); if (fo > 0 && p > clipDurSec - fo) v = Math.min(v, Math.max(0, (clipDurSec - p) / fo)); return v * base; };
    g.gain.setValueAtTime(envAt(posStart), t);
    if (fi > 0 && posStart < fi) g.gain.linearRampToValueAtTime(base, t + (fi - posStart));
    if (fo > 0) { const s0 = Math.max(posStart, clipDurSec - fo); g.gain.setValueAtTime(envAt(s0), t + (s0 - posStart)); g.gain.linearRampToValueAtTime(0, t + (clipDurSec - posStart)); }
    src.connect(g); g.connect(this.strip(tr).input);
    src.start(t, Math.max(0, offset), Math.max(0.001, dur));
    return { end: t + dur, isAudio: true, release() {}, stop(at) { const n = Math.max(c.currentTime, at || 0); g.gain.cancelScheduledValues(n); g.gain.setTargetAtTime(0, n, 0.01); try { src.stop(n + 0.05); } catch (e) {} } };
  }
}

// ---------------- Zamanlayıcı ----------------
class Transport {
  constructor(app) { this.app = app; this.playing = false; this.active = new Set(); this.segs = []; }
  get ctx() { return this.app.ctx; }
  get eng() { return this.app.eng; }

  start(fromBeat, opts = {}) {
    this.stopAll(true);
    const ctx = this.ctx;
    this.playing = true; this.countIn = opts.countIn || 0;
    this.cursor = fromBeat - this.countIn; this.cursorTime = ctx.currentTime + 0.08;
    this.segs = [{ t: this.cursorTime, b: this.cursor, spb: 60 / this.app.p.bpm }];
    this.segStart = true;
    this.timer = setInterval(() => this.tick(), 20);
    this.tick();
    return this.cursorTime;
  }

  tempoChanged() { if (this.playing) this.segs.push({ t: this.cursorTime, b: this.cursor, spb: 60 / this.app.p.bpm }); }

  beat() {
    if (!this.playing) return null;
    const now = this.ctx.currentTime; let s = this.segs[0];
    for (const x of this.segs) if (x.t <= now) s = x;
    return s.b + (now - s.t) / s.spb;
  }
  timeOfBeat(b) { // yalnızca mevcut segment için
    const s = this.segs[this.segs.length - 1]; return s.t + (b - s.b) * s.spb;
  }

  tick() {
    const p = this.app.p, ctx = this.ctx, ahead = ctx.currentTime + 0.15;
    const loop = p.loop && p.loop.on && p.loop.end > p.loop.start + 0.01 && !this.app.recording ? p.loop : null;
    let guard = 0;
    while (this.cursorTime < ahead && guard++ < 50) {
      const spb = 60 / p.bpm;
      if (loop && this.cursor >= loop.end) { for (const v of this.active) if (v.isAudio) v.stop(this.cursorTime); this.cursor = loop.start; this.segStart = true; this.segs.push({ t: this.cursorTime, b: loop.start, spb }); }
      const b0 = this.cursor; let b1 = b0 + 0.05 / spb;
      if (loop && b0 < loop.end && b1 >= loop.end) b1 = loop.end;
      this.schedule(b0, b1, this.cursorTime, spb, this.segStart, loop);
      this.segStart = false;
      this.cursorTime += (b1 - b0) * spb; this.cursor = b1;
      if (loop && b0 < loop.end && b1 >= loop.end - 1e-9) {
        this.cursor = loop.start; this.segStart = true;
        this.segs.push({ t: this.cursorTime, b: loop.start, spb });
      }
    }
    if (this.segs.length > 8) this.segs = this.segs.filter((s, i, a) => i >= a.length - 8 || s.t > ctx.currentTime);
    const now = ctx.currentTime;
    for (const v of this.active) if (v.end < now - 0.5) this.active.delete(v);
    if (!loop && !this.app.recording) {
      const end = this.app.songEnd();
      const b = this.beat();
      if (b !== null && b > end + 0.5 && b > (this.segs[0].b + 1)) this.app.stop();
    }
  }

  schedule(b0, b1, t0, spb, segStart, loop) {
    const app = this.app, p = app.p, eng = this.eng;
    const swing = (p.swing || 0) / 100 * (1 / 12);
    const at = b => t0 + (b - b0) * spb;
    // metronom
    if (p.metro || (this.countIn && b0 < this.cursorStartReal())) {
      const bar = app.barBeats();
      for (let k = Math.ceil(b0 - 1e-9); k < b1; k++) {
        if (p.metro || k < this.cursorStartReal()) eng.click(at(k), ((k % bar) + bar) % bar < 0.01);
      }
    }
    for (const tr of p.tracks) {
      if (tr.type === 'audio') {
        for (const c of tr.clips) {
          const buf = app.audio.get(c.buf); if (!buf) continue;
          const cs = c.start, ce = c.start + c.len;
          let from = null;
          if (cs >= b0 && cs < b1) from = cs; else if (segStart && cs < b0 && ce > b0) from = b0;
          if (from === null) continue;
          let endB = ce; if (loop && endB > loop.end && from < loop.end) endB = loop.end;
          const off = (c.off || 0) + (from - cs) * spb, dur = Math.min((endB - from) * spb, buf.duration - off);
          if (dur <= 0) continue;
          c.lenSec = c.len * spb;
          this.active.add(eng.playAudio(tr, buf, at(from), off, dur, c));
        }
        continue;
      }
      for (const c of tr.clips) {
        if (c.start >= b1 || c.start + c.len <= b0) continue;
        for (const n of c.notes) {
          if (n.s >= c.len) continue;
          let a = c.start + n.s;
          if (swing && Math.abs(n.s * 4 - Math.round(n.s * 4)) < 1e-6 && Math.round(n.s * 4) % 2 === 1) a += swing;
          if (a < b0 || a >= b1) continue;
          const t = at(a), d = Math.max(0.02, Math.min(n.d, c.len - n.s) * spb);
          const v = eng.play(p, tr, t, n.p, n.v);
          if (v) { v.release(t + d); this.active.add(v); }
        }
      }
    }
  }
  cursorStartReal() { return this.segs.length ? this.segs[0].b + this.countIn : 0; }

  stopAll(hard) {
    clearInterval(this.timer); this.playing = false;
    for (const v of this.active) { if (hard || v.end === Infinity || v.isAudio) v.stop(); }
    if (!hard) for (const v of this.active) { if (v.release && v.end === Infinity) v.release(this.ctx.currentTime); }
    this.active.clear();
  }
}

// ------------- WAV kodlama ve şarkıyı çevrimdışı oluşturma -------------
function encodeWav(buf) {
  const ch = buf.numberOfChannels, n = buf.length, sr = buf.sampleRate;
  const ab = new ArrayBuffer(44 + n * ch * 2), v = new DataView(ab);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true); v.setUint32(24, sr, true);
  v.setUint32(28, sr * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * ch * 2, true);
  const data = []; for (let c = 0; c < ch; c++) data.push(buf.getChannelData(c));
  let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const s = Math.max(-1, Math.min(1, data[c][i])); v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true); o += 2; }
  return new Blob([ab], { type: 'audio/wav' });
}

async function renderOffline(app, opts = {}) {
  if (typeof Samples !== 'undefined') await Samples.ensureAll(app.ctx, app.p.tracks.filter(t => t.type === 'inst').map(t => t.inst));
  const p = app.p, sr = app.ctx.sampleRate, spb = 60 / p.bpm;
  const startB = opts.from ?? 0, endB = opts.to ?? app.songEnd();
  const secs = (endB - startB) * spb + (opts.tail ?? 3);
  const oc = new OfflineAudioContext(2, Math.ceil(secs * sr), sr);
  const eng = new Engine(oc);
  const proj = opts.onlyTrack ? Object.assign({}, p, { tracks: p.tracks.map(t => Object.assign({}, t, { solo: t.id === opts.onlyTrack, mute: t.id === opts.onlyTrack ? false : t.mute })) }) : p;
  eng.syncAll(proj, true);
  const fakeApp = { p: proj, eng, ctx: oc, audio: app.audio, recording: false, barBeats: () => app.barBeats(), songEnd: () => endB };
  const tp = Object.create(Transport.prototype);
  Object.defineProperty(tp, 'app', { value: fakeApp });
  tp.countIn = 0; tp.segs = []; tp.active = new Set();
  const saveMetro = proj.metro; proj.metro = false;
  try {
    for (let b = startB; b < endB; b += 1) tp.schedule(b, Math.min(endB, b + 1), (b - startB) * spb, spb, b === startB, null);
  } finally { proj.metro = saveMetro; }
  return oc.startRendering();
}
