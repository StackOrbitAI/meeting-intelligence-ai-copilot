import React, { useState, useEffect } from 'react';
import { 
  Video, 
  BrainCircuit, 
  
  Terminal, 
  Settings as SettingsIcon,
  Cpu,
  KeyRound,
  FileCheck,
  MessageSquare
} from 'lucide-react';

import MeetingAssistant from './pages/MeetingAssistant';
import BrainsManager from './pages/BrainsManager';
import PromptStudio from './pages/PromptStudio';
import Settings from './pages/Settings';
import ChatAnalyzer from './pages/ChatAnalyzer';
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
        indexRawText: (brainId: string, text: string, sourceName: string) => Promise<number>;
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
        analyzeChat: (chatText: string) => Promise<any>;
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

  const DEFAULT_SETTINGS = {
    geminiApiKey: '',
    openaiApiKey: '',
    claudeApiKey: '',
    openrouterApiKey: '',
    openrouterModel: 'google/gemini-2.5-flash',
    customApiBaseUrl: '',
    customApiKey: '',
    customModel: '',
    activeProviderId: 'gemini',
    targetLanguage: 'hi',
    shortcut: 'CommandOrControl+Shift+E',
    autoCopy: true,
    autoReplace: false,
    launchAtStartup: true,
    theme: 'dark'
  };

  const refreshData = async () => {
    if (window.api) {
      try {
        const loadedSettings = await window.api.settings.get();
        const loadedBrains = await window.api.brains.get();
        setSettings(loadedSettings || DEFAULT_SETTINGS);
        setBrains(loadedBrains || []);
        if (loadedBrains && loadedBrains.length > 0 && !activeBrainId) {
          setActiveBrainId(loadedBrains[0].id);
        }
      } catch (err) {
        console.error('Failed to load storage details:', err);
        // Fallback so UI never gets stuck on spinner
        setSettings(DEFAULT_SETTINGS);
      }
    } else {
      // Running in browser (no Electron context) — use defaults so UI renders
      console.warn('[App] window.api not available — using default settings for dev preview');
      setSettings(DEFAULT_SETTINGS);
      setBrains([]);
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
      case 'analyzer':
        return <ChatAnalyzer brains={brains} onRefresh={refreshData} />;
      case 'brains':
        return <BrainsManager brains={brains} onRefresh={refreshData} />;
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
      case 'openrouter': return `OpenRouter (${settings.openrouterModel ? settings.openrouterModel.split('/').pop() : 'Model'})`;
      case 'custom': return 'Custom API';
      default: return 'Google Gemini';
    }
  };

  const navItems = [
    { id: 'meeting',  label: 'Meeting Assistant',  Icon: Video },
    { id: 'analyzer', label: 'Chat Analyzer',      Icon: MessageSquare },
    { id: 'brains',   label: 'Client Brains',       Icon: BrainCircuit },
        { id: 'prompts',  label: 'Prompt Studio',       Icon: Terminal },
    { id: 'settings', label: 'Settings',            Icon: SettingsIcon },
  ];

  return (
    <div className="app-container">
      {/* ---- Premium Sidebar ---- */}
      <aside className="sidebar glass-panel" style={{ padding: '20px 14px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 4px 12px' }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 18px rgba(124,58,237,0.55), inset 0 1px 0 rgba(255,255,255,0.15)',
              flexShrink: 0, position: 'relative'
            }}>
              <Cpu style={{ width: 16, height: 16, color: '#fff' }} className="animate-pulse-slow" />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f4f4f5', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.03em', lineHeight: 1.2 }}>
                StackOrbitAI
              </div>
              <div style={{ fontSize: '9px', color: '#818cf8', fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.08em', marginTop: 1 }}>
                MEETING COPILOT v1.0
              </div>
            </div>
          </div>

          {/* Section label */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: '9px', fontWeight: 600, color: '#3f3f46', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 4px', marginBottom: 4 }}>
              Navigation
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {navItems.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`nav-item${activeTab === id ? ' active' : ''}`}
                >
                  <Icon className="nav-icon" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.4), transparent)', margin: '4px 0' }} />

          {/* Provider badge */}
          <div style={{
            background: 'rgba(6,78,59,0.12)', border: '1px solid rgba(6,95,70,0.25)',
            borderRadius: 10, padding: '10px 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{ fontSize: '9px', color: '#52525b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Active Provider</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#d4d4d8' }} className="truncate">{getActiveProviderLabel()}</span>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ position: 'absolute', width: 12, height: 12, borderRadius: '50%', border: '1px solid rgba(52,211,153,0.5)' }} className="animate-ping" />
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981', position: 'relative', zIndex: 1 }} />
            </div>
          </div>

          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className="grad-text" style={{ fontSize: '10px', fontWeight: 500, opacity: 0.8 }}>Powered by Local RAG Vector Memory</span>
            <span style={{ fontSize: '10px', color: '#3f3f46' }}>All Data Remains Offline-First</span>
          </div>
        </div>
      </aside>

      {/* ---- Main Content ---- */}
      <main className="content-area animate-slide-up" style={{ background: 'transparent', position: 'relative', zIndex: 10 }}>
        {renderActiveView()}
      </main>
    </div>
  );
}
