// OkiRa Stüdyo — Windows masaüstü kabuğu (Electron)
const { app, BrowserWindow, session, Menu, shell } = require('electron');
const path = require('path');

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400, height: 880, minWidth: 1000, minHeight: 640,
    title: 'OkiRa Stüdyo', backgroundColor: '#1b1c1f',
    icon: path.join(__dirname, 'web', 'icon.png'),
    webPreferences: { contextIsolation: true, nodeIntegration: false, backgroundThrottling: false }
  });
  Menu.setApplicationMenu(null);
  // mikrofon ve MIDI izinleri
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb) => cb(['media', 'midi', 'midiSysex', 'audioCapture'].includes(perm)));
  session.defaultSession.setPermissionCheckHandler((wc, perm) => ['media', 'midi', 'midiSysex', 'audioCapture'].includes(perm));
  // indirmeler (WAV, proje) için "Farklı kaydet" penceresi
  session.defaultSession.on('will-download', (e, item) => {
    item.setSaveDialogOptions({ title: 'Kaydet', defaultPath: path.join(app.getPath('music'), item.getFilename()) });
  });
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && (input.key === 'F11')) win.setFullScreen(!win.isFullScreen());
    if (input.type === 'keyDown' && input.key === 'F12') win.webContents.toggleDevTools();
  });
  win.loadFile(path.join(__dirname, 'web', 'index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
