import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Plus, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Play, 
  Check, 
  Copy,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  isPreset?: boolean;
}

export default function PromptStudio() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('general');
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  
  // Editor inputs
  const [name, setName] = useState<string>('');
  const [desc, setDesc] = useState<string>('');
  const [sysPrompt, setSysPrompt] = useState<string>('');
  const [isAdding, setIsAdding] = useState<boolean>(false);

  // Playground inputs
  const [playInput, setPlayInput] = useState<string>('');
  const [playOutput, setPlayOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    if (window.api) {
      try {
        const list = await window.api.templates.get();
        setTemplates(list);
        if (list.length > 0 && !selectedTemplateId) {
          setSelectedTemplateId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load templates:', err);
      }
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sysPrompt.trim()) return;

    try {
      if (editingTemplate) {
        // Update custom template
        const list = await window.api.templates.update(editingTemplate.id, name, desc, sysPrompt);
        setTemplates(list);
      } else {
        // Create custom template
        const list = await window.api.templates.add(name, desc, sysPrompt);
        setTemplates(list);
      }
      resetForm();
    } catch (err) {
      console.error('Save template failed:', err);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this custom template?')) return;
    try {
      const list = await window.api.templates.delete(id);
      setTemplates(list);
      if (selectedTemplateId === id) {
        setSelectedTemplateId('general');
      }
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  };

  const handleTestTemplate = async () => {
    if (!playInput.trim()) return;

    setIsLoading(true);
    setError('');
    setPlayOutput('');
    
    const activeT = templates.find(t => t.id === selectedTemplateId) || templates[0];

    try {
      const result = await window.api.ai.enhance(playInput, activeT.systemPrompt);
      setPlayOutput(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Optimization failed. Please verify your active API keys.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPlayground = () => {
    if (!playOutput) return;
    navigator.clipboard.writeText(playOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startEdit = (t: PromptTemplate) => {
    setEditingTemplate(t);
    setName(t.name);
    setDesc(t.description);
    setSysPrompt(t.systemPrompt);
    setIsAdding(true);
  };

  const resetForm = () => {
    setEditingTemplate(null);
    setName('');
    setDesc('');
    setSysPrompt('');
    setIsAdding(false);
  };

  const activeT = templates.find(t => t.id === selectedTemplateId) || templates[0];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-5">
      <header className="page-header">
        <div>
          <h2 className="page-title">
            <Terminal style={{ width: 18, height: 18, color: '#a78bfa' }} />
            Prompt Studio
          </h2>
          <p className="page-subtitle">Tune specialized AI system prompts, orchestrate modes, and test parameters</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsAdding(true); }}
          className="btn-primary"
        >
          <Plus style={{ width: 14, height: 14 }} />
          Create Template
        </button>
      </header>

      {/* Main split grid */}
      <div className="flex-1 grid grid-cols-5 gap-6 overflow-hidden min-h-0">
        
        {/* Left 2 Cols: Templates List */}
        <div className="col-span-2 glass-card rounded-2xl flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800/60 bg-zinc-900/30 flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300">Prompt Templates</span>
            <span className="text-[10px] text-zinc-550 font-mono">{templates.length} templates</span>
          </div>

          <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2 bg-zinc-950/20">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setSelectedTemplateId(t.id);
                  setError('');
                  setPlayOutput('');
                }}
                className={`w-full p-3.5 rounded-xl border text-left flex flex-col gap-1.5 transition-all relative group hover-scale ${
                  selectedTemplateId === t.id
                    ? 'bg-zinc-900/60 border-zinc-700 shadow-lg'
                    : 'bg-zinc-900/20 border-zinc-900/40 hover:bg-zinc-900/40 hover:border-zinc-800'
                }`}
              >
                {selectedTemplateId === t.id && (
                  <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-l-xl"></div>
                )}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold transition-colors ${selectedTemplateId === t.id ? 'text-indigo-300' : 'text-zinc-200 group-hover:text-indigo-200'}`}>
                    {t.name}
                  </span>
                  {t.isPreset && (
                    <span className={`text-[8px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded ${
                      selectedTemplateId === t.id ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 glow-pill' : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      System
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-zinc-550 leading-relaxed truncate">{t.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right 3 Cols: Playground Area */}
        <div className="col-span-3 glass-card rounded-2xl flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-850 bg-zinc-900/30 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-300">Playground testbed</span>
              <p className="text-[10px] text-zinc-550 mt-0.5">Active Mode: <span className="text-indigo-400">{activeT?.name}</span></p>
            </div>

            <button
              onClick={handleTestTemplate}
              disabled={isLoading || !playInput.trim()}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold grad-btn text-white shadow-lg disabled:opacity-40 disabled:pointer-events-none transition-all hover-scale"
            >
              <Play className={`w-3.5 h-3.5 text-white ${isLoading ? 'animate-spin' : ''}`} />
              Run Test
            </button>
          </div>

          <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 min-h-0 bg-zinc-950/10">
            {/* Input field */}
            <div className="flex-1 flex flex-col gap-1.5 min-h-[120px]">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Test Input Prompt</label>
              <textarea
                value={playInput}
                onChange={(e) => setPlayInput(e.target.value)}
                placeholder="Type your rough draft prompt here to test this system template..."
                className="w-full flex-1 bg-zinc-950 border border-zinc-850 p-3 text-xs text-zinc-300 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none font-mono"
              />
            </div>

            {/* Outputs field */}
            <div className="flex-1 flex flex-col gap-1.5 min-h-[120px] relative">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Optimized Response Output</label>
                
                {playOutput && (
                  <button
                    onClick={handleCopyPlayground}
                    className="flex items-center gap-1 text-[9px] font-semibold text-zinc-500 hover:text-zinc-300 transition"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    Copy Result
                  </button>
                )}
              </div>

              <div className="flex-1 border border-zinc-850 rounded-xl relative overflow-hidden bg-zinc-900/20">
                {isLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-950/40">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] text-zinc-550 font-mono">Running template engine...</span>
                  </div>
                ) : error ? (
                  <div className="absolute inset-0 p-4 bg-destructive/5 text-red-400 text-xs flex gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                ) : playOutput ? (
                  <textarea
                    readOnly
                    value={playOutput}
                    className="w-full h-full bg-transparent border-0 p-3 text-xs text-zinc-300 resize-none font-mono"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-zinc-650 text-xs">
                    Test output will appear here
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Add / Edit Prompt Template Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-filter backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleSaveTemplate}
            className="w-[500px] glass-panel rounded-2xl border border-zinc-800/60 p-6 flex flex-col gap-4 shadow-xl text-zinc-200"
          >
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <h3 className="text-sm font-bold text-white font-display">
                {editingTemplate ? 'Modify Custom Template' : 'Create Custom Prompt Template'}
              </h3>
              <button 
                type="button"
                onClick={resetForm} 
                className="text-zinc-550 hover:text-zinc-300"
              >
                <ChevronRight className="w-4 h-4 transform rotate-90" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Template Name</label>
              <input
                type="text"
                placeholder="e.g. AdSense Expert Consulting"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-xs rounded-lg px-3 py-2 text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Description</label>
              <input
                type="text"
                placeholder="Tailors prompts for consulting web clients about AdSense monetization"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-xs rounded-lg px-3 py-2 text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">System Instruction Prompt</label>
              <textarea
                placeholder="You are an expert Google AdSense consultant. Rewrite the user's prompt to focus on monetization metrics, ad placement guidelines, compliance rules, and CPM optimization..."
                required
                value={sysPrompt}
                onChange={(e) => setSysPrompt(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-xs rounded-lg p-3 text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 h-28 resize-none font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-900">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-semibold grad-btn text-white transition shadow-md"
              >
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
