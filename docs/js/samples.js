'use strict';
// Gerçek enstrüman kayıtları (FluidR3 GM - MIT, VCSL - CC0). Veriler samples/<id>.js içinde, ihtiyaç olunca yüklenir.
const Samples = (() => {
  let IDX = {};
  const raw = {}, ready = {}, loading = {}, waiters = {};
  let decodeCtx = null;
  function index(idx, newKits) {
    IDX = idx;
    if (newKits && typeof Lib !== 'undefined') Lib.addKits && Lib.addKits(newKits);
  }
  function reg(id, z) { raw[id] = z; if (waiters[id]) waiters[id](); }
  const has = id => !!IDX[id];
  const get = id => ready[id] || null;
  function script(id) {
    return new Promise((res, rej) => {
      if (raw[id]) return res();
      waiters[id] = res;
      const s = document.createElement('script');
      s.src = 'samples/' + id + '.js?v=1';
      s.onerror = () => rej(new Error('örnek yüklenemedi: ' + id));
      document.head.appendChild(s);
    });
  }
  async function dec(b64) {
    const bin = atob(b64), u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return await decodeCtx.decodeAudioData(u.buffer);
  }
  function ensure(ctx, id) {
    if (!has(id) || ready[id]) return Promise.resolve(ready[id] || null);
    if (!decodeCtx && ctx && !(typeof OfflineAudioContext !== 'undefined' && ctx instanceof OfflineAudioContext)) decodeCtx = ctx;
    if (!decodeCtx) decodeCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (!loading[id]) loading[id] = (async () => {
      await script(id);
      const z = raw[id], m = IDX[id];
      const b = await Promise.all(z.map(e => e == null ? null : Array.isArray(e) ? Promise.all(e.map(dec)) : dec(e)));
      delete raw[id];
      ready[id] = Object.assign({ b, rr: 0, f: (m.n || []).map(n => 440 * Math.pow(2, (n - 69) / 12)) }, m);
      return ready[id];
    })().catch(e => { console.warn(e); loading[id] = null; return null; });
    return loading[id];
  }
  const ensureAll = (ctx, ids) => Promise.all([...new Set(ids)].map(id => ensure(ctx, id)));
  const pending = ids => [...new Set(ids)].filter(id => has(id) && !ready[id]);
  return { index, reg, has, get, ensure, ensureAll, pending };
})();
