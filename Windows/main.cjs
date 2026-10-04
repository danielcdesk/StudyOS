const { app, BrowserWindow, shell } = require('electron');

const APP_URL = 'https://studyos-luiz-2026.opao6394.chatgpt.site/';
const APP_ORIGIN = new URL(APP_URL).origin;

function openStudyOS() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 900,
    minHeight: 640,
    title: 'StudyOS',
    autoHideMenuBar: true,
    backgroundColor: '#f4f6f8',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (new URL(url).origin === APP_ORIGIN) return { action: 'allow' };
    shell.openExternal(url);
    return { action: 'deny' };
  });

  window.webContents.on('will-navigate', (event, url) => {
    if (new URL(url).origin !== APP_ORIGIN) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  window.loadURL(APP_URL);
}

app.whenReady().then(() => {
  openStudyOS();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) openStudyOS();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
