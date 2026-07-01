import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Square, Mic, MicOff, Sparkles, Globe, ArrowRight,
  Clipboard, Check, Plus, Volume2, X, Zap, Languages,
  ChevronRight, User, Bot, Loader2, Send, RefreshCw,
  Download, ChevronDown, MessageSquare, Lightbulb,
  Keyboard, Copy, Hash, Clock, TrendingUp
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
  isTranslating?: boolean;
}

// ── Helpers ──
const fmtTime = (secs: number) => {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return m + ':' + s;
};
const uid = () => 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

// ── Quick Reply Phrases (categorized) ──
const QUICK_PHRASES: { cat: string; phrases: string[] }[] = [
  { cat: 'Common', phrases: [
    'Sure, I can do that!',
    'Let me check and get back to you.',
    'Could you please repeat that?',
    'That sounds great!',
    'I understand, let me explain.',
  ]},
  { cat: 'Pricing', phrases: [
    'Let me share the pricing details.',
    'The cost depends on the scope of work.',
    'I can offer a competitive rate for this.',
    'Shall I send a detailed quote?',
  ]},
  { cat: 'Timeline', phrases: [
    'I can deliver that within a week.',
    'Let me check my schedule and confirm.',
    'We can start right away.',
    'The timeline depends on the requirements.',
  ]},
  { cat: 'Closing', phrases: [
    "Thank you for your time today!",
    "I'll send you the details right after this call.",
    "Looking forward to working with you!",
    "Let me know if you have any other questions.",
  ]},
];

// ── Waveform Bar ──
function LiveBars({ active }: { active: boolean }) {
  const bars = [3, 5, 8, 12, 7, 10, 5, 3, 9, 6, 4, 11, 7, 5, 8];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 18 }}>
      {bars.map((h, i) => (
        <div key={i} style={{
          width: 2.5, borderRadius: 2,
          background: active ? 'rgba(167,139,250,0.8)' : 'rgba(63,63,70,0.5)',
          height: active ? h + 'px' : '3px',
          transition: 'height 0.15s ease',
          animationDelay: (i * 50) + 'ms'
        }} />
      ))}
    </div>
  );
}

// ── Suggestion Card with Keyboard Shortcut ──
function SuggestionCard({ text, index, onCopy, onSpeak, isCopied }: any) {
  return (
    <div
      style={{
        background: 'rgba(14,14,22,0.7)',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 12, padding: '11px 13px',
        display: 'flex', flexDirection: 'column', gap: 8,
        transition: 'border-color 0.2s, background 0.2s, transform 0.15s',
        cursor: 'pointer', position: 'relative'
      }}
      onClick={() => onSpeak(text)}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.45)';
        (e.currentTarget as HTMLElement).style.background = 'rgba(18,18,32,0.9)';
        (e.currentTarget as HTMLElement).style.transform = 'translateX(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.2)';
        (e.currentTarget as HTMLElement).style.background = 'rgba(14,14,22,0.7)';
        (e.currentTarget as HTMLElement).style.transform = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{
          width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
          background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(99,102,241,0.15))',
          border: '1px solid rgba(124,58,237,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.62rem', fontWeight: 800, color: '#a78bfa'
        }}>
          {index + 1}
        </div>
        <p style={{ fontSize: '0.82rem', color: '#e4e4e7', lineHeight: 1.55, margin: 0, flex: 1 }}>{text}</p>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button
          onClick={ev => { ev.stopPropagation(); onCopy(text, index); }}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            background: isCopied ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.12)',
            border: isCopied ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(99,102,241,0.25)',
            borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
            color: isCopied ? '#34d399' : '#a5b4fc',
            fontSize: '0.7rem', fontWeight: 600, transition: 'all 0.2s'
          }}
        >
          {isCopied ? <Check style={{ width: 10, height: 10 }} /> : <Copy style={{ width: 10, height: 10 }} />}
          {isCopied ? 'Copied!' : 'Copy'}
        </button>
        <button
          onClick={ev => { ev.stopPropagation(); onSpeak(text); }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: 8, padding: '5px 12px', cursor: 'pointer', color: '#6ee7b7',
            fontSize: '0.7rem', fontWeight: 600, transition: 'all 0.2s'
          }}
        >
          <Volume2 style={{ width: 10, height: 10 }} /> Speak
        </button>
        <span style={{ fontSize: '0.58rem', color: '#3f3f46', fontFamily: 'monospace', letterSpacing: '0.03em' }}>Ctrl+{index + 1}</span>
      </div>
    </div>
  );
}

// ── Main Component ──
export default function MeetingAssistant({ brains, activeBrainId, setActiveBrainId }: MeetingAssistantProps) {
  // ── Core state ──
  const [isActive, setIsActive] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [interimText, setInterimText] = useState('');
  const [duration, setDuration] = useState(0);

  // ── WebRTC System Audio Loopback ──
  const [audioSource, setAudioSource] = useState<'mic' | 'zoom'>('zoom');
  const loopbackStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const loopbackIntervalRef = useRef<any>(null);

  // ── Translation / suggestions ──
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [lastBuyerText, setLastBuyerText] = useState('');

  // ── Hint box ──
  const [hint, setHint] = useState('');

  // ── Quick phrases ──
  const [activeQuickCat, setActiveQuickCat] = useState('Common');
  const [showQuickPhrases, setShowQuickPhrases] = useState(false);

  // ── Who is speaking ──
  const [speakerMode, setSpeakerMode] = useState<'buyer' | 'me'>('buyer');

  // ── Topic tracker ──
  const [meetingTopic, setMeetingTopic] = useState('');
  const [wordCount, setWordCount] = useState(0);

  // ── Refs ──
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);
  const hintRef = useRef<HTMLTextAreaElement>(null);
  const hintDebounceRef = useRef<any>(null);

  // ── Keyboard shortcuts for suggestions ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        if (suggestions[idx]) {
          navigator.clipboard.writeText(suggestions[idx]).catch(() => {});
          setCopiedIndex(idx);
          setTimeout(() => setCopiedIndex(null), 2000);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [suggestions]);

  // ── Speech recognition init ──
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const shouldRunSR = isActive && !isMicMuted && (speakerMode === 'me' || audioSource === 'mic');
    if (!shouldRunSR) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      return;
    }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = async (event: any) => {
      let finalText = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += t;
        else interim += t;
      }
      setInterimText(interim);
      if (finalText.trim()) {
        addSpeechLine(speakerMode, speakerMode === 'buyer' ? 'Buyer' : 'Me', finalText.trim());
      }
    };

    rec.onerror = () => {};
    rec.onend = () => {
      if (isActive && !isMicMuted && (speakerMode === 'me' || audioSource === 'mic')) {
        try { rec.start(); } catch {}
      }
    };

    try { rec.start(); } catch {}
    recognitionRef.current = rec;

    return () => {
      try { rec.stop(); } catch {}
    };
  }, [isActive, isMicMuted, speakerMode, audioSource]);

  // Helper: Start Zoom Loopback Audio Capture
  const startZoomLoopback = async () => {
    try {
      if (!window.api || !window.api.desktopSources) {
        console.warn("Desktop sources API not available, using default microphone fallback");
        setAudioSource('mic');
        return;
      }

      const sources = await window.api.desktopSources.get();
      const primaryScreen = sources.find((s: any) => s.id.startsWith('screen:'));
      if (!primaryScreen) throw new Error("No system screen source found");

      // Capture desktop audio/video
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: primaryScreen.id
          }
        } as any,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: primaryScreen.id,
            minWidth: 1, maxWidth: 1, minHeight: 1, maxHeight: 1
          }
        } as any
      });

      // Stop video immediately to preserve resources
      stream.getVideoTracks().forEach(t => t.stop());
      loopbackStreamRef.current = stream;

      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) throw new Error("No audio track found in desktop stream");

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;

      let chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        if (chunks.length === 0) return;
        const blob = new Blob(chunks, { type: 'audio/webm' });
        chunks = [];

        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64data = (reader.result as string).split(',')[1];
          if (!base64data) return;

          try {
            let targetLang = 'hi';
            if (window.api) {
              const s = await window.api.settings.get();
              targetLang = s?.targetLanguage || 'hi';
            }
            const res = await window.api.ai.transcribeAndTranslateAudio(base64data, targetLang);
            if (res && res.text.trim()) {
              addSpeechLine('buyer', 'Buyer', res.text.trim());
            }
          } catch (err) {
            console.error("Transcribe/Translate loopback error:", err);
          }
        };
      };

      recorder.start();

      loopbackIntervalRef.current = setInterval(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
          recorder.start();
        }
      }, 3500);

    } catch (err) {
      console.error("Failed to start loopback system audio capture:", err);
      setAudioSource('mic');
    }
  };

  // ── WebRTC Loopback Capture effect ──
  useEffect(() => {
    const shouldCaptureZoom = isActive && speakerMode === 'buyer' && audioSource === 'zoom';

    if (!shouldCaptureZoom) {
      if (loopbackIntervalRef.current) clearInterval(loopbackIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
      if (loopbackStreamRef.current) {
        loopbackStreamRef.current.getTracks().forEach(t => t.stop());
        loopbackStreamRef.current = null;
      }
      return;
    }

    startZoomLoopback();

    return () => {
      if (loopbackIntervalRef.current) clearInterval(loopbackIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
      if (loopbackStreamRef.current) {
        loopbackStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [isActive, speakerMode, audioSource]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [transcript, interimText]);

  // ── Add a line ──
  const addSpeechLine = async (role: 'buyer' | 'user', speaker: string, text: string) => {
    const id = uid();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newLine: TranscriptLine = { id, role, speaker, text, timestamp, isTranslating: role === 'buyer' };
    setTranscript(prev => [...prev, newLine]);

    // Track word count
    setWordCount(c => c + text.split(/\s+/).length);

    if (role === 'buyer') {
      setLastBuyerText(text);
      // Update meeting topic from buyer's speech
      if (text.length > 15) {
        const topicWords = text.split(' ').slice(0, 5).join(' ');
        setMeetingTopic(topicWords + '...');
      }
      // Translate buyer speech
      try {
        let targetLang = 'hi';
        if (window.api) {
          const s = await window.api.settings.get();
          targetLang = s?.targetLanguage || 'hi';
        }
        const translation = window.api
          ? await window.api.ai.translate(text, targetLang)
          : '[API key set karo Settings mein → Translation yahan dikhega]';
        setTranscript(prev => prev.map(l => l.id === id ? { ...l, translation, isTranslating: false } : l));
      } catch {
        setTranscript(prev => prev.map(l => l.id === id ? { ...l, isTranslating: false } : l));
      }
      // Auto-trigger reply suggestions
      await generateSuggestions(text, '');
    }
  };

  // ── Generate AI Suggestions ──
  const generateSuggestions = useCallback(async (buyerText: string, hintText: string) => {
    setIsSuggesting(true);
    setSuggestions([]);
    try {
      const recentCtx = transcript.slice(-4).map(t => t.speaker + ': ' + t.text).join('\n');
      let vectorCtx = '';
      if (activeBrainId && window.api) {
        vectorCtx = await window.api.brains.search(activeBrainId, buyerText + ' ' + hintText);
      }
      const result = window.api
        ? await window.api.ai.suggestReplies(recentCtx + '\nBuyer: ' + buyerText, vectorCtx, hintText)
        : [
            'Yes, I can definitely help with that!',
            'Of course, let me work on that for you.',
            'Great question! I can handle that within your timeline.',
            'Sure! Let me share the details with you.',
            'Absolutely, I have extensive experience with this.'
          ];
      setSuggestions(result || []);
    } catch {
      setSuggestions([
        'Yes, I can do that!',
        'Sure, let me help you with that.',
        'Of course, no problem at all!',
        'Absolutely, I can handle that.',
        'Let me look into that for you.'
      ]);
    } finally {
      setIsSuggesting(false);
    }
  }, [transcript, activeBrainId]);

  // ── Hint Debounce (instant suggestions as you type) ──
  const handleHintChange = (value: string) => {
    setHint(value);
    if (hintDebounceRef.current) clearTimeout(hintDebounceRef.current);
    if (value.trim().length > 3) {
      hintDebounceRef.current = setTimeout(() => {
        generateSuggestions(lastBuyerText || '', value.trim());
      }, 800);
    }
  };

  const handleHintSubmit = async () => {
    if (!hint.trim()) return;
    const h = hint.trim();
    setHint('');
    if (hintDebounceRef.current) clearTimeout(hintDebounceRef.current);
    await generateSuggestions(lastBuyerText || '', h);
  };

  // ── Start / Stop ──
  const startMeeting = () => {
    setIsActive(true);
    setTranscript([]);
    setInterimText('');
    setSuggestions([]);
    setLastBuyerText('');
    setDuration(0);
    setWordCount(0);
    setMeetingTopic('');
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    if (audioSource === 'mic' && recognitionRef.current && !isMicMuted) {
      try { recognitionRef.current.start(); } catch {}
    }
  };

  const stopMeeting = () => {
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (recognitionRef.current) try { recognitionRef.current.stop(); } catch {}
    
    // Stop loopback capture
    if (loopbackIntervalRef.current) clearInterval(loopbackIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    if (loopbackStreamRef.current) {
      loopbackStreamRef.current.getTracks().forEach(t => t.stop());
      loopbackStreamRef.current = null;
    }
    setInterimText('');
  };

  const toggleMic = () => {
    const next = !isMicMuted;
    setIsMicMuted(next);
    if (recognitionRef.current) {
      if (next) try { recognitionRef.current.stop(); } catch {}
      else if (isActive) try { recognitionRef.current.start(); } catch {}
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const speakText = (text: string) => {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-US';
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || voices.find(v => v.lang.startsWith('en'));
    if (v) utt.voice = v;
    utt.rate = 0.92;
    window.speechSynthesis.speak(utt);
  };

  const speakQuickPhrase = (text: string) => {
    speakText(text);
    navigator.clipboard.writeText(text).catch(() => {});
  };

  // Simulate demo buyer
  const simulateBuyer = () => {
    if (!isActive) startMeeting();
    const qs = [
      "Can you finish the website redesign by Friday?",
      "What's your rate for a full e-commerce store?",
      "Do you have experience with WordPress and WooCommerce?",
      "How long will the SEO optimization take to show results?",
      "Can you also handle the mobile version of the app?"
    ];
    setTimeout(() => {
      addSpeechLine('buyer', 'Buyer', qs[Math.floor(Math.random() * qs.length)]);
    }, 400);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '16px 20px', gap: 12, boxSizing: 'border-box' }}>

      {/* ── Header Bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: isActive ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isActive ? '0 0 18px rgba(239,68,68,0.45)' : '0 0 18px rgba(124,58,237,0.45)',
            transition: 'all 0.3s ease'
          }}>
            <Mic style={{ width: 15, height: 15, color: '#fff' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#f4f4f5', margin: 0, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 8 }}>
              Meeting AI Copilot
              {isActive && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.6rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171', borderRadius: 999, padding: '2px 8px', fontWeight: 700, letterSpacing: '0.08em', animation: 'pulse 2s infinite' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                  LIVE · {fmtTime(duration)}
                </span>
              )}
            </h2>
            <p style={{ fontSize: '0.68rem', color: '#52525b', margin: '2px 0 0 0' }}>
              {isActive
                ? (meetingTopic ? 'Topic: ' + meetingTopic + ' · ' : '') + wordCount + ' words captured'
                : 'Real-time English→Hindi · AI Reply Suggestions · Voice-assisted'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {brains.length > 0 && (
            <select
              value={activeBrainId}
              onChange={e => setActiveBrainId(e.target.value)}
              disabled={isActive}
              style={{ background: 'rgba(9,9,11,0.9)', border: '1px solid rgba(63,63,70,0.7)', color: '#d4d4d8', fontSize: '0.72rem', borderRadius: 8, padding: '5px 8px', outline: 'none', cursor: 'pointer', maxWidth: 130 }}
            >
              {brains.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          <div style={{ display: 'flex', background: 'rgba(9,9,11,0.9)', border: '1px solid rgba(63,63,70,0.7)', borderRadius: 8, padding: 2, marginRight: 2 }}>
            <button
              onClick={() => setAudioSource('mic')}
              disabled={isActive}
              style={{
                padding: '4px 8px',
                borderRadius: 5,
                border: 'none',
                background: audioSource === 'mic' ? 'rgba(99,102,241,0.2)' : 'transparent',
                color: audioSource === 'mic' ? '#a5b4fc' : '#71717a',
                fontSize: '0.68rem',
                fontWeight: 600,
                cursor: isActive ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
              title="Mic select karein physically bolne ke liye"
            >
              🎤 Mic
            </button>
            <button
              onClick={() => setAudioSource('zoom')}
              disabled={isActive}
              style={{
                padding: '4px 8px',
                borderRadius: 5,
                border: 'none',
                background: audioSource === 'zoom' ? 'rgba(99,102,241,0.2)' : 'transparent',
                color: audioSource === 'zoom' ? '#a5b4fc' : '#71717a',
                fontSize: '0.68rem',
                fontWeight: 600,
                cursor: isActive ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
              title="Zoom select karein buyer ki digital voice direct capture karne ke liye"
            >
              💻 Zoom Audio
            </button>
          </div>
          <button onClick={simulateBuyer} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', color: '#a5b4fc', fontSize: '0.72rem', fontWeight: 600 }}>
            <Zap style={{ width: 12, height: 12 }} /> Demo
          </button>

          {!isActive ? (
            <button onClick={startMeeting} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 0 18px rgba(124,58,237,0.4)', border: 'none', borderRadius: 10, padding: '7px 16px', cursor: 'pointer', color: '#fff', fontSize: '0.78rem', fontWeight: 700 }}>
              <Play style={{ width: 13, height: 13 }} /> Start Meeting
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 5 }}>
              <button onClick={toggleMic} style={{ display: 'flex', alignItems: 'center', gap: 4, background: isMicMuted ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.12)', border: isMicMuted ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(99,102,241,0.25)', borderRadius: 9, padding: '6px 10px', cursor: 'pointer', color: isMicMuted ? '#f87171' : '#a5b4fc', fontSize: '0.72rem', fontWeight: 600 }}>
                {isMicMuted ? <MicOff style={{ width: 12, height: 12 }} /> : <Mic style={{ width: 12, height: 12 }} />}
                {isMicMuted ? 'Unmute' : 'Mute'}
              </button>
              <button onClick={stopMeeting} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 9, padding: '6px 12px', cursor: 'pointer', color: '#f87171', fontSize: '0.72rem', fontWeight: 700 }}>
                <Square style={{ width: 12, height: 12 }} /> End
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── SPEAKER MODE TOGGLE ── */}
      {isActive && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, background: 'rgba(9,9,11,0.6)', border: '1px solid rgba(63,63,70,0.5)', borderRadius: 10, padding: '6px 10px' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Listening:</span>
          {(['buyer', 'me'] as const).map(mode => (
            <button key={mode} onClick={() => setSpeakerMode(mode)} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: '0.72rem', transition: 'all 0.2s',
              background: speakerMode === mode ? (mode === 'buyer' ? 'rgba(99,102,241,0.2)' : 'rgba(16,185,129,0.15)') : 'transparent',
              border: speakerMode === mode ? (mode === 'buyer' ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(16,185,129,0.3)') : '1px solid transparent',
              color: speakerMode === mode ? (mode === 'buyer' ? '#a5b4fc' : '#6ee7b7') : '#52525b'
            }}>
              {mode === 'buyer' ? <Globe style={{ width: 12, height: 12 }} /> : <Mic style={{ width: 12, height: 12 }} />}
              {mode === 'buyer' ? 'Buyer (English→Hindi)' : 'Me (Reply mode)'}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <LiveBars active={isActive && !isMicMuted} />
            <span style={{ fontSize: '0.62rem', color: '#3f3f46' }}>
              {isActive && !isMicMuted ? (speakerMode === 'buyer' ? 'Buyer voice capturing...' : 'Listening your reply...') : 'Muted'}
            </span>
          </div>
        </div>
      )}

      {/* ── Main 2-panel layout ── */}
      <div style={{ flex: 1, display: 'flex', gap: 12, overflow: 'hidden', minHeight: 0 }}>

        {/* ── LEFT: Transcript + Translation ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(9,9,11,0.6)', border: '1px solid rgba(63,63,70,0.5)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', borderBottom: '1px solid rgba(63,63,70,0.4)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Languages style={{ width: 13, height: 13, color: '#a78bfa' }} />
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#d4d4d8' }}>Live Transcript & Translation</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.62rem', color: '#52525b', fontFamily: 'monospace' }}>EN → HI</span>
              {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981', animation: 'pulse 2s infinite' }} />}
            </div>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {transcript.length === 0 && !isActive && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 28 }}>
                <div style={{ width: 48, height: 48, borderRadius: 13, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mic style={{ width: 20, height: 20, color: '#6366f1' }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#71717a', marginBottom: 6 }}>Zoom Meeting ke liye Ready!</div>
                  <div style={{ fontSize: '0.7rem', color: '#3f3f46', lineHeight: 1.7 }}>
                    <strong style={{ color: '#a5b4fc' }}>Start Meeting</strong> dabao, phir Zoom chalao.<br/>
                    Buyer ki English speech → Hindi mein translate hogi live.<br/>
                    AI automatically reply suggest karega English mein.<br/>
                    <span style={{ color: '#52525b' }}>Ctrl+1/2/3/4/5 se suggestion turant copy karo!</span>
                  </div>
                </div>
                <button onClick={simulateBuyer} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', color: '#a5b4fc', fontSize: '0.73rem', fontWeight: 600, marginTop: 4 }}>
                  <Zap style={{ width: 12, height: 12 }} /> Try Demo — Buyer Simulate karo
                </button>
              </div>
            )}

            {transcript.length === 0 && isActive && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 28 }}>
                <LiveBars active={true} />
                <div style={{ fontSize: '0.76rem', color: '#52525b', textAlign: 'center' }}>
                  {speakerMode === 'buyer' ? 'Buyer ki voice sun raha hai...' : 'Aapki reply sun raha hai...'}
                  <br/><span style={{ fontSize: '0.66rem', color: '#3f3f46' }}>Mic ke paas clearly bolo</span>
                </div>
              </div>
            )}

            {transcript.map((line) => (
              <div key={line.id} style={{
                display: 'flex', flexDirection: 'column', gap: 5,
                alignSelf: line.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '88%',
                animation: 'slideUp 0.25s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: line.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ width: 15, height: 15, borderRadius: '50%', background: line.role === 'buyer' ? 'rgba(99,102,241,0.3)' : 'rgba(16,185,129,0.25)', border: line.role === 'buyer' ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {line.role === 'buyer' ? <Globe style={{ width: 7, height: 7, color: '#818cf8' }} /> : <User style={{ width: 7, height: 7, color: '#6ee7b7' }} />}
                  </div>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: line.role === 'buyer' ? '#818cf8' : '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{line.speaker}</span>
                  <span style={{ fontSize: '0.58rem', color: '#3f3f46' }}>{line.timestamp}</span>
                </div>
                <div style={{
                  background: line.role === 'buyer' ? 'rgba(18,18,32,0.8)' : 'rgba(16,185,129,0.08)',
                  border: line.role === 'buyer' ? '1px solid rgba(99,102,241,0.18)' : '1px solid rgba(16,185,129,0.2)',
                  borderRadius: line.role === 'user' ? '13px 4px 13px 13px' : '4px 13px 13px 13px',
                  padding: '9px 13px', display: 'flex', flexDirection: 'column', gap: 7
                }}>
                  <p style={{ fontSize: '0.82rem', color: '#e4e4e7', margin: 0, lineHeight: 1.5 }}>{line.text}</p>
                  {line.role === 'buyer' && (
                    <div style={{ borderTop: '1px solid rgba(99,102,241,0.12)', paddingTop: 6 }}>
                      {line.isTranslating ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Loader2 style={{ width: 11, height: 11, color: '#6366f1', animation: 'spin 0.8s linear infinite' }} />
                          <span style={{ fontSize: '0.66rem', color: '#52525b' }}>Hindi mein translate ho raha hai...</span>
                        </div>
                      ) : line.translation ? (
                        <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                          <div style={{ background: 'rgba(99,102,241,0.15)', borderRadius: 4, padding: '1px 5px', fontSize: '0.54rem', fontWeight: 700, color: '#818cf8', letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0, marginTop: 2 }}>HI</div>
                          <p style={{ fontSize: '0.79rem', color: '#a5b4fc', margin: 0, lineHeight: 1.55, fontFamily: "'Noto Sans Devanagari', 'Mangal', sans-serif" }}>{line.translation}</p>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {interimText && (
              <div style={{ alignSelf: speakerMode === 'me' ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
                <div style={{ background: 'rgba(18,18,28,0.6)', border: '1px dashed rgba(63,63,70,0.5)', borderRadius: 11, padding: '7px 13px' }}>
                  <p style={{ fontSize: '0.78rem', color: '#52525b', margin: 0, fontStyle: 'italic' }}>{interimText}...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: AI Suggestions + Hint + Quick Phrases ── */}
        <div style={{ width: 310, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* ── Quick Phrase Bar ── */}
          <div style={{ background: 'rgba(9,9,11,0.7)', border: '1px solid rgba(63,63,70,0.5)', borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
            <button
              onClick={() => setShowQuickPhrases(!showQuickPhrases)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', color: '#d4d4d8' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap style={{ width: 12, height: 12, color: '#fbbf24' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Quick Phrases</span>
                <span style={{ fontSize: '0.58rem', color: '#52525b' }}>Click to speak instantly</span>
              </div>
              <ChevronDown style={{ width: 12, height: 12, color: '#52525b', transition: 'transform 0.2s', transform: showQuickPhrases ? 'rotate(180deg)' : 'none' }} />
            </button>
            {showQuickPhrases && (
              <div style={{ padding: '0 10px 10px', animation: 'slideUp 0.2s ease' }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
                  {QUICK_PHRASES.map(qp => (
                    <button key={qp.cat} onClick={() => setActiveQuickCat(qp.cat)} style={{
                      padding: '3px 8px', borderRadius: 5, fontSize: '0.6rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                      background: activeQuickCat === qp.cat ? 'rgba(124,58,237,0.2)' : 'transparent',
                      border: activeQuickCat === qp.cat ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(63,63,70,0.4)',
                      color: activeQuickCat === qp.cat ? '#a78bfa' : '#52525b'
                    }}>{qp.cat}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {QUICK_PHRASES.find(q => q.cat === activeQuickCat)?.phrases.map((ph, i) => (
                    <button key={i} onClick={() => speakQuickPhrase(ph)} style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 9px', borderRadius: 7,
                      background: 'rgba(14,14,22,0.6)', border: '1px solid rgba(63,63,70,0.4)',
                      cursor: 'pointer', color: '#d4d4d8', fontSize: '0.72rem', textAlign: 'left',
                      transition: 'all 0.15s', width: '100%'
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.4)'; (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.08)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(63,63,70,0.4)'; (e.currentTarget as HTMLElement).style.background = 'rgba(14,14,22,0.6)'; }}
                    >
                      <Volume2 style={{ width: 10, height: 10, color: '#6ee7b7', flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>{ph}</span>
                      <Copy style={{ width: 9, height: 9, color: '#3f3f46', flexShrink: 0 }} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Hint Box ── */}
          <div style={{ background: 'rgba(9,9,11,0.7)', border: '1px solid rgba(63,63,70,0.5)', borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,63,70,0.35)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lightbulb style={{ width: 12, height: 12, color: '#fbbf24' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#d4d4d8' }}>Hint Box</span>
              <span style={{ fontSize: '0.58rem', color: '#52525b' }}>Hindi/English/Hinglish — instant suggest</span>
            </div>
            <div style={{ padding: '8px 10px', display: 'flex', gap: 6 }}>
              <textarea
                ref={hintRef}
                value={hint}
                onChange={e => handleHintChange(e.target.value)}
                placeholder={"Hint do... jaise: 'haan 3 din mein ho jayega' ya 'price 500 dollar hai'"}
                rows={2}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleHintSubmit(); } }}
                style={{
                  flex: 1, background: 'rgba(9,9,11,0.8)', border: '1px solid rgba(63,63,70,0.6)',
                  borderRadius: 8, padding: '7px 9px', fontSize: '0.73rem', color: '#e4e4e7',
                  resize: 'none', outline: 'none', lineHeight: 1.4,
                  fontFamily: 'inherit', boxSizing: 'border-box'
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.5)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(63,63,70,0.6)'; }}
              />
              <button
                onClick={handleHintSubmit}
                disabled={!hint.trim()}
                style={{
                  width: 34, height: 34, alignSelf: 'flex-end', borderRadius: 8, border: 'none',
                  background: hint.trim() ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(63,63,70,0.3)',
                  cursor: hint.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, boxShadow: hint.trim() ? '0 0 10px rgba(124,58,237,0.4)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <Send style={{ width: 13, height: 13, color: hint.trim() ? '#fff' : '#52525b' }} />
              </button>
            </div>
          </div>

          {/* ── AI Suggestions Panel ── */}
          <div style={{ flex: 1, background: 'rgba(9,9,11,0.7)', border: '1px solid rgba(63,63,70,0.5)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(63,63,70,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles style={{ width: 12, height: 12, color: '#a78bfa' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#d4d4d8' }}>AI Reply Suggestions</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.56rem', color: '#3f3f46', fontFamily: 'monospace' }}>Ctrl+1-5 to copy</span>
                {lastBuyerText && (
                  <button onClick={() => generateSuggestions(lastBuyerText, '')} disabled={isSuggesting} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.62rem', padding: '2px 4px' }} title="Refresh suggestions">
                    <RefreshCw style={{ width: 10, height: 10, animation: isSuggesting ? 'spin 0.8s linear infinite' : 'none' }} />
                  </button>
                )}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {isSuggesting && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16 }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#7c3aed', animation: 'pulse 1.2s ease-in-out ' + (i * 0.15) + 's infinite' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#52525b' }}>AI reply generate kar raha hai...</span>
                </div>
              )}

              {!isSuggesting && suggestions.length === 0 && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageSquare style={{ width: 16, height: 16, color: '#4f46e5' }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: '#52525b', lineHeight: 1.6 }}>
                      Jab buyer bolega, AI automatically<br/>professional English reply suggest karega
                    </div>
                    <div style={{ fontSize: '0.64rem', color: '#3f3f46', marginTop: 4 }}>
                      Ya Hint Box mein apna idea likho (Hindi/English)
                    </div>
                  </div>
                </div>
              )}

              {!isSuggesting && suggestions.map((s, i) => (
                <SuggestionCard key={i} text={s} index={i} isCopied={copiedIndex === i} onCopy={copyToClipboard} onSpeak={speakText} />
              ))}
            </div>
          </div>

          {/* ── Shortcut Helper (tiny footer) ── */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '4px 0' }}>
            <span style={{ fontSize: '0.56rem', color: '#27272a', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Keyboard style={{ width: 9, height: 9 }} /> Ctrl+1-5 copy
            </span>
            <span style={{ fontSize: '0.56rem', color: '#27272a' }}>·</span>
            <span style={{ fontSize: '0.56rem', color: '#27272a', display: 'flex', alignItems: 'center', gap: 3 }}>
              Click card = speak
            </span>
            <span style={{ fontSize: '0.56rem', color: '#27272a' }}>·</span>
            <span style={{ fontSize: '0.56rem', color: '#27272a', display: 'flex', alignItems: 'center', gap: 3 }}>
              Enter = send hint
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
