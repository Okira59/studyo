'use strict';
// Hazır ritim kalıpları. Her karakter 1 adım (varsayılan 1/16). x=normal, X=vurgulu, o=hafif
const Rhythms = [
  // ---- Akustik Davul (kit_akustik): 0 kick 1 trampet 2 rim 3 clap 4 hh kapalı 5 hh açık 6 pedal 7-9 tom 10 crash 11 ride 12 tef 13 cowbell
  { kit: 'kit_akustik', name: 'Rock', sig: [4, 4], rows: { 0: 'x.......x.x.....', 1: '....X.......X...', 4: 'x.x.x.x.x.x.x.x.' } },
  { kit: 'kit_akustik', name: 'Pop', sig: [4, 4], rows: { 0: 'x.....x.x.......', 1: '....X.......X...', 4: 'xoxoxoxoxoxoxoxo' } },
  { kit: 'kit_akustik', name: 'Disko', sig: [4, 4], rows: { 0: 'x...x...x...x...', 1: '....X.......X...', 4: 'x.x.x.x.x.x.x.x.', 5: '..x...x...x...x.' } },
  { kit: 'kit_akustik', name: 'Funk', sig: [4, 4], rows: { 0: 'x..x..x...x..x..', 1: '....X..o.o..X..o', 4: 'xxxxxxxxxxxxxxxx' } },
  { kit: 'kit_akustik', name: 'Shuffle / Blues', sig: [12, 8], rows: { 0: 'x.....x.....', 1: '......X.....', 11: 'x.ox.ox.ox.o' } },
  { kit: 'kit_akustik', name: 'Balad 6/8', sig: [6, 8], rows: { 0: 'x...........', 1: '......X.....', 4: 'x.x.x.x.x.x.' } },
  { kit: 'kit_akustik', name: 'Vals 3/4', sig: [3, 4], rows: { 0: 'x...........', 1: '....x...x...', 4: 'x...x...x...' } },
  { kit: 'kit_akustik', name: 'Bossa Nova', sig: [4, 4], rows: { 0: 'x..xx..xx..xx..x', 2: 'x..x..x...x..x..', 4: 'x.x.x.x.x.x.x.x.' } },
  { kit: 'kit_akustik', name: 'Reggae (One Drop)', sig: [4, 4], rows: { 0: '........X.......', 2: '........X.......', 4: '..x...x...x...x.' } },
  // ---- 808 (kit_808): 0 kick 1 snare 2 clap 3 hh 4 oh 5 tom 6 cowbell 7 rim 8 clave 9 conga 10 maracas 11 zil 12 909kick 13 hat rulo
  { kit: 'kit_808', name: 'Trap', sig: [4, 4], rows: { 0: 'x......x..x.....', 2: '........X.......', 3: 'x.x.x.x.x.xxx.x.', 13: '..........xx.xxx' } },
  { kit: 'kit_808', name: 'Hip-Hop (Boom Bap)', sig: [4, 4], rows: { 0: 'x.....x..x......', 1: '....X.......X...', 3: 'x.x.x.x.x.x.x.x.' } },
  { kit: 'kit_808', name: 'House 4x4', sig: [4, 4], rows: { 12: 'x...x...x...x...', 2: '....x.......x...', 3: '..x...x...x...x.', 4: '..x...x...x...x.' } },
  { kit: 'kit_808', name: 'Techno', sig: [4, 4], rows: { 12: 'X...X...X...X...', 3: 'xxxxxxxxxxxxxxxx', 7: '...x..x....x..x.', 4: '..x...x...x...x.' } },
  { kit: 'kit_808', name: 'Reggaeton (Dembow)', sig: [4, 4], rows: { 0: 'x...x...x...x...', 1: '...x..x....x..x.', 3: 'x.x.x.x.x.x.x.x.' } },
  { kit: 'kit_808', name: 'Afrobeats', sig: [4, 4], rows: { 0: 'x.....x...x.....', 7: '...x..x....x..x.', 10: 'x.xxx.xxx.xxx.xx', 2: '........X.......' } },
  // ---- Türk (kit_turk): 0 düm 1 tek 2 ka 3 şaplak 4 def düm 5 def tek 6 bendir düm 7 bendir tek 8 kudüm düm 9 kudüm tek 10 davul tokmak 11 davul çubuk 12 parmak zili 13 kaşık 14 riq düm 15 riq zil 16 tabl 17 daf
  { kit: 'kit_turk', name: 'Maksum 8/8', sig: [8, 8], rows: { 0: 'X.......X.......', 1: '..x...x.....x...', 2: '....o.....o...o.' } },
  { kit: 'kit_turk', name: 'Çiftetelli 8/8', sig: [8, 8], rows: { 0: 'X.....X...X.....', 1: '...x.x......x.x.', 2: '.o.......o......' } },
  { kit: 'kit_turk', name: 'Ayyuk 2/4', sig: [2, 4], rows: { 0: 'X.......', 1: '....x...', 2: '..o...o.' } },
  { kit: 'kit_turk', name: 'Sofyan 4/4', sig: [4, 4], rows: { 0: 'X...............', 1: '........x...x...', 2: '..........o.....' } },
  { kit: 'kit_turk', name: 'Malfuf 2/4', sig: [2, 4], rows: { 0: 'X.......', 1: '...x..x.', 2: '.o...o..' } },
  { kit: 'kit_turk', name: 'Roman Havası 9/8', sig: [9, 8], rows: { 0: 'X...X.............', 1: '........x...x.x...', 2: '..o...o...o.....o.' } },
  { kit: 'kit_turk', name: 'Karşılama 9/8 (2+2+2+3)', sig: [9, 8], rows: { 0: 'X.......X.........', 1: '....x.......x...x.', 2: '..o...o...o...o...' } },
  { kit: 'kit_turk', name: 'Aksak 9/8 (Kudüm)', sig: [9, 8], rows: { 8: 'X.......X.........', 9: '....x.......x.x...' } },
  { kit: 'kit_turk', name: 'Curcuna 10/8', sig: [10, 8], rows: { 0: 'X.....X.............', 1: '..........x...x...x.', 2: '..o.......o.......o.' } },
  { kit: 'kit_turk', name: 'Semai 6/8', sig: [6, 8], rows: { 0: 'X...........', 1: '......x.x...', 2: '..o.......o.' } },
  { kit: 'kit_turk', name: 'Halay (Davul)', sig: [2, 4], rows: { 10: 'X.......', 11: '..x.x.x.' } },
  { kit: 'kit_turk', name: 'Zeybek 9/4 (ağır)', sig: [9, 4], rows: { 6: 'X.......X.......................X...', 7: '........................x.......x...', 4: '................X.......X...........' } },
  { kit: 'kit_turk', name: 'Def ile Sofyan', sig: [4, 4], rows: { 4: 'X...............', 5: '........x...x...', 15: '..o...o...o...o.' } },
  { kit: 'kit_turk', name: 'Arap Saidi', sig: [4, 4], rows: { 16: 'X.....X.X.......', 1: '....x.......x...', 14: '..o...o...o...o.' } },
  // ---- Hint (kit_hint): 0 Na 1 Tin 2 Tun 3 Te 4 Ge 5 Ke 6 Ge kaydırma 7 dholak bas 8 dholak tiz 9 tha 10 thi 11 ghatam 12 manjira
  { kit: 'kit_hint', name: 'Teentaal (16 matra)', sig: [16, 8], rows: { 0: 'x..xx..xx..xx..x', 1: '.xx..xx..xx..xx.', 4: 'xxxxxxxxx...xxxx' } },
  { kit: 'kit_hint', name: 'Keharwa (8 matra)', sig: [4, 4], rows: { 0: 'x...x...x...x...', 1: '......x.....x...', 4: 'x.......x.......', 5: '....x.......x...' } },
  { kit: 'kit_hint', name: 'Dadra (6 matra)', sig: [6, 8], rows: { 0: 'x...x...x...', 1: '......x.x...', 4: 'x...........', 5: '......x.....' } },
  { kit: 'kit_hint', name: 'Bhangra (Dholak)', sig: [4, 4], rows: { 7: 'X..x..x.X..x..x.', 8: '..x.x...x.x...x.', 12: 'x...x...x...x...' } },
  // ---- Afrika (kit_afrika): 0 bas 1 ton 2 şaplak 3 dundunba 4 sangban 5 kenkeni 6 çan 7-8 konuşan 9 shekere 10 udu 11-12 agogo
  { kit: 'kit_afrika', name: 'Kuku (Djembe)', sig: [4, 4], rows: { 0: 'x.......x.......', 1: '..x.x.....x.x...', 2: '......x.x.....x.', 3: 'x...x...x...x...', 6: 'x.x.x.x.x.x.x.x.' } },
  { kit: 'kit_afrika', name: 'Afro 12/8', sig: [12, 8], rows: { 6: 'x.x.xx.x.x.x', 0: 'x.....x.....', 1: '...x.....x..', 9: 'xxxxxxxxxxxx' } },
  { kit: 'kit_afrika', name: 'Highlife', sig: [4, 4], rows: { 11: 'x..x..x...x.x...', 12: '..........x.....', 3: 'x.....x.x.......', 9: 'x.x.x.x.x.x.x.x.' } },
  // ---- Latin (kit_latin): 0 conga açık 1 mute 2 slap 3 tumba 4-5 bongo 6-7 timbal 8 cowbell 9 clave 10 güiro 11 marakas 12 cajón bas 13 cajón slap 14 kastanyet
  { kit: 'kit_latin', name: 'Salsa (Clave 3-2)', sig: [4, 4], rows: { 9: 'x..x...x..x.x...', 1: 'x...x...x...x...', 0: '......xx......xx', 8: 'x.x.x.x.x.x.x.x.' } },
  { kit: 'kit_latin', name: 'Cumbia', sig: [4, 4], rows: { 10: 'x.xxx.xxx.xxx.xx', 0: '..x...x...x...x.', 3: 'x.......x.......' } },
  { kit: 'kit_latin', name: 'Cajón Flamenko (Rumba)', sig: [4, 4], rows: { 12: 'x.....x.x.......', 13: '....X.......X..o', 14: 'x.x.x.x.x.x.x.x.' } },
  { kit: 'kit_latin', name: 'Bolero', sig: [4, 4], rows: { 4: 'x.xx..x...xx..x.', 11: 'x...x...x...x...', 3: '..........x.....' } },
  // ---- Asya (kit_asya)
  { kit: 'kit_asya', name: 'Taiko Festivali', sig: [4, 4], rows: { 0: 'X.......X..x....', 1: '....x.x.....x.x.', 2: 'x.x.x.x.x.x.x.x.', 3: '...x.......x....' } },
  // ---- Samba (kit_samba)
  { kit: 'kit_samba', name: 'Samba Batucada', sig: [2, 4], rows: { 0: '....X...', 1: 'x.......', 2: 'xoxoxoxo', 4: 'x.xx.x.x', 7: 'x.xxx.xx', 5: 'x...x.x.', 6: '..x.....' } },
  // ---- Orkestra & Kelt (kit_orkestra)
  { kit: 'kit_orkestra', name: 'Kelt Jig 6/8 (Bodhrán)', sig: [6, 8], rows: { 7: 'X.....x.....', 8: '..x.x...x.x.' } },
  { kit: 'kit_orkestra', name: 'Marş', sig: [2, 4], rows: { 2: 'X...x...', 3: 'x.xxx.x.', 4: 'x.......' } },
];
