import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (key: string, value: any) => ipcRenderer.invoke('settings:update', key, value)
  },
  templates: {
    get: () => ipcRenderer.invoke('templates:get'),
    add: (name: string, desc: string, systemPrompt: string) =>
      ipcRenderer.invoke('templates:add', name, desc, systemPrompt),
    update: (id: string, name: string, desc: string, systemPrompt: string) =>
      ipcRenderer.invoke('templates:update', id, name, desc, systemPrompt),
    delete: (id: string) => ipcRenderer.invoke('templates:delete', id)
  },
  brains: {
    get: () => ipcRenderer.invoke('brains:get'),
    create: (name: string, desc: string) => ipcRenderer.invoke('brains:create', name, desc),
    update: (id: string, name: string, desc: string) => ipcRenderer.invoke('brains:update', id, name, desc),
    delete: (id: string) => ipcRenderer.invoke('brains:delete', id),
    indexFile: (brainId: string, filePath: string, fileName: string) =>
      ipcRenderer.invoke('brains:indexFile', brainId, filePath, fileName),
    deleteFile: (brainId: string, fileName: string) =>
      ipcRenderer.invoke('brains:deleteFile', brainId, fileName),
    search: (brainId: string, query: string, topK?: number) =>
      ipcRenderer.invoke('brains:search', brainId, query, topK)
  },
  meetings: {
    get: () => ipcRenderer.invoke('meetings:get'),
    save: (record: any) => ipcRenderer.invoke('meetings:save', record)
  },
  ai: {
    enhance: (prompt: string, systemPrompt: string) =>
      ipcRenderer.invoke('ai:enhance', prompt, systemPrompt),
    translate: (text: string, targetLanguage: string) =>
      ipcRenderer.invoke('ai:translate', text, targetLanguage),
    suggestReplies: (transcriptSnippet: string, contextInfo: string, userHints: string) =>
      ipcRenderer.invoke('ai:suggestReplies', transcriptSnippet, contextInfo, userHints),
    summarizeMeeting: (fullTranscript: string) =>
      ipcRenderer.invoke('ai:summarizeMeeting', fullTranscript)
  },
  window: {
    closeHUD: () => ipcRenderer.invoke('window:closeHUD'),
    applyHUD: (enhancedText: string) => ipcRenderer.invoke('window:applyHUD', enhancedText),
    copyHUD: (enhancedText: string) => ipcRenderer.invoke('window:copyHUD', enhancedText),
    openMainWindow: () => ipcRenderer.invoke('window:openMainWindow'),
    isHUD: () => {
      return window.location.search.includes('window=hud');
    },
    onProcessHUD: (callback: (data: any) => void) => {
      const listener = (_event: any, data: any) => callback(data);
      ipcRenderer.on('hud:process', listener);
      return () => ipcRenderer.off('hud:process', listener);
    }
  },
  app: {
    openExternal: (url: string) => ipcRenderer.invoke('app:openExternal', url)
  }
});
