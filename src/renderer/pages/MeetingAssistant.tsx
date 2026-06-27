import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Square, 
  Mic, 
  MicOff, 
  Sparkles, 
  Globe, 
  ArrowRight, 
  Keyboard, 
  Clipboard, 
  Check, 
  History,
  FileText,
  User,
  RotateCw,
  Plus
} from 'lucide-react';

interface MeetingAssistantProps {
  brains: any[];
  activeBrainId: string;
  setActiveBrainId: (id: string) => void;
}

interface TranscriptLine {
  id: string;
  role: 'buyer' | 'user' | 'system';
  speaker: string;
  text: string;
  translation?: string;
  timestamp: string;
}

export default function MeetingAssistant({ brains, activeBrainId, setActiveBrainId }: MeetingAssistantProps) {
  const [isMeetingActive, setIsMeetingActive] = useState<boolean>(false);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [interimText, setInterimText] = useState<string>('');
  const [hints, setHints] = useState<string>('');
  
  // AI Suggestions
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Audio wave animation simulation
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const audioIntervalRef = useRef<any>(null);

  // Speech Recognition variables
  const recognitionRef = useRef<any>(null);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);

  // Meeting duration
  const [duration, setDuration] = useState<number>(0);
  const timerRef = useRef<any>(null);

  // Summary state
  const [summaryData, setSummaryData] = useState<any>(null);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const downloadTranscript = () => {
    if (transcript.length === 0) return;
    const content = transcript
      .map(t => `[${t.timestamp}] ${t.speaker}: ${t.text}${t.translation ? `\nTranslation: ${t.translation}` : ''}`)
      .join('\n\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Meeting_Transcript_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadSummaryMarkdown = () => {
    if (!summaryData) return;
    const content = `# Meeting Summary Report - ${activeBrainObj?.name || 'Client'}
Date: ${new Date().toLocaleDateString()}

## Outcomes Summary
${summaryData.summary}

## Action Items
${summaryData.actionItems.map((item: string) => `- [ ] ${item}`).join('\n')}

## Key Decisions
${summaryData.decisions.map((dec: string) => `- ${dec}`).join('\n')}
`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Meeting_Summary_${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getKeywordTags = () => {
    const buyerLines = transcript.filter(t => t.role === 'buyer');
    if (buyerLines.length === 0) return [];
    
    const allWords = buyerLines
      .map(t => t.text)
      .join(' ')
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
      .split(/\s+/);
      
    const stopWords = new Set(['I', 'We', 'They', 'He', 'She', 'The', 'And', 'But', 'Or', 'This', 'That', 'These', 'Those', 'Is', 'Are', 'Was', 'Were', 'Have', 'Has', 'Had', 'To', 'Of', 'In', 'On', 'For', 'With', 'About', 'By', 'At', 'Can', 'You', 'What', 'How', 'Why']);
    
    const keywords = allWords.filter(word => {
      if (word.length < 3) return false;
      if (word[0] !== word[0].toUpperCase()) return false;
      if (stopWords.has(word)) return false;
      return true;
    });

    return Array.from(new Set(keywords)).slice(0, 8);
  };

  useEffect(() => {
    // 1. Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US'; // Capture English meetings

    rec.onresult = async (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      setInterimText(interimTranscript);

      if (finalTranscript.trim() !== '') {
        handleFinalizedSpeech('user', 'Me', finalTranscript);
      }
    };

    rec.onerror = (err: any) => {
      console.error('[Speech Error]', err);
    };

    rec.onend = () => {
      // Auto-restart if meeting is still active and not muted
      if (isMeetingActive && !isMicMuted) {
        try { rec.start(); } catch {}
      }
    };

    recognitionRef.current = rec;

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, [isMeetingActive, isMicMuted]);

  // Scroll transcript to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, interimText]);

  // Audio level animation
  useEffect(() => {
    if (isMeetingActive && !isMicMuted) {
      audioIntervalRef.current = setInterval(() => {
        setAudioLevel(Math.floor(Math.random() * 80) + 10);
      }, 100);
    } else {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      setAudioLevel(0);
    }
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, [isMeetingActive, isMicMuted]);

  const startMeeting = () => {
    setIsMeetingActive(true);
    setTranscript([]);
    setInterimText('');
    setSuggestions([]);
    setSummaryData(null);
    setDuration(0);

    // Start clock timer
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    // Start recognition
    if (recognitionRef.current && !isMicMuted) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Recognition start error:', e);
      }
    }
  };

  const stopMeeting = async () => {
    setIsMeetingActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    // Trigger meeting summarization
    if (transcript.length > 0) {
      setIsSummarizing(true);
      try {
        const fullTxt = transcript
          .map(t => `${t.speaker}: ${t.text}`)
          .join('\n');

        const summary = await window.api.ai.summarizeMeeting(fullTxt);
        setSummaryData(summary);

        // Save meeting to disk
        const currentBrainObj = brains.find(b => b.id === activeBrainId);
        const record = {
          id: 'meet_' + Date.now(),
          brainId: activeBrainId,
          brainName: currentBrainObj ? currentBrainObj.name : 'Unassigned',
          title: `Meeting on ${new Date().toLocaleDateString()} - ${currentBrainObj?.name || 'Copilot'}`,
          date: new Date().toISOString(),
          duration: duration,
          transcript: transcript.map(t => ({
            role: t.role,
            text: t.text,
            translation: t.translation,
            timestamp: t.timestamp
          })),
          summary: summary.summary,
          actionItems: summary.actionItems,
          decisions: summary.decisions
        };
        await window.api.meetings.save(record);
      } catch (err) {
        console.error('Failed to summarize meeting:', err);
      } finally {
        setIsSummarizing(false);
      }
    }
  };

  const toggleMic = () => {
    setIsMicMuted(!isMicMuted);
    if (recognitionRef.current) {
      if (!isMicMuted) {
        recognitionRef.current.stop();
      } else {
        if (isMeetingActive) {
          try { recognitionRef.current.start(); } catch {}
        }
      }
    }
  };

  /**
   * Translates text and pushes finalized transcripts.
   */
  const handleFinalizedSpeech = async (role: 'buyer' | 'user', speaker: string, text: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const id = 'line_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Add text immediately without translation first
    const newLine: TranscriptLine = { id, role, speaker, text, timestamp };
    setTranscript(prev => [...prev, newLine]);

    // Fetch target language setting
    let targetLanguage = 'hi';
    try {
      const settings = await window.api.settings.get();
      targetLanguage = settings.targetLanguage || 'hi';
    } catch {}

    // Translate asynchronously
    try {
      const translation = await window.api.ai.translate(text, targetLanguage);
      setTranscript(prev => 
        prev.map(line => line.id === id ? { ...line, translation } : line)
      );
    } catch (err) {
      console.error('Translation failed:', err);
    }

    // Refresh reply suggestions immediately
    triggerSuggestionsUpdate([...transcript, newLine]);
  };

  /**
   * Hits the RAG vector store and AI suggested reply endpoint
   */
  const triggerSuggestionsUpdate = async (currentTranscript: TranscriptLine[]) => {
    setIsSuggesting(true);
    try {
      const snippet = currentTranscript
        .slice(-4)
        .map(t => `${t.speaker}: ${t.text}`)
        .join('\n');

      // 1. Perform RAG Vector Search in selected Client Brain
      let vectorContext = '';
      if (activeBrainId) {
        vectorContext = await window.api.brains.search(activeBrainId, snippet + ' ' + hints);
      }

      // 2. Fetch reply suggestions from AI
      const suggestedOptions = await window.api.ai.suggestReplies(snippet, vectorContext, hints);
      setSuggestions(suggestedOptions);
    } catch (err) {
      console.error('Suggestions generation failed:', err);
    } finally {
      setIsSuggesting(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Mock buyer questions simulation for demoing
  const simulateBuyerQuestion = () => {
    if (!isMeetingActive) {
      startMeeting();
    }
    const questions = [
      "Can you finish the website redesign by Friday?",
      "Can you deliver it in 3 days? What is the budget?",
      "Do we need a dedicated server for this AI automation or will a basic hosting work?",
      "How do we handle the Google AdSense integration? Have you done this on WordPress before?"
    ];
    const randomQ = questions[Math.floor(Math.random() * questions.length)];
    
    // Simulate Buyer text appearing
    setTimeout(() => {
      handleFinalizedSpeech('buyer', 'Buyer', randomQ);
    }, 400);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const activeBrainObj = brains.find(b => b.id === activeBrainId);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-6">
      {/* Top action header bar */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white font-display flex items-center gap-2">
            Meeting AI Assistant
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          </h2>
          <p className="text-xs text-zinc-500">Real-time transcription, dual captions, client brain integration</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Client Brain Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">Active Brain</span>
            <select
              value={activeBrainId}
              onChange={(e) => setActiveBrainId(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
              disabled={isMeetingActive}
            >
              {brains.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
              {brains.length === 0 && <option value="">No Brains Configured</option>}
            </select>
          </div>

          {/* Simulate Client button */}
          <button
            onClick={simulateBuyerQuestion}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            Simulate Buyer Question
          </button>
        </div>
      </header>

      {/* Main split dashboard panels */}
      <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
        
        {/* Left Side: Real-time Transcript & Dual Captions */}
        <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-zinc-800/60 bg-zinc-900/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-zinc-500" />
              <span className="text-xs font-semibold text-zinc-300">Live Transcript & Captions</span>
            </div>

            {isMeetingActive && (
              <div className="flex items-center gap-3">
                {/* Audio visualizer simulation */}
                <div className="flex items-end gap-[2px] h-3.5 w-12">
                  <div className="w-[3px] bg-indigo-500 rounded-full transition-all" style={{ height: `${audioLevel * 0.8}%` }} />
                  <div className="w-[3px] bg-indigo-400 rounded-full transition-all" style={{ height: `${audioLevel * 0.4}%` }} />
                  <div className="w-[3px] bg-indigo-500 rounded-full transition-all" style={{ height: `${audioLevel * 0.9}%` }} />
                  <div className="w-[3px] bg-indigo-600 rounded-full transition-all" style={{ height: `${audioLevel * 0.5}%` }} />
                </div>
                
                <span className="text-xs font-mono text-zinc-400">{formatTime(duration)}</span>
              </div>
            )}
          </div>

          {/* Transcript Scroll Area */}
          <div 
            ref={scrollRef}
            className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 min-h-0 bg-zinc-950/20"
          >
            {transcript.length === 0 && !interimText && (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
                <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500">
                  <MicOff className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-400">Assistant Idle</h3>
                <p className="text-xs text-zinc-650 max-w-[280px]">
                  Click "Start Meeting" and speak. If you don't have a mic, click "Simulate Buyer Question" above to see the copilot in action!
                </p>
              </div>
            )}

            {/* Render completed transcript rows */}
            {transcript.map((line) => (
              <div 
                key={line.id} 
                className={`flex gap-3 text-xs max-w-[85%] ${
                  line.role === 'buyer' ? 'self-start' : 'self-end flex-row-reverse text-right'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  line.role === 'buyer' ? 'bg-indigo-950/80 text-indigo-400' : 'bg-emerald-950/80 text-emerald-400'
                }`}>
                  {line.role === 'buyer' ? <User className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <span className="font-bold text-zinc-400">{line.speaker}</span>
                    <span>•</span>
                    <span>{line.timestamp}</span>
                  </div>
                  
                  {/* Speech bubble */}
                  <div className={`p-3 rounded-xl border ${
                    line.role === 'buyer' 
                      ? 'bg-zinc-900/60 border-zinc-800 text-zinc-200 rounded-tl-none' 
                      : 'bg-emerald-900/10 border-emerald-900/20 text-emerald-100 rounded-tr-none'
                  }`}>
                    {/* Dual captions: Original Speech */}
                    <p className="font-medium text-xs leading-relaxed">{line.text}</p>
                    
                    {/* Dual captions: Translation */}
                    {line.translation && (
                      <div className="mt-2 pt-2 border-t border-zinc-850 flex items-start gap-1.5 text-zinc-400 text-xs italic">
                        <Globe className="w-3.5 h-3.5 shrink-0 text-zinc-500 mt-[2px]" />
                        <span>{line.translation}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Interim Transcript text (Live feedback) */}
            {interimText && (
              <div className="flex gap-3 text-xs max-w-[85%] self-end flex-row-reverse text-right opacity-60">
                <div className="w-7 h-7 rounded-full bg-emerald-950/80 text-emerald-400 flex items-center justify-center shrink-0">
                  <Mic className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-zinc-500 font-bold">Me (speaking...)</span>
                  <div className="p-3 rounded-xl border bg-emerald-900/5 border-emerald-950/10 text-emerald-200/80 rounded-tr-none font-medium italic">
                    {interimText}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls Footer */}
          <footer className="px-5 py-4 border-t border-zinc-850 bg-zinc-900/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isMeetingActive ? (
                <button
                  onClick={stopMeeting}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-red-650 hover:bg-red-750 text-white shadow-md transition"
                >
                  <Square className="w-3.5 h-3.5" />
                  End & Save Meeting
                </button>
              ) : (
                <button
                  onClick={startMeeting}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold grad-btn text-white shadow-md transition"
                >
                  <Play className="w-3.5 h-3.5" />
                  Start Meeting Assistant
                </button>
              )}

              {isMeetingActive && (
                <button
                  onClick={toggleMic}
                  className={`p-2.5 rounded-lg border transition ${
                    isMicMuted 
                      ? 'bg-red-950/30 border-red-900/40 text-red-400 hover:bg-red-950/50' 
                      : 'bg-zinc-850 border-zinc-750 text-zinc-400 hover:text-zinc-200'
                  }`}
                  title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
                >
                  {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}
            </div>

            <div className="text-[10px] text-zinc-600 flex items-center gap-1.5">
              {!speechSupported && (
                <span className="text-yellow-500">Web Speech API not supported in this environment</span>
              )}
              {speechSupported && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Speech Recognizer Ready</span>
                </>
              )}
            </div>
          </footer>
        </div>

        {/* Right Side: AI Reply Suggestions & Brain Context */}
        <div className="w-[380px] flex flex-col gap-6 shrink-0 min-h-0">
          
          {/* Suggested Replies Panel */}
          <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-zinc-800/60 bg-zinc-900/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold text-zinc-300">Contextual AI Suggestions</span>
              </div>
              
              {isSuggesting && (
                <RotateCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
              )}
            </div>

            {/* Suggestions cards list */}
            <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 bg-zinc-950/20">
              {suggestions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-zinc-900/80 flex items-center justify-center text-indigo-400/60">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-semibold text-zinc-400">Suggestions Waiting</h4>
                  <p className="text-[10px] text-zinc-650 max-w-[200px]">
                    Once transcript lines start compiling, AI will generate replies contextually from "{activeBrainObj?.name || 'Client'}" brain.
                  </p>
                </div>
              ) : (
                suggestions.map((option, idx) => (
                  <div 
                    key={idx}
                    className="glass-card rounded-xl p-4 border border-zinc-800/50 flex flex-col gap-3 relative hover:border-zinc-700/60"
                  >
                    {/* Header bar of suggestion card */}
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-wider font-semibold text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/30">
                        Option {idx + 1}
                      </span>
                      <button
                        onClick={() => copyToClipboard(option, idx)}
                        className="text-zinc-500 hover:text-zinc-300 p-1 hover:bg-zinc-800 rounded transition"
                        title="Copy suggestion"
                      >
                        {copiedIndex === idx ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Clipboard className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed font-medium">"{option}"</p>
                  </div>
                ))
              )}
            </div>

            {/* Steering Hint Bar */}
            <div className="p-4 border-t border-zinc-850 bg-zinc-900/40 flex flex-col gap-2">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Keyboard className="w-3 h-3 text-zinc-600" />
                Steering Hint Words
              </label>

              {transcript.length > 0 && getKeywordTags().length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-1" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                  {getKeywordTags().map((tag, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const newHints = hints ? `${hints}, ${tag}` : tag;
                        setHints(newHints);
                      }}
                      className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-indigo-400 transition"
                      style={{ cursor: 'pointer', padding: '2px 6px', border: '1px solid #27272a', borderRadius: '4px', fontSize: '10px', backgroundColor: '#09090b', color: '#a1a1aa' }}
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Mention WordPress, Fiverr delivery..."
                  value={hints}
                  onChange={(e) => setHints(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      triggerSuggestionsUpdate(transcript);
                    }
                  }}
                  className="flex-1 bg-zinc-950 border border-zinc-800 text-xs rounded-lg px-3 py-2 text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => triggerSuggestionsUpdate(transcript)}
                  disabled={isSuggesting}
                  className="px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 border border-zinc-700/30 transition disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary report overlay card when meeting concludes */}
      {summaryData && (
        <div className="glass-card rounded-2xl border border-indigo-900/40 p-5 bg-zinc-950/65 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white font-display">Meeting Concluded - AI Summary Report</h3>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={downloadTranscript}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition"
                style={{ cursor: 'pointer', padding: '6px 12px', border: '1px solid #27272a', borderRadius: '8px', backgroundColor: '#18181b', color: '#d4d4d8' }}
              >
                Export Transcript (.txt)
              </button>
              <button 
                onClick={downloadSummaryMarkdown}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold grad-btn text-white transition"
                style={{ cursor: 'pointer', padding: '6px 12px', borderRadius: '8px', color: '#ffffff' }}
              >
                Export Report (.md)
              </button>
              <button 
                onClick={() => setSummaryData(null)}
                className="text-xs text-zinc-550 hover:text-zinc-300 ml-2"
                style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#71717a' }}
              >
                Dismiss
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row">
            {/* Quick summary paragraph */}
            <div className="flex-1 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Outcomes Summary</span>
              <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/30 p-3 rounded-xl border border-zinc-850">
                {summaryData.summary}
              </p>
            </div>

            {/* Action items list */}
            <div className="w-[280px] shrink-0 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Action Items</span>
              <ul className="text-xs text-zinc-300 flex flex-col gap-1.5 bg-zinc-900/30 p-3 rounded-xl border border-zinc-850">
                {summaryData.actionItems.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
                {summaryData.actionItems.length === 0 && <span className="text-zinc-600">No action items detected.</span>}
              </ul>
            </div>

            {/* Decisions list */}
            <div className="w-[240px] shrink-0 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Key Decisions</span>
              <ul className="text-xs text-zinc-300 flex flex-col gap-1.5 bg-zinc-900/30 p-3 rounded-xl border border-zinc-850">
                {summaryData.decisions.map((dec: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span>{dec}</span>
                  </li>
                ))}
                {summaryData.decisions.length === 0 && <span className="text-zinc-600">No major decisions logged.</span>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {isSummarizing && (
        <div className="glass-card rounded-2xl border border-indigo-900/30 p-5 bg-zinc-950/60 flex items-center justify-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-zinc-400">Analyzing transcript to generate Summary and Action Items...</span>
        </div>
      )}
    </div>
  );
}
