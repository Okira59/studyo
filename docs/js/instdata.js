'use strict';
// Enstrüman kütüphanesi: bölgelere göre dünya enstrümanları ve ritim kitleri
const Lib = (() => {
  const INST = {}, CATS = [];
  let C = null;
  const cat = (name) => { C = { name, items: [] }; CATS.push(C); };
  const add = (id, name, type, p, ex = {}) => { const i = Object.assign({ id, name, type, p, cat: C.name, gain: 1 }, ex); INST[id] = i; C.items.push(i); };
  const pl = (id, name, p, ex) => add(id, name, 'pluck', p, ex);
  const md = (id, name, p, ex) => add(id, name, 'modal', p, ex);
  const sy = (id, name, p, ex) => add(id, name, 'synth', p, ex);
  const ODD = [1, 0, 0.45, 0, 0.28, 0, 0.16, 0, 0.1, 0, 0.06];
  const REED = [1, 0.7, 0.55, 0.4, 0.3, 0.22, 0.16, 0.12, 0.09, 0.07];

  // ===================== TÜRK & ANADOLU =====================
  cat('Türk & Anadolu');
  pl('baglama', 'Bağlama (Saz)', { courses: [[0, 1], [5, 0.85], [1200, 0.3]], bright: 0.9, pick: 0.85, decay: 2.2, pos: 0.1, body: [[350, 2, 5], [2200, 1.5, 5]], lp: 7500, buzz: 0.06, pickNoise: 0.15, rel: 0.4 });
  pl('cura', 'Cura', { courses: [[0, 1], [4, 0.85]], bright: 0.9, pick: 0.9, decay: 1.3, pos: 0.09, body: [[600, 2, 5], [2800, 1.5, 5]], lp: 8000, buzz: 0.05, pickNoise: 0.15 });
  pl('divan', 'Divan Sazı', { courses: [[0, 1], [3, 0.9], [-1200, 0.45]], bright: 0.88, pick: 0.75, decay: 3, pos: 0.12, body: [[200, 2, 6], [1800, 1.5, 4]], lp: 6500, buzz: 0.05, rel: 0.5 });
  pl('ebaglama', 'Elektro Bağlama', { courses: [[0, 1], [5, 0.8]], bright: 0.93, pick: 0.85, decay: 3.5, pos: 0.08, body: [[1500, 1, 4]], lp: 6000, drive: 1.6, rel: 0.4 });
  pl('ud', 'Ud', { courses: [[0, 1], [3, 0.9]], bright: 0.62, pick: 0.6, decay: 2, pos: 0.2, body: [[150, 1.5, 6], [300, 2, 5], [2500, 1, -3]], lp: 4500, pickNoise: 0.1, rel: 0.35 });
  pl('cumbus', 'Cümbüş', { courses: [[0, 1], [5, 0.8]], bright: 0.84, pick: 0.85, decay: 2, pos: 0.1, body: [[600, 2, 7], [3000, 1.5, 6]], hp: 120 });
  pl('kanun', 'Kanun', { courses: [[0, 1], [2.5, 0.9], [-2.5, 0.9]], bright: 0.82, pick: 0.75, decay: 2.5, pos: 0.12, body: [[600, 1.5, 4], [2500, 1, 4]], hp: 110, pickNoise: 0.1, rel: 0.6 });
  md('santur', 'Santur', { harm: 16, B: 0.00005, tilt: 0.7, dd: 0.25, decay: 3, detune: 4, noise: [0.4, 4000, 1, 0.004], hammer: 0.13, rel: 0.6 });
  sy('kemence', 'Kemençe (Karadeniz)', { osc: [['sawtooth', 0, 0, 1]], lp: { f: 6500 }, peaks: [[900, 3, 8], [2500, 2, 6], [300, 1, -4]], env: [0.03, 0.2, 0.9, 0.12], vib: [6.5, 22, 0.12], breath: [0.04, 0, 1, 3500], gain: 0.28 });
  sy('kemence2', 'Kemençe (Klasik)', { osc: [['sawtooth', 0, 0, 1]], lp: { f: 5500 }, peaks: [[600, 2.5, 7], [1800, 2, 5]], env: [0.05, 0.2, 0.9, 0.18], vib: [5.5, 22, 0.2], scoop: [-30, 0.08], breath: [0.04, 0, 1, 3000], gain: 0.28 });
  sy('kabak', 'Kabak Kemane', { osc: [['sawtooth', 0, 0, 1]], lp: { f: 4500 }, peaks: [[500, 3, 8], [1500, 2, 6]], env: [0.06, 0.2, 0.9, 0.2], vib: [5, 26, 0.2], scoop: [-40, 0.1], breath: [0.05, 0, 1, 2500], gain: 0.28 });
  sy('ney', 'Ney', { osc: [['sine', 0, 0, 1], [[0, 0.25, 0.08, 0.04], 0, 0, 0.5]], lp: { f: 3500 }, env: [0.14, 0.2, 0.85, 0.25], vib: [4.5, 12, 0.35], scoop: [-35, 0.15], breath: [0.5, 2, 1.2], gain: 0.45 });
  sy('kaval', 'Kaval', { osc: [['sine', 0, 0, 1], ['triangle', 0, 0, 0.35]], lp: { f: 5000 }, env: [0.08, 0.2, 0.85, 0.2], vib: [5, 12, 0.3], breath: [0.3, 2, 1.5], chiff: 0.2, gain: 0.45 });
  sy('zurna', 'Zurna', { osc: [['square', 0, 0, 0.7], ['sawtooth', 0, 0, 0.6]], lp: { f: 7500 }, peaks: [[1200, 2, 8], [2800, 2, 8], [300, 1, -6]], env: [0.02, 0.1, 0.95, 0.08], vib: [6, 30, 0.1], scoop: [-50, 0.05], breath: [0.03, 0, 1, 4000], gain: 0.22 });
  sy('mey', 'Mey', { osc: [[REED, 0, 0, 1]], lp: { f: 2200 }, peaks: [[600, 2.5, 8], [1100, 2, 4]], env: [0.05, 0.2, 0.9, 0.15], vib: [5, 20, 0.2], scoop: [-40, 0.1], breath: [0.05, 0, 1, 1500], gain: 0.4 });
  sy('tklarnet', 'Klarnet (Türk / Roman)', { osc: [[[1, 0.2, 0.6, 0.1, 0.4, 0.05, 0.25, 0.02, 0.12], 0, 0, 1]], lp: { f: 4500 }, peaks: [[1500, 2, 4]], env: [0.03, 0.1, 0.9, 0.1], vib: [6, 25, 0.15], scoop: [-60, 0.08], breath: [0.03, 3, 1], gain: 0.4 });
  sy('tulum', 'Tulum', { osc: [['square', -6, 0, 0.7], ['square', 6, 0, 0.7]], lp: { f: 5000 }, peaks: [[1000, 2, 6], [2500, 2, 4]], env: [0.02, 0.1, 1, 0.05], gain: 0.2 });
  md('kudumzil', 'Çalpara / Zil (melodik)', { modes: [[1, 1, 1], [2.32, 0.6, 0.6], [4.25, 0.4, 0.4], [6.63, 0.2, 0.3]], decay: 2.2, noise: [0.3, 6000, 1, 0.003] });
  sy('akordeon', 'Akordeon', { osc: [['sawtooth', -14, 0, 0.6], ['sawtooth', 0, 0, 0.6], ['square', 14, 0, 0.4]], lp: { f: 4500 }, peaks: [[1000, 1.5, 4]], env: [0.025, 0.1, 0.9, 0.08], gain: 0.2 });

  // ===================== ORTA DOĞU & KAFKASYA =====================
  cat('Orta Doğu & Kafkasya');
  pl('tar', 'Tar (Azeri / İran)', { courses: [[0, 1], [4, 0.9]], bright: 0.86, pick: 0.8, decay: 1.8, pos: 0.1, body: [[500, 3, 8], [2200, 2, 5]], pickNoise: 0.15 });
  pl('setar', 'Setar', { bright: 0.8, pick: 0.5, decay: 2.2, pos: 0.15, body: [[400, 2, 5]], buzz: 0.03 });
  pl('tanbur', 'Tanbur', { courses: [[0, 1], [1200, 0.4]], bright: 0.86, pick: 0.7, decay: 4, pos: 0.1, body: [[250, 2, 5], [2000, 1.5, 3]], buzz: 0.05, rel: 0.6 });
  pl('arabud', 'Arap Udu', { courses: [[0, 1], [4, 0.9]], bright: 0.58, pick: 0.55, decay: 1.8, pos: 0.22, body: [[130, 1.5, 6], [280, 2, 5]], lp: 4000 });
  sy('duduk', 'Duduk', { osc: [[[1, 0.6, 0.5, 0.3, 0.2, 0.15, 0.1], 0, 0, 1]], lp: { f: 2500 }, peaks: [[500, 2, 6], [1300, 2, 5]], env: [0.08, 0.2, 0.9, 0.2], vib: [5, 18, 0.25], scoop: [-40, 0.1], breath: [0.06, 0, 1, 1500], gain: 0.4 });
  sy('rebab', 'Rebab', { osc: [['sawtooth', 0, 0, 1]], lp: { f: 4000 }, peaks: [[700, 3, 9], [2000, 2, 5]], env: [0.05, 0.2, 0.9, 0.18], vib: [5, 30, 0.2], breath: [0.06, 0, 1, 2500], gain: 0.28 });
  sy('kamancheh', 'Kamançe', { osc: [['sawtooth', 0, 0, 1]], lp: { f: 5000 }, peaks: [[650, 2.5, 7], [2000, 2, 5]], env: [0.05, 0.2, 0.9, 0.2], vib: [5.5, 25, 0.2], gain: 0.28 });
  sy('mizmar', 'Mizmar', { osc: [['square', 0, 0, 0.7], ['sawtooth', 5, 0, 0.5]], lp: { f: 6500 }, peaks: [[1100, 2.5, 9], [2600, 2, 6]], env: [0.02, 0.1, 0.95, 0.08], vib: [6, 25, 0.1], gain: 0.22 });
  sy('mijwiz', 'Mijwiz', { osc: [['square', -12, 0, 0.6], ['square', 12, 0, 0.6]], lp: { f: 4500 }, peaks: [[1300, 2, 6]], env: [0.02, 0.1, 0.95, 0.06], vib: [6, 10, 0.1], gain: 0.25 });
  sy('arghul', 'Arghul', { osc: [[ODD, 0, 0, 1], ['sawtooth', 0, -1, 0.3]], lp: { f: 3500 }, peaks: [[900, 2, 6]], env: [0.03, 0.1, 0.95, 0.08], gain: 0.35 });

  // ===================== HİNDİSTAN & GÜNEY ASYA =====================
  cat('Hindistan & Güney Asya');
  pl('sitar', 'Sitar', { courses: [[0, 1], [1200, 0.12], [1902, 0.08]], bright: 0.94, pick: 0.85, decay: 4, pos: 0.08, buzz: 0.35, body: [[300, 2, 4], [3000, 1.5, 6]], rel: 0.8 });
  pl('tanpura', 'Tanpura (Dem)', { courses: [[0, 1], [1200, 0.3], [-3, 0.8]], bright: 0.92, pick: 0.5, decay: 6, dur: 7, pos: 0.2, buzz: 0.5, body: [[200, 2, 4]], rel: 1.5 });
  pl('sarod', 'Sarod', { bright: 0.78, pick: 0.85, decay: 2.5, pos: 0.12, body: [[400, 3, 8], [1500, 2, 4]], buzz: 0.1 });
  pl('veena', 'Veena', { courses: [[0, 1], [1200, 0.15]], bright: 0.86, pick: 0.7, decay: 4, pos: 0.12, buzz: 0.25, body: [[180, 2, 6]], rel: 0.7 });
  md('santoor', 'Santoor (Hint)', { harm: 14, B: 0.00004, tilt: 0.75, dd: 0.3, decay: 2.6, detune: 5, noise: [0.45, 4500, 1, 0.003], hammer: 0.11, rel: 0.6 });
  sy('sarangi', 'Sarangi', { osc: [['sawtooth', 0, 0, 1]], lp: { f: 5000 }, peaks: [[500, 2, 6], [1200, 2.5, 6], [3000, 2, 4]], env: [0.06, 0.2, 0.9, 0.2], vib: [5.5, 30, 0.2], scoop: [-50, 0.12], breath: [0.04, 0, 1, 3000], gain: 0.28 });
  sy('esraj', 'Esraj', { osc: [['sawtooth', 0, 0, 1]], lp: { f: 4000 }, peaks: [[450, 2, 5], [1100, 2, 5]], env: [0.08, 0.2, 0.9, 0.25], vib: [5, 22, 0.25], gain: 0.28 });
  sy('bansuri', 'Bansuri', { osc: [['sine', 0, 0, 1], ['triangle', 0, 0, 0.2]], lp: { f: 4000 }, env: [0.1, 0.2, 0.85, 0.25], vib: [5, 15, 0.3], scoop: [-50, 0.1], breath: [0.25, 2, 1.3], gain: 0.45 });
  sy('shehnai', 'Shehnai', { osc: [['square', 0, 0, 0.6], ['sawtooth', 0, 0, 0.6]], lp: { f: 6000 }, peaks: [[1500, 3, 10], [3000, 2, 5], [300, 1, -6]], env: [0.03, 0.1, 0.95, 0.1], vib: [6, 35, 0.12], scoop: [-60, 0.08], gain: 0.22 });
  sy('harmonium', 'Harmonium', { osc: [['sawtooth', -5, 0, 0.6], ['sawtooth', 5, 0, 0.6], ['square', 0, 1, 0.3]], lp: { f: 3000 }, peaks: [[800, 1.5, 3]], env: [0.04, 0.1, 0.9, 0.1], gain: 0.2 });

  // ===================== DOĞU ASYA =====================
  cat('Doğu Asya (Japon, Çin, Kore)');
  pl('koto', 'Koto', { bright: 0.8, pick: 0.75, decay: 2.5, pos: 0.2, body: [[250, 2, 4], [1800, 1.5, 5]], hp: 100, rel: 0.6 });
  pl('shamisen', 'Shamisen', { bright: 0.9, pick: 1, decay: 0.9, pos: 0.05, buzz: 0.3, body: [[600, 3, 10], [2500, 2, 6]], hp: 200, pickNoise: 0.3 });
  pl('biwa', 'Biwa', { bright: 0.9, pick: 0.9, decay: 1.8, pos: 0.08, buzz: 0.35, body: [[300, 2, 6]] });
  pl('guzheng', 'Guzheng', { bright: 0.83, pick: 0.7, decay: 3.5, pos: 0.2, body: [[200, 1.5, 4], [2500, 1, 4]], rel: 0.7 });
  pl('pipa', 'Pipa', { bright: 0.86, pick: 0.85, decay: 1.6, pos: 0.12, body: [[400, 2, 5], [2600, 1.5, 5]], pickNoise: 0.15 });
  pl('gayageum', 'Gayageum (Kore)', { bright: 0.6, pick: 0.4, decay: 2.5, pos: 0.18, body: [[180, 1.5, 5]], rel: 0.6 });
  md('yangqin', 'Yangqin', { harm: 14, B: 0.00005, tilt: 0.75, dd: 0.3, decay: 2, detune: 4, noise: [0.4, 4000, 1, 0.003], hammer: 0.12 });
  sy('erhu', 'Erhu', { osc: [['sawtooth', 0, 0, 1]], lp: { f: 5000 }, peaks: [[800, 2.5, 8], [2000, 2, 4]], env: [0.06, 0.2, 0.9, 0.2], vib: [6, 35, 0.15], scoop: [-40, 0.1], breath: [0.04, 0, 1, 3000], gain: 0.28 });
  sy('haegeum', 'Haegeum (Kore)', { osc: [['sawtooth', 0, 0, 1]], lp: { f: 4500 }, peaks: [[1000, 3, 9], [2200, 2, 4]], env: [0.06, 0.2, 0.9, 0.2], vib: [5, 30, 0.2], gain: 0.28 });
  sy('shakuhachi', 'Shakuhachi', { osc: [['sine', 0, 0, 1], ['triangle', 0, 0, 0.15]], lp: { f: 3000 }, env: [0.12, 0.2, 0.85, 0.3], vib: [4, 20, 0.4], scoop: [-80, 0.2], breath: [0.5, 2, 0.8], gain: 0.45 });
  sy('dizi', 'Dizi', { osc: [['sine', 0, 0, 1], ['sawtooth', 0, 0, 0.12]], lp: { f: 6000 }, peaks: [[2500, 3, 6]], env: [0.05, 0.2, 0.9, 0.2], vib: [5.5, 15, 0.25], breath: [0.15, 2, 1.5], gain: 0.42 });
  sy('sheng', 'Sheng', { osc: [[[1, 0.8, 0.6, 0.5, 0.4, 0.3, 0.2, 0.15], -4, 0, 0.6], [[1, 0.8, 0.6, 0.5, 0.4], 4, 0, 0.6]], lp: { f: 4000 }, env: [0.05, 0.1, 0.9, 0.12], gain: 0.25 });

  // ===================== GÜNEYDOĞU ASYA =====================
  cat('Güneydoğu Asya (Gamelan)');
  md('gender', 'Gamelan Gender', { modes: [[1, 1, 1], [2.4, 0.2, 0.4], [4.4, 0.1, 0.2]], decay: 4, detune: 6, noise: [0.15, 2000, 1, 0.005], decayKey: 0.3, rel: 1.2 });
  md('bonang', 'Gamelan Bonang', { modes: [[1, 1, 1], [1.52, 0.4, 0.5], [2.41, 0.3, 0.3], [3.2, 0.15, 0.2]], decay: 2, detune: 5, noise: [0.2, 3000, 1, 0.004], rel: 0.8 });
  md('saron', 'Gamelan Saron', { modes: [[1, 1, 1], [2.7, 0.3, 0.4], [4.9, 0.15, 0.2]], decay: 2.5, detune: 6, noise: [0.3, 3000, 1, 0.003], rel: 0.8 });
  md('ranat', 'Ranat (Tayland)', { modes: [[1, 1, 1], [3.9, 0.4, 0.25], [9.2, 0.12, 0.1]], decay: 0.6, noise: [0.4, 2500, 1, 0.003], rel: 0.2 });
  md('angklung', 'Angklung', { modes: [[1, 1, 1], [2, 0.5, 0.5], [3.01, 0.2, 0.3]], decay: 1.5, trem: [11, 0.85], attack: 0.01, rel: 0.2 });
  md('khim', 'Khim', { harm: 12, B: 0.00005, tilt: 0.8, dd: 0.35, decay: 2, detune: 3, noise: [0.3, 3500, 1, 0.003], hammer: 0.15 });
  sy('khaen', 'Khaen', { osc: [[[1, 0.7, 0.5, 0.35, 0.25, 0.18], -3, 0, 0.6], [[1, 0.7, 0.5], 3, 0, 0.6]], lp: { f: 3500 }, env: [0.04, 0.1, 0.9, 0.1], breath: [0.06, 3, 1], trem: [6, 0.2], gain: 0.25 });

  // ===================== AFRİKA =====================
  cat('Afrika');
  md('kalimba', 'Kalimba', { modes: [[1, 1, 1], [5.9, 0.25, 0.2], [13.6, 0.08, 0.08]], decay: 1.6, noise: [0.25, 250, 1, 0.02], body: [[300, 1, 4]], rel: 0.4 });
  md('mbira', 'Mbira', { modes: [[1, 1, 1], [5.6, 0.2, 0.2], [12.7, 0.08, 0.08]], decay: 2, buzz: 0.25, noise: [0.2, 300, 1, 0.02], rel: 0.4 });
  md('balafon', 'Balafon', { modes: [[1, 1, 1], [4, 0.35, 0.15], [9.9, 0.1, 0.06]], decay: 0.7, buzz: 0.3, noise: [0.3, 1500, 1, 0.004], rel: 0.2 });
  pl('kora', 'Kora', { bright: 0.75, pick: 0.55, decay: 2.5, pos: 0.25, body: [[300, 3, 8], [150, 2, 5]], rel: 0.6 });
  pl('ngoni', 'Ngoni', { bright: 0.82, pick: 0.7, decay: 1.2, pos: 0.12, body: [[400, 3, 8]], buzz: 0.15 });
  sy('goje', 'Goje (Batı Afrika kemanı)', { osc: [['sawtooth', 0, 0, 1]], lp: { f: 4000 }, peaks: [[600, 3, 8]], env: [0.05, 0.2, 0.9, 0.2], vib: [4, 20, 0.1], breath: [0.08, 0, 1, 2500], gain: 0.28 });
  sy('masenqo', 'Masenqo (Etiyopya)', { osc: [['sawtooth', 0, 0, 1]], lp: { f: 3500 }, peaks: [[550, 3, 9], [1600, 2, 4]], env: [0.06, 0.2, 0.9, 0.2], vib: [5, 25, 0.15], gain: 0.28 });

  // ===================== AVRUPA & KELT =====================
  cat('Avrupa & Kelt');
  pl('mandolin', 'Mandolin', { courses: [[0, 1], [6, 0.9]], bright: 0.86, pick: 0.75, decay: 1.5, pos: 0.12, body: [[400, 1.5, 4], [3000, 1, 4]] });
  pl('buzuki', 'Buzuki', { courses: [[0, 1], [1200, 0.6]], bright: 0.86, pick: 0.8, decay: 2.5, pos: 0.1, body: [[350, 2, 4], [2500, 1.5, 5]] });
  pl('balalayka', 'Balalayka', { courses: [[0, 1], [3, 0.9]], bright: 0.82, pick: 0.75, decay: 1, pos: 0.12, body: [[500, 2, 6]] });
  pl('lavta', 'Lavta / Lut', { courses: [[0, 1], [3, 0.9]], bright: 0.62, pick: 0.5, decay: 2, pos: 0.18, body: [[200, 1.5, 5]], lp: 4000 });
  pl('keltarp', 'Kelt Arpı', { bright: 0.72, pick: 0.5, decay: 3.5, pos: 0.3, lp: 5000, rel: 0.8 });
  pl('klavsen', 'Klavsen (Harpsichord)', { courses: [[0, 1], [1200, 0.45]], bright: 0.9, pick: 0.9, decay: 2.5, pos: 0.07, body: [[2500, 1, 3]], rel: 0.15 });
  md('cimbalom', 'Simbalom', { harm: 16, B: 0.00006, tilt: 0.9, dd: 0.25, decay: 4, detune: 4, noise: [0.3, 3000, 1, 0.004], hammer: 0.12, rel: 0.8 });
  sy('gayda', 'Gayda / Gaida', { osc: [['sawtooth', 0, 0, 1]], lp: { f: 6000 }, peaks: [[1200, 2, 8], [3000, 1.5, 6]], env: [0.02, 0.1, 1, 0.05], gain: 0.22 });
  sy('bagpipe', 'İskoç Gaydası', { osc: [['sawtooth', 0, 0, 0.8], ['square', 3, 0, 0.4]], lp: { f: 6500 }, peaks: [[1000, 2, 7], [2800, 2, 7]], env: [0.02, 0.1, 1, 0.05], gain: 0.2 });
  sy('tinwhistle', 'Tin Whistle', { osc: [['triangle', 0, 0, 1], ['sine', 0, 1, 0.1]], lp: { f: 6000 }, env: [0.03, 0.2, 0.9, 0.12], vib: [6, 12, 0.25], breath: [0.12, 3, 1.5], chiff: 0.25, gain: 0.42 });
  sy('bandoneon', 'Bandoneon', { osc: [['sawtooth', -6, 0, 0.6], ['sawtooth', 6, 0, 0.6], ['square', 0, 1, 0.25]], lp: { f: 3500 }, peaks: [[800, 1.5, 3]], env: [0.04, 0.1, 0.9, 0.1], gain: 0.2 });
  sy('hurdy', 'Çarklı Lir (Hurdy-gurdy)', { osc: [['sawtooth', 0, 0, 0.8], ['square', 0, 0, 0.3]], lp: { f: 5000 }, peaks: [[1000, 2.5, 6]], env: [0.02, 0.1, 1, 0.1], breath: [0.06, 0, 1, 3000], trem: [24, 0.15], gain: 0.25 });
  sy('mizika', 'Mızıka (Harmonika)', { osc: [['square', -8, 0, 0.6], ['square', 8, 0, 0.6]], lp: { f: 4000 }, peaks: [[1500, 2, 6]], env: [0.03, 0.1, 0.9, 0.08], vib: [5, 15, 0.2], gain: 0.22 });
  sy('melodika', 'Melodika', { osc: [['square', 0, 0, 1]], lp: { f: 3000 }, peaks: [[1200, 1.5, 3]], env: [0.02, 0.1, 0.9, 0.08], gain: 0.25 });

  // ===================== AMERİKA, LATİN & OKYANUSYA =====================
  cat('Amerika, Latin & Okyanusya');
  pl('banjo', 'Banjo', { bright: 0.86, pick: 0.8, decay: 1.2, pos: 0.08, body: [[700, 2, 8], [2000, 1.5, 6]], hp: 150 });
  pl('charango', 'Charango', { courses: [[0, 1], [1200, 0.5], [4, 0.8]], bright: 0.82, pick: 0.7, decay: 1.3, pos: 0.15, body: [[500, 1.5, 4]] });
  pl('cuatro', 'Cuatro', { courses: [[0, 1], [4, 0.8]], bright: 0.75, pick: 0.6, decay: 1.4, pos: 0.15, body: [[350, 1.5, 5]] });
  pl('ukulele', 'Ukulele', { bright: 0.62, pick: 0.45, decay: 1.2, pos: 0.18, body: [[300, 1.5, 5]] });
  sy('panflut', 'Pan Flüt (Zampoña)', { osc: [['sine', 0, 0, 1], ['sine', 0, 1, 0.08]], lp: { f: 3000 }, env: [0.05, 0.2, 0.85, 0.2], vib: [5, 8, 0.35], breath: [0.3, 2, 1.2], chiff: 0.35, gain: 0.45 });
  sy('quena', 'Quena', { osc: [['sine', 0, 0, 1], ['triangle', 0, 0, 0.3]], lp: { f: 4500 }, env: [0.06, 0.2, 0.85, 0.2], vib: [5.5, 14, 0.25], breath: [0.25, 2, 1.2], gain: 0.45 });
  sy('ocarina', 'Okarina', { osc: [['sine', 0, 0, 1]], env: [0.04, 0.2, 0.9, 0.15], vib: [5, 8, 0.3], breath: [0.06, 2, 2], gain: 0.5 });
  md('steelpan', 'Steel Pan (Çelik Tava)', { modes: [[1, 1, 1], [2, 0.8, 0.6], [3, 0.3, 0.4], [4, 0.15, 0.3]], decay: 1.6, noise: [0.2, 3000, 1, 0.003], attack: 0.003, rel: 0.5 });
  sy('didgeridoo', 'Didgeridoo', { osc: [['sawtooth', 0, 0, 1]], lp: { f: 500, q: 6 }, wah: [0.4, 0.8], peaks: [[200, 2, 6]], env: [0.08, 0.1, 1, 0.2], breath: [0.08, 0, 1, 300], gain: 0.4 });

  // ===================== KLAVYELER =====================
  cat('Klavyeler');
  md('piyano', 'Piyano', { harm: 24, B: 0.0004, tilt: 1, dd: 0.35, decay: 5, decayKey: 0.7, detune: 1.5, hammer: 0.12, noise: [0.25, 2500, 0.7, 0.012], dur: 7, rel: 0.25 }, { gain: 1 });
  md('parlakpiyano', 'Parlak Piyano', { harm: 26, B: 0.0004, tilt: 0.75, dd: 0.3, decay: 4.5, decayKey: 0.7, detune: 2, hammer: 0.08, noise: [0.35, 3500, 0.7, 0.01], dur: 6, rel: 0.25 });
  md('epiano', 'Elektrik Piyano', { modes: [[1, 1, 1], [2, 0.15, 0.6], [3, 0.05, 0.3], [7.2, 0.18, 0.06]], decay: 3, decayKey: 0.6, noise: [0.05, 1000, 1, 0.005], trem: [5, 0.15], rel: 0.3 });
  md('celesta', 'Çelesta', { modes: [[1, 1, 1], [3.98, 0.3, 0.4], [10.1, 0.1, 0.1]], decay: 1.5, noise: [0.2, 4000, 1, 0.002], rel: 0.4 });
  sy('org', 'Hammond Org', { osc: [[[1, 1, 0.8, 0.6, 0, 0.4, 0, 0.3], 0, 0, 1], ['sine', 0, -1, 0.5]], env: [0.005, 0.01, 1, 0.03], vib: [6.5, 6, 0], chiff: 0.15, gain: 0.25 });
  sy('kilise', 'Kilise Orgu', { osc: [[[1, 0.7, 0.5, 0.4, 0.3, 0.25, 0.2, 0.15, 0.12, 0.1], 0, 0, 1], ['sine', 0, -1, 0.6], [[1, 0.5, 0.3], 2, 1, 0.3]], env: [0.08, 0.05, 1, 0.25], gain: 0.22 });
  pl('clavinet', 'Clavinet', { bright: 0.84, pick: 0.8, decay: 1.2, pos: 0.05, body: [[1200, 2, 6]], rel: 0.08 });

  // ===================== GİTAR & BAS =====================
  cat('Gitar & Bas');
  pl('klasikgitar', 'Klasik Gitar', { bright: 0.58, pick: 0.35, decay: 2.5, pos: 0.2, body: [[110, 1.5, 6], [220, 2, 4], [2500, 1, -4]], lp: 5000, rel: 0.3 });
  pl('akustikgitar', 'Akustik Gitar', { bright: 0.72, pick: 0.6, decay: 3, pos: 0.15, body: [[100, 1.2, 5], [200, 1.5, 3], [3000, 1, 3]], pickNoise: 0.1, rel: 0.3 });
  pl('12telli', '12 Telli Gitar', { courses: [[0, 1], [1200, 0.45], [4, 0.6]], bright: 0.75, pick: 0.6, decay: 3, pos: 0.15, body: [[100, 1.2, 5], [3000, 1, 4]], rel: 0.3 });
  pl('egitar', 'Elektro Gitar (Temiz)', { bright: 0.78, pick: 0.55, decay: 3.5, pos: 0.1, body: [[1500, 1, 3]], lp: 4500, rel: 0.2 });
  pl('distgitar', 'Distortion Gitar', { bright: 0.85, pick: 0.6, decay: 6, pos: 0.12, drive: 9, body: [[800, 1, 4], [3000, 1, -6]], lp: 3800, rel: 0.12 }, { gain: 0.8 });
  pl('basgitar', 'Bas Gitar', { bright: 0.62, pick: 0.35, decay: 3, pos: 0.25, lp: 2500, body: [[80, 1, 4]], rel: 0.12 });
  pl('fretless', 'Perdesiz Bas', { bright: 0.55, pick: 0.25, decay: 3, pos: 0.3, lp: 1500, rel: 0.15 });
  pl('kontrbaspizz', 'Kontrbas (Pizzicato)', { bright: 0.48, pick: 0.25, decay: 1.2, pos: 0.25, body: [[90, 1.5, 6]], lp: 1200, rel: 0.2 });

  // ===================== YAYLILAR =====================
  cat('Yaylılar (Orkestra)');
  sy('keman', 'Keman', { osc: [['sawtooth', 0, 0, 1]], lp: { f: 6500 }, peaks: [[300, 2, 4], [2800, 1.5, 6], [4500, 2, -4]], env: [0.06, 0.2, 0.9, 0.2], vib: [5.5, 18, 0.25], breath: [0.03, 0, 1, 3000], gain: 0.28 });
  sy('viyola', 'Viyola', { osc: [['sawtooth', 0, 0, 1]], lp: { f: 5000 }, peaks: [[250, 2, 4], [2200, 1.5, 5]], env: [0.07, 0.2, 0.9, 0.25], vib: [5, 15, 0.3], gain: 0.3 });
  sy('cello', 'Çello', { osc: [['sawtooth', 0, 0, 1]], lp: { f: 4000 }, peaks: [[200, 2, 5], [1500, 1.5, 4]], env: [0.08, 0.2, 0.9, 0.3], vib: [5, 14, 0.3], gain: 0.32 });
  sy('kontrbas', 'Kontrbas (Yay)', { osc: [['sawtooth', 0, 0, 1]], lp: { f: 2500 }, peaks: [[100, 1.5, 5]], env: [0.1, 0.2, 0.9, 0.3], vib: [4.5, 10, 0.4], gain: 0.38 });
  sy('yayligrubu', 'Yaylı Grubu', { osc: [['sawtooth', -9, 0, 0.6], ['sawtooth', 0, 0, 0.6], ['sawtooth', 9, 0, 0.6]], lp: { f: 5000 }, peaks: [[3000, 1, 3]], env: [0.25, 0.3, 0.9, 0.5], vib: [5, 8, 0.3], gain: 0.2 });
  pl('pizzicato', 'Pizzicato Yaylılar', { bright: 0.52, pick: 0.3, decay: 0.6, pos: 0.25, body: [[400, 1, 3]], rel: 0.2 });
  pl('arp', 'Arp (Harp)', { bright: 0.62, pick: 0.3, decay: 3, pos: 0.5, lp: 4000, rel: 0.8 });

  // ===================== NEFESLİLER =====================
  cat('Nefesliler');
  sy('flut', 'Flüt', { osc: [['sine', 0, 0, 1], ['triangle', 0, 0, 0.25], ['sine', 0, 1, 0.1]], lp: { f: 5000 }, env: [0.05, 0.2, 0.9, 0.15], vib: [5, 10, 0.3], breath: [0.12, 2, 1.5], gain: 0.45 });
  sy('klarnet', 'Klarnet', { osc: [[ODD, 0, 0, 1]], lp: { f: 3000 }, env: [0.03, 0.1, 0.9, 0.1], vib: [5, 6, 0.4], breath: [0.02, 3, 1], gain: 0.42 });
  sy('obua', 'Obua', { osc: [['sawtooth', 0, 0, 1]], lp: { f: 4000 }, peaks: [[1100, 3, 10], [2800, 2, 6], [300, 1, -6]], env: [0.03, 0.1, 0.9, 0.1], vib: [5.5, 10, 0.3], gain: 0.25 });
  sy('fagot', 'Fagot', { osc: [['sawtooth', 0, 0, 1]], lp: { f: 2000 }, peaks: [[450, 3, 9], [1100, 2, 4]], env: [0.04, 0.1, 0.9, 0.12], vib: [5, 6, 0.4], gain: 0.32 });
  sy('saksafon', 'Saksafon', { osc: [['sawtooth', 0, 0, 0.8], ['square', 0, 0, 0.3]], lp: { k: 3, env: 2.5, a: 0.06, d: 0.3, s: 1.6 }, peaks: [[600, 2, 5], [1700, 2, 5]], env: [0.04, 0.1, 0.9, 0.12], vib: [5, 12, 0.3], breath: [0.04, 3, 1], gain: 0.3 });
  sy('trompet', 'Trompet', { osc: [['sawtooth', 0, 0, 1]], lp: { k: 2, env: 4, a: 0.04, d: 0.2, s: 3 }, peaks: [[1200, 1.5, 4]], env: [0.03, 0.1, 0.85, 0.1], vib: [5.5, 8, 0.4], gain: 0.3 });
  sy('trombon', 'Trombon', { osc: [['sawtooth', 0, 0, 1]], lp: { k: 1.5, env: 3.5, a: 0.06, d: 0.3, s: 2.5 }, peaks: [[500, 1.5, 4]], env: [0.05, 0.1, 0.85, 0.12], vib: [5, 6, 0.4], gain: 0.32 });
  sy('korno', 'Korno', { osc: [['sawtooth', 0, 0, 1]], lp: { k: 1.2, env: 2.5, a: 0.08, d: 0.3, s: 2 }, peaks: [[400, 1.5, 4]], env: [0.06, 0.1, 0.9, 0.15], gain: 0.35 });
  sy('tuba', 'Tuba', { osc: [['sawtooth', 0, 0, 1]], lp: { k: 1.2, env: 2.2, a: 0.06, d: 0.3, s: 1.8 }, env: [0.05, 0.1, 0.9, 0.12], gain: 0.4 });
  sy('brass', 'Bakır Nefesli Grubu', { osc: [['sawtooth', -8, 0, 0.6], ['sawtooth', 0, 0, 0.6], ['sawtooth', 8, 0, 0.6]], lp: { k: 2, env: 3.5, a: 0.06, d: 0.3, s: 2.5 }, peaks: [[1000, 1.5, 3]], env: [0.05, 0.1, 0.9, 0.15], gain: 0.2 });

  // ===================== VURMALI MELODİK =====================
  cat('Vurmalı Melodik');
  md('marimba', 'Marimba', { modes: [[1, 1, 1], [4, 0.35, 0.15], [9.9, 0.1, 0.06]], decay: 0.9, noise: [0.2, 1200, 1, 0.004], rel: 0.3 });
  md('ksilofon', 'Ksilofon', { modes: [[1, 1, 1], [3, 0.4, 0.3], [6, 0.15, 0.15]], decay: 0.5, noise: [0.4, 3000, 1, 0.002], rel: 0.2 });
  md('vibrafon', 'Vibrafon', { modes: [[1, 1, 1], [4, 0.25, 0.4], [10, 0.08, 0.15]], decay: 4, trem: [5.5, 0.35], noise: [0.1, 2000, 1, 0.003], rel: 0.5 });
  md('glock', 'Glockenspiel', { modes: [[1, 1, 1], [2.76, 0.4, 0.5], [5.4, 0.2, 0.3], [8.9, 0.1, 0.2]], decay: 2.5, noise: [0.3, 5000, 1, 0.002], rel: 0.6 });
  md('muzikkutusu', 'Müzik Kutusu', { modes: [[1, 1, 1], [4.2, 0.3, 0.3], [9.3, 0.15, 0.15]], decay: 1.2, noise: [0.2, 5000, 1, 0.002], rel: 0.5 });
  md('tupcan', 'Tüp Çan', { modes: [[1, 1, 1], [1.48, 0.6, 0.8], [1.98, 0.5, 0.7], [2.44, 0.4, 0.6], [2.9, 0.3, 0.5], [4, 0.2, 0.4]], decay: 5, decayKey: 0.2, noise: [0.2, 3000, 1, 0.004], rel: 1.5 });
  md('can', 'Kilise Çanı', { modes: [[0.5, 0.6, 1.2], [1, 1, 1], [1.19, 0.6, 0.8], [1.5, 0.5, 0.7], [2, 0.4, 0.6], [2.5, 0.3, 0.5], [3, 0.2, 0.4]], decay: 6, decayKey: 0.2, dur: 7, rel: 2 });
  md('handpan', 'Handpan (Hang)', { modes: [[1, 1, 1], [2, 0.6, 0.8], [3, 0.25, 0.5]], decay: 3.5, attack: 0.005, noise: [0.1, 800, 1, 0.01], rel: 0.8 });
  md('tibetkase', 'Tibet Kâsesi', { modes: [[1, 1, 1], [2.71, 0.5, 0.8], [5.15, 0.25, 0.6]], decay: 6, decayKey: 0.1, detune: 3, attack: 0.01, dur: 7, rel: 2 });

  // ===================== SES & KORO =====================
  cat('Ses & Koro');
  sy('koroaah', 'Koro "Aaa"', { osc: [['sawtooth', -8, 0, 0.6], ['sawtooth', 8, 0, 0.6]], formants: [[800, 6, 1], [1150, 7, 0.5], [2900, 10, 0.15]], env: [0.2, 0.2, 0.9, 0.4], vib: [5, 15, 0.3], breath: [0.02, 0, 1, 3000, 1], gain: 0.45 });
  sy('koroooh', 'Koro "Ooo"', { osc: [['sawtooth', -8, 0, 0.6], ['sawtooth', 8, 0, 0.6]], formants: [[400, 6, 1], [750, 6, 0.3], [2600, 10, 0.05]], env: [0.2, 0.2, 0.9, 0.4], vib: [5, 15, 0.3], gain: 0.5 });
  sy('vokalpad', 'Vokal Pad', { osc: [['sawtooth', -10, 0, 0.5], ['sawtooth', 0, 0, 0.5], ['sawtooth', 10, 0, 0.5]], formants: [[450, 6, 1], [1900, 8, 0.4], [2700, 10, 0.2]], env: [0.4, 0.3, 0.9, 0.7], vib: [4.5, 10, 0.4], gain: 0.4 });

  // ===================== SYNTH =====================
  cat('Synth & Elektronik');
  sy('sawlead', 'Saw Lead', { osc: [['sawtooth', -7, 0, 0.6], ['sawtooth', 7, 0, 0.6]], lp: { f: 3000, q: 2 }, env: [0.005, 0.2, 0.8, 0.12], vib: [5.5, 10, 0.4], gain: 0.22 });
  sy('squarelead', 'Square Lead', { osc: [['square', 0, 0, 0.8], ['square', 5, 1, 0.2]], lp: { f: 3500, q: 1.5 }, env: [0.005, 0.2, 0.8, 0.1], gain: 0.2 });
  sy('supersaw', 'Super Saw', { osc: [['sawtooth', -20, 0, 0.4], ['sawtooth', -9, 0, 0.4], ['sawtooth', 0, 0, 0.4], ['sawtooth', 9, 0, 0.4], ['sawtooth', 20, 0, 0.4]], lp: { f: 6000 }, env: [0.01, 0.3, 0.8, 0.3], gain: 0.16 });
  sy('pad', 'Synth Pad', { osc: [['sawtooth', -10, 0, 0.5], ['sawtooth', 10, 0, 0.5]], lp: { f: 1500, q: 1 }, env: [0.6, 0.5, 0.9, 1], gain: 0.3 });
  sy('sicakpad', 'Sıcak Pad', { osc: [['triangle', -6, 0, 0.6], ['sawtooth', 6, 0, 0.4]], lp: { f: 900, q: 1 }, env: [0.8, 0.5, 0.9, 1.2], vib: [4, 5, 0.5], gain: 0.4 });
  sy('pluck', 'Synth Pluck', { osc: [['sawtooth', -5, 0, 0.6], ['square', 5, 0, 0.4]], lp: { k: 1.5, env: 10, a: 0.003, d: 0.25, s: 1 }, env: [0.003, 0.35, 0, 0.25], gain: 0.3 });
  sy('synthbas', 'Synth Bas', { osc: [['sawtooth', 0, 0, 0.7], ['square', 0, -1, 0.5]], lp: { k: 2, env: 5, a: 0.005, d: 0.2, s: 1.5, q: 4 }, env: [0.005, 0.2, 0.8, 0.1], gain: 0.3 });
  sy('acidbas', 'Acid Bas (303)', { osc: [['sawtooth', 0, 0, 1]], lp: { k: 1.5, env: 12, a: 0.003, d: 0.18, s: 1.2, q: 14 }, env: [0.003, 0.2, 0.8, 0.08], drive: 2, gain: 0.25 });
  sy('subbas', 'Sub Bas', { osc: [['sine', 0, 0, 1], ['triangle', 0, 0, 0.2]], env: [0.005, 0.1, 1, 0.1], gain: 0.6 });
  sy('808bas', '808 Bas', { osc: [['sine', 0, 0, 1]], scoop: [500, 0.04], env: [0.002, 1.5, 0.3, 0.3], drive: 2.5, gain: 0.55 });
  md('bellsynth', 'Synth Çan', { modes: [[1, 1, 1], [3.5, 0.5, 0.5], [7.1, 0.2, 0.3]], decay: 2.5, rel: 0.6 });
  sy('chiptune', '8-bit (Chiptune)', { osc: [['square', 0, 0, 1]], env: [0.002, 0.1, 0.8, 0.05], gain: 0.18 });

  // ===================== RİTİM KİTLERİ =====================
  const KITS = [];
  cat('Ritim Kitleri (Davullar)');
  const kit = (id, name, pads, ex) => { add(id, name, 'kit', null, Object.assign({ pads }, ex || {})); KITS.push(INST[id]); };
  const T = (f, d, a = 1, f2, sw, ex) => Object.assign({ t: 'tone', f, d, a, f2, sw }, ex || {});
  const N = (ft, f, d, a = 1, q, ex) => Object.assign({ t: 'noise', ft, f, d, a, q }, ex || {});
  const Mo = (f, r, d, a = 1, ex) => Object.assign({ t: 'modes', f, r, d, a }, ex || {});
  const Me = (d, a = 1, ex) => Object.assign({ t: 'metal', d, a }, ex || {});
  const J = (d, a = 1, ex) => Object.assign({ t: 'jingle', d, a }, ex || {});
  const pad = (name, parts, ex) => ({ name, p: Object.assign({ parts }, ex || {}) });

  const kick = pad('Kick (Bas Davul)', [T(110, 0.32, 1, 48, 0.035), N('lp', 2500, 0.006, 0.5)]);
  const snare = pad('Trampet', [T(190, 0.1, 0.6, 170, 0.02), Mo(330, [1, 1.6], 0.07, 0.3), N('hp', 1500, 0.16, 0.8)]);
  const chh = pad('Hi-Hat Kapalı', [Me(0.035, 1, { ff: 7500 })], { g: 0.6 });
  const ohh = pad('Hi-Hat Açık', [Me(0.35, 1, { ff: 7000 })], { g: 0.6 });
  kit('kit_akustik', 'Akustik Davul Seti', [
    kick, snare,
    pad('Yan Çubuk (Rim)', [T(800, 0.02, 0.6), N('bp', 2000, 0.02, 0.8, 3)], { g: 0.7 }),
    pad('El Çırpma (Clap)', [J(0.03, 1, { f: 1200, q: 1.5, n: 4, spread: 0.03 }), N('bp', 1200, 0.12, 0.6, 1.5, { delay: 0.025 })], { g: 0.8 }),
    chh, ohh,
    pad('Hi-Hat Pedal', [Me(0.02, 1, { ff: 8000 })], { g: 0.45 }),
    pad('Tom Tiz', [T(260, 0.25, 1, 200, 0.05), N('lp', 1500, 0.02, 0.2)], { g: 0.85 }),
    pad('Tom Orta', [T(180, 0.3, 1, 140, 0.05), N('lp', 1200, 0.02, 0.2)], { g: 0.85 }),
    pad('Tom Kalın (Floor)', [T(115, 0.4, 1, 88, 0.06), N('lp', 900, 0.02, 0.2)], { g: 0.9 }),
    pad('Crash Zil', [Me(1.4, 0.8, { ff: 4000, f: 330 }), N('hp', 5000, 1.2, 0.5)], { dur: 2.5, g: 0.6 }),
    pad('Ride Zil', [Me(0.9, 0.6, { ff: 3000, f: 500 }), Mo(1800, [1, 2.4], 0.6, 0.2)], { dur: 2, g: 0.5 }),
    pad('Tef (Tambourine)', [J(0.06, 1, { f: 7500, n: 6, spread: 0.02 })], { g: 0.5 }),
    pad('İnek Çanı (Cowbell)', [Me(0.12, 1, { fs: [540, 800], ft: 'bp', ff: 800, q: 1.5 })], { g: 0.6 }),
  ]);
  kit('kit_808', 'Elektronik 808 / Trap', [
    pad('808 Kick', [T(65, 0.9, 1, 45, 0.02), N('lp', 3000, 0.003, 0.4)], { dur: 1.6, drive: 1.5 }),
    pad('808 Trampet', [T(180, 0.08, 0.5), T(330, 0.06, 0.3), N('hp', 1800, 0.12, 0.7)]),
    pad('808 Clap', [J(0.025, 1, { f: 1100, q: 1.2, n: 4, spread: 0.03 }), N('bp', 1100, 0.15, 0.6, 1.2, { delay: 0.03 })], { g: 0.8 }),
    pad('808 Hat Kapalı', [Me(0.03, 1, { ff: 8000 })], { g: 0.55 }),
    pad('808 Hat Açık', [Me(0.28, 1, { ff: 8000 })], { g: 0.55 }),
    pad('808 Tom', [T(160, 0.3, 1, 120, 0.06)]),
    pad('808 Cowbell', [Me(0.2, 1, { fs: [540, 800], ft: 'bp', ff: 800, q: 1.5 })], { g: 0.6 }),
    pad('808 Rimshot', [T(1700, 0.012, 0.8), N('bp', 2500, 0.01, 0.6, 4)], { g: 0.6 }),
    pad('808 Clave', [T(2500, 0.03, 1)], { g: 0.5 }),
    pad('808 Conga', [T(380, 0.18, 1, 330, 0.03)], { g: 0.7 }),
    pad('808 Maracas', [N('hp', 6000, 0.03, 1, 0.7, { at: 0.005 })], { g: 0.4 }),
    pad('808 Zil', [Me(1, 0.8, { ff: 5000, f: 350 })], { dur: 2, g: 0.5 }),
    pad('909 Kick', [T(160, 0.3, 1, 52, 0.03), N('lp', 4000, 0.004, 0.6)], { drive: 1.2 }),
    pad('Hi-Hat Rulo (Trap)', [Me(0.015, 1, { ff: 8500 })], { g: 0.45 }),
  ]);
  kit('kit_turk', 'Türk & Orta Doğu Vurmalıları', [
    pad('Darbuka Düm', [T(155, 0.3, 1, 115, 0.025), Mo(230, [1, 1.59], 0.12, 0.25), N('lp', 800, 0.02, 0.3)]),
    pad('Darbuka Tek', [Mo(620, [1, 1.59, 2.14, 2.3, 2.65], 0.11, 1, { dd: 0.6 }), N('bp', 5000, 0.008, 0.5, 1)], { g: 0.75 }),
    pad('Darbuka Ka', [Mo(600, [1, 1.59, 2.14], 0.04, 1), N('bp', 4500, 0.006, 0.6, 1)], { g: 0.55 }),
    pad('Darbuka Şaplak', [N('bp', 1800, 0.05, 1, 1), T(350, 0.05, 0.5)], { g: 0.7 }),
    pad('Def Düm', [T(110, 0.35, 1, 90, 0.03), J(0.06, 0.35, { f: 7000, n: 5 })]),
    pad('Def Tek (Zilli)', [Mo(420, [1, 1.6], 0.07, 0.6), J(0.08, 1, { f: 7500, n: 6 })], { g: 0.7 }),
    pad('Bendir Düm', [T(80, 0.5, 1, 70, 0.04), N('bp', 1500, 0.3, 0.3, 1)], { dur: 1.5 }),
    pad('Bendir Tek', [Mo(300, [1, 1.5], 0.06, 0.8), N('bp', 1600, 0.12, 0.3, 1)], { g: 0.7 }),
    pad('Kudüm Düm', [T(150, 0.25, 1, 130, 0.03), N('lp', 1000, 0.015, 0.3)], { g: 0.9 }),
    pad('Kudüm Tek', [Mo(330, [1, 1.5, 2.1], 0.12, 1), N('bp', 3000, 0.005, 0.4)], { g: 0.75 }),
    pad('Davul (Tokmak)', [T(90, 0.45, 1, 58, 0.04), N('lp', 2000, 0.05, 0.4)], { dur: 1.5 }),
    pad('Davul (Çubuk)', [N('bp', 2500, 0.04, 1, 1), T(400, 0.03, 0.5)], { g: 0.7 }),
    pad('Parmak Zili', [Mo(2600, [1, 1.48, 2.3], 1.2, 1, { dd: 0.4 })], { dur: 2, g: 0.45 }),
    pad('Kaşık', [N('bp', 2500, 0.015, 1, 4), N('bp', 1800, 0.015, 0.8, 4, { delay: 0.018 })], { g: 0.6 }),
    pad('Riq Düm', [T(180, 0.15, 1, 150, 0.02), J(0.05, 0.6, { f: 8000, n: 6 })], { g: 0.8 }),
    pad('Riq Zil', [J(0.1, 1, { f: 8000, n: 8, spread: 0.035 })], { g: 0.55 }),
    pad('Tabl (Büyük Davul)', [T(75, 0.5, 1, 55, 0.04), N('lp', 1500, 0.04, 0.4)], { dur: 1.5 }),
    pad('Daf', [T(95, 0.4, 1, 80, 0.03), J(0.1, 0.4, { f: 6000, n: 10, spread: 0.05 })], { dur: 1.3 }),
  ]);
  kit('kit_hint', 'Hint Vurmalıları (Tabla)', [
    pad('Tabla Na', [Mo(350, [1, 2, 3, 4, 5], 0.35, 1, { as: [1, 0.6, 0.4, 0.3, 0.2], dd: 0.4 }), N('bp', 3000, 0.005, 0.5)], { g: 0.75 }),
    pad('Tabla Tin', [Mo(350, [1, 2, 3], 0.6, 1, { as: [0.6, 1, 0.4] })], { g: 0.7 }),
    pad('Tabla Tun', [Mo(350, [1, 2], 0.8, 1, { as: [1, 0.3] })], { g: 0.75 }),
    pad('Tabla Te (Tit)', [N('bp', 1500, 0.02, 1, 0.8), T(300, 0.02, 0.6)], { g: 0.6 }),
    pad('Bayan Ge (Açık)', [T(85, 0.6, 1, 110, 0.08)], { dur: 1.3 }),
    pad('Bayan Ke (Kapalı)', [N('lp', 600, 0.03, 1), T(120, 0.03, 0.8)], { g: 0.8 }),
    pad('Bayan Kaydırma', [T(80, 0.9, 1, 135, 0.25)], { dur: 1.6 }),
    pad('Dholak Bas', [T(120, 0.3, 1, 95, 0.03), N('lp', 900, 0.02, 0.3)]),
    pad('Dholak Tiz', [Mo(450, [1, 1.6, 2.2], 0.1, 1), N('bp', 3000, 0.008, 0.4)], { g: 0.7 }),
    pad('Mridangam Tha', [T(140, 0.2, 1, 120, 0.02), N('lp', 1000, 0.02, 0.3)]),
    pad('Mridangam Thi', [Mo(500, [1, 2, 3, 4], 0.3, 1, { as: [1, 0.5, 0.3, 0.2] })], { g: 0.7 }),
    pad('Ghatam', [Mo(420, [1, 1.7, 2.6], 0.08, 1), N('bp', 2500, 0.01, 0.5)], { g: 0.7 }),
    pad('Manjira', [Mo(3100, [1, 1.51, 2.4], 1, 1, { dd: 0.3 })], { dur: 2, g: 0.45 }),
  ]);
  kit('kit_afrika', 'Afrika Vurmalıları', [
    pad('Djembe Bas', [T(75, 0.25, 1, 62, 0.03), N('lp', 300, 0.03, 0.4)]),
    pad('Djembe Ton', [Mo(330, [1, 1.5, 2], 0.15, 1), N('lp', 1500, 0.01, 0.3)], { g: 0.8 }),
    pad('Djembe Şaplak', [N('bp', 2500, 0.05, 1, 1), Mo(600, [1, 1.6], 0.05, 0.5)], { g: 0.75 }),
    pad('Dundunba', [T(70, 0.4, 1, 60, 0.03), N('lp', 800, 0.02, 0.3)]),
    pad('Sangban', [T(110, 0.3, 1, 95, 0.03), N('lp', 1000, 0.02, 0.3)]),
    pad('Kenkeni', [T(180, 0.22, 1, 160, 0.03), N('lp', 1200, 0.02, 0.3)]),
    pad('Dundun Çanı', [Mo(1600, [1, 2.2, 3.1], 0.25, 1)], { g: 0.5 }),
    pad('Konuşan Davul ↓', [T(220, 0.35, 1, 120, 0.1)]),
    pad('Konuşan Davul ↑', [T(140, 0.35, 1, 230, 0.1)]),
    pad('Shekere', [N('hp', 3000, 0.12, 1, 0.7, { at: 0.02 })], { g: 0.45 }),
    pad('Udu', [T(100, 0.3, 1, 70, 0.05, { at: 0.01 })]),
    pad('Agogo Tiz', [Mo(950, [1, 2.4], 0.25, 1)], { g: 0.5 }),
    pad('Agogo Pes', [Mo(640, [1, 2.4], 0.25, 1)], { g: 0.5 }),
  ]);
  kit('kit_latin', 'Latin Vurmalıları', [
    pad('Conga Açık', [Mo(230, [1, 1.5], 0.3, 1), N('lp', 1500, 0.01, 0.3)]),
    pad('Conga Susturulmuş', [Mo(240, [1, 1.5], 0.06, 1), N('bp', 1500, 0.01, 0.4)], { g: 0.8 }),
    pad('Conga Şaplak', [N('bp', 2200, 0.04, 1, 1), Mo(450, [1, 1.6], 0.04, 0.5)], { g: 0.75 }),
    pad('Tumba', [Mo(180, [1, 1.5], 0.35, 1), N('lp', 1200, 0.01, 0.3)]),
    pad('Bongo Tiz', [Mo(420, [1, 1.6], 0.12, 1), N('bp', 3000, 0.005, 0.4)], { g: 0.75 }),
    pad('Bongo Pes', [Mo(310, [1, 1.6], 0.14, 1), N('bp', 2500, 0.005, 0.4)], { g: 0.8 }),
    pad('Timbal Tiz', [T(520, 0.15, 1), Me(0.25, 0.4, { ff: 4000, f: 600 })], { g: 0.7 }),
    pad('Timbal Pes', [T(360, 0.18, 1), Me(0.25, 0.4, { ff: 3500, f: 500 })], { g: 0.7 }),
    pad('Cowbell', [Me(0.15, 1, { fs: [560, 845], ft: 'bp', ff: 840, q: 1.5 })], { g: 0.6 }),
    pad('Clave', [T(2500, 0.04, 1)], { g: 0.55 }),
    pad('Güiro', [{ t: 'scrape', n: 14, gap: 0.013, f: 3500, q: 2, a: 1 }], { g: 0.5 }),
    pad('Marakas', [N('hp', 5000, 0.05, 1, 0.7, { at: 0.01 })], { g: 0.4 }),
    pad('Cajón Bas', [T(90, 0.2, 1, 70, 0.03), N('lp', 400, 0.03, 0.4)]),
    pad('Cajón Şaplak', [N('bp', 2500, 0.08, 0.8, 1), N('hp', 3000, 0.12, 0.6)], { g: 0.75 }),
    pad('Kastanyet', [N('bp', 3000, 0.012, 1, 3), N('bp', 3200, 0.012, 0.8, 3, { delay: 0.02 })], { g: 0.55 }),
  ]);
  kit('kit_asya', 'Japon & Çin Vurmalıları', [
    pad('Ō-daiko (Büyük Taiko)', [T(70, 0.9, 1, 48, 0.05), N('lp', 800, 0.05, 0.4)], { dur: 2 }),
    pad('Nagado Taiko', [T(120, 0.5, 1, 90, 0.04), N('lp', 1200, 0.03, 0.3)], { dur: 1.5 }),
    pad('Shime-daiko', [T(380, 0.08, 1), N('bp', 3000, 0.02, 0.5)], { g: 0.75 }),
    pad('Taiko Kenarı (Fuchi)', [T(1200, 0.02, 1), N('bp', 2000, 0.015, 0.6, 3)], { g: 0.55 }),
    pad('Kane (Çan)', [Mo(2000, [1, 2.6, 4.1], 0.4, 1)], { g: 0.45 }),
    pad('Çin Gongu', [Mo(110, [1, 1.47, 2.09, 2.56, 3.14, 3.7, 4.3], 3.5, 1, { dd: 0.15, at: 0.02 }), N('bp', 600, 1, 0.2, 0.5)], { dur: 5, g: 0.9 }),
    pad('Chau Gong', [Mo(220, [1, 1.5, 2.2, 2.9, 3.6], 2, 1, { dd: 0.2 }), Me(1.5, 0.3, { ff: 3000, f: 250 })], { dur: 3.5, g: 0.7 }),
    pad('Mokugyo (Tahta)', [Mo(700, [1, 2.3], 0.06, 1)], { g: 0.6 }),
    pad('Bo (Çin Zili)', [Me(1, 1, { ff: 3000, f: 380 })], { dur: 2, g: 0.5 }),
    pad('Rin (Kâse)', [Mo(600, [1, 2.71, 5.15], 3, 1, { dd: 0.2 })], { dur: 4, g: 0.5 }),
    pad('Tahta Blok', [Mo(1200, [1, 2.1], 0.04, 1)], { g: 0.55 }),
  ]);
  kit('kit_samba', 'Brezilya (Samba)', [
    pad('Surdo', [T(62, 0.6, 1, 52, 0.04), N('lp', 600, 0.03, 0.3)], { dur: 1.5 }),
    pad('Surdo Susturulmuş', [T(65, 0.1, 1, 55, 0.02)]),
    pad('Caixa', [T(400, 0.05, 0.5), N('hp', 2500, 0.1, 1)], { g: 0.7 }),
    pad('Repinique', [T(500, 0.2, 0.8, 450, 0.03), N('hp', 2000, 0.05, 0.4)], { g: 0.75 }),
    pad('Tamborim', [T(900, 0.05, 1), N('bp', 3000, 0.01, 0.4)], { g: 0.6 }),
    pad('Agogô Tiz', [Mo(1000, [1, 2.4], 0.25, 1)], { g: 0.5 }),
    pad('Agogô Pes', [Mo(700, [1, 2.4], 0.25, 1)], { g: 0.5 }),
    pad('Pandeiro', [T(200, 0.1, 0.6), J(0.06, 1, { f: 7000, n: 6 })], { g: 0.6 }),
    pad('Cuíca Tiz', [T(520, 0.15, 1, 820, 0.05, { at: 0.01 })], { g: 0.55 }),
    pad('Cuíca Pes', [T(380, 0.15, 1, 260, 0.05, { at: 0.01 })], { g: 0.6 }),
    pad('Ganzá', [N('hp', 4500, 0.06, 1, 0.7, { at: 0.012 })], { g: 0.4 }),
    pad('Apito (Düdük)', [T(2600, 0.15, 1, 2500, 0.1, { at: 0.01 })], { g: 0.35 }),
  ]);
  kit('kit_orkestra', 'Orkestra & Kelt Vurmalıları', [
    pad('Timpani Pes', [Mo(90, [1, 1.5, 1.98, 2.44], 1.5, 1, { dd: 0.4 }), N('lp', 500, 0.02, 0.3)], { dur: 2.5 }),
    pad('Timpani Tiz', [Mo(130, [1, 1.5, 1.98, 2.44], 1.3, 1, { dd: 0.4 }), N('lp', 600, 0.02, 0.3)], { dur: 2.5 }),
    pad('Bas Davul (Orkestra)', [T(55, 1, 1, 45, 0.05), N('lp', 300, 0.05, 0.3)], { dur: 2 }),
    pad('Trampet (Marş)', [T(210, 0.08, 0.5), N('hp', 1800, 0.18, 1)], { g: 0.75 }),
    pad('Zil (Orkestra)', [Me(2, 0.8, { ff: 3500, f: 300 }), N('hp', 4000, 1.5, 0.4)], { dur: 3, g: 0.55 }),
    pad('Üçgen (Triangle)', [Mo(3000, [1, 2.71, 4.5], 2, 1, { dd: 0.3 })], { dur: 3, g: 0.4 }),
    pad('Kızak Çanları', [J(0.15, 1, { f: 6500, n: 14, spread: 0.12 })], { dur: 1.2, g: 0.45 }),
    pad('Bodhrán Pes', [T(90, 0.25, 1, 80, 0.03), N('lp', 400, 0.03, 0.4)]),
    pad('Bodhrán Tiz', [T(180, 0.1, 1, 160, 0.02), N('lp', 800, 0.02, 0.3)], { g: 0.8 }),
    pad('Bodhrán Kenar', [T(350, 0.04, 1), N('bp', 2000, 0.02, 0.5)], { g: 0.65 }),
    pad('Tef (Tambourine)', [J(0.07, 1, { f: 7500, n: 7, spread: 0.02 })], { g: 0.5 }),
    pad('Kastanyet', [N('bp', 3000, 0.012, 1, 3), N('bp', 3200, 0.012, 0.8, 3, { delay: 0.02 })], { g: 0.55 }),
  ]);

  // ===================== AKORT / MAKAM =====================
  // Kök sese göre 12 perdenin cent sapmaları ve dizi derece(ler)i
  const TUNINGS = [
    { id: 'esit', name: 'Eşit Akort (Batı)', c: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], s: [0, 2, 4, 5, 7, 9, 11] },
    { id: 'minor', name: 'Minör (Nihavent / Batı)', c: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], s: [0, 2, 3, 5, 7, 8, 10] },
    { id: 'rast', name: 'Rast (Türk)', c: [0, 0, 0, 0, -16, 0, 0, 0, 0, 0, 0, -15], s: [0, 2, 4, 5, 7, 9, 11] },
    { id: 'ussak', name: 'Uşşak (Türk)', c: [0, 0, -19, -6, 0, 0, 0, 0, -8, 0, -4, 0], s: [0, 2, 3, 5, 7, 8, 10] },
    { id: 'huseyni', name: 'Hüseyni (Türk)', c: [0, 0, -19, -6, 0, 0, 0, 0, 0, -16, -4, 0], s: [0, 2, 3, 5, 7, 9, 10] },
    { id: 'hicaz', name: 'Hicaz (Türk)', c: [0, 13, 0, 0, -15, 0, 0, 0, 0, -16, -4, 0], s: [0, 1, 4, 5, 7, 9, 10] },
    { id: 'saba', name: 'Saba (Türk)', c: [0, 0, -19, -6, -8, 0, 0, 0, 0, 0, -4, 0], s: [0, 2, 3, 4, 7, 8, 10] },
    { id: 'kurdi', name: 'Kürdi', c: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], s: [0, 1, 3, 5, 7, 8, 10] },
    { id: 'bayati', name: 'Bayati (Arap, çeyrek ses)', c: [0, 0, -50, 0, 0, 0, 0, 0, 0, 0, 0, 0], s: [0, 2, 3, 5, 7, 8, 10] },
    { id: 'arastrast', name: 'Rast (Arap, çeyrek ses)', c: [0, 0, 0, 0, -50, 0, 0, 0, 0, 0, 0, -50], s: [0, 2, 4, 5, 7, 9, 11] },
    { id: 'sika', name: 'Sikah (Arap)', c: [-50, 0, 0, 0, -50, 0, 0, 0, 0, 0, 0, -50], s: [0, 2, 4, 5, 7, 9, 11] },
    { id: 'bhairav', name: 'Raga Bhairav (Hint)', c: [0, 12, 0, 0, -14, -2, 0, 2, 14, 0, 0, -12], s: [0, 1, 4, 5, 7, 8, 11] },
    { id: 'yaman', name: 'Raga Yaman (Hint)', c: [0, 0, 4, 0, -14, 0, -10, 2, 0, -16, 0, -12], s: [0, 2, 4, 6, 7, 9, 11] },
    { id: 'saf', name: 'Saf Akort (Just)', c: [0, 12, 4, 16, -14, -2, -10, 2, 14, -16, 18, -12], s: [0, 2, 4, 5, 7, 9, 11] },
    { id: 'pentaj', name: 'Japon "In" dizisi', c: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], s: [0, 1, 5, 7, 8] },
    { id: 'penta', name: 'Pentatonik (Çin / Kelt)', c: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], s: [0, 2, 4, 7, 9] },
    { id: 'pelog', name: 'Pelog (Gamelan)', c: [0, 20, 0, -30, 0, 0, 30, -10, 0, 0, 0, 0], s: [0, 1, 3, 7, 8] },
    { id: 'blues', name: 'Blues', c: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], s: [0, 3, 5, 6, 7, 10] },
  ];
  const NOTE_NAMES = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];

  return { INST, CATS, KITS, TUNINGS, NOTE_NAMES };
})();
