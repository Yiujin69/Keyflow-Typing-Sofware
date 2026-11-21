const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const isDev = process.argv.includes('--dev');
const DEV_URL = 'http://localhost:4317';

// Fully offline: no remote navigation, no popups, no background network.
function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0a0c11',
    show: false,
    autoHideMenuBar: true,
    title: 'Keyflow',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  win.once('ready-to-show', () => win.show());

  // Block any navigation that is not our own local application content.
  win.webContents.on('will-navigate', (event, url) => {
    if (isDev && url.startsWith(DEV_URL)) return;
    if (!isDev && url.startsWith('file://')) return;
    event.preventDefault();
  });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  if (isDev) {
    win.loadURL(DEV_URL);
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  win.webContents.on('render-process-gone', (_event, details) => {
    dialog.showErrorBox('Keyflow stopped unexpectedly', `The interface process ended (${details.reason}). Reopen the app to continue. Your progress is saved locally.`);
  });
}

function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Export progress…',
          click: (_item, win) => win && win.webContents.executeJavaScript("window.dispatchEvent(new CustomEvent('keyflow:export'))"),
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ---- Local profile storage (JSON in the OS user-data folder) ----
function profilePath() {
  return path.join(app.getPath('userData'), 'keyflow-profile.json');
}

function registerStorageHandlers() {
  ipcMain.handle('keyflow:load', async () => {
    try {
      return fs.readFileSync(profilePath(), 'utf8');
    } catch {
      return null;
    }
  });

  ipcMain.handle('keyflow:save', async (_event, data) => {
    if (typeof data !== 'string' || data.length > 8_000_000) return false;
    const target = profilePath();
    const temp = `${target}.tmp`;
    await fs.promises.mkdir(path.dirname(target), { recursive: true });
    await fs.promises.writeFile(temp, data, 'utf8');
    await fs.promises.rename(temp, target);
    return true;
  });

  ipcMain.handle('keyflow:export', async (event, data) => {
    if (typeof data !== 'string') return false;
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showSaveDialog(win, {
      title: 'Export Keyflow progress',
      defaultPath: `keyflow-progress-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (result.canceled || !result.filePath) return false;
    await fs.promises.writeFile(result.filePath, data, 'utf8');
    return true;
  });

  ipcMain.handle('keyflow:import', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(win, {
      title: 'Import Keyflow progress',
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (result.canceled || !result.filePaths[0]) return null;
    return fs.promises.readFile(result.filePaths[0], 'utf8');
  });
}

app.whenReady().then(() => {
  registerStorageHandlers();
  buildMenu();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Electron security hardening: refuse remote permission requests.
app.on('web-contents-created', (_event, contents) => {
  contents.session.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
});
