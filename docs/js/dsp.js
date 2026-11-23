'use strict';
// Basit DSP yardımcıları (çevrimdışı ses üretimi için)
const DSP = (() => {
  let seed = 22222;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2147483648 - 1; };

  class BQ {
    constructor(type, f, q, sr, db = 0) { this.x1 = this.x2 = this.y1 = this.y2 = 0; this.set(type, f, q, sr, db); }
    set(type, f, q, sr, db = 0) {
      const A = Math.pow(10, db / 40), w = 2 * Math.PI * Math.min(f, sr * 0.45) / sr;
      const cs = Math.cos(w), sn = Math.sin(w), al = sn / (2 * q);
      let b0, b1, b2, a0, a1, a2;
      switch (type) {
        case 'lp': b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = b0; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; break;
        case 'hp': b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = b0; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; break;
        case 'bp': b0 = al; b1 = 0; b2 = -al; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; break;
        default: b0 = 1 + al * A; b1 = -2 * cs; b2 = 1 - al * A; a0 = 1 + al / A; a1 = -2 * cs; a2 = 1 - al / A;
      }
      this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = a1 / a0; this.a2 = a2 / a0;
    }
    p(x) {
      const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
      this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y; return y;
    }
    run(b) { for (let i = 0; i < b.length; i++) b[i] = this.p(b[i]); return b; }
  }

  const peak = b => { let m = 0; for (let i = 0; i < b.length; i++) { const a = Math.abs(b[i]); if (a > m) m = a; } return m; };
  const normalize = (b, to = 0.8) => { const m = peak(b); if (m > 1e-9) { const k = to / m; for (let i = 0; i < b.length; i++) b[i] *= k; } return b; };
  const fadeOut = (b, sr, t = 0.05) => { const n = Math.min(b.length, Math.floor(sr * t)); for (let i = 0; i < n; i++) b[b.length - 1 - i] *= i / n; return b; };
  const fadeIn = (b, sr, t = 0.002) => { const n = Math.min(b.length, Math.max(1, Math.floor(sr * t))); for (let i = 0; i < n; i++) b[i] *= i / n; return b; };
  const filt = (b, sr, list) => { if (list) for (const [type, f, q, db] of list) new BQ(type, f, q || 0.7, sr, db || 0).run(b); return b; };
  const drive = (b, k) => { const n = Math.tanh(k); for (let i = 0; i < b.length; i++) b[i] = Math.tanh(k * b[i]) / n; return b; };
  const trimTail = (b, sr, th = 0.0006) => { let e = b.length - 1; while (e > sr * 0.05 && Math.abs(b[e]) < th) e--; return b.subarray(0, Math.min(b.length, e + Math.floor(sr * 0.01))); };

  return { rnd, BQ, peak, normalize, fadeOut, fadeIn, filt, drive, trimTail };
})();
