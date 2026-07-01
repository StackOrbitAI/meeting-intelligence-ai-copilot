import React, { useState } from 'react';
import { 
  MessageSquare, 
  Sparkles, 
  BrainCircuit, 
  CheckCircle, 
  Database,
  ArrowRight,
  Loader2,
  Clock,
  DollarSign,
  User,
  Tag,
  Code
} from 'lucide-react';

interface ChatAnalyzerProps {
  brains: any[];
  onRefresh: () => void;
}

export default function ChatAnalyzer({ brains, onRefresh }: ChatAnalyzerProps) {
  const [selectedBrainId, setSelectedBrainId] = useState<string>(brains[0]?.id || '');
  const [chatText, setChatText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleAnalyze = async () => {
    if (!chatText.trim()) return;
    setIsLoading(true);
    setError('');
    setAnalysis(null);
    setSaveStatus('');

    try {
      const result = await window.api.ai.analyzeChat(chatText);
      setAnalysis(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Chat analysis failed. Please verify API key.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleIndexToBrain = async () => {
    if (!analysis || !selectedBrainId) return;
    setIsSaving(true);
    setSaveStatus('');
    setError('');

    const sourceName = `Chat_Analysis_${analysis.clientName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`;
    const textToIndex = `
=== CLIENT PROFILE ===
Client Name: ${analysis.clientName}
Project Type: ${analysis.projectType}
Budget: ${analysis.budget}
Timeline: ${analysis.timeline}
Sentiment: ${analysis.sentiment}
Tech Stack: ${analysis.techStack.join(', ')}
Key Topics: ${analysis.keyTopics.join(', ')}

=== CONVERSATION INTELLIGENCE ===
${analysis.extractedContext}
`;

    try {
      await window.api.brains.indexRawText(selectedBrainId, textToIndex, sourceName);
      setSaveStatus('Successfully saved and indexed to RAG vector memory!');
      onRefresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to index data.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedBrain = brains.find(b => b.id === selectedBrainId);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-5">
      <header className="page-header">
        <div>
          <h2 className="page-title">
            <MessageSquare style={{ width: 18, height: 18, color: '#a78bfa' }} />
            Chat Intelligence Analyzer
          </h2>
          <p className="page-subtitle">Paste Fiverr chats or meeting dialogues to extract structure &amp; feed vector memory</p>
        </div>
      </header>

      {/* Grid Content Split */}
      <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
        
        {/* Left Side: Paste Chat Input */}
        <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden">
          <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifycontent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#d4d4d8' }}>Raw Chat Log Input</span>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '9px', fontWeight: 600, color: '#52525b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Target Brain</span>
              <select
                value={selectedBrainId}
                onChange={(e) => setSelectedBrainId(e.target.value)}
                style={{ background: 'rgba(9,9,11,0.8)', border: '1px solid rgba(63,63,70,0.7)', color: '#d4d4d8', fontSize: '0.75rem', borderRadius: 8, padding: '6px 28px 6px 10px', outline: 'none', cursor: 'pointer' }}
              >
                {brains.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
                {brains.length === 0 && <option value="">No Brains Configured</option>}
              </select>
            </div>
          </div>

          <div className="flex-1 p-5 flex flex-col gap-4 min-h-0 bg-zinc-950/20">
            <textarea
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder={`Example paste format:\nBuyer: Hey! Can you redesign my WordPress blog using Oxygen Builder? I need it done in 4 days. My budget is around $250.\nMe: Yes, I can do this. I have experience with Oxygen and WordPress.`}
              className="w-full flex-1 bg-zinc-950/50 border border-zinc-900/60 rounded-xl p-4 text-xs text-zinc-300 placeholder-zinc-650 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none leading-relaxed"
            />

            {error && (
              <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', padding: '10px 14px', borderRadius: 10, fontSize: '0.75rem' }} className="animate-slide-up">
                {error}
              </div>
            )}
          </div>

          <footer className="px-5 py-4 border-t border-zinc-850 bg-zinc-900/30 flex items-center justify-between">
            <span style={{ fontSize: '10px', color: '#71717a' }}>{chatText.length} characters pasted</span>
            <button
              onClick={handleAnalyze}
              disabled={isLoading || !chatText.trim()}
              className="btn-primary"
            >
              {isLoading ? (
                <>
                  <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
                  Analyzing Chat...
                </>
              ) : (
                <>
                  <Sparkles style={{ width: 14, height: 14 }} />
                  Extract & Analyze
                </>
              )}
            </button>
          </footer>
        </div>

        {/* Right Side: Results & Save */}
        <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden">
          <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#d4d4d8' }}>AI Extracted Insights</span>
          </div>

          <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-5 bg-zinc-950/20 min-h-0">
            {!analysis ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-zinc-900/80 flex items-center justify-center text-indigo-400/60 border border-zinc-800">
                  <Database style={{ width: 18, height: 18 }} />
                </div>
                <h3 className="text-sm font-semibold text-zinc-400">Waiting for Input</h3>
                <p className="text-xs text-zinc-650 max-w-[280px]">
                  Paste a client conversation on the left and click analyze. The AI will extract key details and save them to the brain vector storage.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-5 animate-slide-up">
                
                {/* 4 Cards info split */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl border border-zinc-800/40 bg-zinc-900/10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-950/60 flex items-center justify-center text-indigo-400">
                      <User style={{ width: 14, height: 14 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '9px', color: '#52525b', textTransform: 'uppercase', fontWeight: 600 }}>Client Name</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f4f4f5' }}>{analysis.clientName}</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-zinc-800/40 bg-zinc-900/10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-950/60 flex items-center justify-center text-emerald-400">
                      <Clock style={{ width: 14, height: 14 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '9px', color: '#52525b', textTransform: 'uppercase', fontWeight: 600 }}>Timeline</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f4f4f5' }}>{analysis.timeline}</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-zinc-800/40 bg-zinc-900/10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-950/60 flex items-center justify-center text-amber-400">
                      <DollarSign style={{ width: 14, height: 14 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '9px', color: '#52525b', textTransform: 'uppercase', fontWeight: 600 }}>Budget</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f4f4f5' }}>{analysis.budget}</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-zinc-800/40 bg-zinc-900/10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-950/60 flex items-center justify-center text-purple-400">
                      <Sparkles style={{ width: 14, height: 14 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '9px', color: '#52525b', textTransform: 'uppercase', fontWeight: 600 }}>Sentiment</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f4f4f5', textTransform: 'capitalize' }}>{analysis.sentiment}</div>
                    </div>
                  </div>
                </div>

                {/* Project Type */}
                <div className="flex flex-col gap-1.5">
                  <span style={{ fontSize: '10px', color: '#71717a', fontWeight: 600 }}>Project Type</span>
                  <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, fontSize: '0.75rem', color: '#e4e4e7', fontWeight: 600 }}>
                    {analysis.projectType}
                  </div>
                </div>

                {/* Key Topics tags */}
                <div className="flex flex-col gap-2">
                  <span style={{ fontSize: '10px', color: '#71717a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Tag style={{ width: 12, height: 12 }} />
                    Key Deliverables / Topics
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.keyTopics.map((topic: string, i: number) => (
                      <span key={i} style={{ fontSize: '10px', padding: '4px 10px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc', borderRadius: 6, fontWeight: 600 }}>
                        {topic}
                      </span>
                    ))}
                    {analysis.keyTopics.length === 0 && <span style={{ fontSize: '10px', color: '#52525b' }}>None detected</span>}
                  </div>
                </div>

                {/* Tech Stack tags */}
                <div className="flex flex-col gap-2">
                  <span style={{ fontSize: '10px', color: '#71717a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Code style={{ width: 12, height: 12 }} />
                    Tech Stack Detected
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.techStack.map((tech: string, i: number) => (
                      <span key={i} style={{ fontSize: '10px', padding: '4px 10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#6ee7b7', borderRadius: 6, fontWeight: 600 }}>
                        {tech}
                      </span>
                    ))}
                    {analysis.techStack.length === 0 && <span style={{ fontSize: '10px', color: '#52525b' }}>None detected</span>}
                  </div>
                </div>

                {/* Context summary */}
                <div className="flex flex-col gap-1.5">
                  <span style={{ fontSize: '10px', color: '#71717a', fontWeight: 600 }}>Extract Summary (To be Vector Indexed)</span>
                  <textarea
                    value={analysis.extractedContext}
                    onChange={(e) => setAnalysis({ ...analysis, extractedContext: e.target.value })}
                    rows={4}
                    style={{ background: 'rgba(9,9,11,0.6)', border: '1px solid rgba(63,63,70,0.6)', color: '#d4d4d8', fontSize: '0.75rem', borderRadius: 10, padding: 12, outline: 'none', resize: 'none', lineHeight: 1.5 }}
                  />
                </div>

                {saveStatus && (
                  <div style={{ color: '#34d399', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', padding: '10px 14px', borderRadius: 10, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 8 }} className="animate-slide-up">
                    <CheckCircle style={{ width: 14, height: 14, color: '#34d399' }} />
                    {saveStatus}
                  </div>
                )}
              </div>
            )}
          </div>

          {analysis && (
            <footer className="px-5 py-4 border-t border-zinc-850 bg-zinc-900/30 flex items-center justify-between">
              <span style={{ fontSize: '10px', color: '#71717a' }}>Target Profile: {selectedBrain?.name || 'Selected Client'}</span>
              <button
                onClick={handleIndexToBrain}
                disabled={isSaving || !selectedBrainId}
                className="btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 0 15px rgba(16,185,129,0.3)'
                }}
              >
                {isSaving ? (
                  <>
                    <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
                    Indexing to RAG...
                  </>
                ) : (
                  <>
                    <Database style={{ width: 14, height: 14 }} />
                    Save & Index context
                  </>
                )}
              </button>
            </footer>
          )}
        </div>

      </div>
    </div>
  );
}
