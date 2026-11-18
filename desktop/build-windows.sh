#!/bin/bash
# Windows kurulum dosyasını (OkiRa-Studyo-Kurulum.exe) Linux üzerinde üretir. Gerekli: curl, unzip, makensis
set -e
EV=33.4.11
ROOT=$(cd "$(dirname "$0")/.." && pwd)
W=${WORK:-$HOME/desk-studyo}
mkdir -p "$W" && cd "$W"
[ -f electron-win.zip ] || curl -sL -o electron-win.zip https://github.com/electron/electron/releases/download/v$EV/electron-v$EV-win32-x64.zip
rm -rf build && mkdir -p build/app && cd build/app && unzip -q "$W/electron-win.zip"
mv electron.exe "OkiRa Studyo.exe"
rm -f resources/default_app.asar LICENSES.chromium.html
mkdir -p resources/app && cp "$ROOT/desktop/main.js" "$ROOT/desktop/package.json" resources/app/
cp -r "$ROOT/docs" resources/app/web
cp "$ROOT/desktop/icon.ico" "$W/build/icon.ico"
cd "$W"
makensis -V2 -DSRCDIR="$W/build" -DOUTFILE="$W/OkiRa-Studyo-Kurulum.exe" "$ROOT/desktop/installer.nsi"
ls -la "$W/OkiRa-Studyo-Kurulum.exe"
