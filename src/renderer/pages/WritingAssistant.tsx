import React, { useState } from 'react';
import { 
  PenTool, 
  Sparkles, 
  Copy, 
  Check, 
  Send,
  MessageSquare,
  FileCheck,
  Languages,
  Zap
} from 'lucide-react';

interface TonePreset {
  id: string;
  name: string;
  desc: string;
  icon: React.ReactNode;
  systemPrompt: string;
}

const TONES: TonePreset[] = [
  {
    id: 'grammar',
    name: 'Grammar & Styling',
    desc: 'Corrects spelling and aligns phrasing to sound natural, polite, and fluent.',
    icon: <Check className="w-4 h-4 text-emerald-400" />,
    systemPrompt: 'You are an elite copy editor. Rewrite the user input to correct grammar, style, spelling, and phrasing. Flow naturally and sound like a highly-educated native English speaker. Do not explain changes. Return ONLY the rewritten text.'
  },
  {
    id: 'fiverr_reply',
    name: 'Client Message Response',
    desc: 'Drafts responses to freelance inquiries to sound helpful, clear, and professional.',
    icon: <MessageSquare className="w-4 h-4 text-indigo-400" />,
    systemPrompt: 'You are a highly successful freelancer. Draft a reply to the client query. Be extremely professional, polite, and structured. Mention that you can handle the requirements, and suggest a polite call to action. Return ONLY the reply message.'
  },
  {
    id: 'proposal',
    name: 'Proposal Pitch Writer',
    desc: 'Drafts tailored project proposals from client briefs to pitch on Upwork/Fiverr.',
    icon: <FileCheck className="w-4 h-4 text-purple-400" />,
    systemPrompt: 'You are a business consultant. Write a high-converting project proposal based on the brief provided. Structure it with: 1) Brief greeting & understanding of project, 2) Why you are the best fit, 3) Proposed outline & tech approach, 4) Soft call to action. Keep it persuasive, professional, and clear. Return ONLY the proposal text.'
  },
  {
    id: 'tech_layman',
    name: 'Tech-to-Layman Explainer',
    desc: 'Translates complex code details or issues into simple terms a client understands.',
    icon: <Languages className="w-4 h-4 text-amber-400" />,
    systemPrompt: 'You are a client-relations specialist at a dev agency. The user provides technical coding jargon/errors. Translate this into extremely simple, reassuring layman terms that a non-technical client would understand. Focus on what it means for their project and that you have it under control. Return ONLY the translated explanation.'
  }
];

export default function WritingAssistant() {
  const [activeToneId, setActiveToneId] = useState<string>('grammar');
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const activeTone = TONES.find((t) => t.id === activeToneId) || TONES[0];

  const handleGenerate = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError('');
    setOutputText('');
    try {
      const result = await window.api.ai.enhance(inputText, activeTone.systemPrompt);
      setOutputText(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Generation failed. Please verify your API key configuration in settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-5">
      <header className="page-header">
        <div>
          <h2 className="page-title">
            <PenTool style={{ width: 18, height: 18, color: '#a78bfa' }} />
            AI Writing Assistant
          </h2>
          <p className="page-subtitle">Draft proposals, rewrite messages, and translate development jargon</p>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
        
        {/* Left Panel: Selector + Input */}
        <div className="flex-[0.9] flex flex-col gap-5 min-w-0">
          
          {/* Tone Presets Selector cards */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Select Assistant Template</span>
            <div className="grid grid-cols-2 gap-3">
              {TONES.map((tone) => (
                <button
                  key={tone.id}
                  onClick={() => {
                    setActiveToneId(tone.id);
                    setOutputText('');
                    setError('');
                  }}
                  className={`p-3.5 rounded-xl border text-left flex gap-3 items-start transition-all relative overflow-hidden group hover-scale ${
                    activeToneId === tone.id
                      ? 'bg-zinc-900/60 border-zinc-700 shadow-lg'
                      : 'bg-zinc-900/20 border-zinc-900/40 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-900/40'
                  }`}
                >
                  {activeToneId === tone.id && (
                    <div className="absolute inset-0 border-2 border-indigo-500/30 rounded-xl pointer-events-none"></div>
                  )}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    activeToneId === tone.id ? 'bg-indigo-950/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-zinc-950 group-hover:bg-zinc-900'
                  }`}>
                    {tone.icon}
                  </div>
                  <div className="flex flex-col min-w-0 pt-0.5">
                    <span className={`text-xs font-bold leading-normal transition-colors ${activeToneId === tone.id ? 'text-indigo-200' : 'text-white'}`}>{tone.name}</span>
                    <span className="text-[9px] text-zinc-500 leading-relaxed truncate group-hover:text-zinc-400 transition-colors">{tone.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Input text block */}
          <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800/60 bg-zinc-900/30">
              <span className="text-xs font-semibold text-zinc-300">Input Content</span>
            </div>
            
            <div className="flex-1 p-4 relative flex flex-col min-h-0">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Paste your rough drafted text, errors, or client message here...\nExample: "hey client, code breaks due to database socket timeout. we need to buy more ram. cost is 20$" `}
                className="w-full flex-1 bg-transparent border-0 p-1 text-xs text-zinc-300 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            <footer className="px-5 py-3.5 border-t border-zinc-850 bg-zinc-900/30 flex items-center justify-between">
              <span className="text-[10px] text-zinc-650 font-mono">
                {inputText.length} characters
              </span>
              
              <button
                onClick={handleGenerate}
                disabled={isLoading || !inputText.trim()}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold grad-btn text-white shadow-md disabled:opacity-40 disabled:pointer-events-none transition-all hover-scale"
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
                Enhance & Rewrite
              </button>
            </footer>
          </div>
        </div>

        {/* Right Panel: Rewritten Output result card */}
        <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800/60 bg-zinc-900/30 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-semibold text-zinc-300">Refined Response</span>
            </div>

            {outputText && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700/80 transition"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                Copy Output
              </button>
            )}
          </div>

          <div className="flex-1 p-5 overflow-y-auto relative min-h-0 bg-zinc-950/20">
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-950/40">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] text-zinc-500 font-mono">Refining language styling...</span>
              </div>
            ) : error ? (
              <div className="bg-destructive/10 border border-destructive/20 text-red-400 text-xs p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-[2px]" />
                <span>{error}</span>
              </div>
            ) : outputText ? (
              <p className="text-xs text-zinc-300 font-medium leading-relaxed whitespace-pre-wrap animate-slide-up">{outputText}</p>
            ) : (
              <div className="flex flex-col items-center justify-center text-center gap-2 h-full opacity-60">
                <PenTool className="w-8 h-8 text-zinc-700" />
                <span className="text-xs text-zinc-650">Ready to rewrite response</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

const AlertCircle = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
  </svg>
);
