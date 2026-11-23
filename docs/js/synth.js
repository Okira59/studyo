'use strict';
// Ses motoru: tel (Karplus-Strong), vurmalı (modal), perküsyon ve gerçek zamanlı sentez sesleri
const Synth = (() => {
  const { rnd, BQ, normalize, fadeOut, fadeIn, filt, drive, trimTail } = DSP;
  const cache = new Map();

  function toBuffer(data, sr) {
    const b = new AudioBuffer({ length: Math.max(1, data.length), sampleRate: sr, numberOfChannels: 1 });
    b.copyToChannel(data, 0); return b;
  }

  // ---------- Tel / mızrap (Karplus-Strong) ----------
  function ksString(sr, f, o, out, amp) {
    const N = sr / f, b = o.bright ?? 0.5, P = N - (1 - b);
    const T60 = (o.decay || 2) * Math.pow(220 / f, o.decayKey ?? 0.5);
    const g = Math.pow(10, -3 / (Math.max(0.05, T60) * f));
    const L = Math.max(2, Math.round(N));
    const ex = new Float32Array(L);
    const tone = o.pick ?? 0.5;
    let lp = 0, mean = 0;
    for (let i = 0; i < L; i++) { lp += tone * (rnd() - lp); ex[i] = lp; mean += lp; }
    mean /= L; for (let i = 0; i < L; i++) ex[i] -= mean;
    if (o.pos) { const k = Math.max(1, Math.round(o.pos * L)); for (let i = L - 1; i >= k; i--) ex[i] -= ex[i - k]; }
    const n = out.length, y = new Float32Array(n);
    let prev = 0;
    for (let i = 0; i < n; i++) {
      const pos = i - P; let r = 0;
      if (pos >= 0) { const i0 = pos | 0, fr = pos - i0; r = y[i0] + fr * (y[i0 + 1] - y[i0]); }
      y[i] = (i < L ? ex[i] : 0) + g * (b * r + (1 - b) * prev);
      prev = r;
    }
    for (let i = 0; i < n; i++) out[i] += amp * y[i];
  }

  function renderPluck(sr, f, o) {
    const dur = Math.min(o.dur || 3, 1.2 + (o.decay || 2) * 1.5 * Math.pow(220 / f, 0.4));
    const out = new Float32Array(Math.floor(sr * dur));
    for (const [c, a] of (o.courses || [[0, 1]])) ksString(sr, f * Math.pow(2, c / 1200), o, out, a);
    normalize(out, 0.8);
    if (o.buzz) {
      const hp = new BQ('hp', 1800, 0.7, sr);
      for (let i = 0; i < out.length; i++) { const z = out[i] * Math.abs(out[i]); out[i] += o.buzz * 2.5 * hp.p(z); }
    }
    if (o.pickNoise) {
      const h = new BQ('bp', 3000, 0.8, sr), m = Math.floor(sr * 0.006);
      for (let i = 0; i < m; i++) out[i] += o.pickNoise * h.p(rnd()) * (1 - i / m);
    }
    filt(out, sr, o.body && o.body.map(([fr, q, db]) => ['pk', fr, q, db]));
    if (o.lp) new BQ('lp', o.lp, 0.7, sr).run(out);
    if (o.hp) new BQ('hp', o.hp, 0.7, sr).run(out);
    if (o.drive) drive(out, o.drive);
    normalize(out, 0.8); fadeIn(out, sr, 0.0015); fadeOut(out, sr, 0.08);
    return trimTail(out, sr);
  }

  // ---------- Vurmalı / tokmaklı (modal sentez) ----------
  function renderModal(sr, f, o) {
    const dk = o.decayKey ?? 0.5;
    const baseDec = (o.decay || 2) * Math.pow(220 / f, dk);
    const dur = Math.min(o.dur || 6, 0.3 + baseDec * 1.4);
    const n = Math.floor(sr * dur), out = new Float32Array(n);
    let parts = [];
    if (o.harm) {
      const B = (o.B || 0) * Math.pow(f / 220, 1.5), max = o.harm;
      for (let k = 1; k <= max; k++) {
        const r = k * Math.sqrt(1 + B * k * k);
        let a = 1 / Math.pow(k, o.tilt ?? 1);
        if (o.hammer) a *= Math.abs(Math.sin(Math.PI * k * o.hammer)) + 0.05;
        parts.push([r, a, 1 / (1 + (k - 1) * (o.dd ?? 0.3))]);
      }
    } else parts = o.modes;
    const det = o.detune || 0;
    for (const [r, a, dm] of parts) {
      const fr = f * r; if (fr > sr * 0.45) continue;
      const d = Math.max(0.01, baseDec * dm);
      const copies = det ? [-det / 2, det / 2] : [0];
      for (const c of copies) {
        const w = 2 * Math.PI * fr * Math.pow(2, c / 1200) / sr;
        const rr = Math.exp(-1 / (d * sr)), A = 2 * rr * Math.cos(w), Bc = -rr * rr;
        let y2 = 0, y1 = a * Math.sin(w) * rr; out[1] += y1;
        for (let i = 2; i < n; i++) { const y = A * y1 + Bc * y2; out[i] += y; y2 = y1; y1 = y; }
      }
    }
    if (o.noise) {
      const [amp, nf, q, nd] = o.noise, h = new BQ('bp', nf, q, sr), m = Math.min(n, Math.floor(sr * nd * 6));
      const nn = new Float32Array(m);
      for (let i = 0; i < m; i++) nn[i] = h.p(rnd()) * Math.exp(-i / (nd * sr));
      normalize(nn, 1); const pk = DSP.peak(out.subarray(0, Math.floor(sr * 0.05))) || 1;
      for (let i = 0; i < m; i++) out[i] += amp * pk * nn[i];
    }
    if (o.attack) { const m = Math.floor(sr * o.attack); for (let i = 0; i < m && i < n; i++) out[i] *= i / m; }
    if (o.trem) { const [rate, depth] = o.trem; for (let i = 0; i < n; i++) out[i] *= 1 - depth * 0.5 * (1 - Math.cos(2 * Math.PI * rate * i / sr)); }
    normalize(out, 0.8);
    if (o.buzz) { const hp = new BQ('hp', 1500, 0.7, sr); for (let i = 0; i < n; i++) { const z = out[i] * Math.abs(out[i]); out[i] += o.buzz * 3 * hp.p(z); } }
    filt(out, sr, o.body && o.body.map(([fr, q, db]) => ['pk', fr, q, db]));
    if (o.lp) new BQ('lp', o.lp, 0.7, sr).run(out);
    normalize(out, 0.8); fadeIn(out, sr, 0.0008); fadeOut(out, sr, 0.05);
    return trimTail(out, sr);
  }

  // ---------- Perküsyon ----------
  const METAL = [1, 1.4471, 1.6170, 1.9265, 2.5028, 2.6637];
  function renderPerc(sr, p) {
    const dur = p.dur || 1.2, n = Math.floor(sr * dur), out = new Float32Array(n);
    for (const q of p.parts) {
      const at = Math.max(1, Math.floor(sr * (q.at || 0.0008))), off = Math.floor(sr * (q.delay || 0));
      const env = i => (i < at ? i / at : Math.exp(-(i - at) / (q.d * sr)));
      const amp = q.a ?? 1;
      if (q.t === 'tone') {
        let ph = 0; const f1 = q.f, f2 = q.f2 ?? q.f, sw = q.sw || 0.03;
        for (let i = 0; i + off < n; i++) {
          const t = i / sr, fr = f2 + (f1 - f2) * Math.exp(-t / sw);
          ph += 2 * Math.PI * fr / sr;
          let s = Math.sin(ph); if (q.w === 'tri') s = Math.asin(s) * 0.6366;
          out[i + off] += amp * s * env(i);
        }
      } else if (q.t === 'noise') {
        const h = new BQ(q.ft || 'bp', q.f || 1000, q.q || 0.7, sr), h2 = q.f2 ? new BQ(q.ft2 || 'lp', q.f2, 0.7, sr) : null;
        for (let i = 0; i + off < n; i++) { let s = h.p(rnd()); if (h2) s = h2.p(s); out[i + off] += amp * s * env(i); }
      } else if (q.t === 'modes') {
        const rs = q.r || [1], as = q.as || rs.map((_, k) => 1 / (k + 1));
        rs.forEach((r, k) => {
          const fr = q.f * r; if (fr > sr * 0.45) return;
          const d = q.d / (1 + k * (q.dd ?? 0.5));
          let ph = 0; const fe = q.f2 ? q.f2 / q.f : 1, sw = q.sw || 0.03;
          for (let i = 0; i + off < n; i++) {
            const t = i / sr; ph += 2 * Math.PI * fr * (fe + (1 - fe) * Math.exp(-t / sw)) / sr;
            out[i + off] += amp * as[k] * Math.sin(ph) * (i < at ? i / at : Math.exp(-(i - at) / (d * sr)));
          }
        });
      } else if (q.t === 'metal') {
        const fs = q.fs || METAL.map(r => r * (q.f || 400));
        const ph = fs.map(() => Math.random()), h = new BQ(q.ft || 'hp', q.ff || 7000, q.q || 0.7, sr), h2 = new BQ('pk', (q.ff || 7000) * 1.3, 1, sr, 6);
        for (let i = 0; i + off < n; i++) {
          let s = 0; for (let k = 0; k < fs.length; k++) { ph[k] += fs[k] / sr; s += (ph[k] % 1) < 0.5 ? 1 : -1; }
          out[i + off] += amp * h2.p(h.p(s / fs.length)) * env(i);
        }
      } else if (q.t === 'jingle') {
        const cnt = q.n || 5, spread = q.spread || 0.03;
        for (let j = 0; j < cnt; j++) {
          const o2 = off + Math.floor(sr * spread * (j / cnt) * (0.6 + 0.8 * Math.abs(rnd())));
          const h = new BQ('bp', (q.f || 7000) * (0.85 + 0.3 * Math.abs(rnd())), q.q || 3, sr);
          const a2 = amp * (0.5 + 0.5 * Math.abs(rnd())) * (1 - 0.5 * j / cnt);
          for (let i = 0; i + o2 < n && i < q.d * sr * 7; i++) out[i + o2] += a2 * h.p(rnd()) * Math.exp(-i / (q.d * sr));
        }
      } else if (q.t === 'scrape') {
        const cnt = q.n || 12, gap = q.gap || 0.012, h = new BQ('bp', q.f || 3000, q.q || 2, sr);
        for (let j = 0; j < cnt; j++) {
          const o2 = off + Math.floor(sr * gap * j);
          for (let i = 0; i + o2 < n && i < sr * 0.01; i++) out[i + o2] += amp * h.p(rnd()) * Math.exp(-i / (0.002 * sr));
        }
      }
    }
    if (p.drive) drive(out, p.drive);
    if (p.lp) new BQ('lp', p.lp, 0.7, sr).run(out);
    normalize(out, (p.g ?? 1) * 0.85); fadeOut(out, sr, 0.02);
    return trimTail(out, sr, 0.0004);
  }

  // ---------- Kaynaklar ----------
  const resMap = new WeakMap();
  function res(ctx) {
    let r = resMap.get(ctx);
    if (!r) {
      const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = nb.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      r = { noise: nb, waves: new Map() }; resMap.set(ctx, r);
    }
    return r;
  }
  function wave(ctx, harm) {
    const r = res(ctx), k = harm.join(',');
    if (!r.waves.has(k)) {
      const re = new Float32Array(harm.length + 1), im = new Float32Array(harm.length + 1);
      harm.forEach((a, i) => { im[i + 1] = a; });
      r.waves.set(k, ctx.createPeriodicWave(re, im));
    }
    return r.waves.get(k);
  }

  function getBuffer(inst, key, sr, make) {
    const k = inst.id + '|' + key + '|' + sr;
    let b = cache.get(k);
    if (!b) { b = toBuffer(make(), sr); cache.set(k, b); }
    return b;
  }

  const velGain = v => Math.pow(Math.max(1, v) / 127, 1.4);

  function bufferVoice(ctx, dest, t, buf, gain, rel) {
    const src = ctx.createBufferSource(); src.buffer = buf;
    const g = ctx.createGain(); g.gain.value = gain;
    src.connect(g); g.connect(dest); src.start(t);
    const v = { end: t + buf.duration, release(rt) {
      if (!rel) return; rt = Math.max(rt, t + 0.005);
      if (rt >= v.end) return;
      g.gain.setValueAtTime(gain, rt); g.gain.setTargetAtTime(0, rt, rel / 4);
      try { src.stop(rt + rel * 1.6); } catch (e) {} v.end = rt + rel * 1.6;
    }, stop() { try { src.stop(); } catch (e) {} } };
    src.onended = () => { try { g.disconnect(); } catch (e) {} };
    return v;
  }

  // Gerçek zamanlı (sürekli) sesler: nefesli, yaylı, org, koro, synth
  function synthVoice(ctx, dest, t, f, gain, o) {
    const [a, d, s, r] = o.env || [0.01, 0.2, 0.8, 0.2];
    const out = ctx.createGain(); out.gain.value = 0;
    let node = out; const nodes = [], oscs = [];
    let chain = ctx.createGain(); const mix = chain;
    // filtre
    let last = chain;
    if (o.lp) {
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = o.lp.q || 0.7;
      const base = o.lp.k ? f * o.lp.k : o.lp.f;
      lp.frequency.value = Math.min(18000, base);
      if (o.lp.env) {
        const pk = Math.min(18000, base * o.lp.env);
        lp.frequency.setValueAtTime(base, t);
        lp.frequency.linearRampToValueAtTime(pk, t + (o.lp.a || 0.01));
        lp.frequency.setTargetAtTime(Math.min(18000, base * (o.lp.s ?? 1)), t + (o.lp.a || 0.01), (o.lp.d || 0.2) / 3);
      }
      if (o.wah) {
        const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = o.wah[0]; lg.gain.value = base * o.wah[1];
        l.connect(lg); lg.connect(lp.frequency); l.start(t); oscs.push(l);
      }
      last.connect(lp); last = lp;
    }
    if (o.peaks) for (const [pf, q, db] of o.peaks) {
      const p = ctx.createBiquadFilter(); p.type = 'peaking'; p.frequency.value = pf; p.Q.value = q; p.gain.value = db;
      last.connect(p); last = p;
    }
    if (o.formants) {
      const sum = ctx.createGain();
      for (const [ff, q, g] of o.formants) {
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = ff; bp.Q.value = q;
        const gg = ctx.createGain(); gg.gain.value = g * 3; last.connect(bp); bp.connect(gg); gg.connect(sum);
      }
      last = sum;
    }
    if (o.drive) {
      const ws = ctx.createWaveShaper(), c = new Float32Array(1024);
      for (let i = 0; i < 1024; i++) { const x = i / 511.5 - 1; c[i] = Math.tanh(o.drive * x) / Math.tanh(o.drive); }
      ws.curve = c; last.connect(ws); last = ws;
    }
    last.connect(out); out.connect(dest);
    // titreşim (vibrato)
    let vib = null;
    if (o.vib) {
      const [rate, cents, delay] = o.vib;
      const l = ctx.createOscillator(); l.frequency.value = rate * (0.95 + Math.random() * 0.1);
      vib = ctx.createGain(); vib.gain.setValueAtTime(0, t);
      vib.gain.linearRampToValueAtTime(0, t + (delay || 0)); vib.gain.linearRampToValueAtTime(cents, t + (delay || 0) + 0.4);
      l.connect(vib); l.start(t); oscs.push(l);
    }
    for (const w of (o.osc || [['sawtooth', 0, 0, 1]])) {
      const [type, cents, oct, amp] = w;
      const os = ctx.createOscillator();
      if (Array.isArray(type)) os.setPeriodicWave(wave(ctx, type)); else os.type = type;
      os.frequency.value = f * Math.pow(2, oct || 0);
      os.detune.value = cents || 0;
      if (o.scoop) { os.detune.setValueAtTime((cents || 0) + o.scoop[0], t); os.detune.setTargetAtTime(cents || 0, t, o.scoop[1] / 3); }
      if (vib) vib.connect(os.detune);
      const g = ctx.createGain(); g.gain.value = amp ?? 1;
      os.connect(g); g.connect(mix); os.start(t); oscs.push(os);
    }
    if (o.breath) {
      const [ba, bk, bq, bf] = o.breath;
      const ns = ctx.createBufferSource(); ns.buffer = res(ctx).noise; ns.loop = true;
      ns.loopStart = Math.random(); 
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = Math.min(16000, bf || f * (bk || 2)); bp.Q.value = bq || 1;
      const bg = ctx.createGain(); bg.gain.value = ba * 2;
      ns.connect(bp); bp.connect(bg); bg.connect(o.breathPost ? out : mix); ns.start(t, Math.random()); oscs.push(ns);
    }
    if (o.chiff) {
      const ns = ctx.createBufferSource(); ns.buffer = res(ctx).noise;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 4; bp.Q.value = 1.5;
      const cg = ctx.createGain(); cg.gain.setValueAtTime(o.chiff * 2, t); cg.gain.setTargetAtTime(0, t, 0.03);
      ns.connect(bp); bp.connect(cg); cg.connect(out); ns.start(t); ns.stop(t + 0.3);
    }
    let am = null;
    if (o.trem) {
      am = ctx.createGain(); const l = ctx.createOscillator(), lg = ctx.createGain();
      l.frequency.value = o.trem[0]; lg.gain.value = o.trem[1] * 0.5; am.gain.value = 1 - o.trem[1] * 0.5;
      l.connect(lg); lg.connect(am.gain); l.start(t); oscs.push(l);
      out.disconnect(); out.connect(am); am.connect(dest);
    }
    const g = out.gain, pk = gain * (o.gain ?? 0.3);
    g.setValueAtTime(0, t); g.linearRampToValueAtTime(pk, t + Math.max(0.003, a));
    g.setTargetAtTime(pk * s, t + Math.max(0.003, a), Math.max(0.01, d) / 3);
    const v = { end: Infinity, release(rt) {
      rt = Math.max(rt, t + 0.01);
      if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(rt); else { g.cancelScheduledValues(rt); g.setValueAtTime(pk * s, rt); }
      g.setTargetAtTime(0, rt, Math.max(0.01, r) / 4);
      const e = rt + Math.max(0.02, r) * 1.5 + 0.05; v.end = e;
      oscs.forEach(o2 => { try { o2.stop(e); } catch (er) {} });
    }, stop() { oscs.forEach(o2 => { try { o2.stop(); } catch (er) {} }); try { out.disconnect(); } catch (e) {} } };
    if (oscs[0]) oscs[oscs.length - 1].onended = () => { try { out.disconnect(); am && am.disconnect(); } catch (e) {} };
    return v;
  }

  // Gerçek kayıt (örnek) çalıcı: en yakın kök notayı seçip hızını ayarlar (makam komaları dahil)
  function sampleVoice(ctx, dest, t, S, note, f, vel) {
    const pk = velGain(vel) * (S.g ?? 1);
    if (S.kit) {
      const arr = S.b[note]; if (!arr || !arr.length) return null;
      return bufferVoice(ctx, dest, t, arr[(S.rr++) % arr.length], pk, 0);
    }
    let bi = 0, bd = Infinity;
    for (let i = 0; i < S.f.length; i++) { const d = Math.abs(Math.log(f / S.f[i])); if (d < bd) { bd = d; bi = i; } }
    const buf = S.b[bi], rate = f / S.f[bi], rel = S.rel ?? 0.3;
    const src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = rate;
    if (S.loop) { src.loop = true; src.loopStart = S.loop[0]; src.loopEnd = Math.min(S.loop[1], buf.duration); }
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(pk, t + 0.004);
    src.connect(g); g.connect(dest); src.start(t);
    const v = { end: S.loop ? Infinity : t + buf.duration / rate, release(rt) {
      rt = Math.max(rt, t + 0.01); if (rt >= v.end) return;
      if (g.gain.cancelAndHoldAtTime) g.gain.cancelAndHoldAtTime(rt); else { g.gain.cancelScheduledValues(rt); g.gain.setValueAtTime(pk, rt); }
      g.gain.setTargetAtTime(0, rt, rel / 4);
      const e = rt + rel * 1.6 + 0.02; try { src.stop(e); } catch (er) {} v.end = e;
    }, stop() { try { src.stop(); } catch (e) {} } };
    src.onended = () => { try { g.disconnect(); } catch (e) {} };
    return v;
  }

  // inst: enstrüman tanımı, note: MIDI notası (kit için ped numarası), f: frekans
  function noteOn(ctx, dest, t, inst, note, f, vel) {
    if (typeof Samples !== 'undefined' && Samples.has(inst.id)) {
      const S = Samples.get(inst.id);
      if (S) { const v = sampleVoice(ctx, dest, t, S, note, f, vel); if (v) return v; }
      else Samples.ensure(ctx, inst.id);
    }
    const sr = ctx.sampleRate, gain = velGain(vel) * (inst.gain ?? 1);
    if (inst.type === 'kit') {
      const pad = inst.pads[note]; if (!pad) return null;
      const buf = getBuffer(inst, note, sr, () => renderPerc(sr, pad.p));
      return bufferVoice(ctx, dest, t, buf, gain * (pad.g ?? 1), 0);
    }
    if (inst.type === 'pluck' || inst.type === 'modal') {
      const fn = inst.type === 'pluck' ? renderPluck : renderModal;
      const buf = getBuffer(inst, f.toFixed(2), sr, () => fn(sr, f, inst.p));
      return bufferVoice(ctx, dest, t, buf, gain, inst.p.rel ?? 0.25);
    }
    return synthVoice(ctx, dest, t, f, velGain(vel) * (inst.gain ?? 1), inst.p);
  }

  function prerender(inst, note, f, sr) {
    if (inst.type === 'kit') { const pad = inst.pads[note]; if (pad) getBuffer(inst, note, sr, () => renderPerc(sr, pad.p)); }
    else if (inst.type === 'pluck') getBuffer(inst, f.toFixed(2), sr, () => renderPluck(sr, f, inst.p));
    else if (inst.type === 'modal') getBuffer(inst, f.toFixed(2), sr, () => renderModal(sr, f, inst.p));
  }

  return { noteOn, prerender, renderPerc, toBuffer, res, velGain };
})();
