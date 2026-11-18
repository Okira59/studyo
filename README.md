# OkiRa Stüdyo

Bilgisayarda çalışan, internetsiz müzik yapım programı (Logic Pro benzeri). Windows için kurulum dosyası olarak gelir; tarayıcıda da açılır (Mac dahil).

## Özellikler
- **150'den fazla enstrüman**, bölgelere göre: Türk & Anadolu (bağlama, ud, kanun, ney, zurna, kemençe...), Orta Doğu, Hint, Doğu Asya, Gamelan, Afrika, Avrupa & Kelt, Latin, klavyeler, gitarlar, yaylılar, nefesliler, koro, synth.
- **9 ritim kiti ve 44 hazır ritim**: Rock, Pop, Trap, House, Maksum, Çiftetelli, Aksak, Curcuna, Zeybek, Halay, Saidi, Teentaal, Samba, Salsa, Taiko...
- **Makamlar ve akortlar**: Rast, Uşşak, Hüseyni, Hicaz, Saba, Kürdi, Bayati, Sikah, ragalar, pentatonik, pelog (mikrotonal).
- Zaman çizelgesi, piyano rulosu, ritim makinesi (adım sıralayıcı), ekran klavyesi.
- Bilgisayar klavyesi ve USB MIDI klavye ile çalma ve kayıt; mikrofonla ses kaydı; metronom, sayım, döngü, swing.
- **Mikser**: kanal başına 3 bantlı ekolayzır, kompresör, yankı, eko, pan, solo/sessiz; ana çıkışta EQ, kompresör ve limiter.
- **Şarkıdan ses ayırma**: vokal, davul, bas, diğer enstrümanlar + karaoke (STFT orta/yan analizi ve harmonik/perküsif ayrıştırma, internetsiz).
- **Yapay Zekâ Besteci** (sağ alt köşe): tarz (31 tarz: Pop, Arabesk, Çiftetelli, Roman Havası, Halay, Zeybek, Trap, House, Salsa, Hint...), ruh hali, makam, ton, tempo ve uzunluk seçilir veya Türkçe tarif yazılır ("hüzünlü arabesk, 85 tempo, ney ile"); ritim, bas, akor, pad ve melodi düzenlenebilir parçalar olarak üretilir. İnternetsiz, kural ve olasılık tabanlıdır.
- Proje kaydetme/açma (`.okst`), otomatik kayıt, WAV dışa aktarma (tüm şarkı, döngü bölgesi veya her parça ayrı).

Sesler programın içinde sentezle üretilir (hazır ses kaydı kullanılmaz).

## Yapı
- `docs/` — uygulamanın kendisi (HTML/CSS/JavaScript, Web Audio API). `docs/index.html` tarayıcıda açılır.
  - `js/synth.js` ses sentezi (Karplus-Strong, modal, osilatör/formant), `js/instdata.js` enstrümanlar, kitler ve makamlar, `js/rhythms.js` hazır ritimler, `js/engine.js` ses motoru, mikser ve WAV, `js/separate.js` ses ayırma, `js/composer.js` yapay zekâ besteci, `js/app.js` arayüz.
- `desktop/` — Windows masaüstü kabuğu (Electron) ve NSIS kurulum betiği.

## Windows kurulum dosyasını üretmek
```bash
./desktop/build-windows.sh   # gerekli: curl, unzip, makensis
```
Çıktı: `~/desk-studyo/OkiRa-Studyo-Kurulum.exe`

OkiRa8406 tarafından yapılmıştır.
