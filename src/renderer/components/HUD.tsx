import React, { useState, useEffect } from 'react';
import { Sparkles, Clipboard, Check, X, ArrowRight, CornerDownLeft } from 'lucide-react';

export default function HUD() {
  const [originalText, setOriginalText] = useState<string>('');
  const [enhancedText, setEnhancedText] = useState<string>('');
  const [modeName, setModeName] = useState<string>('General AI');
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Listen to main process starting the processing
    const unsubscribe = window.api.window.onProcessHUD(async (data: any) => {
      setIsLoading(true);
      setError('');
      setOriginalText(data.text || '');
      setModeName(data.modeName || 'General AI');
      setSystemPrompt(data.systemPrompt || '');

      const promptToRun = data.text && data.text.trim() !== '' 
        ? data.text 
        : 'Please prompt the user or type something.';

      if (!data.text || data.text.trim() === '') {
        setOriginalText('(No text highlighted. Ready to type a new prompt)');
        setIsLoading(false);
        setEnhancedText('');
        return;
      }

      try {
        const result = await window.api.ai.enhance(promptToRun, data.systemPrompt);
        setEnhancedText(result);
      } catch (err: any) {
        setError(err.message || 'AI Enhancement failed. Please check your API key.');
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleCustomEnhance = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!originalText || originalText.trim() === '') return;
    
    setIsLoading(true);
    setError('');
    try {
      const result = await window.api.ai.enhance(originalText, systemPrompt);
      setEnhancedText(result);
    } catch (err: any) {
      setError(err.message || 'Enhancement failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    if (!enhancedText) return;
    await window.api.window.applyHUD(enhancedText);
  };

  const handleCopy = async () => {
    if (!enhancedText) return;
    await window.api.window.copyHUD(enhancedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = async () => {
    await window.api.window.closeHUD();
  };

  return (
    <div 
      className="glass-panel w-full h-full rounded-2xl flex flex-col overflow-hidden text-zinc-200 border"
      style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80 bg-zinc-950/60">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded grad-btn flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-white tracking-wide uppercase">Prompt Enhancer HUD</h2>
            <p className="text-[10px] text-zinc-500 font-mono">Active Preset: {modeName}</p>
          </div>
        </div>
        
        <button 
          onClick={handleClose}
          className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      {/* Editor & AI Result Panel */}
      <div className="flex-1 p-5 flex flex-col gap-4 overflow-hidden">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-red-400 text-xs p-3 rounded-lg flex items-center justify-between">
            <span className="truncate">{error}</span>
            <button onClick={() => setError('')} className="text-[10px] underline hover:no-underline">Dismiss</button>
          </div>
        )}

        <form onSubmit={handleCustomEnhance} className="flex-1 flex gap-4 overflow-hidden">
          {/* Original Text Box (Editable if user wants to change prompt) */}
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Input Prompt</label>
            <textarea
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              placeholder="Paste or write your prompt here..."
              className="flex-1 bg-zinc-950/70 border border-zinc-850 rounded-xl p-3 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none font-mono"
            />
          </div>

          <div className="flex items-center justify-center text-zinc-700">
            <ArrowRight className="w-5 h-5" />
          </div>

          {/* Enhanced Result Box */}
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
              <span>Enhanced Response</span>
              {isLoading && <span className="text-[10px] text-indigo-400 lowercase animate-pulse">thinking...</span>}
            </label>
            <div className="flex-1 relative bg-zinc-900/40 border border-zinc-850 rounded-xl overflow-hidden">
              {isLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-950/40">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] text-zinc-500 font-mono">Running LLM optimizer...</span>
                </div>
              ) : (
                <textarea
                  readOnly
                  value={enhancedText}
                  placeholder="Enhanced version will appear here after API response."
                  className="w-full h-full bg-transparent border-0 p-3 text-xs text-indigo-200 focus:outline-none resize-none font-mono"
                />
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Footer controls */}
      <footer className="px-5 py-4 border-t border-zinc-900 bg-zinc-950/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {originalText && originalText.trim() !== '' && (
            <button
              onClick={() => setIsLoading(true)}
              type="submit"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              disabled={isLoading}
            >
              Regenerate
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            disabled={isLoading || !enhancedText}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 transition disabled:opacity-40 disabled:pointer-events-none"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Clipboard className="w-3.5 h-3.5" />}
            Copy Only
          </button>

          <button
            onClick={handleApply}
            disabled={isLoading || !enhancedText}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold grad-btn text-white shadow-md transition disabled:opacity-40 disabled:pointer-events-none"
          >
            <CornerDownLeft className="w-3.5 h-3.5" />
            Apply & Paste
          </button>
        </div>
      </footer>
    </div>
  );
}
