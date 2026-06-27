import {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  Menu,
  Tray,
  globalShortcut,
  clipboard,
  Notification,
  session
} from 'electron';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { StorageService, AppSettings } from './services/storage';
import { KeystrokeService } from './services/keystrokes';
import { AIService } from './services/ai';
import { RAGService } from './services/rag';

let mainWindow: BrowserWindow | null = null;
let hudWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let activeModeId: string = 'general';

const isDev = process.env.NODE_ENV === 'development';

// --- Window Helpers ---

function createMainWindow() {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    return;
  }

  const iconPath = isDev
    ? path.join(__dirname, '../../build/icon.png')
    : path.join(process.resourcesPath, 'icon.png');

  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 980,
    minHeight: 650,
    title: 'StackOrbitAI Meeting Intelligence & AI Copilot',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    backgroundColor: '#09090b', // zinc-950
    show: false
  });

  mainWindow.setMenu(null);

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createHUDWindow() {
  if (hudWindow) {
    hudWindow.show();
    hudWindow.focus();
    return;
  }

  hudWindow = new BrowserWindow({
    width: 650,
    height: 480,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    show: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  hudWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  if (isDev) {
    hudWindow.loadURL('http://localhost:5173?window=hud');
  } else {
    hudWindow.loadFile(path.join(__dirname, '../renderer/index.html'), {
      query: { window: 'hud' }
    });
  }

  hudWindow.once('ready-to-show', () => {
    hudWindow?.center();
    hudWindow?.show();
    hudWindow?.focus();
  });

  hudWindow.on('closed', () => {
    hudWindow = null;
  });
}

// --- Tray System ---

function createTray() {
  const iconPath = isDev
    ? path.join(__dirname, '../../build/icon.png')
    : path.join(process.resourcesPath, 'icon.png');

  // Create a placeholder tray or use icon if exists
  if (!fs.existsSync(iconPath)) {
    console.warn('[Tray] Icon file not found at:', iconPath);
    return;
  }

  tray = new Tray(iconPath);
  tray.setToolTip('StackOrbitAI Meeting & AI Copilot');

  tray.on('double-click', () => {
    createMainWindow();
  });

  updateTrayMenu();
}

function updateTrayMenu() {
  if (!tray) return;

  const settings = StorageService.getSettings();
  const templates = StorageService.getTemplates();
  activeModeId = settings.shortcut ? activeModeId : 'general';

  const modeSubmenu = templates.map((t) => ({
    label: t.name,
    type: 'radio' as const,
    checked: t.id === activeModeId,
    click: () => {
      activeModeId = t.id;
      updateTrayMenu();
    }
  }));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'StackOrbitAI Meeting Copilot',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Open Dashboard',
      click: () => createMainWindow()
    },
    {
      label: 'Enhance Selected Text',
      accelerator: settings.shortcut.replace('CommandOrControl', 'Ctrl'),
      click: () => triggerEnhancementFlow()
    },
    { type: 'separator' },
    {
      label: 'Enhancer Mode',
      submenu: modeSubmenu
    },
    {
      label: 'Auto-Replace Selection',
      type: 'checkbox',
      checked: settings.autoReplace,
      click: (item) => {
        StorageService.updateSetting('autoReplace', item.checked);
        updateTrayMenu();
      }
    },
    {
      label: 'Auto-Copy Output',
      type: 'checkbox',
      checked: settings.autoCopy,
      click: (item) => {
        StorageService.updateSetting('autoCopy', item.checked);
        updateTrayMenu();
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

// --- Global Shortcuts & Workflow ---

function registerGlobalShortcut() {
  globalShortcut.unregisterAll();
  const settings = StorageService.getSettings();
  const shortcut = settings.shortcut || 'CommandOrControl+Shift+E';

  try {
    const registered = globalShortcut.register(shortcut, () => {
      triggerEnhancementFlow();
    });

    if (!registered) {
      console.error(`[Shortcut] Failed to register: ${shortcut}`);
    } else {
      console.log(`[Shortcut] Registered: ${shortcut}`);
    }
  } catch (err) {
    console.error(`[Shortcut] Error: ${shortcut}`, err);
  }
}

async function triggerEnhancementFlow() {
  const settings = StorageService.getSettings();
  const originalClipboard = clipboard.readText();

  clipboard.clear();
  const copySuccess = await KeystrokeService.simulateCopy();
  await new Promise((resolve) => setTimeout(resolve, 200));
  let selectedText = clipboard.readText();

  if (!copySuccess || !selectedText || selectedText.trim() === '') {
    clipboard.writeText(originalClipboard);
    selectedText = '';
  }

  const templates = StorageService.getTemplates();
  const currentMode = templates.find((t) => t.id === activeModeId) || templates[0];

  if (settings.autoReplace && selectedText && selectedText.trim() !== '') {
    new Notification({
      title: 'Prompt Enhancer',
      body: `Rewriting text with ${currentMode.name}...`
    }).show();

    try {
      const enhanced = await AIService.enhancePrompt(selectedText, currentMode.systemPrompt);
      clipboard.writeText(enhanced);
      await KeystrokeService.simulatePaste();
      await new Promise((resolve) => setTimeout(resolve, 200));
      clipboard.writeText(originalClipboard);

      new Notification({
        title: 'Prompt Enhancer',
        body: 'Text replaced successfully!'
      }).show();
    } catch (err: any) {
      new Notification({
        title: 'Prompt Enhancer Error',
        body: `Failed: ${err.message || err}`
      }).show();
      clipboard.writeText(originalClipboard);
    }
  } else {
    createHUDWindow();
    setTimeout(() => {
      if (hudWindow) {
        hudWindow.webContents.send('hud:process', {
          text: selectedText,
          systemPrompt: currentMode.systemPrompt,
          modeId: currentMode.id,
          modeName: currentMode.name,
          originalClipboard: selectedText ? originalClipboard : ''
        });
      }
    }, 300);
  }
}

// --- Companion Local HTTP Server ---
let localServer: http.Server | null = null;

function startLocalServer() {
  localServer = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'POST' && req.url === '/enhance') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          const text = data.text || '';
          const direct = !!data.direct;

          const settings = StorageService.getSettings();
          const templates = StorageService.getTemplates();
          const currentMode = templates.find((t) => t.id === activeModeId) || templates[0];

          if (direct) {
            try {
              const enhanced = await AIService.enhancePrompt(text, currentMode.systemPrompt);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ enhancedText: enhanced }));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message || err }));
            }
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));

            createHUDWindow();
            setTimeout(() => {
              if (hudWindow) {
                hudWindow.webContents.send('hud:process', {
                  text,
                  systemPrompt: currentMode.systemPrompt,
                  modeId: currentMode.id,
                  modeName: currentMode.name,
                  originalClipboard: ''
                });
              }
            }, 300);
          }
        } catch (err: any) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON request: ' + err.message }));
        }
      });
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  localServer.listen(4891, '127.0.0.1', () => {
    console.log('[Server] Companion server running on http://127.0.0.1:4891');
  });
}

function stopLocalServer() {
  if (localServer) {
    localServer.close();
    localServer = null;
  }
}

function configureStartup() {
  const settings = StorageService.getSettings();
  try {
    app.setLoginItemSettings({
      openAtLogin: settings.launchAtStartup,
      path: app.getPath('exe')
    });
  } catch (err) {
    console.error('Failed to configure startup:', err);
  }
}

// --- App Singleton Lock ---
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    createMainWindow();
  });

  app.whenReady().then(() => {
    // 1. Grant Audio Capturing Permission Natively
    session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
      if (permission === 'media') {
        callback(true);
      } else {
        callback(false);
      }
    });

    const template: any[] = [
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'delete' },
          { role: 'selectall' }
        ]
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' }
        ]
      }
    ];

    const appMenu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(appMenu);

    createTray();
    registerGlobalShortcut();
    configureStartup();
    startLocalServer();

    // In dev mode, always open main window immediately
    createMainWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
    stopLocalServer();
  });

  app.on('window-all-closed', () => {
    stopLocalServer();
    // Keep alive in tray
  });
}

// --- IPC Binding ---

// Settings
ipcMain.handle('settings:get', () => StorageService.getSettings());
ipcMain.handle('settings:update', (_event, key: any, value: any) => {
  const updated = StorageService.updateSetting(key, value);
  if (key === 'shortcut') registerGlobalShortcut();
  if (key === 'launchAtStartup') configureStartup();
  updateTrayMenu();
  return updated;
});

// Templates
ipcMain.handle('templates:get', () => StorageService.getTemplates());
ipcMain.handle('templates:add', (_event, name, desc, systemPrompt) => {
  const list = StorageService.addCustomTemplate(name, desc, systemPrompt);
  updateTrayMenu();
  return list;
});
ipcMain.handle('templates:update', (_event, id, name, desc, systemPrompt) => {
  const list = StorageService.updateCustomTemplate(id, name, desc, systemPrompt);
  updateTrayMenu();
  return list;
});
ipcMain.handle('templates:delete', (_event, id) => {
  const list = StorageService.deleteCustomTemplate(id);
  updateTrayMenu();
  return list;
});

// Brains
ipcMain.handle('brains:get', () => StorageService.getBrains());
ipcMain.handle('brains:create', (_event, name, desc) => StorageService.createBrain(name, desc));
ipcMain.handle('brains:update', (_event, id, name, desc) => StorageService.updateBrain(id, name, desc));
ipcMain.handle('brains:delete', (_event, id) => StorageService.deleteBrain(id));
ipcMain.handle('brains:indexFile', (_event, brainId, filePath, fileName) =>
  RAGService.indexFile(brainId, filePath, fileName)
);
ipcMain.handle('brains:deleteFile', (_event, brainId, fileName) =>
  RAGService.deleteFile(brainId, fileName)
);
ipcMain.handle('brains:search', (_event, brainId, query, topK) =>
  RAGService.searchBrain(brainId, query, topK)
);

// Meetings
ipcMain.handle('meetings:get', () => StorageService.getMeetings());
ipcMain.handle('meetings:save', (_event, record) => StorageService.saveMeeting(record));

// AI Engine API Wrappers
ipcMain.handle('ai:enhance', (_event, prompt, systemPrompt) => AIService.enhancePrompt(prompt, systemPrompt));
ipcMain.handle('ai:translate', (_event, text, targetLang) => AIService.translateText(text, targetLang));
ipcMain.handle('ai:suggestReplies', (_event, transcript, context, hints) =>
  AIService.generateReplySuggestions(transcript, context, hints)
);
ipcMain.handle('ai:summarizeMeeting', (_event, transcript) => AIService.generateMeetingSummary(transcript));

// Window Management
ipcMain.handle('window:closeHUD', () => {
  if (hudWindow) hudWindow.close();
});
ipcMain.handle('window:applyHUD', async (_event, text) => {
  if (hudWindow) hudWindow.close();
  clipboard.writeText(text);
  await KeystrokeService.simulatePaste();
});
ipcMain.handle('window:copyHUD', (_event, text) => {
  if (hudWindow) hudWindow.close();
  clipboard.writeText(text);
});
ipcMain.handle('window:openMainWindow', () => {
  createMainWindow();
});
ipcMain.handle('app:openExternal', (_event, url) => {
  shell.openExternal(url);
});
