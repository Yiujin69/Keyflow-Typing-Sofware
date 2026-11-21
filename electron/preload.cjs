const { contextBridge, ipcRenderer } = require('electron');

// Deliberately tiny: the app is fully local and needs no privileged APIs.
contextBridge.exposeInMainWorld('keyflowDesktop', {
  isDesktop: true,
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
  },
  storage: {
    load: () => ipcRenderer.invoke('keyflow:load'),
    save: (data) => ipcRenderer.invoke('keyflow:save', data),
    exportFile: (data) => ipcRenderer.invoke('keyflow:export', data),
    importFile: () => ipcRenderer.invoke('keyflow:import'),
  },
});
