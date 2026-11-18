'use strict';
// Şarkıdan ses ayırma (STFT tabanlı): orta/yan kanal analizi + harmonik/perküsif ayrıştırma (HPSS)
// Çevrimdışı çalışır; Web Worker içinde yürütülür.
const Separator = (() => {
  function workerMain() {
    function fft(re, im, inv) {
      const n = re.length;
      for (let i = 1, j = 0; i < n; i++) {
        let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit;
        if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
      }
      for (let len = 2; len <= n; len <<= 1) {
        const ang = 2 * Math.PI / len * (inv ? 1 : -1), wr = Math.cos(ang), wi = Math.sin(ang);
        for (let i = 0; i < n; i += len) {
          let cr = 1, ci = 0;
          for (let j = 0; j < len / 2; j++) {
            const a = i + j, b = a + len / 2;
            const xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
            re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
            const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
          }
        }
      }
      if (inv) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
    }
    function median(a, n) { // küçük dizi için ekleme sıralaması
      for (let i = 1; i < n; i++) { const v = a[i]; let j = i - 1; while (j >= 0 && a[j] > v) { a[j + 1] = a[j]; j--; } a[j + 1] = v; }
      return a[n >> 1];
    }
    onmessage = (e) => {
      const { L, R, sr } = e.data;
      const N = 4096, H = 1024, B = N / 2 + 1, len = L.length;
      const frames = Math.ceil((len + N) / H);
      const win = new Float64Array(N); for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N);
      const re = new Float64Array(N), im = new Float64Array(N);
      const mag = new Float32Array(frames * B);
      const get = (x, i) => (i >= 0 && i < len ? x[i] : 0);
      const frame = (f) => { const o = f * H - N; for (let i = 0; i < N; i++) { re[i] = get(L, o + i) * win[i]; im[i] = get(R, o + i) * win[i]; } fft(re, im, false); };
      // 1. geçiş: orta kanal genlik spektrogramı
      for (let f = 0; f < frames; f++) {
        frame(f);
        for (let k = 0; k < B; k++) {
          const k2 = (N - k) % N;
          const lr = (re[k] + re[k2]) / 2, li = (im[k] - im[k2]) / 2, rr = (im[k] + im[k2]) / 2, ri = (re[k2] - re[k]) / 2;
          mag[f * B + k] = Math.hypot(lr + rr, li + ri) / 2;
        }
        if (f % 200 === 0) postMessage({ progress: 0.3 * f / frames });
      }
      const out = []; for (let s = 0; s < 4; s++) out.push([new Float32Array(len), new Float32Array(len)]);
      const TW = 13, FW = 13, tb = new Float32Array(TW), fb = new Float32Array(FW);
      const hz = k => k * sr / N;
      const lowW = k => { const f = hz(k); return f < 120 ? 1 : f > 280 ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * (f - 120) / 160); };
      const vocW = k => { const f = hz(k); if (f < 100) return 0; if (f < 220) return (f - 100) / 120; if (f < 7000) return 1; if (f < 12000) return 1 - 0.6 * (f - 7000) / 5000; return 0.4; };
      const masks = [new Float32Array(B), new Float32Array(B), new Float32Array(B), new Float32Array(B)];
      const ore = new Float64Array(N), oim = new Float64Array(N);
      const norm = 1 / 1.5; // Hann² örtüşme toplamı (%75)
      for (let f = 0; f < frames; f++) {
        frame(f);
        for (let k = 0; k < B; k++) {
          // harmonik (zaman boyunca medyan) ve perküsif (frekans boyunca medyan)
          for (let j = 0; j < TW; j++) { const ff = Math.min(frames - 1, Math.max(0, f + j - (TW >> 1))), r = ff * B; let m = mag[r + k]; for (let q = Math.max(0, k - 2); q <= Math.min(B - 1, k + 2); q++) if (mag[r + q] > m) m = mag[r + q]; tb[j] = m; }
          for (let j = 0; j < FW; j++) { const kk = Math.min(B - 1, Math.max(0, k + j - (FW >> 1))); fb[j] = mag[f * B + kk]; }
          const Hm = median(tb, TW), Pm = median(fb, FW);
          const h2 = Hm * Hm, p2 = Pm * Pm, den = h2 + p2 + 1e-12;
          const hs = h2 / den, ps = p2 / den;
          const k2 = (N - k) % N;
          const lr = (re[k] + re[k2]) / 2, li = (im[k] - im[k2]) / 2, rr = (im[k] + im[k2]) / 2, ri = (re[k2] - re[k]) / 2;
          const el = lr * lr + li * li, er = rr * rr + ri * ri;
          let c = (2 * (lr * rr + li * ri)) / (el + er + 1e-12); c = Math.max(0, c);
          const vm = Math.pow(c, 4) * hs * vocW(k);
          const dm = ps * (1 - vm);
          const bm = hs * lowW(k) * (1 - vm);
          const om = Math.max(0, 1 - vm - dm - bm);
          masks[0][k] = vm; masks[1][k] = dm; masks[2][k] = bm; masks[3][k] = om;
        }
        const o = f * H - N;
        for (let s = 0; s < 4; s++) {
          const m = masks[s];
          for (let k = 0; k < N; k++) { const kk = k < B ? k : N - k; ore[k] = re[k] * m[kk]; oim[k] = im[k] * m[kk]; }
          fft(ore, oim, true);
          const oL = out[s][0], oR = out[s][1];
          for (let i = 0; i < N; i++) { const idx = o + i; if (idx >= 0 && idx < len) { oL[idx] += ore[i] * win[i] * norm; oR[idx] += oim[i] * win[i] * norm; } }
        }
        if (f % 50 === 0) postMessage({ progress: 0.3 + 0.7 * f / frames });
      }
      postMessage({ done: true, stems: out }, out.flat().map(a => a.buffer));
    };
  }
  let url = null;
  function separate(buffer, onProgress) {
    if (!url) url = URL.createObjectURL(new Blob(['(' + workerMain.toString() + ')()'], { type: 'text/javascript' }));
    const w = new Worker(url);
    const L = buffer.getChannelData(0).slice(), R = (buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : buffer.getChannelData(0)).slice();
    return new Promise((res, rej) => {
      w.onmessage = e => {
        if (e.data.progress !== undefined) onProgress && onProgress(e.data.progress);
        if (e.data.done) { w.terminate(); res(e.data.stems); }
      };
      w.onerror = er => { w.terminate(); rej(er); };
      w.postMessage({ L, R, sr: buffer.sampleRate }, [L.buffer, R.buffer]);
    });
  }
  return { separate, NAMES: ['Vokal', 'Davul / Ritim', 'Bas', 'Diğer Enstrümanlar'] };
})();
