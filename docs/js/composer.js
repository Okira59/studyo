'use strict';
// Yapay Zekâ Besteci: tarz, makam, tempo ve ruh haline göre internetsiz otomatik beste (kural + olasılık tabanlı)
const Composer = (() => {
  const P_MAJ = [[0, 4, 5, 3], [0, 5, 3, 4], [3, 4, 0, 0], [0, 3, 4, 3], [5, 3, 0, 4], [0, 2, 3, 4]];
  const P_MIN = [[0, 5, 2, 6], [0, 3, 4, 0], [0, 6, 5, 6], [0, 3, 6, 2], [5, 6, 0, 0], [0, 4, 5, 3]];
  const P_MAKAM = [[0, 0, 3, 0], [0, 3, 4, 0], [0, 6, 0, 4], [0, 0, 4, 0]];
  const BLUES12 = [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7];
  const STYLES = [];
  const st = (id, name, kw, rh, bpm, sc, inst, ch, bs, ex = {}) => STYLES.push(Object.assign({ id, name, kw, rh, bpm, sc: typeof sc === 'string' ? { h: sc, s: sc } : sc, inst, ch, bs, dens: 0.6, grid: 0.5 }, ex));
  st('pop', 'Pop', ['pop'], 'Pop', 104, { h: 'esit', s: 'minor' }, ['sawlead', 'piyano', 'basgitar', 'pad'], 'half', 'pop');
  st('turkpop', 'Türk Pop', ['türk pop', 'turk pop', 'tarkan'], 'Sofyan 4/4', 112, { h: 'esit', s: 'ussak' }, ['kanun', 'piyano', 'basgitar', 'yayligrubu'], 'half', 'pop', { orn: true });
  st('rock', 'Rock', ['rock', 'rok'], 'Rock', 122, { h: 'esit', s: 'minor' }, ['egitar', 'distgitar', 'basgitar', null], 'power8', 'root8', { dens: 0.55 });
  st('balad', 'Balad', ['balad', 'romantik', 'aşk'], 'Balad 6/8', 64, { h: 'esit', s: 'minor' }, ['keman', 'piyano', 'fretless', 'yayligrubu'], 'arp', 'root1', { dens: 0.45 });
  st('arabesk', 'Arabesk', ['arabesk', 'damar'], 'Çiftetelli 8/8', 84, 'hicaz', ['keman', 'yayligrubu', 'basgitar', null], 'pad', 'follow', { orn: true, dens: 0.5 });
  st('oryantal', 'Oryantal / Çiftetelli', ['oryantal', 'çiftetelli', 'ciftetelli', 'göbek'], 'Çiftetelli 8/8', 112, 'hicaz', ['tklarnet', 'kanun', 'basgitar', null], 'drone', 'follow', { orn: true });
  st('roman', 'Roman Havası (9/8)', ['roman', '9/8', 'dokuz sekiz'], 'Roman Havası 9/8', 125, { h: 'ussak', s: 'hicaz' }, ['tklarnet', 'kanun', 'basgitar', null], 'stab', 'follow', { orn: true, dens: 0.7 });
  st('karsilama', 'Karşılama (9/8)', ['karşılama', 'karsilama', 'trakya'], 'Karşılama 9/8 (2+2+2+3)', 130, { h: 'rast', s: 'ussak' }, ['tklarnet', 'akordeon', 'basgitar', null], 'stab', 'follow', { orn: true });
  st('halay', 'Halay / Türkü', ['halay', 'halk', 'türkü', 'turku', 'davul zurna', 'düğün'], 'Halay (Davul)', 125, 'huseyni', ['zurna', 'baglama', null, null], 'drone', 'none', { orn: true, dens: 0.75, grid: 0.25 });
  st('zeybek', 'Zeybek', ['zeybek', 'efe'], 'Zeybek 9/4 (ağır)', 115, 'huseyni', ['zurna', 'divan', null, null], 'drone', 'none', { orn: true, dens: 0.45 });
  st('sufi', 'Tasavvuf / Ney', ['tasavvuf', 'sufi', 'ilahi', 'semai', 'mevlevi', 'tekke'], 'Semai 6/8', 66, { h: 'rast', s: 'ussak' }, ['ney', 'tanbur', null, 'koroooh'], 'drone', 'none', { orn: true, dens: 0.4 });
  st('arap', 'Arap (Saidi)', ['arap', 'saidi', 'mısır', 'misir'], 'Arap Saidi', 100, { h: 'arastrast', s: 'bayati' }, ['arabud', 'kanun', 'basgitar', null], 'drone', 'follow', { orn: true });
  st('trap', 'Trap', ['trap'], 'Trap', 140, 'minor', ['bellsynth', 'pad', '808bas', null], 'pad', '808', { dens: 0.4, grid: 0.25 });
  st('hiphop', 'Hip-Hop', ['hip', 'hop', 'rap'], 'Hip-Hop (Boom Bap)', 90, 'minor', ['vibrafon', 'epiano', 'subbas', null], 'block', 'pop', { dens: 0.45, sev: true });
  st('lofi', 'Lo-fi', ['lofi', 'lo-fi', 'chill', 'ders çalışma'], 'Hip-Hop (Boom Bap)', 78, { h: 'esit', s: 'minor' }, ['vibrafon', 'epiano', 'kontrbaspizz', null], 'block', 'root', { dens: 0.35, sev: true, swing: 45 });
  st('house', 'House / EDM', ['house', 'edm', 'elektronik', 'dans', 'dance', 'club', 'kulüp'], 'House 4x4', 124, 'minor', ['supersaw', 'piyano', 'synthbas', 'sicakpad'], 'stab', 'offbeat');
  st('funk', 'Funk', ['funk', 'disko', 'disco'], 'Funk', 102, { h: 'esit', s: 'minor' }, ['brass', 'clavinet', 'synthbas', null], 'stab', 'funk', { sev: true });
  st('reggaeton', 'Reggaeton', ['reggaeton', 'regeton', 'latin pop'], 'Reggaeton (Dembow)', 95, 'minor', ['sawlead', 'pluck', '808bas', null], 'stab', '808');
  st('afrobeats', 'Afrobeats', ['afrobeat', 'afro'], 'Afrobeats', 106, { h: 'esit', s: 'minor' }, ['kalimba', 'marimba', 'synthbas', null], 'arp', 'follow');
  st('reggae', 'Reggae', ['reggae', 'rege', 'jamaika'], 'Reggae (One Drop)', 76, { h: 'esit', s: 'minor' }, ['melodika', 'org', 'basgitar', null], 'stab', 'reggae');
  st('bossa', 'Bossa Nova', ['bossa', 'caz', 'jazz'], 'Bossa Nova', 125, { h: 'esit', s: 'minor' }, ['flut', 'klasikgitar', 'kontrbaspizz', null], 'strum', 'bossa', { sev: true });
  st('salsa', 'Salsa', ['salsa', 'küba'], 'Salsa (Clave 3-2)', 96, { h: 'esit', s: 'minor' }, ['trompet', 'piyano', 'basgitar', null], 'montuno', 'tumbao');
  st('flamenko', 'Flamenko', ['flamenko', 'flamenco', 'ispanyol'], 'Cajón Flamenko (Rumba)', 100, 'hicaz', ['klasikgitar', 'klasikgitar', 'basgitar', null], 'strum', 'follow', { orn: true });
  st('samba', 'Samba', ['samba', 'brezilya', 'karnaval'], 'Samba Batucada', 100, 'esit', ['flut', 'klasikgitar', 'basgitar', null], 'strum', 'follow');
  st('hint', 'Hint / Bollywood', ['hint', 'bollywood', 'raga'], 'Keharwa (8 matra)', 100, { h: 'yaman', s: 'bhairav' }, ['sitar', 'tanpura', 'basgitar', 'harmonium'], 'drone', 'follow', { orn: true });
  st('afrika', 'Afrika (Djembe)', ['afrika', 'djembe'], 'Kuku (Djembe)', 112, 'penta', ['kora', 'balafon', 'basgitar', null], 'arp', 'follow');
  st('japon', 'Japon', ['japon', 'japonya', 'taiko'], 'Taiko Festivali', 84, 'pentaj', ['shakuhachi', 'koto', null, null], 'arp', 'none', { dens: 0.4 });
  st('cin', 'Çin', ['çin müziği', 'çin', 'cin'], 'Taiko Festivali', 90, 'penta', ['erhu', 'guzheng', null, null], 'arp', 'none', { dens: 0.5 });
  st('kelt', 'Kelt / İrlanda', ['kelt', 'irlanda', 'iskoç', 'jig'], 'Kelt Jig 6/8 (Bodhrán)', 112, 'esit', ['tinwhistle', 'keltarp', 'kontrbaspizz', null], 'arp', 'root1', { dens: 0.8, orn: true });
  st('blues', 'Blues', ['blues'], 'Shuffle / Blues', 80, 'blues', ['mizika', 'piyano', 'basgitar', null], 'blues', 'walking', { harm: 'blues12', dens: 0.5 });
  st('vals', 'Vals', ['vals'], 'Vals 3/4', 150, { h: 'esit', s: 'minor' }, ['keman', 'akordeon', 'kontrbaspizz', null], 'waltz', 'root1', { dens: 0.5 });
  st('sinematik', 'Sinematik / Film', ['sinematik', 'film', 'epik', 'orkestra', 'senfoni'], 'Taiko Festivali', 84, { h: 'esit', s: 'minor' }, ['korno', 'yayligrubu', 'kontrbas', 'koroaah'], 'pad', 'root1', { dens: 0.35 });
  const MOODS = [['auto', 'Otomatik'], ['happy', 'Neşeli'], ['sad', 'Hüzünlü'], ['energy', 'Enerjik'], ['calm', 'Sakin']];
  const LENGTHS = [[30, 'Kısa (~30 sn)'], [60, 'Orta (~1 dk)'], [120, 'Uzun (~2 dk)'], [180, 'Çok uzun (~3 dk)']];

  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function generate(o) {
    const R = rng(o.seed), pick = a => a[Math.floor(R() * a.length)], jitter = (v, k = 6) => Math.round(clamp(v + (R() * 2 - 1) * k, 20, 127));
    const S = STYLES.find(s => s.id === o.style) || STYLES[0];
    const rh = Rhythms.find(r => r.name === S.rh) || Rhythms[1];
    const mood = o.mood === 'auto' ? (R() < 0.5 ? 'happy' : 'sad') : o.mood;
    const tuning = o.tuning !== 'auto' ? o.tuning : (mood === 'sad' ? S.sc.s : S.sc.h);
    const tu = Lib.TUNINGS.find(t => t.id === tuning) || Lib.TUNINGS[0], scale = tu.s, n = scale.length;
    const root = o.root === 'auto' ? (S.sc.h === 'esit' || S.sc.h === 'minor' ? pick([0, 2, 4, 5, 7, 9]) : pick([2, 7, 9])) : +o.root;
    let bpm = o.bpm > 0 ? o.bpm : Math.round(S.bpm * (mood === 'energy' ? 1.1 : mood === 'calm' ? 0.88 : 1));
    bpm = clamp(bpm, 40, 220);
    let dens = clamp(S.dens + (mood === 'energy' ? 0.1 : mood === 'calm' ? -0.12 : 0), 0.2, 0.95);
    const velAdd = mood === 'energy' ? 8 : mood === 'calm' ? -12 : 0;
    const bb = rh.sig[0] * 4 / rh.sig[1], chordBars = bb < 3 ? 2 : 1, phrase = 4 * chordBars;
    const minorish = scale[2] === 3 || scale[2] === 1;
    let bars = Math.round(o.length / (bb * 60 / bpm) / phrase) * phrase; bars = clamp(bars, phrase * 2, 128);
    // bölümler
    const intro = bars >= phrase * 3 ? phrase / 2 : 0, outro = bars >= phrase * 3 ? phrase / 2 : chordBars;
    const sections = []; let b = 0;
    if (intro) { sections.push({ t: 'I', s: 0, bars: intro }); b = intro; }
    const order = ['V', 'V', 'C', 'C']; let k = 0;
    while (b + phrase <= bars - outro) { sections.push({ t: order[k % 4], s: b, bars: phrase }); b += phrase; k++; }
    if (b < bars - outro) sections[sections.length - 1].bars += bars - outro - b;
    sections.push({ t: 'O', s: bars - outro, bars: outro });
    // akor zaman çizelgesi
    const progs = S.ch === 'drone' ? P_MAKAM : minorish ? P_MIN : P_MAJ;
    const progV = pick(progs), progC = pick(progs.filter(p => p !== progV));
    const chords = [];
    const degChord = d => { const pcs = [scale[d % n], scale[(d + 2) % n], scale[(d + 4) % n]]; if (S.sev && n >= 7) pcs.push(scale[(d + 6) % n]); return { rootPc: (scale[d % n] + root) % 12, pcs: pcs.map(x => (x + root) % 12) }; };
    for (const sec of sections) {
      for (let cb = 0; cb < sec.bars; cb += chordBars) {
        const idx = cb / chordBars; let c;
        if (S.harm === 'blues12') { const semi = BLUES12[Math.floor((sec.s + cb - intro) / chordBars + 120) % 12]; c = { rootPc: (root + semi) % 12, pcs: [0, 4, 7, 10].map(x => (x + root + semi) % 12) }; }
        else if (sec.t === 'O') c = degChord(0);
        else c = degChord((sec.t === 'C' ? progC : progV)[idx % 4]);
        if (S.ch === 'drone') c = { rootPc: c.rootPc, pcs: [c.rootPc, (c.rootPc + 7) % 12] };
        chords.push(Object.assign(c, { s: (sec.s + cb) * bb, len: Math.min(chordBars, sec.bars - cb) * bb, sec: sec.t }));
      }
    }
    const chordAt = beat => chords.find(c => beat >= c.s - 1e-6 && beat < c.s + c.len - 1e-6) || chords[chords.length - 1];
    const near = (pc, center) => { let m = center - 6; m += ((pc - m) % 12 + 12) % 12; return m; };
    const voice = (pcs, center) => pcs.map(pc => near(pc, center)).sort((a, b) => a - b);
    const tracks = {};
    const T = (key, name, inst, color) => { if (!inst || !Lib.INST[inst]) return null; tracks[key] = { name, inst, color, notes: [] }; return tracks[key]; };
    const push = (tr, s, d, p, v) => { if (tr && d > 0.01 && p >= 0 && p <= 127) tr.notes.push({ s, d, p, v: jitter(v + velAdd) }); };
    const [mI, cI, bI, pI] = S.inst;
    const parts = o.parts || { drums: true, bass: true, chords: true, melody: true, pad: true };
    // ---- davul ----
    if (parts.drums) {
      const dt = T('drums', 'YZ Ritim', rh.kit, '#e8534a');
      const one = patternNotes(rh, 1, bb), kit = Lib.INST[rh.kit];
      const crash = kit.pads.findIndex(p => /crash|zil|gong|çan/i.test(p.name));
      for (const sec of sections) for (let i = 0; i < sec.bars; i++) {
        const bs = (sec.s + i) * bb, last = sec.t !== 'O' && sec.t !== 'I' && (i + 1) % phrase === 0;
        if (sec.t === 'O' && i === sec.bars - 1) { one.filter(x => x.s === 0).forEach(x => push(dt, bs, x.d, x.p, x.v)); if (crash >= 0) push(dt, bs, 1, crash, 105); continue; }
        for (const x of one) { if (last && x.s >= bb - 1) continue; push(dt, bs + x.s, x.d, x.p, sec.t === 'I' ? x.v * 0.65 : x.v); }
        if (last) for (let j = 0; j < 4; j++) push(dt, bs + bb - 1 + j * 0.25, 0.25, 1, 70 + j * 14);
        if (i === 0 && sec.t === 'C' && crash >= 0) push(dt, bs, 1, crash, 100);
      }
    }
    // ---- bas ----
    const bt = parts.bass ? T('bass', 'YZ Bas', bI, '#4f8fff') : null;
    if (bt) {
      const cyc = {
        root: [[0, 0, 0.9], [1, 0, 0.9], [2, 0, 0.9], [3, 0, 0.9]], root8: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map(x => [x, 0, 0.45]),
        pop: [[0, 0, 1.4], [1.5, 0, 0.45], [2, 0, 0.9], [3, 0, 0.9]], '808': [[0, 0, 2.4], [2.5, 0, 1.4]], offbeat: [0.5, 1.5, 2.5, 3.5].map(x => [x, 0, 0.4]),
        reggae: [[1, 0, 0.45], [1.5, 0, 0.4], [2, 7, 0.9], [3, 0, 0.45], [3.5, 0, 0.4]], tumbao: [[1.5, 0, 1.4], [3, 7, 0.9]],
        bossa: [[0, 0, 1.4], [1.5, 7, 0.45], [2, 0, 1.4], [3.5, 7, 0.45]], funk: [[0, 0, 0.4], [0.75, 12, 0.2], [1.5, 0, 0.4], [2.25, 7, 0.2], [2.5, 0, 0.4], [3.5, 12, 0.4]],
      }[S.bs];
      const kick = (rh.rows[0] || 'x').split(''), kd = bb / kick.length;
      chords.forEach((c, ci) => {
        let R0 = 36 + c.rootPc; if (R0 > 45) R0 -= 12;
        if (S.bs === 'root1') { for (let x = 0; x < c.len; x += bb) push(bt, c.s + x, Math.min(bb, c.len - x) * 0.9, R0, 100); return; }
        if (S.bs === 'follow') {
          for (let x = 0; x < c.len - 1e-6; x += bb) {
            const hits = kick.map((ch, i) => [i * kd, ch]).filter(([, ch]) => ch !== '.');
            hits.forEach(([t, ch], i) => { const nx = i + 1 < hits.length ? hits[i + 1][0] : bb; if (x + t < c.len) push(bt, c.s + x + t, Math.max(0.2, (nx - t) * 0.9), R0 + (i % 3 === 2 ? 7 : 0), ch === 'X' ? 110 : ch === 'o' ? 70 : 95); });
          }
          return;
        }
        if (S.bs === 'walking') {
          const next = chords[ci + 1] || c; let nR = 36 + next.rootPc; if (nR > 45) nR -= 12;
          for (let x = 0; x < c.len - 1e-6; x++) { const steps = [R0, R0 + 4, R0 + 7, nR + (nR > R0 ? -1 : 1)]; push(bt, c.s + x, 0.9, steps[x % 4], x % 2 ? 85 : 100); }
          return;
        }
        for (let base = 0; base < c.len - 1e-6; base += 4) for (const [off, iv, d] of cyc) if (base + off < c.len - 1e-6) push(bt, c.s + base + off, Math.min(d, c.len - base - off - 0.02), R0 + iv, off === 0 ? 105 : 90);
      });
    }
    // ---- akor ----
    const ct = parts.chords ? T('chords', S.ch === 'drone' ? 'YZ Dem / Akor' : 'YZ Akor', cI, '#e8d23a') : null;
    if (ct) for (const c of chords) {
      const v = voice(c.pcs, 60), L = c.len, at = (s, d, ns, vel) => ns.forEach((p, i) => push(ct, c.s + s + (S.ch === 'strum' ? i * 0.02 : 0), d, p, vel));
      if (c.sec === 'O' && c === chords[chords.length - 1]) { at(0, L - 0.1, v, 85); continue; }
      switch (S.ch) {
        case 'block': at(0, L - 0.05, v, 80); break;
        case 'pad': at(0, L - 0.02, v, 72); break;
        case 'half': for (let x = 0; x < L - 1e-6; x += 2) at(x, Math.min(1.9, L - x), v, x ? 75 : 85); break;
        case 'drone': { const r = near(c.rootPc, 54); at(0, L - 0.02, [r - 12, r, r + 7], 78); break; }
        case 'stab': for (let x = 0.5; x < L; x += 1) at(x, 0.25, v, 85); break;
        case 'power8': { const r = near(c.rootPc, 46); for (let x = 0; x < L - 1e-6; x += 0.5) at(x, 0.45, [r, r + 7, r + 12], x % 1 ? 85 : 100); break; }
        case 'strum': for (let x = 0; x < L - 1e-6; x += 1) at(x, 0.9, x % 2 ? v.slice().reverse() : v, x ? 75 : 95); break;
        case 'waltz': for (let x = 0; x < L - 1e-6; x += 3) { at(x + 1, 0.6, v, 72); at(x + 2, 0.6, v, 68); } break;
        case 'blues': for (let x = 0; x < L - 1e-6; x += 1.5) at(x, 1.2, v, x ? 72 : 85); break;
        case 'montuno': { const seq = [0, 0.75, 1.5, 2, 2.75, 3.5]; for (let base = 0; base < L - 1e-6; base += 4) seq.forEach((x, i) => { if (base + x < L) at(base + x, 0.4, i % 2 ? [v[1], v[2]] : [v[0], v[0] + 12], 85); }); break; }
        case 'arp': default: { const up = [v[0], v[1], v[2], v[0] + 12, v[1] + 12, v[2] + 12], seq = up.concat(up.slice(1, -1).reverse()); for (let x = 0, i = 0; x < L - 1e-6; x += 0.5, i++) push(ct, c.s + x, 0.6, seq[i % seq.length], i % 4 ? 70 : 82); }
      }
    }
    // ---- pad ----
    const pt = parts.pad && pI ? T('pad', 'YZ Pad', pI, '#9b6bff') : null;
    if (pt) for (const c of chords) if (c.sec === 'C' || c.sec === 'I' || c.sec === 'O') voice(c.pcs, 67).forEach(p => push(pt, c.s, c.len - 0.02, p, 58));
    // ---- melodi ----
    const mInst = o.melInst && o.melInst !== 'auto' ? o.melInst : mI;
    const mt = parts.melody ? T('melody', 'YZ Melodi', mInst, '#5fd17a') : null;
    if (mt) {
      const lo = 60 + root - (root > 6 ? 12 : 0), sn = []; for (let p = lo - 5; p <= lo + 21; p++) if (scale.includes(((p - root) % 12 + 12) % 12)) sn.push(p);
      const g = S.grid, motifBars = phrase / 2;
      const makeRhythm = (d0) => {
        const on = [];
        for (let t = 0; t < motifBars * bb - 1e-6; t += g) {
          const beat = Math.abs(t - Math.round(t)) < 1e-6, down = Math.abs((t % bb)) < 1e-6;
          if (t === 0 || R() < d0 * (beat ? 1 : 0.5) * (down ? 1.3 : 1)) on.push(t);
        }
        return on.map((t, i) => { const nx = i + 1 < on.length ? on[i + 1] : motifBars * bb; let d = Math.min(2, nx - t); if (R() < 0.15 && d > g) d *= 0.5; return [t, Math.max(g * 0.9, d)]; });
      };
      const choose = (prev, beatAbs, strong, range) => {
        const c = chordAt(beatAbs); let best = [], tot = 0;
        for (let j = Math.max(0, prev - 3); j <= Math.min(sn.length - 1, prev + 3); j++) {
          const iv = Math.abs(j - prev); let w = [0.5, 3, 1.6, 0.6][iv];
          if (c.pcs.includes(sn[j] % 12)) w *= strong ? 3 : 1.3; else if (strong) w *= 0.5;
          if (j < range[0] || j > range[1]) w *= 0.15;
          best.push([j, w]); tot += w;
        }
        let r = R() * tot; for (const [j, w] of best) { r -= w; if (r <= 0) return j; } return prev;
      };
      const toChordTone = (j, beatAbs, preferRoot) => {
        const c = chordAt(beatAbs); let bj = j, bd = 99;
        sn.forEach((p, i) => { if (c.pcs.includes(p % 12) && (!preferRoot || p % 12 === c.rootPc)) { const d = Math.abs(i - j); if (d < bd) { bd = d; bj = i; } } });
        return bd < 99 ? bj : j;
      };
      const motifs = {};
      const getMotif = t => {
        if (motifs[t]) return motifs[t];
        const rngR = t === 'C' ? [Math.round(sn.length * 0.4), sn.length - 1] : [2, Math.round(sn.length * 0.7)];
        return (motifs[t] = { r: makeRhythm(t === 'C' ? dens : dens * 0.8), range: rngR, start: t === 'C' ? Math.round(sn.length * 0.6) : Math.round(sn.length * 0.35) });
      };
      for (const sec of sections) {
        if (sec.t === 'I') continue;
        const s0 = sec.s * bb;
        if (sec.t === 'O') { const j = toChordTone(Math.round(sn.length * 0.4), s0, true); push(mt, s0, Math.min(sec.bars * bb, 4) - 0.1, sn[j], 95); continue; }
        const m = getMotif(sec.t);
        for (let ph = 0; ph < sec.bars; ph += phrase) {
          let prev = m.start, first = null;
          for (let half = 0; half < 2; half++) {
            const off = s0 + (ph + half * motifBars) * bb;
            if (off >= (sec.s + sec.bars) * bb - 1e-6) break;
            const cad = half === 1;
            m.r.forEach(([t, d], i) => {
              const abs = off + t, strong = Math.abs(t % 1) < 1e-6 && (Math.abs(t % 2) < 1e-6 || Math.abs(t % bb) < 1e-6);
              const lastNote = cad && i === m.r.length - 1;
              let j;
              if (half === 1 && first && R() < 0.6 && !lastNote) { j = clamp(first[i] + (R() < 0.3 ? pick([-1, 1]) : 0), 0, sn.length - 1); if (strong) j = toChordTone(j, abs, false); }
              else j = choose(prev, abs, strong, m.range);
              if (lastNote) { j = toChordTone(j, abs, true); d = Math.max(d, Math.min(2, motifBars * bb - t)); }
              if (half === 0) (first = first || [])[i] = j;
              if (S.orn && d >= 0.5 && R() < 0.3 && t >= 0.12 && j + 1 < sn.length) push(mt, abs - 0.12, 0.11, sn[j + 1], 70);
              push(mt, abs, d * 0.95, sn[j], strong ? 105 : 88);
              prev = j;
            });
          }
        }
      }
    }
    const pn = Lib.NOTE_NAMES[root], mn = MOODS.find(x => x[0] === mood)[1];
    return { style: S, rh, bpm, sig: rh.sig.slice(), tuning, tuName: tu.name, root, swing: S.swing || 0, bars, bb, mood: mn, name: `${S.name} — ${pn} ${tu.name.split(' (')[0]}`, tracks };
  }

  function parsePrompt(text) {
    const t = ' ' + text.toLocaleLowerCase('tr') + ' ', o = {}, said = [];
    let best = null, bl = 0;
    for (const s of STYLES) for (const k of s.kw) if (t.includes(k) && k.length > bl) { best = s; bl = k.length; }
    if (best) { o.style = best.id; said.push(best.name); }
    const moods = [['sad', ['hüzün', 'üzgün', 'duygusal', 'melankol', 'dertli', 'ağla', 'karanlık', 'minör']], ['happy', ['neşe', 'mutlu', 'eğlen', 'coşku', 'şen', 'parlak', 'majör']], ['energy', ['enerji', 'hızlı', 'hareketli', 'coşkulu', 'güçlü', 'sert', 'oynak']], ['calm', ['sakin', 'yavaş', 'rahat', 'huzur', 'dingin', 'hafif', 'uyku']]];
    for (const [id, ws] of moods) if (ws.some(w => t.includes(w))) { o.mood = id; said.push(MOODS.find(m => m[0] === id)[1]); break; }
    const bm = t.match(/(\d{2,3})\s*(bpm|tempo|vuruş)/) || t.match(/tempo\s*(\d{2,3})/);
    if (bm) { const v = +(bm[1].match(/\d+/) ? bm[1] : bm[2]); if (v >= 40 && v <= 220) { o.bpm = v; said.push(v + ' BPM'); } }
    const lm = t.match(/(\d+)\s*(dakika|dk)/), sm = t.match(/(\d+)\s*(saniye|sn)/);
    if (lm) o.length = clamp(+lm[1] * 60, 20, 300); else if (sm) o.length = clamp(+sm[1], 20, 300);
    else if (t.includes('kısa')) o.length = 30; else if (t.includes('uzun')) o.length = 120;
    if (o.length) said.push(Math.round(o.length) + ' sn');
    for (const tu of Lib.TUNINGS) { const w = tu.name.split(' (')[0].toLocaleLowerCase('tr').replace(/["']/g, ''); if (w.length > 3 && t.includes(w)) { o.tuning = tu.id; said.push(tu.name); break; } }
    const nm = t.match(/\s(do|re|mi|fa|sol|la|si)(#| diyez)?\s/);
    if (nm) { const idx = Lib.NOTE_NAMES.findIndex(x => x.toLocaleLowerCase('tr') === nm[1] + (nm[2] ? '#' : '')); if (idx >= 0) { o.root = idx; said.push('Kök: ' + Lib.NOTE_NAMES[idx]); } }
    let ib = null, il = 0;
    for (const id in Lib.INST) { const i = Lib.INST[id]; if (i.type === 'kit') continue; const w = i.name.split(' (')[0].toLocaleLowerCase('tr'); if (w.length > 2 && t.includes(w) && w.length > il) { ib = id; il = w.length; } }
    if (ib) { o.melInst = ib; said.push('Melodi: ' + Lib.INST[ib].name); }
    return { o, said };
  }
  return { STYLES, MOODS, LENGTHS, generate, parsePrompt };
})();

// ---------------- Besteci paneli ----------------
(() => {
  const btn = el('button', '', '✨ YZ Besteci'); btn.id = 'aiBtn'; btn.title = 'Yapay zekâ ile otomatik beste';
  const pan = el('div'); pan.id = 'aiPanel'; pan.className = 'hidden';
  const opt = (arr, sel) => arr.map(([v, n]) => `<option value="${v}"${String(v) === String(sel) ? ' selected' : ''}>${esc(n)}</option>`).join('');
  const melOpts = [['auto', 'Otomatik (tarza göre)']].concat(Lib.CATS.filter(c => !/Ritim/.test(c.name)).flatMap(c => c.items.map(i => [i.id, c.name.split(' (')[0] + ' — ' + i.name])));
  pan.innerHTML = `<div class="aiHead"><b>✨ Yapay Zekâ Besteci</b><button id="aiClose" title="Kapat">✕</button></div>
    <label class="aiFull">Ne tür bir müzik istersiniz? (isteğe bağlı)<textarea id="aiText" rows="2" placeholder="ör. hüzünlü bir arabesk, 85 tempo, ney ile, 2 dakika"></textarea></label>
    <div class="aiRow"><button id="aiParse">💡 Anla ve ayarla</button><span id="aiSaid"></span></div>
    <div class="aiGrid">
      <label>Tarz<select id="aiStyle">${opt(Composer.STYLES.map(s => [s.id, s.name]), 'pop')}</select></label>
      <label>Ruh hali<select id="aiMood">${opt(Composer.MOODS, 'auto')}</select></label>
      <label>Makam / dizi<select id="aiTuning">${opt([['auto', 'Otomatik (tarza göre)']].concat(Lib.TUNINGS.map(t => [t.id, t.name])), 'auto')}</select></label>
      <label>Ton (kök)<select id="aiRoot">${opt([['auto', 'Otomatik']].concat(Lib.NOTE_NAMES.map((n, i) => [i, n])), 'auto')}</select></label>
      <label>Tempo (BPM)<input id="aiBpm" type="number" min="40" max="220" placeholder="Otomatik"></label>
      <label>Uzunluk<select id="aiLen">${opt(Composer.LENGTHS, 60)}</select></label>
      <label class="aiFull">Melodi enstrümanı<select id="aiMel">${opt(melOpts, 'auto')}</select></label>
    </div>
    <div class="aiRow aiChecks"><label><input type="checkbox" id="aiDr" checked>Ritim</label><label><input type="checkbox" id="aiBs" checked>Bas</label><label><input type="checkbox" id="aiCh" checked>Akor</label><label><input type="checkbox" id="aiMl" checked>Melodi</label><label><input type="checkbox" id="aiPd" checked>Pad</label></div>
    <div class="aiRow"><label><input type="radio" name="aiMode" value="new" checked>Yeni proje olarak</label><label><input type="radio" name="aiMode" value="add">Mevcut projeye ekle</label></div>
    <div class="aiRow"><label><input type="checkbox" id="aiPlay" checked>Oluşturunca çal</label></div>
    <div class="aiRow aiBtns"><button id="aiGo" class="pri">🎵 Besteyi Oluştur</button><button id="aiVar" title="Aynı ayarlarla farklı bir beste">🎲 Başka varyasyon</button></div>
    <div id="aiInfo" class="hint"></div>`;
  document.body.append(btn, pan);
  const q = s => pan.querySelector(s);
  btn.onclick = () => pan.classList.toggle('hidden');
  q('#aiClose').onclick = () => pan.classList.add('hidden');
  pan.addEventListener('keydown', e => e.stopPropagation());
  q('#aiParse').onclick = () => {
    const { o, said } = Composer.parsePrompt(q('#aiText').value);
    if (o.style) q('#aiStyle').value = o.style; if (o.mood) q('#aiMood').value = o.mood; if (o.tuning) q('#aiTuning').value = o.tuning;
    if (o.root !== undefined) q('#aiRoot').value = o.root; if (o.bpm) q('#aiBpm').value = o.bpm; if (o.melInst) q('#aiMel').value = o.melInst;
    if (o.length) { const l = Composer.LENGTHS.reduce((a, x) => Math.abs(x[0] - o.length) < Math.abs(a[0] - o.length) ? x : a); q('#aiLen').value = l[0]; }
    q('#aiSaid').textContent = said.length ? 'Anlaşılan: ' + said.join(' · ') : 'Anlaşılamadı; ayarları elle seçin.';
    return said.length;
  };
  let last = null;
  const sigOf = p => JSON.stringify(p, (k, v) => (k === 'lenSec' ? undefined : v));
  let parsedText = '';
  function run(variation) {
    const txt = q('#aiText').value.trim();
    if (txt && txt !== parsedText) { q('#aiParse').onclick(); parsedText = txt; }
    const o = {
      style: q('#aiStyle').value, mood: q('#aiMood').value, tuning: q('#aiTuning').value, root: q('#aiRoot').value,
      bpm: +q('#aiBpm').value || 0, length: +q('#aiLen').value, melInst: q('#aiMel').value, seed: Math.floor(Math.random() * 1e9),
      parts: { drums: q('#aiDr').checked, bass: q('#aiBs').checked, chords: q('#aiCh').checked, melody: q('#aiMl').checked, pad: q('#aiPd').checked },
    };
    const mode = pan.querySelector('input[name=aiMode]:checked').value;
    if (App.tr.playing) App.stop();
    const g = Composer.generate(o);
    const keys = Object.keys(g.tracks); if (!keys.length) return msg('Oluşturulacak bölüm seçilmedi');
    const replacing = variation && last && sigOf(App.p) === last.after;
    if (replacing) { App.p = JSON.parse(last.before); App.undoStack.pop(); }
    const before = JSON.stringify(App.p); snap();
    if (mode === 'new') {
      const p = blankProject(); Object.assign(p, { name: g.name, bpm: g.bpm, sig: g.sig, tuning: g.tuning, root: g.root, swing: g.swing, loop: { on: false, start: 0, end: g.bars * g.bb } });
      App.p = p; App.pos = 0;
    } else {
      Object.assign(App.p, { bpm: g.bpm, sig: g.sig, tuning: g.tuning, root: g.root });
      App.p.tracks.forEach(t => t.type === 'audio' && t.clips.forEach(c => { if (c.durS) c.len = c.durS / App.spb(); }));
      App.tr.tempoChanged();
    }
    const bbNow = App.barBeats(), start = mode === 'new' ? 0 : replacing && last.mode === 'add' ? last.start : Math.floor(App.pos / bbNow) * bbNow;
    let melId = null;
    for (const k of keys) {
      const d = g.tracks[k], kit = Lib.INST[d.inst].type === 'kit';
      const t = newTrack({ name: d.name, inst: d.inst, color: d.color, rev: kit ? 0.08 : k === 'pad' ? 0.35 : 0.2, vol: k === 'pad' ? 0.55 : k === 'chords' ? 0.65 : 0.8, pan: k === 'chords' ? -0.15 : k === 'pad' ? 0.15 : 0 });
      t.clips.push({ id: uid(), start, len: g.bars * g.bb, notes: d.notes });
      App.p.tracks.push(t); if (k === 'melody' || !melId) melId = t.id;
    }
    App.selTrackId = melId; App.selClipId = App.track(melId).clips[0].id; App.eng.syncAll(App.p);
    refreshAll(); showTab('piano');
    last = { before, after: sigOf(App.p), mode, start };
    const secs = Math.round(g.bars * g.bb * 60 / g.bpm);
    q('#aiInfo').innerHTML = `Oluşturuldu: <b>${esc(g.style.name)}</b> · ${esc(g.mood)} · ${esc(g.tuName)} · Kök ${Lib.NOTE_NAMES[g.root]} · ${g.bpm} BPM · ${g.sig.join('/')} · ${g.bars} ölçü (~${secs} sn). Notaları piyano rulosunda değiştirebilirsiniz; geri almak için Ctrl+Z.`;
    msg(`Beste hazır: ${g.style.name}, ${g.bpm} BPM`);
    const L = App.p.loop;
    if (L.on && (start < L.start || start >= L.end)) { L.on = false; refreshTop(); }
    if (q('#aiPlay').checked) { setPos(start); play(); }
  }
  q('#aiParse').addEventListener('click', () => { parsedText = q('#aiText').value.trim(); });
  q('#aiGo').onclick = () => run(false);
  q('#aiVar').onclick = () => run(true);
})();
