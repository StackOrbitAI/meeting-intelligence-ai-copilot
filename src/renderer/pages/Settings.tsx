import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Key, 
  Languages, 
  Keyboard, 
  Sliders, 
  Check, 
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';

interface SettingsProps {
  settings: any;
  onUpdate: () => void;
}

const LANGUAGES = [
  { code: 'hi', name: 'Hindi (हिंदी)' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'zh', name: 'Chinese (中文)' },
  { code: 'ar', name: 'Arabic (العربية)' }
];

export default function Settings({ settings, onUpdate }: SettingsProps) {
  const [showOpenAI, setShowOpenAI] = useState<boolean>(false);
  const [showGemini, setShowGemini] = useState<boolean>(false);
  const [showClaude, setShowClaude] = useState<boolean>(false);
  const [showCustom, setShowCustom] = useState<boolean>(false);
  const [saveIndicator, setSaveIndicator] = useState<string>('');

  if (!settings) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleUpdate = async (key: string, value: any) => {
    try {
      await window.api.settings.update(key, value);
      setSaveIndicator(`Saved ${key}`);
      setTimeout(() => setSaveIndicator(''), 1500);
      onUpdate();
    } catch (err) {
      console.error('Settings update failed:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-6 max-w-4xl">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white font-display flex items-center gap-2">
            Application Settings
            <SettingsIcon className="w-4.5 h-4.5 text-zinc-500" />
          </h2>
          <p className="text-xs text-zinc-500 font-mono">Manage API credentials, configure hotkeys, and translate settings</p>
        </div>

        {saveIndicator && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 text-[10px] font-mono font-bold animate-pulse">
            <Check className="w-3 h-3" />
            {saveIndicator}
          </div>
        )}
      </header>

      {/* Main Settings Form Panels */}
      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-6">
        
        {/* Section 1: AI Provider selection */}
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-400" />
            AI Providers Credentials
          </h3>
          <p className="text-xs text-zinc-550">Configure keys and choose the default engine. Swaps are processed instantly.</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-zinc-550 uppercase tracking-wider">Active Provider</label>
              <select
                value={settings.activeProviderId}
                onChange={(e) => handleUpdate('activeProviderId', e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="gemini">Google Gemini (Default)</option>
                <option value="openai">OpenAI GPT</option>
                <option value="claude">Anthropic Claude</option>
                <option value="custom">Custom OpenAI-compatible API</option>
              </select>
            </div>
          </div>

          <div className="border-t border-zinc-850 pt-4 flex flex-col gap-3">
            {/* Gemini API Key */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Google Gemini API Key</label>
                <button onClick={() => setShowGemini(!showGemini)} className="text-zinc-650 hover:text-zinc-400 transition">
                  {showGemini ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <input
                type={showGemini ? 'text' : 'password'}
                placeholder="AIzaSy..."
                value={settings.geminiApiKey}
                onChange={(e) => handleUpdate('geminiApiKey', e.target.value)}
                className="bg-zinc-950 border border-zinc-850 text-xs rounded-lg px-3 py-2.5 text-zinc-300 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* OpenAI API Key */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">OpenAI API Key</label>
                <button onClick={() => setShowOpenAI(!showOpenAI)} className="text-zinc-650 hover:text-zinc-400 transition">
                  {showOpenAI ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <input
                type={showOpenAI ? 'text' : 'password'}
                placeholder="sk-proj-..."
                value={settings.openaiApiKey}
                onChange={(e) => handleUpdate('openaiApiKey', e.target.value)}
                className="bg-zinc-950 border border-zinc-850 text-xs rounded-lg px-3 py-2.5 text-zinc-300 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Claude API Key */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Anthropic Claude API Key</label>
                <button onClick={() => setShowClaude(!showClaude)} className="text-zinc-650 hover:text-zinc-400 transition">
                  {showClaude ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <input
                type={showClaude ? 'text' : 'password'}
                placeholder="sk-ant-..."
                value={settings.claudeApiKey}
                onChange={(e) => handleUpdate('claudeApiKey', e.target.value)}
                className="bg-zinc-950 border border-zinc-850 text-xs rounded-lg px-3 py-2.5 text-zinc-300 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Custom endpoint API configuration */}
            <div className="flex flex-col gap-3 border-t border-zinc-850/60 pt-3">
              <h4 className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider">Custom OpenAI Endpoint Setup</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-zinc-500">Base URL</label>
                  <input
                    type="text"
                    placeholder="e.g. http://localhost:11434/v1"
                    value={settings.customApiBaseUrl}
                    onChange={(e) => handleUpdate('customApiBaseUrl', e.target.value)}
                    className="bg-zinc-950 border border-zinc-850 text-xs rounded-lg px-3 py-2 text-zinc-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-zinc-500">Model Name</label>
                  <input
                    type="text"
                    placeholder="e.g. llama3, mistral"
                    value={settings.customModel}
                    onChange={(e) => handleUpdate('customModel', e.target.value)}
                    className="bg-zinc-950 border border-zinc-850 text-xs rounded-lg px-3 py-2 text-zinc-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold text-zinc-550">Custom API Authorization Token (optional)</label>
                  <button onClick={() => setShowCustom(!showCustom)} className="text-zinc-650 hover:text-zinc-400 transition">
                    {showCustom ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <input
                  type={showCustom ? 'text' : 'password'}
                  placeholder="Bearer token or leave empty"
                  value={settings.customApiKey}
                  onChange={(e) => handleUpdate('customApiKey', e.target.value)}
                  className="bg-zinc-950 border border-zinc-850 text-xs rounded-lg px-3 py-2.5 text-zinc-300 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Meeting Assistant Options */}
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Languages className="w-4 h-4 text-emerald-400" />
            Meeting & Translation Configuration
          </h3>
          <p className="text-xs text-zinc-550">Customize caption languages and target parameters for the live meeting assist.</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-zinc-550 uppercase tracking-wider">Default Translation Target</label>
              <select
                value={settings.targetLanguage}
                onChange={(e) => handleUpdate('targetLanguage', e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Prompt Studio / Global shortcut configuration */}
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-purple-400" />
            Prompt Enhancer Global Shortcut
          </h3>
          <p className="text-xs text-zinc-550">Orchestrate system-wide prompt re-writing hotkeys.</p>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-zinc-550 uppercase tracking-wider">Keyboard Hotkey</label>
                <input
                  type="text"
                  placeholder="CommandOrControl+Shift+E"
                  value={settings.shortcut}
                  onChange={(e) => handleUpdate('shortcut', e.target.value)}
                  className="bg-zinc-950 border border-zinc-850 text-xs rounded-lg px-3 py-2.5 text-zinc-300 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="border-t border-zinc-850 pt-4 flex flex-col gap-3">
              {/* Checkboxes */}
              <label className="flex items-center gap-3 cursor-pointer group text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={settings.autoReplace}
                  onChange={(e) => handleUpdate('autoReplace', e.target.checked)}
                  className="w-4 h-4 rounded bg-zinc-950 border-zinc-800 text-indigo-500 focus:ring-indigo-500"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-zinc-200 group-hover:text-white transition">Auto-Replace Selection</span>
                  <span className="text-[10px] text-zinc-550 leading-none">Pastes rewritten prompt directly replacing highlighted text without overlaying the HUD.</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={settings.autoCopy}
                  onChange={(e) => handleUpdate('autoCopy', e.target.checked)}
                  className="w-4 h-4 rounded bg-zinc-950 border-zinc-800 text-indigo-500 focus:ring-indigo-500"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-zinc-200 group-hover:text-white transition">Auto-Copy Enhanced Output</span>
                  <span className="text-[10px] text-zinc-550 leading-none">Copies AI rewritten response to your clipboard automatically.</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={settings.launchAtStartup}
                  onChange={(e) => handleUpdate('launchAtStartup', e.target.checked)}
                  className="w-4 h-4 rounded bg-zinc-950 border-zinc-800 text-indigo-500 focus:ring-indigo-500"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-zinc-200 group-hover:text-white transition">Start on OS Login</span>
                  <span className="text-[10px] text-zinc-550 leading-none">Configures Electron to auto-start on system startup (headless in tray).</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Section 4: Storage paths details */}
        <div className="glass-card rounded-2xl p-5 border border-amber-900/10 bg-amber-950/5 flex gap-4">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-[2px]" />
          <div className="flex flex-col gap-1">
            <h4 className="text-xs font-bold text-amber-400 font-display">Data Privacy Compliance Notice</h4>
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              StackOrbitAI is designed to be fully self-contained. Your API keys are saved on your local OS filesystem inside Electron's sandbox, and all document texts chunks are stored as local JSON files on this computer. No telemetry is collected and no external indexing servers are used.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
