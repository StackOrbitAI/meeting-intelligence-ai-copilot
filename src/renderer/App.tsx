import React, { useState, useEffect } from 'react';
import { 
  Video, 
  BrainCircuit, 
  PenTool, 
  Terminal, 
  Settings as SettingsIcon,
  Cpu,
  KeyRound,
  FileCheck
} from 'lucide-react';

import MeetingAssistant from './pages/MeetingAssistant';
import BrainsManager from './pages/BrainsManager';
import WritingAssistant from './pages/WritingAssistant';
import PromptStudio from './pages/PromptStudio';
import Settings from './pages/Settings';
import HUD from './components/HUD';

// Extend window interface for Electron API
declare global {
  interface Window {
    api: {
      settings: {
        get: () => Promise<any>;
        update: (key: string, value: any) => Promise<any>;
      };
      templates: {
        get: () => Promise<any[]>;
        add: (name: string, desc: string, systemPrompt: string) => Promise<any[]>;
        update: (id: string, name: string, desc: string, systemPrompt: string) => Promise<any[]>;
        delete: (id: string) => Promise<any[]>;
      };
      brains: {
        get: () => Promise<any[]>;
        create: (name: string, desc: string) => Promise<any>;
        update: (id: string, name: string, desc: string) => Promise<any[]>;
        delete: (id: string) => Promise<any[]>;
        indexFile: (brainId: string, filePath: string, fileName: string) => Promise<number>;
        deleteFile: (brainId: string, fileName: string) => Promise<number>;
        search: (brainId: string, query: string, topK?: number) => Promise<string>;
      };
      meetings: {
        get: () => Promise<any[]>;
        save: (record: any) => Promise<any[]>;
      };
      ai: {
        enhance: (prompt: string, systemPrompt: string) => Promise<string>;
        translate: (text: string, targetLanguage: string) => Promise<string>;
        suggestReplies: (transcriptSnippet: string, contextInfo: string, userHints: string) => Promise<string[]>;
        summarizeMeeting: (fullTranscript: string) => Promise<any>;
      };
      window: {
        closeHUD: () => Promise<void>;
        applyHUD: (text: string) => Promise<void>;
        copyHUD: (text: string) => Promise<void>;
        openMainWindow: () => Promise<void>;
        isHUD: () => boolean;
        onProcessHUD: (callback: (data: any) => void) => () => void;
      };
      app: {
        openExternal: (url: string) => Promise<void>;
      };
    };
  }
}

export default function App() {
  const [isHUD, setIsHUD] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('meeting');
  const [settings, setSettings] = useState<any>(null);
  const [brains, setBrains] = useState<any[]>([]);
  const [activeBrainId, setActiveBrainId] = useState<string>('');

  useEffect(() => {
    // Determine window mode
    if (window.api && window.api.window) {
      setIsHUD(window.api.window.isHUD());
    }

    // Load initial settings and brains
    refreshData();
  }, []);

  const refreshData = async () => {
    if (window.api) {
      try {
        const loadedSettings = await window.api.settings.get();
        const loadedBrains = await window.api.brains.get();
        setSettings(loadedSettings);
        setBrains(loadedBrains);
        if (loadedBrains.length > 0 && !activeBrainId) {
          setActiveBrainId(loadedBrains[0].id);
        }
      } catch (err) {
        console.error('Failed to load storage details:', err);
      }
    }
  };

  if (isHUD) {
    return <HUD />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'meeting':
        return (
          <MeetingAssistant 
            brains={brains} 
            activeBrainId={activeBrainId} 
            setActiveBrainId={setActiveBrainId}
          />
        );
      case 'brains':
        return <BrainsManager brains={brains} onRefresh={refreshData} />;
      case 'writing':
        return <WritingAssistant />;
      case 'prompts':
        return <PromptStudio />;
      case 'settings':
        return <Settings settings={settings} onUpdate={refreshData} />;
      default:
        return <MeetingAssistant brains={brains} activeBrainId={activeBrainId} setActiveBrainId={setActiveBrainId} />;
    }
  };

  const getActiveProviderLabel = () => {
    if (!settings) return 'Connecting...';
    switch (settings.activeProviderId) {
      case 'openai': return 'OpenAI GPT';
      case 'gemini': return 'Google Gemini';
      case 'claude': return 'Anthropic Claude';
      case 'custom': return 'Custom API';
      default: return 'Google Gemini';
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar glass-panel p-4 flex flex-col justify-between" style={{ padding: '1.25rem' }}>
        <div className="flex flex-col gap-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-2 px-2 py-3">
            <div className="w-8 h-8 rounded-lg grad-btn flex items-center justify-center shadow-lg">
              <Cpu className="w-4 h-4 text-white animate-pulse-slow" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white font-display">StackOrbitAI</h1>
              <span className="text-[10px] text-zinc-500 font-mono">MEETING COPILOT v1.0</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex flex-col gap-1.5">
            <button
              onClick={() => setActiveTab('meeting')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'meeting'
                  ? 'bg-zinc-800/80 text-white shadow-md border-l-2 border-indigo-500'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <Video className="w-4 h-4" />
              Meeting Assistant
            </button>

            <button
              onClick={() => setActiveTab('brains')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'brains'
                  ? 'bg-zinc-800/80 text-white shadow-md border-l-2 border-indigo-500'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <BrainCircuit className="w-4 h-4" />
              Client Brains
            </button>

            <button
              onClick={() => setActiveTab('writing')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'writing'
                  ? 'bg-zinc-800/80 text-white shadow-md border-l-2 border-indigo-500'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <PenTool className="w-4 h-4" />
              Writing Assistant
            </button>

            <button
              onClick={() => setActiveTab('prompts')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'prompts'
                  ? 'bg-zinc-800/80 text-white shadow-md border-l-2 border-indigo-500'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <Terminal className="w-4 h-4" />
              Prompt Studio
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-zinc-800/80 text-white shadow-md border-l-2 border-indigo-500'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              Settings
            </button>
          </nav>
        </div>

        {/* Footer info & Active Model status */}
        <div className="flex flex-col gap-3 border-t border-zinc-800/60 pt-4">
          <div className="glass-card rounded-lg p-3 flex items-center justify-between gap-2">
            <div className="flex flex-col overflow-hidden">
              <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Active Provider</span>
              <span className="text-xs font-semibold text-zinc-300 truncate">{getActiveProviderLabel()}</span>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
          </div>

          <div className="text-[10px] text-zinc-600 text-center flex flex-col gap-0.5">
            <span>Powered by Local RAG Vector Memory</span>
            <span>All Data Remains Offline-First</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="content-area bg-[#09090b]">
        {renderActiveView()}
      </main>
    </div>
  );
}
