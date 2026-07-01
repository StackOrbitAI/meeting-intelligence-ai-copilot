import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Key,
  Languages,
  Keyboard,
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
  Shield,
  Zap,
  Globe,
  ToggleLeft,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Download,
  Info
} from 'lucide-react';

interface SettingsProps {
  settings: any;
  onUpdate: () => void;
}

const LANGUAGES = [
  { code: 'hi', name: 'Hindi' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' }
];

const PROVIDERS = [
  { id: 'gemini', label: 'Google Gemini', color: '#60a5fa', badge: 'Recommended' },
  { id: 'openai', label: 'OpenAI GPT', color: '#34d399', badge: '' },
  { id: 'claude', label: 'Anthropic Claude', color: '#fb923c', badge: '' },
  { id: 'openrouter', label: 'OpenRouter', color: '#a78bfa', badge: '' },
  { id: 'custom', label: 'Custom Endpoint', color: '#f59e0b', badge: '' },
];

function SectionCard({ title, subtitle, icon, accentFrom, accentTo, children }: any) {
  return (
    <div style={{
      background: 'rgba(18,18,28,0.8)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16,
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{ height: 2, background: `linear-gradient(90deg, ${accentFrom}, ${accentTo})`, width: '100%' }} />
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(135deg, ${accentFrom}22, ${accentTo}15)`,
            border: `1px solid ${accentFrom}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            {icon}
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f4f4f5' }}>{title}</div>
            <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: 2 }}>{subtitle}</div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function FieldLabel({ children, hint }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 6 }}>
      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {children}
      </label>
      {hint && <span style={{ fontSize: '0.68rem', color: '#52525b' }}>{hint}</span>}
    </div>
  );
}

function APIInput({ label, value, onChange, placeholder, show, onToggleShow, hint, color }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {color && <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block', boxShadow: `0 0 6px ${color}80` }} />}
          {label}
        </label>
        <button
          onClick={onToggleShow}
          type="button"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', padding: 2, display: 'flex', alignItems: 'center' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#a1a1aa')}
          onMouseLeave={e => (e.currentTarget.style.color = '#52525b')}
        >
          {show ? <EyeOff style={{ width: 13, height: 13 }} /> : <Eye style={{ width: 13, height: 13 }} />}
        </button>
      </div>
      <input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          background: 'rgba(9,9,11,0.8)',
          border: '1px solid rgba(63,63,70,0.7)',
          borderRadius: 10,
          padding: '9px 14px',
          fontSize: '0.8rem',
          color: '#e4e4e7',
          fontFamily: 'monospace',
          outline: 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxSizing: 'border-box'
        }}
        onFocus={e => {
          e.target.style.borderColor = 'rgba(99,102,241,0.6)';
          e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)';
        }}
        onBlur={e => {
          e.target.style.borderColor = 'rgba(63,63,70,0.7)';
          e.target.style.boxShadow = 'none';
        }}
      />
      {hint && <span style={{ fontSize: '0.68rem', color: '#52525b', marginTop: 5 }}>{hint}</span>}
    </div>
  );
}

function TextInput({ label, value, onChange, onBlur, placeholder, hint }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          background: 'rgba(9,9,11,0.8)',
          border: '1px solid rgba(63,63,70,0.7)',
          borderRadius: 10,
          padding: '9px 14px',
          fontSize: '0.8rem',
          color: '#e4e4e7',
          outline: 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxSizing: 'border-box'
        }}
        onFocus={e => {
          e.target.style.borderColor = 'rgba(99,102,241,0.6)';
          e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)';
        }}
        onBlur={e => {
          e.target.style.borderColor = 'rgba(63,63,70,0.7)';
          e.target.style.boxShadow = 'none';
          if (onBlur) onBlur();
        }}
      />
      {hint && <span style={{ fontSize: '0.68rem', color: '#52525b', marginTop: 5 }}>{hint}</span>}
    </div>
  );
}

export default function Settings({ settings, onUpdate }: SettingsProps) {
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [showGemini, setShowGemini] = useState(false);
  const [showClaude, setShowClaude] = useState(false);
  const [showCustomKey, setShowCustomKey] = useState(false);
  const [showOpenRouter, setShowOpenRouter] = useState(false);
  const [saveState, setSaveState] = useState<'idle'|'saving'|'saved'>('idle');

  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [claudeKey, setClaudeKey] = useState('');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [openrouterModel, setOpenrouterModel] = useState('');
  const [customApiBase, setCustomApiBase] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [shortcut, setShortcut] = useState('');

  React.useEffect(() => {
    if (settings) {
      setGeminiKey(settings.geminiApiKey || '');
      setOpenaiKey(settings.openaiApiKey || '');
      setClaudeKey(settings.claudeApiKey || '');
      setOpenrouterKey(settings.openrouterApiKey || '');
      setOpenrouterModel(settings.openrouterModel || '');
      setCustomApiBase(settings.customApiBaseUrl || '');
      setCustomModel(settings.customModel || '');
      setCustomKey(settings.customApiKey || '');
      setShortcut(settings.shortcut || '');
    }
  }, [settings]);

  if (!settings) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <div style={{ width: 28, height: 28, border: '2px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#52525b', fontSize: '0.8rem' }}>Loading settings...</p>
      </div>
    );
  }

  const handleUpdate = async (key: string, value: any) => {
    try {
      if (window.api) await window.api.settings.update(key, value);
      onUpdate();
    } catch (err) {
      console.error('Settings update failed:', err);
    }
  };

  const handleSave = async () => {
    setSaveState('saving');
    try {
      if (window.api) {
        await window.api.settings.update('geminiApiKey', geminiKey);
        await window.api.settings.update('openaiApiKey', openaiKey);
        await window.api.settings.update('claudeApiKey', claudeKey);
        await window.api.settings.update('openrouterApiKey', openrouterKey);
        await window.api.settings.update('openrouterModel', openrouterModel);
        await window.api.settings.update('customApiBaseUrl', customApiBase);
        await window.api.settings.update('customModel', customModel);
        await window.api.settings.update('customApiKey', customKey);
        await window.api.settings.update('shortcut', shortcut);
      }
      setSaveState('saved');
      onUpdate();
      setTimeout(() => setSaveState('idle'), 2500);
    } catch (err) {
      console.error(err);
      setSaveState('idle');
    }
  };

  const activeProvider = PROVIDERS.find(p => p.id === settings.activeProviderId) || PROVIDERS[0];

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '28px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      maxWidth: 760,
      width: '100%',
      margin: '0 auto',
      boxSizing: 'border-box'
    }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.2rem', fontWeight: 800, color: '#f4f4f5', margin: 0, letterSpacing: '-0.03em' }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(124,58,237,0.4)' }}>
              <SettingsIcon style={{ width: 15, height: 15, color: '#fff' }} />
            </div>
            Application Settings
          </h2>
          <p style={{ color: '#52525b', fontSize: '0.78rem', margin: '6px 0 0 42px' }}>Configure API keys, language & preferences</p>
        </div>

        {/* Save Status Badge */}
        {saveState === 'saved' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 10, padding: '7px 14px',
            color: '#34d399', fontSize: '0.78rem', fontWeight: 600,
            animation: 'slideUp 0.3s ease'
          }}>
            <Check style={{ width: 13, height: 13 }} />
            All keys saved!
          </div>
        )}
      </div>

      {/* ── Section 1: Active Provider Selector ── */}
      <SectionCard
        title="AI Provider"
        subtitle="Choose the AI engine used for all tasks"
        icon={<Zap style={{ width: 16, height: 16, color: '#a78bfa' }} />}
        accentFrom="#7c3aed"
        accentTo="#4f46e5"
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {PROVIDERS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleUpdate('activeProviderId', p.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                padding: '10px 6px',
                borderRadius: 10,
                border: settings.activeProviderId === p.id ? `1.5px solid ${p.color}60` : '1.5px solid rgba(63,63,70,0.5)',
                background: settings.activeProviderId === p.id ? `${p.color}12` : 'rgba(9,9,11,0.5)',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {settings.activeProviderId === p.id && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${p.color}, transparent)` }} />
              )}
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, boxShadow: settings.activeProviderId === p.id ? `0 0 8px ${p.color}` : 'none' }} />
              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: settings.activeProviderId === p.id ? '#f4f4f5' : '#71717a', textAlign: 'center', lineHeight: 1.2 }}>{p.label}</span>
              {p.badge && settings.activeProviderId === p.id && (
                <span style={{ fontSize: '0.55rem', background: `${p.color}25`, color: p.color, borderRadius: 4, padding: '1px 5px', fontWeight: 700, letterSpacing: '0.04em' }}>{p.badge}</span>
              )}
            </button>
          ))}
        </div>
      </SectionCard>

      {/* ── Section 2: API Keys ── */}
      <SectionCard
        title="API Credentials"
        subtitle="Enter your keys — stored locally, never uploaded"
        icon={<Key style={{ width: 16, height: 16, color: '#818cf8' }} />}
        accentFrom="#6366f1"
        accentTo="#8b5cf6"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <APIInput
            label="Google Gemini API Key"
            placeholder="AIzaSy..."
            value={geminiKey}
            onChange={setGeminiKey}
            show={showGemini}
            onToggleShow={() => setShowGemini(!showGemini)}
            hint="Get your key at aistudio.google.com/app/apikey"
            color="#60a5fa"
          />
          <APIInput
            label="OpenAI API Key"
            placeholder="sk-..."
            value={openaiKey}
            onChange={setOpenaiKey}
            show={showOpenAI}
            onToggleShow={() => setShowOpenAI(!showOpenAI)}
            hint="Get your key at platform.openai.com/api-keys"
            color="#34d399"
          />
          <APIInput
            label="Anthropic Claude API Key"
            placeholder="sk-ant-..."
            value={claudeKey}
            onChange={setClaudeKey}
            show={showClaude}
            onToggleShow={() => setShowClaude(!showClaude)}
            color="#fb923c"
          />

          {/* OpenRouter */}
          <div style={{ borderTop: '1px solid rgba(63,63,70,0.4)', paddingTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Globe style={{ width: 12, height: 12, color: '#a78bfa' }} />
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>OpenRouter</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <APIInput
                label="API Key"
                placeholder="sk-or-v1-..."
                value={openrouterKey}
                onChange={setOpenrouterKey}
                show={showOpenRouter}
                onToggleShow={() => setShowOpenRouter(!showOpenRouter)}
                color="#a78bfa"
              />
              <TextInput
                label="Model Name"
                placeholder="google/gemini-2.5-flash"
                value={openrouterModel}
                onChange={setOpenrouterModel}
              />
            </div>
          </div>

          {/* Custom Endpoint */}
          <div style={{ borderTop: '1px solid rgba(63,63,70,0.4)', paddingTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Zap style={{ width: 12, height: 12, color: '#f59e0b' }} />
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Custom / Ollama Endpoint</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <TextInput
                label="Base URL"
                placeholder="http://localhost:11434/v1"
                value={customApiBase}
                onChange={setCustomApiBase}
              />
              <TextInput
                label="Model Name"
                placeholder="llama3, mistral..."
                value={customModel}
                onChange={setCustomModel}
              />
            </div>
            <APIInput
              label="Auth Token (optional)"
              placeholder="Bearer token or leave empty"
              value={customKey}
              onChange={setCustomKey}
              show={showCustomKey}
              onToggleShow={() => setShowCustomKey(!showCustomKey)}
            />
          </div>

          {/* Save Button */}
          <div style={{ paddingTop: 4 }}>
            <button
              onClick={handleSave}
              disabled={saveState === 'saving'}
              type="button"
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '11px 24px',
                borderRadius: 12,
                border: 'none',
                background: saveState === 'saved'
                  ? 'linear-gradient(135deg, #059669, #10b981)'
                  : 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 60%, #6366f1 100%)',
                boxShadow: saveState === 'saved'
                  ? '0 0 20px rgba(16,185,129,0.35)'
                  : '0 0 20px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
                cursor: saveState === 'saving' ? 'not-allowed' : 'pointer',
                opacity: saveState === 'saving' ? 0.75 : 1,
                transition: 'all 0.3s ease',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#fff',
                letterSpacing: '-0.01em'
              }}
            >
              {saveState === 'saving' && <Loader2 style={{ width: 15, height: 15, animation: 'spin 0.8s linear infinite' }} />}
              {saveState === 'saved' && <Check style={{ width: 15, height: 15 }} />}
              {saveState === 'idle' && <Key style={{ width: 15, height: 15 }} />}
              {saveState === 'saving' ? 'Saving credentials...' : saveState === 'saved' ? 'All API Keys Saved!' : 'Save All API Keys'}
            </button>
          </div>
        </div>
      </SectionCard>

      {/* ── Section 3: Language ── */}
      <SectionCard
        title="Language & Translation"
        subtitle="Real-time translation target for meeting captions"
        icon={<Languages style={{ width: 16, height: 16, color: '#34d399' }} />}
        accentFrom="#10b981"
        accentTo="#06b6d4"
      >
        <div>
          <FieldLabel hint="Buyer speech will be translated to this language live during meetings">Default Target Language</FieldLabel>
          <select
            value={settings.targetLanguage}
            onChange={e => handleUpdate('targetLanguage', e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(9,9,11,0.8)',
              border: '1px solid rgba(63,63,70,0.7)',
              borderRadius: 10,
              padding: '9px 14px',
              fontSize: '0.8rem',
              color: '#e4e4e7',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
          </select>
        </div>
      </SectionCard>

      {/* ── Section 4: Hotkey & Preferences ── */}
      <SectionCard
        title="Hotkey & Preferences"
        subtitle="Global shortcuts and application behavior"
        icon={<Keyboard style={{ width: 16, height: 16, color: '#c084fc' }} />}
        accentFrom="#a855f7"
        accentTo="#ec4899"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TextInput
            label="Global Hotkey (Prompt Enhancer)"
            placeholder="CommandOrControl+Shift+E"
            value={shortcut}
            onChange={setShortcut}
            onBlur={() => handleUpdate('shortcut', shortcut)}
            hint="Press this keyboard shortcut anywhere to enhance selected text with AI"
          />

          <div style={{ borderTop: '1px solid rgba(63,63,70,0.4)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <ToggleLeft style={{ width: 12, height: 12, color: '#818cf8' }} />
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Behavior Options</span>
            </div>
            {[
              { key: 'autoReplace', label: 'Auto-Replace Selection', desc: 'Paste enhanced text directly, replacing highlighted text without showing the HUD overlay', checked: settings.autoReplace },
              { key: 'autoCopy', label: 'Auto-Copy to Clipboard', desc: 'Automatically copy AI-enhanced response to clipboard after processing', checked: settings.autoCopy },
              { key: 'launchAtStartup', label: 'Start on System Login', desc: 'Launch StackOrbitAI in the system tray automatically when Windows starts', checked: settings.launchAtStartup }
            ].map(({ key, label, desc, checked }) => (
              <label key={key} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer',
                padding: '10px 12px', borderRadius: 10,
                border: '1px solid transparent',
                transition: 'background 0.15s, border-color 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.06)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.12)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; }}
              >
                <div
                  onClick={() => handleUpdate(key, !checked)}
                  style={{
                    width: 18, height: 18, borderRadius: 5, marginTop: 1, flexShrink: 0, cursor: 'pointer',
                    background: checked ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(9,9,11,0.9)',
                    border: checked ? '1px solid #7c3aed' : '1px solid rgba(63,63,70,0.8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                    boxShadow: checked ? '0 0 8px rgba(124,58,237,0.4)' : 'none'
                  }}
                >
                  {checked && <Check style={{ width: 11, height: 11, color: '#fff' }} />}
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#d4d4d8' }}>{label}</div>
                  <div style={{ fontSize: '0.71rem', color: '#52525b', marginTop: 2, lineHeight: 1.5 }}>{desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* ── Section 5: Application Updates ── */}
      <SectionCard
        title="Application Updates"
        subtitle="Automatic and manual package updater"
        icon={<Info style={{ width: 16, height: 16, color: '#f59e0b' }} />}
        accentFrom="#f59e0b"
        accentTo="#ef4444"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(9,9,11,0.6)', border: '1px solid rgba(63,63,70,0.5)', borderRadius: 10 }}>
            <div>
              <span style={{ fontSize: '0.73rem', color: '#52525b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Current Version</span>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e4e4e7', marginTop: 2 }}>v1.0.0</div>
            </div>
            <div>
              <span style={{ fontSize: '0.73rem', color: '#52525b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Status</span>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f4f4f5', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                {updateStatus === 'idle' && 'Up to date ✓'}
                {updateStatus === 'checking' && (
                  <>
                    <Loader2 style={{ width: 12, height: 12, color: '#f59e0b', animation: 'spin 0.8s linear infinite' }} />
                    Checking...
                  </>
                )}
                {updateStatus === 'available' && 'Update Available! ⚡'}
                {updateStatus === 'not-available' && 'Latest version installed ✓'}
                {updateStatus === 'downloading' && (
                  <>
                    <Loader2 style={{ width: 12, height: 12, color: '#34d399', animation: 'spin 0.8s linear infinite' }} />
                    Downloading ({updateDetails?.percent ? Math.round(updateDetails.percent) : 0}%)
                  </>
                )}
                {updateStatus === 'downloaded' && 'Download Complete! Restarting... ✓'}
                {updateStatus === 'error' && 'Check Failed ⚠'}
              </div>
            </div>
          </div>

          {updateStatus === 'error' && (
            <div style={{ fontSize: '0.72rem', color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '8px 12px', borderRadius: 8 }}>
              Update check failed: {updateDetails || 'Unknown error. Check network connection.'}
            </div>
          )}

          <button
            onClick={triggerUpdateCheck}
            disabled={updateStatus === 'checking' || updateStatus === 'downloading'}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              border: 'none',
              borderRadius: 10,
              padding: '10px 18px',
              cursor: (updateStatus === 'checking' || updateStatus === 'downloading') ? 'not-allowed' : 'pointer',
              color: '#fff',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 0 14px rgba(245,158,11,0.25)',
              transition: 'all 0.2s'
            }}
          >
            <RefreshCw style={{ width: 13, height: 13, animation: (updateStatus === 'checking' || updateStatus === 'downloading') ? 'spin 0.8s linear infinite' : 'none' }} />
            Check for Updates Now
          </button>
        </div>
      </SectionCard>

      {/* ── Privacy Notice ── */}
      <div style={{
        borderRadius: 14,
        border: '1px solid rgba(245,158,11,0.2)',
        background: 'rgba(245,158,11,0.05)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{ height: 2, background: 'linear-gradient(90deg, #f59e0b, #f97316)' }} />
        <div style={{ padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
            <Shield style={{ width: 14, height: 14, color: '#f59e0b' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fbbf24', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle style={{ width: 12, height: 12 }} />
              Data Privacy — 100% Local Storage
            </div>
            <p style={{ fontSize: '0.72rem', color: '#71717a', margin: 0, lineHeight: 1.6 }}>
              StackOrbitAI stores all API keys and data locally on your computer inside Electron's secure sandbox.
              No data is sent to external servers. AI processing goes directly from your device to the AI provider's API.
            </p>
          </div>
        </div>
      </div>

      <div style={{ height: 16 }} />
    </div>
  );
}
