#!/usr/bin/env python3
"""Gerçek enstrüman örneklerini üretir: FluidR3_GM.sf2 (MIT) + VCSL (CC0).
Çıktı: docs/samples/index.js ve docs/samples/<id>.js (base64 Ogg Vorbis)."""
import base64, json, os, re, subprocess, sys, urllib.parse, urllib.request
import numpy as np
from scipy.signal import lfilter
import fluidsynth

SR = 44100
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs', 'samples')
CACHE = os.path.expanduser('~/.cache/okira-samples')
SF2 = '/usr/share/sounds/sf2/FluidR3_GM.sf2'
VCSL = 'https://raw.githubusercontent.com/sgossner/VCSL/master/'
os.makedirs(OUT, exist_ok=True); os.makedirs(CACHE, exist_ok=True)

# ---------- yardımcılar ----------
def biquad(kind, f, q=0.7, db=0.0):
    A = 10 ** (db / 40); w = 2 * np.pi * f / SR; c, s = np.cos(w), np.sin(w); al = s / (2 * q)
    if kind == 'lp': b = [(1 - c) / 2, 1 - c, (1 - c) / 2]; a = [1 + al, -2 * c, 1 - al]
    elif kind == 'hp': b = [(1 + c) / 2, -(1 + c), (1 + c) / 2]; a = [1 + al, -2 * c, 1 - al]
    else: b = [1 + al * A, -2 * c, 1 - al * A]; a = [1 + al / A, -2 * c, 1 - al / A]
    return np.array(b) / a[0], np.array(a) / a[0]

def eq(x, spec):
    for e in spec or []:
        b, a = biquad(*e); x = lfilter(b, a, x, axis=0)
    return x

def trim(x, floor_db=-62, keep=0.05):
    env = np.abs(x).max(axis=1) if x.ndim > 1 else np.abs(x)
    pk = env.max() + 1e-9; idx = np.where(env > pk * 10 ** (floor_db / 20))[0]
    if not len(idx): return x[:SR // 10]
    st = max(0, idx[0] - int(0.002 * SR)); en = min(len(x), idx[-1] + int(keep * SR))
    y = x[st:en].copy(); n = min(len(y), int(0.03 * SR))
    fade = np.linspace(1, 0, n); y[-n:] *= fade[:, None] if y.ndim > 1 else fade
    return y

def enc(x):
    x = np.clip(x, -1, 1); ch = 1 if x.ndim == 1 else x.shape[1]
    pcm = (x * 32767).astype('<i2').tobytes()
    p = subprocess.run(['ffmpeg', '-v', 'error', '-f', 's16le', '-ar', str(SR), '-ac', str(ch), '-i', '-',
                        '-c:a', 'libvorbis', '-q:a', '3' if ch == 1 else '2', '-f', 'ogg', '-'], input=pcm, capture_output=True, check=True)
    return base64.b64encode(p.stdout).decode()

def load_file(path):
    p = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True)
    return np.frombuffer(p.stdout, dtype='<f4').astype(np.float64)

def vcsl(rel):
    loc = os.path.join(CACHE, rel.replace('/', '__'))
    if not os.path.exists(loc):
        urllib.request.urlretrieve(VCSL + urllib.parse.quote(rel), loc)
    return load_file(loc)

VTREE = None
def vfind(pattern):
    global VTREE
    if VTREE is None:
        js = os.path.join(CACHE, 'vcsl-tree.json')
        if not os.path.exists(js):
            subprocess.run(['gh', 'api', 'repos/sgossner/VCSL/git/trees/master?recursive=1'], stdout=open(js, 'w'), check=True)
        VTREE = [t['path'] for t in json.load(open(js))['tree'] if t['path'].lower().endswith('.wav')]
    r = re.compile(pattern)
    return sorted(p for p in VTREE if r.search(p))

def rms(x, sec=0.6):
    y = x[: int(sec * SR)]; return float(np.sqrt(np.mean(y ** 2)) + 1e-9)

# ---------- FluidSynth ----------
fs = fluidsynth.Synth(samplerate=float(SR), gain=0.6)
fs.setting('synth.reverb.active', 0); fs.setting('synth.chorus.active', 0)
SFID = fs.sfload(SF2)

def gm(notes, hold, tail, bank=0, prog=0, courses=None, vel=100, drum=False):
    """notes: MIDI notası; courses: [(yarım ses, kazanç, (bank, prog)|None)]"""
    courses = courses or [(0, 1, None)]
    chans = []
    for i, (off, g, bp) in enumerate(courses):
        ch = 9 if drum else (i if i < 9 else i + 1)
        b, p = bp or (bank, prog)
        fs.program_select(ch, SFID, b, p)
        whole = int(np.floor(off)); frac = off - whole
        if not drum: fs.pitch_bend(ch, int(frac * 4096))
        fs.cc(ch, 7, int(max(1, min(127, 127 * g))))
        chans.append((ch, whole))
        if drum: break
    for ch, w in chans: fs.noteon(ch, notes + w, vel)
    a = fs.get_samples(int(hold * SR))
    for ch, w in chans: fs.noteoff(ch, notes + w)
    b = fs.get_samples(int(tail * SR))
    fs.get_samples(int(1.5 * SR))  # kalan sesi boşalt
    for ch, _ in chans: fs.cc(ch, 123, 0); fs.cc(ch, 120, 0)
    fs.get_samples(int(0.2 * SR))
    x = np.concatenate([a, b]).astype(np.float64).reshape(-1, 2) / 32768
    return x

def make_loop(x, ls, le, xf=0.12):
    """Sürekli sesler için çapraz geçişli döngü (çıktı le'de biter)."""
    L, E, X = int(ls * SR), int(le * SR), int(xf * SR)
    y = x[:E].copy(); a = np.sin(np.linspace(0, np.pi / 2, X)) ** 2
    if y.ndim > 1: a = a[:, None]
    y[E - X:E] = y[E - X:E] * (1 - a) + x[L - X:L] * a
    return y

# ---------- enstrüman eşlemesi ----------
# m(prog, bank, lo, hi, step, hold, sus, st, courses, eq, rel, g)
def m(prog, bank=0, lo=36, hi=96, step=4, hold=2.4, sus=False, st=False, c=None, e=None, rel=0.3, g=1.0, tail=0.8):
    return dict(prog=prog, bank=bank, lo=lo, hi=hi, step=step, hold=hold, sus=sus, st=st, c=c, e=e, rel=rel, g=g, tail=tail)

PLUCK = dict(hold=2.6)
BOW = dict(sus=True, hold=3.4, rel=0.25)
WIND = dict(sus=True, hold=3.4, rel=0.2)
SAZ_EQ = [('hp', 180), ('pk', 2600, 1.2, 5), ('pk', 700, 1.5, -3)]
UD_EQ = [('pk', 180, 1.2, 4), ('lp', 4200), ('pk', 1200, 1.5, -2)]
MELODIC = {
    # Türk & Anadolu
    'baglama': m(25, c=[(0, 1, None), (12, 0.45, None)], e=SAZ_EQ, lo=40, hi=88, **PLUCK),
    'cura': m(25, 16, lo=52, hi=96, e=SAZ_EQ, **PLUCK),
    'divan': m(25, 8, lo=36, hi=84, e=[('hp', 120), ('pk', 2200, 1.2, 4)], **PLUCK),
    'ebaglama': m(27, c=[(0, 1, None), (12, 0.4, None)], e=[('hp', 200), ('pk', 2400, 1, 5)], lo=40, hi=88, **PLUCK),
    'ud': m(24, c=[(0, 1, None), (0.06, 0.8, None)], e=UD_EQ, lo=36, hi=84, **PLUCK),
    'cumbus': m(105, lo=40, hi=88, e=[('pk', 900, 1, 3)], **PLUCK),
    'kanun': m(46, c=[(0, 1, None), (0, 0.6, (0, 107))], e=[('hp', 150), ('pk', 3000, 1, 4)], lo=43, hi=96, **PLUCK),
    'santur': m(15, lo=43, hi=96, **PLUCK),
    'kemence': m(110, lo=52, hi=93, e=[('pk', 2500, 1.2, 3)], **BOW),
    'kemence2': m(40, 8, lo=52, hi=93, **BOW),
    'kabak': m(110, lo=48, hi=88, e=[('lp', 4000)], **BOW),
    'ney': m(77, lo=48, hi=91, **WIND),
    'kaval': m(75, lo=55, hi=96, **WIND),
    'zurna': m(111, lo=55, hi=93, **WIND),
    'mey': m(69, lo=43, hi=81, e=[('lp', 3000)], **WIND),
    'tklarnet': m(71, lo=48, hi=91, **WIND),
    'tulum': m(109, lo=52, hi=88, **WIND),
    'kudumzil': m(112, lo=60, hi=96, hold=2),
    'akordeon': m(21, 8, lo=36, hi=93, st=True, **WIND),
    # Orta Doğu & Kafkasya
    'tar': m(25, 16, lo=43, hi=91, c=[(0, 1, (16, 25)), (0.05, 0.7, (16, 25))], e=[('pk', 2200, 1, 4)], **PLUCK),
    'setar': m(25, lo=43, hi=88, e=[('hp', 200), ('lp', 6000)], **PLUCK),
    'tanbur': m(104, lo=40, hi=84, e=[('lp', 5000)], **PLUCK),
    'arabud': m(24, c=[(0, 1, None), (0.08, 0.8, None)], e=[('pk', 160, 1.2, 5), ('lp', 3600)], lo=36, hi=84, **PLUCK),
    'duduk': m(69, lo=43, hi=81, e=[('lp', 2600), ('pk', 500, 1.5, 3)], **WIND),
    'rebab': m(110, lo=48, hi=84, e=[('lp', 3500), ('pk', 700, 2, 4)], **BOW),
    'kamancheh': m(40, lo=48, hi=93, **BOW),
    'mizmar': m(111, lo=55, hi=91, e=[('pk', 1100, 1.5, 3)], **WIND),
    'mijwiz': m(111, lo=55, hi=88, c=[(0, 1, None), (0.15, 0.8, None)], **WIND),
    'arghul': m(71, lo=40, hi=79, c=[(0, 1, None), (-12, 0.4, None)], **WIND),
    # Hindistan
    'sitar': m(104, lo=40, hi=88, **PLUCK),
    'tanpura': m(104, lo=36, hi=72, hold=5, e=[('lp', 4000)], rel=1.2),
    'sarod': m(104, lo=40, hi=84, e=[('lp', 3500), ('pk', 400, 1.5, 4)], **PLUCK),
    'veena': m(104, lo=36, hi=84, e=[('pk', 200, 1.2, 4)], **PLUCK),
    'santoor': m(15, lo=48, hi=96, **PLUCK),
    'sarangi': m(40, 8, lo=48, hi=91, e=[('pk', 1200, 2, 4)], **BOW),
    'esraj': m(41, lo=48, hi=88, e=[('lp', 4000)], **BOW),
    'bansuri': m(73, lo=55, hi=96, e=[('lp', 6000)], **WIND),
    'shehnai': m(111, lo=55, hi=93, **WIND),
    'harmonium': m(20, lo=36, hi=93, st=True, **WIND),
    # Doğu Asya
    'koto': m(107, lo=43, hi=96, **PLUCK),
    'shamisen': m(106, lo=43, hi=91, **PLUCK),
    'biwa': m(106, lo=36, hi=81, e=[('lp', 4000), ('pk', 250, 1.2, 4)], **PLUCK),
    'guzheng': m(107, 8, lo=40, hi=96, **PLUCK),
    'pipa': m(25, 16, lo=45, hi=93, e=[('pk', 2000, 1, 3)], **PLUCK),
    'gayageum': m(107, lo=36, hi=88, e=[('lp', 4500)], **PLUCK),
    'yangqin': m(15, lo=48, hi=96, **PLUCK),
    'erhu': m(40, 8, lo=55, hi=96, e=[('pk', 1500, 1.5, 3), ('hp', 250)], **BOW),
    'haegeum': m(110, lo=55, hi=93, e=[('pk', 1800, 2, 4)], **BOW),
    'shakuhachi': m(77, lo=48, hi=91, **WIND),
    'dizi': m(73, lo=60, hi=96, e=[('pk', 3000, 1.5, 4)], **WIND),
    'sheng': m(20, lo=48, hi=93, st=True, **WIND),
    # Güneydoğu Asya
    'gender': m(11, lo=48, hi=96, hold=3),
    'bonang': m(113, lo=48, hi=88, hold=2),
    'saron': m(114, lo=48, hi=88, hold=2),
    'ranat': m(13, lo=55, hi=96, hold=1.5),
    'angklung': m(12, lo=55, hi=96, hold=1.5),
    'khim': m(15, lo=48, hi=96, **PLUCK),
    'khaen': m(22, lo=48, hi=88, **WIND),
    # Afrika
    'kalimba': m(108, lo=48, hi=96, hold=2.5),
    'kora': m(46, lo=40, hi=91, e=[('pk', 2500, 1, 3)], **PLUCK),
    'ngoni': m(105, lo=40, hi=84, e=[('lp', 4000)], **PLUCK),
    'goje': m(110, lo=48, hi=84, e=[('lp', 3000), ('pk', 600, 2, 4)], **BOW),
    'masenqo': m(110, lo=48, hi=84, e=[('lp', 3500)], **BOW),
    # Avrupa & Kelt
    'mandolin': m(25, 16, lo=55, hi=96, **PLUCK),
    'buzuki': m(25, 8, lo=48, hi=93, e=[('hp', 150)], **PLUCK),
    'balalayka': m(25, 16, lo=52, hi=93, e=[('hp', 250)], **PLUCK),
    'lavta': m(24, c=[(0, 1, None), (12, 0.35, None)], lo=40, hi=88, e=[('hp', 120)], **PLUCK),
    'keltarp': m(46, lo=36, hi=96, **PLUCK),
    'klavsen': m(6, lo=36, hi=93, **PLUCK),
    'cimbalom': m(15, lo=36, hi=93, **PLUCK),
    'gayda': m(109, lo=55, hi=88, **WIND),
    'bagpipe': m(109, lo=55, hi=88, **WIND),
    'tinwhistle': m(78, lo=62, hi=96, **WIND),
    'bandoneon': m(23, lo=36, hi=93, st=True, **WIND),
    'hurdy': m(110, lo=48, hi=88, c=[(0, 1, None), (0, 0.5, (0, 109))], **BOW),
    'mizika': m(22, lo=55, hi=93, **WIND),
    'melodika': m(20, lo=53, hi=89, e=[('pk', 1500, 1, 4)], **WIND),
    # Amerika, Latin & Okyanusya
    'banjo': m(105, lo=48, hi=93, **PLUCK),
    'charango': m(25, 16, lo=55, hi=96, e=[('hp', 250)], **PLUCK),
    'cuatro': m(24, 8, lo=52, hi=93, **PLUCK),
    'ukulele': m(24, 8, lo=55, hi=93, **PLUCK),
    'panflut': m(75, lo=55, hi=96, **WIND),
    'quena': m(73, lo=55, hi=93, e=[('lp', 6000)], **WIND),
    'ocarina': m(79, lo=60, hi=96, **WIND),
    'steelpan': m(114, lo=48, hi=91, hold=2.5),
    # Klavyeler
    'piyano': m(0, lo=21, hi=108, step=3, hold=4, st=True, rel=0.35, tail=1.2),
    'parlakpiyano': m(1, lo=21, hi=108, step=3, hold=4, st=True, rel=0.35, tail=1.2),
    'epiano': m(4, lo=28, hi=103, step=3, hold=3.5, st=True, rel=0.3),
    'celesta': m(8, lo=60, hi=108, hold=2),
    'org': m(16, lo=36, hi=96, st=True, **WIND),
    'kilise': m(19, lo=24, hi=96, st=True, sus=True, hold=3.6, rel=0.6),
    'clavinet': m(7, lo=36, hi=91, hold=2),
    # Gitar & Bas
    'klasikgitar': m(24, lo=40, hi=88, step=3, **PLUCK),
    'akustikgitar': m(25, lo=40, hi=88, step=3, **PLUCK),
    '12telli': m(25, 8, lo=40, hi=88, **PLUCK),
    'egitar': m(27, lo=40, hi=88, **PLUCK),
    'distgitar': m(30, lo=40, hi=88, sus=True, hold=3.2, rel=0.15),
    'basgitar': m(33, lo=24, hi=67, step=3, hold=2.5, rel=0.15),
    'fretless': m(35, lo=24, hi=67, step=3, hold=2.5, rel=0.2),
    'kontrbaspizz': m(32, lo=24, hi=67, step=3, hold=2.2, rel=0.2),
    # Yaylılar
    'keman': m(40, lo=55, hi=100, st=True, **BOW),
    'viyola': m(41, lo=48, hi=88, st=True, **BOW),
    'cello': m(42, lo=36, hi=79, st=True, **BOW),
    'kontrbas': m(43, lo=24, hi=67, st=True, **BOW),
    'yayligrubu': m(48, lo=28, hi=100, st=True, sus=True, hold=3.6, rel=0.5),
    'pizzicato': m(45, lo=28, hi=96, st=True, hold=1.6),
    'arp': m(46, lo=24, hi=103, step=3, st=True, **PLUCK),
    # Nefesliler
    'flut': m(73, lo=60, hi=96, **WIND),
    'klarnet': m(71, lo=50, hi=91, **WIND),
    'obua': m(68, lo=58, hi=91, **WIND),
    'fagot': m(70, lo=34, hi=75, **WIND),
    'saksafon': m(65, lo=49, hi=88, **WIND),
    'trompet': m(56, lo=52, hi=86, **WIND),
    'trombon': m(57, lo=40, hi=76, **WIND),
    'korno': m(60, lo=41, hi=77, st=True, **WIND),
    'tuba': m(58, lo=28, hi=65, **WIND),
    'brass': m(61, lo=36, hi=86, st=True, **WIND),
    # Vurmalı melodik
    'marimba': m(12, lo=45, hi=96, hold=1.8),
    'ksilofon': m(13, lo=60, hi=108, hold=1.2),
    'vibrafon': m(11, lo=53, hi=96, hold=3, st=True),
    'glock': m(9, lo=72, hi=108, hold=2.2),
    'muzikkutusu': m(10, lo=60, hi=108, hold=2.2),
    'tupcan': m(14, lo=55, hi=84, hold=4, rel=0.8),
    'can': m(14, 8, lo=36, hi=79, hold=4, rel=1),
    'handpan': m(114, lo=48, hi=84, hold=3, e=[('lp', 3500), ('pk', 300, 1, 3)]),
    # Ses & Koro
    'koroaah': m(52, lo=43, hi=86, st=True, sus=True, hold=3.6, rel=0.5),
    'koroooh': m(53, lo=43, hi=86, st=True, sus=True, hold=3.6, rel=0.5),
    'vokalpad': m(54, lo=36, hi=86, st=True, sus=True, hold=3.6, rel=0.6),
    # Synth
    'pad': m(94, lo=36, hi=91, st=True, sus=True, hold=3.6, rel=0.8),
    'sicakpad': m(89, lo=36, hi=91, st=True, sus=True, hold=3.6, rel=0.8),
    'synthbas': m(38, lo=24, hi=67, hold=2, rel=0.1),
    'bellsynth': m(98, lo=48, hi=96, hold=2.5, st=True),
}

# ---------- kit eşlemesi ----------
STD, ROOM, POWER, ELEC, R808, JAZZ, BRUSH, ORCH = 0, 8, 16, 24, 25, 32, 40, 48
D = lambda kit, n, g=1.0: ('d', kit, n, g)
M = lambda prog, n, g=1.0, bank=0: ('m', (bank, prog), n, g)
V = lambda pat, g=1.0, rate=1.0, k=2: ('v', pat, g, rate, k)
ACU = [36, 38, 37, 39, 42, 46, 44, 50, 47, 43, 49, 51, 54, 56]
def drumkit(k): return [D(k, n) for n in ACU]
FD = 'Frame Drum/'
KITS = {
    'kit_akustik': drumkit(STD),
    'kit_oda': drumkit(ROOM),
    'kit_rock': drumkit(POWER),
    'kit_caz': [D(BRUSH, n) for n in ACU[:4]] + [D(JAZZ, n) for n in ACU[4:]],
    'kit_elektro': drumkit(ELEC),
    'kit_808': [D(R808, 36), D(R808, 38), D(R808, 39), D(R808, 42), D(R808, 46), D(R808, 45), D(R808, 56), D(R808, 37),
                D(R808, 75), D(R808, 63), D(R808, 70), D(R808, 49), D(ELEC, 36), D(R808, 42, 0.6)],
    'kit_turk': ['darbuka:dum', 'darbuka:tek', 'darbuka:ka', 'darbuka:slap',
                 [V(FD + 'HDrumS_Hit_v3'), V('Tambourine 1/Tamb1_Hit_v1', 0.35)], V('Tambourine 1/Tamb1_Hit_v2'),
                 V(FD + 'HDrumL_Hit_v3'), V(FD + 'HDrumS_HitMuted_v2'),
                 V('Bongos/BongoL_Hit1_v3', 1, 0.75), V('Bongos/BongoH_Hit1_v3'),
                 D(ORCH, 36), D(STD, 37), V('Finger Cymbals/'), D(STD, 77, 0.8),
                 [V(FD + 'HDrumS_Hand'), V('Tambourine 1/Tamb1_Hit_v1', 0.3)], V('Tambourine 1/Tamb1_Hit_v1'),
                 M(116, 40), [V(FD + 'HDrumL_Hand'), V('Tambourine 1/Tamb1_Roll_v1', 0.25)]],
    'kit_hint': [None] * 12 + [V('Finger Cymbals/', 0.8)],
    'kit_afrika': [V('Conga/Tumba_HitN_v3', 1, 0.7), V('Conga/Conga_HitN_v2'), V('Conga/Quinto_HitFM1_v2'),
                   M(116, 38), M(116, 45), M(116, 52), D(STD, 56, 0.8), None, None,
                   V('Shaker, Small/Mid_ShakerDouble_Down'), None, D(STD, 67), D(STD, 68)],
    'kit_latin': [V('Conga/Conga_HitN_v2'), D(STD, 62), V('Conga/Quinto_HitFM1_v2'), V('Conga/Tumba_HitN_v2'),
                  V('Bongos/BongoH_Hit1_v2'), V('Bongos/BongoL_Hit1_v2'), D(STD, 65), D(STD, 66), D(STD, 56), D(STD, 75),
                  D(STD, 74), D(STD, 70), V('Cajon/Cajon_hit1_f'), V('Cajon/Cajon_hit3_f'), M(115, 60, 1, 8)],
    'kit_asya': [M(116, 33), M(116, 45), M(116, 64), D(STD, 37), V('Hand Bells, Nepalese/HB_1', 0.8), V('Gong 1/gong_f\\.'),
                 V('Gong 1/gong_2_f'), D(STD, 77), V('Clash Cymbals 1/cymbal_crash1_mf1', 0.8), V('Hand Bells, Nepalese/HB_2', 0.8), D(STD, 76)],
    'kit_samba': [D(ROOM, 41), D(STD, 41, 0.8), D(ORCH, 38), D(STD, 50), D(STD, 65), D(STD, 67), D(STD, 68),
                  [V('Tambourine 1/Tamb1_Hit_v1'), V(FD + 'HDrumS_HitMuted_v2', 0.6)], D(STD, 78), D(STD, 79), D(STD, 69), D(STD, 71)],
    'kit_orkestra': [M(47, 41), M(47, 48), D(ORCH, 36), D(ORCH, 38), V('Clash Cymbals 1/cymbal_crash1_ff2', 0.8), D(STD, 81),
                     V('Sleigh Bells/Sleighbells_Hit_rr1'), V(FD + 'HDrumL_Hit_v3'), V(FD + 'HDrumS_Hit_v2'),
                     V(FD + 'HDrumS_HitMuted_v2'), V('Tambourine 1/Tamb1_Hit_v2'), M(115, 60, 1, 8)],
}
NEW_KITS = {'kit_oda': 'Oda Davul Seti (Room)', 'kit_rock': 'Rock Davul Seti (Power)', 'kit_caz': 'Caz Davul Seti (Fırça)', 'kit_elektro': 'Elektronik Davul Seti'}

def render_src(s):
    """Tek bir ped kaynağı -> mono sinyal listesi (round-robin)."""
    kind = s[0]
    if kind == 'd':
        _, kit, n, g = s
        return [trim(gm(n, 1.6, 1.2, 128, kit, drum=True).mean(axis=1)) * g]
    if kind == 'm':
        _, (b, p), n, g = s
        return [trim(gm(n, 2.5, 1.5, b, p).mean(axis=1)) * g]
    _, pat, g, rate, k = s
    files = vfind(re.escape(pat).replace('\\\\', '\\') if False else pat)
    if not files: raise SystemExit('VCSL bulunamadı: ' + pat)
    rr = [f for f in files if 'rr1' in f] + [f for f in files if 'rr2' in f]
    files = (rr or files)[:k]
    out = []
    for f in files:
        x = vcsl(f)
        if rate != 1.0:
            idx = np.arange(0, len(x) - 1, rate); x = np.interp(idx, np.arange(len(x)), x)
        out.append(trim(x) * g)
    return out

def render_pad(spec):
    if spec is None: return None
    if isinstance(spec, str) and spec.startswith('darbuka:'):
        return DARBUKA[spec.split(':')[1]]
    if isinstance(spec, list):
        layers = [render_src(s) for s in spec]; base = layers[0]
        res = []
        for i, b in enumerate(base):
            y = b.copy()
            for L in layers[1:]:
                o = L[i % len(L)]; n = min(len(y), len(o)); y[:n] += o[:n]
                if len(o) > len(y): y = np.concatenate([y, o[len(y):]])
            res.append(y)
        return res
    return render_src(spec)

def centroid(x):
    X = np.abs(np.fft.rfft(x[: SR // 4], SR // 2)); f = np.fft.rfftfreq(SR // 2, 1 / SR)
    return float((X * f).sum() / (X.sum() + 1e-9))

def build_darbuka():
    groups = {}
    for f in vfind(r'Darbuka/Darbuka_\d_hit_vl2'):
        groups.setdefault(re.search(r'Darbuka_(\d)', f).group(1), []).append(f)
    feats = []
    for k, fl in sorted(groups.items()):
        xs = [trim(vcsl(f)) for f in fl[:2]]
        feats.append((centroid(xs[0]), len(xs[0]) / SR, k, xs))
    feats.sort()
    for c, d, k, _ in feats: print(f'  darbuka {k}: merkez {c:.0f} Hz, süre {d:.2f} sn')
    dum = feats[0][3]; tek = feats[-1][3]; ka = [x * 0.55 for x in feats[-2][3]]; slap = feats[len(feats) // 2][3]
    return {'dum': dum, 'tek': tek, 'ka': ka, 'slap': slap}

# ---------- VCSL melodik ----------
NN = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}
def note_of(name):
    mt = re.search(r'_([A-G]#?)(\d)_', name); return 12 * (int(mt.group(2)) + 1) + NN[mt.group(1)]

VMEL = {'mbira': (r'Mbira Mavembe.*_vl2_rr1', 2.5), 'balafon': (r'Balafon/Hard Mallet/.*_vl2_rr1', 1.5)}

def norm_inst(xs, target=0.12):
    mid = sorted(rms(x) for x in xs)[len(xs) // 2]
    k = target / mid
    pk = max(np.abs(x).max() for x in xs) * k
    if pk > 0.98: k *= 0.98 / pk
    return [x * k for x in xs]

def write(id_, meta, xs, index):
    if meta.get("kit"):
        z = [[enc(v) for v in pad] if pad is not None else None for pad in xs]
    else:
        z = [enc(x) for x in xs]
    js = f'Samples.reg({json.dumps(id_)},{json.dumps(z, separators=(",", ":"))});\n'
    open(os.path.join(OUT, id_ + '.js'), 'w').write(js)
    meta['g'] = index.get(id_, {}).get('g', 1)  # seviye dengesi (tarayıcıda ölçülür)
    index[id_] = meta
    print(f'{id_}: {len(js) / 1e6:.2f} MB', flush=True)

def main():
    only = set(sys.argv[1:])
    idxf = os.path.join(OUT, 'index.json')
    index = json.load(open(idxf)) if os.path.exists(idxf) else {}
    global DARBUKA
    for id_, s in MELODIC.items():
        if only and id_ not in only: continue
        notes = list(range(s['lo'], s['hi'] + 1, s['step']))
        if notes[-1] != s['hi']: notes.append(s['hi'])
        xs = []
        for n in notes:
            hold = s['hold'] if s['sus'] else s['hold'] * (1.0 if n < 72 else 0.7)
            x = gm(n, hold, 0.05 if s['sus'] else s['tail'], s['bank'], s['prog'], s['c'])
            x = eq(x, s['e'])
            if not s['st']: x = x.mean(axis=1)
            if s['sus']: x = make_loop(trim(x, -80, 1), 1.0, hold - 0.1) if True else x
            else: x = trim(x)
            xs.append(x)
        xs = norm_inst(xs, 0.12 if not s['sus'] else 0.09)
        meta = {'n': notes, 'rel': s['rel']}
        if s['sus']: meta['loop'] = [1.0, s['hold'] - 0.1]
        write(id_, meta, xs, index)
    for id_, (pat, dur) in VMEL.items():
        if only and id_ not in only: continue
        files = vfind(pat); pairs = sorted((note_of(f.split('/')[-1]), f) for f in files)
        seen = {}; [seen.setdefault(n, f) for n, f in pairs]
        notes = sorted(seen); xs = norm_inst([trim(vcsl(seen[n])[: int(dur * SR)]) for n in notes])
        write(id_, {'n': notes, 'rel': 0.3}, xs, index)
    if not only or only & set(KITS):
        DARBUKA = build_darbuka() if (not only or 'kit_turk' in only) else None
    for id_, pads in KITS.items():
        if only and id_ not in only: continue
        rendered = [render_pad(p) for p in pads]
        allx = [x for r in rendered if r for x in r]
        pk = max(np.abs(x).max() for x in allx)
        k = 0.9 / pk
        # kit içi dengeyi koru, ama ped başına aşırı sessizleri yükselt
        out = []
        for r in rendered:
            if r is None: out.append(None); continue
            pr = max(np.abs(x).max() for x in r) * k
            boost = min(3.0, 0.35 / pr) if pr < 0.35 else 1.0
            out.append([x * k * boost for x in r])
        write(id_, {'kit': 1, 'pads': [r is not None for r in out]}, out, index)
    json.dump(index, open(idxf, 'w'), indent=0, sort_keys=True)
    open(os.path.join(OUT, 'index.js'), 'w').write(
        '// Otomatik üretildi: tools/build_samples.py\nSamples.index(' + json.dumps(index, separators=(',', ':'), sort_keys=True) + ', '
        + json.dumps(NEW_KITS, ensure_ascii=False) + ');\n')
    tot = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
    print(f'TOPLAM {tot / 1e6:.1f} MB, {len(index)} enstrüman')

if __name__ == '__main__':
    main()
