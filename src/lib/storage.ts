import type { Profile } from './types';

interface DesktopBridge {
  isDesktop: boolean;
  platform: string;
  versions: { electron: string; chrome: string };
  storage: {
    load: () => Promise<string | null>;
    save: (data: string) => Promise<boolean>;
    exportFile: (data: string) => Promise<boolean>;
    importFile: () => Promise<string | null>;
  };
}

declare global {
  interface Window {
    keyflowDesktop?: DesktopBridge;
  }
}

export const STORAGE_KEY = 'keyflow.profile.v1';
export const isDesktop = () => Boolean(window.keyflowDesktop?.isDesktop);

export async function loadStoredProfile(): Promise<string | null> {
  const bridge = window.keyflowDesktop;
  if (bridge) {
    try {
      const data = await bridge.storage.load();
      if (data) return data;
    } catch {
      // Fall through to localStorage so the app still opens.
    }
  }
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function saveStoredProfile(profile: Profile): Promise<void> {
  const data = JSON.stringify(profile);
  try {
    window.localStorage.setItem(STORAGE_KEY, data);
  } catch {
    // Storage can be full or blocked; the desktop bridge is the fallback.
  }
  const bridge = window.keyflowDesktop;
  if (bridge) {
    try {
      await bridge.storage.save(data);
    } catch {
      // The in-memory profile is still authoritative for this session.
    }
  }
}

export async function exportProfileFile(profile: Profile): Promise<boolean> {
  const data = JSON.stringify(profile, null, 2);
  const bridge = window.keyflowDesktop;
  if (bridge) {
    try {
      return await bridge.storage.exportFile(data);
    } catch {
      return false;
    }
  }
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `keyflow-progress-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  return true;
}

export async function importProfileFile(): Promise<string | null> {
  const bridge = window.keyflowDesktop;
  if (bridge) {
    try {
      return await bridge.storage.importFile();
    } catch {
      return null;
    }
  }
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    };
    input.click();
  });
}
