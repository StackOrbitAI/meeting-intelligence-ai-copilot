import React, { useState } from 'react';
import { 
  FolderPlus, 
  Upload, 
  FileText, 
  Trash2, 
  CheckCircle, 
  Database,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  Search,
  Sparkles,
  HelpCircle
} from 'lucide-react';

interface BrainsManagerProps {
  brains: any[];
  onRefresh: () => void;
}

export default function BrainsManager({ brains, onRefresh }: BrainsManagerProps) {
  const [selectedBrainId, setSelectedBrainId] = useState<string>(brains[0]?.id || '');
  const [newBrainName, setNewBrainName] = useState<string>('');
  const [newBrainDesc, setNewBrainDesc] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');

  const activeBrain = brains.find((b) => b.id === selectedBrainId) || brains[0];

  // Adjustable left panel divider state
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(300);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  React.useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX - 260; // adjust for sidebar width and padding
      if (newWidth > 200 && newWidth < 650) {
        setLeftPanelWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      setIsResizing(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleCreateBrain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrainName.trim()) return;

    try {
      await window.api.brains.create(newBrainName, newBrainDesc);
      setNewBrainName('');
      setNewBrainDesc('');
      setIsCreating(false);
      onRefresh();
    } catch (err) {
      console.error('Failed to create brain:', err);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedBrainId) return;

    setIsUploading(true);
    setUploadStatus('Reading document...');
    setUploadError('');

    const file = files[0] as any;
    // Electron extends the standard web File object to include the local absolute path!
    const filePath = file.path; 
    const fileName = file.name;

    if (!filePath) {
      setUploadError('Unable to resolve absolute file path in this environment.');
      setIsUploading(false);
      return;
    }

    try {
      setUploadStatus(`Chunking & generating vector embeddings for ${fileName}...`);
      const chunks = await window.api.brains.indexFile(selectedBrainId, filePath, fileName);
      setUploadStatus(`Index successful! Generated ${chunks} embedding vectors.`);
      setTimeout(() => {
        setUploadStatus('');
        onRefresh();
      }, 3000);
    } catch (err: any) {
      console.error('[Upload Error]', err);
      setUploadError(err.message || 'RAG Indexing failed. Please make sure your AI keys are saved.');
    } finally {
      setIsUploading(false);
      // Clear input value so uploader can trigger on same file again
      e.target.value = '';
    }
  };

  const handleDeleteFile = async (fileName: string) => {
    if (!selectedBrainId || !window.confirm(`Are you sure you want to delete "${fileName}" from memory?`)) return;

    try {
      await window.api.brains.deleteFile(selectedBrainId, fileName);
      onRefresh();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleDeleteBrain = async () => {
    if (!selectedBrainId || !window.confirm(`Are you sure you want to completely delete "${activeBrain?.name}" and all its documents?`)) return;

    try {
      const remaining = await window.api.brains.delete(selectedBrainId);
      onRefresh();
      if (remaining.length > 0) {
        setSelectedBrainId(remaining[0].id);
      } else {
        setSelectedBrainId('');
      }
    } catch (err) {
      console.error('Failed to delete brain:', err);
    }
  };

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type === 'xlsx' || type === 'xls' || type === 'csv') {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    }
    return <FileText className="w-5 h-5 text-indigo-400" />;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-5">
      <header className="page-header">
        <div>
          <h2 className="page-title">
            <Database style={{ width: 18, height: 18, color: '#a78bfa' }} />
            Client Brains Memory
          </h2>
          <p className="page-subtitle">Create, upload, and index local knowledge spaces for RAG context</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="btn-primary"
        >
          <FolderPlus style={{ width: 14, height: 14 }} />
          New Client Brain
        </button>
      </header>

      {/* Main double panel splits */}
      <div className="flex-1 flex gap-0 overflow-hidden min-h-0 relative">
        
        {/* Left Side: Brains List */}
        <div style={{ width: leftPanelWidth }} className="glass-card rounded-2xl flex flex-col overflow-hidden shrink-0">
          <div className="px-5 py-4 border-b border-zinc-800/60 bg-zinc-900/30 flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300">Client Profiles</span>
            <span className="text-[10px] text-zinc-500 font-mono">{brains.length} total</span>
          </div>

          <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-1.5 bg-zinc-950/20">
            {brains.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setSelectedBrainId(b.id);
                  setUploadError('');
                  setUploadStatus('');
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1 relative overflow-hidden group hover-scale ${
                  selectedBrainId === b.id
                    ? 'bg-zinc-900/60 border-zinc-700 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.5)]'
                    : 'bg-zinc-900/20 border-zinc-900/40 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-900/40'
                }`}
              >
                {selectedBrainId === b.id && (
                  <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-indigo-500 to-emerald-500"></div>
                )}
                <span className="text-xs font-bold text-white transition-colors group-hover:text-indigo-200">{b.name}</span>
                <span className="text-[10px] text-zinc-550 truncate">{b.description || 'No description'}</span>
                
                {/* Stats badge */}
                <div className="flex items-center gap-1.5 mt-2 text-[9px] text-zinc-500 font-mono">
                  <span>{b.documents?.length || 0} documents</span>
                  <span>•</span>
                  <span>
                    {b.documents?.reduce((acc: number, d: any) => acc + (d.chunkCount || 0), 0) || 0} chunks
                  </span>
                </div>
              </button>
            ))}

            {brains.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 gap-1">
                <AlertCircle className="w-5 h-5 text-zinc-650" />
                <span className="text-xs text-zinc-550">No clients setup</span>
              </div>
            )}
          </div>
        </div>

        {/* Draggable vertical divider */}
        <div
          onMouseDown={startResize}
          style={{
            width: '12px',
            cursor: 'col-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            userSelect: 'none',
            background: isResizing ? 'rgba(124, 58, 237, 0.08)' : 'transparent',
            transition: 'background 0.25s ease'
          }}
          className="hover:bg-zinc-800/20 group"
        >
          <div
            style={{
              width: '2px',
              height: '40px',
              borderRadius: '2px',
              background: isResizing ? '#a78bfa' : 'rgba(255, 255, 255, 0.1)',
              boxShadow: isResizing ? '0 0 10px #a78bfa' : 'none',
              transition: 'all 0.25s ease'
            }}
            className="group-hover:bg-indigo-400 group-hover:shadow-[0_0_8px_#818cf8]"
          />
        </div>

        {/* Right Side: Brain workspace, upload documents */}
        <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden">
          {activeBrain ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Header profile details */}
              <div className="px-6 py-5 border-b border-zinc-850 bg-zinc-900/30 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white font-display">{activeBrain.name}</h3>
                  <p className="text-xs text-zinc-550">{activeBrain.description || 'Client workspace description details'}</p>
                </div>
                
                <button
                  onClick={handleDeleteBrain}
                  className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition-all"
                  title="Delete client profile"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Workspace Content */}
              <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 min-h-0 bg-zinc-950/10">
                {/* Upload Section */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Index Documents into RAG</label>
                  
                  {/* File Upload portal */}
                  <div className="relative border-2 border-dashed border-zinc-800 rounded-xl p-8 bg-zinc-900/10 hover:border-indigo-500 hover:bg-indigo-950/20 transition-all flex flex-col items-center justify-center text-center gap-4 group hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] overflow-hidden">
                    <input
                      type="file"
                      accept=".txt,.md,.markdown,.html,.pdf,.docx,.xlsx,.xls,.csv"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer z-20"
                      disabled={isUploading}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity z-0"></div>
                    <div className="w-12 h-12 rounded-full bg-zinc-900/80 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)] group-hover:scale-110 transition-transform relative z-10 backdrop-blur-md">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="relative z-10">
                      <h4 className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">Click or drag document to index</h4>
                      <p className="text-[10px] text-zinc-500 mt-1">Supports PDF, DOCX, XLSX, CSV, HTML, MD, TXT</p>
                    </div>
                  </div>
                </div>

                {/* Progress bar and logs */}
                {isUploading && (
                  <div className="bg-indigo-950/25 border border-indigo-900/40 rounded-xl p-4 flex items-center gap-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 w-full animate-pulse-slow"></div>
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs text-indigo-300 font-semibold">Indexing File</span>
                      <span className="text-[10px] text-zinc-400 font-mono">{uploadStatus}</span>
                    </div>
                  </div>
                )}

                {uploadStatus && !isUploading && (
                  <div className="bg-emerald-950/25 border border-emerald-900/40 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs text-emerald-300 font-semibold">Success</span>
                      <span className="text-[10px] text-zinc-400 font-mono">{uploadStatus}</span>
                    </div>
                  </div>
                )}

                {uploadError && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs text-red-400 font-semibold">Indexing Error</span>
                      <span className="text-[10px] text-zinc-500 font-mono">{uploadError}</span>
                    </div>
                  </div>
                )}

                {/* Indexed Documents Table List */}
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Memory Files ({activeBrain.documents?.length || 0})</label>
                  
                  <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                    {activeBrain.documents?.map((doc: any) => (
                      <div 
                        key={doc.id}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/30 border border-zinc-850 hover:bg-zinc-900/60 hover:border-zinc-700/60 transition-all hover:translate-x-1 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {getFileIcon(doc.fileType)}
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-zinc-300 truncate">{doc.fileName}</span>
                            <span className="text-[9px] text-zinc-500 font-mono flex items-center gap-1.5">
                              <Calendar className="w-2.5 h-2.5" />
                              {new Date(doc.uploadedAt).toLocaleDateString()}
                              <span>•</span>
                              <span>{doc.chunkCount} vector chunks</span>
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteFile(doc.fileName)}
                          className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800/40 transition"
                          title="Delete document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {(!activeBrain.documents || activeBrain.documents.length === 0) && (
                      <div className="flex flex-col items-center justify-center p-6 border border-zinc-850/50 rounded-xl text-center gap-1">
                        <FileText className="w-5 h-5 text-zinc-700" />
                        <span className="text-xs text-zinc-650">No documents indexed in this client brain space.</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 p-6">
              <Database className="w-10 h-10 text-zinc-700" />
              <h3 className="text-sm font-semibold text-zinc-400">Select Client Brain</h3>
              <p className="text-xs text-zinc-600">Please choose a client brain profile from the sidebar panel or configure a new one.</p>
            </div>
          )}
        </div>

      </div>

      {/* Create Brain Dialog Overlay Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/60 backdrop-filter backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleCreateBrain}
            className="w-[450px] glass-panel rounded-2xl border border-zinc-800/60 p-6 flex flex-col gap-4 shadow-xl text-zinc-200"
          >
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <h3 className="text-sm font-bold text-white font-display">Create Client Brain Profile</h3>
              <button 
                type="button"
                onClick={() => setIsCreating(false)} 
                className="text-zinc-550 hover:text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Client / Company Name</label>
              <input
                type="text"
                placeholder="e.g. John Smith, Acme Corp"
                required
                value={newBrainName}
                onChange={(e) => setNewBrainName(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-xs rounded-lg px-3 py-2 text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Description</label>
              <textarea
                placeholder="Fiverr projects details, website credentials details..."
                value={newBrainDesc}
                onChange={(e) => setNewBrainDesc(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-xs rounded-lg p-3 text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 h-24 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-900">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-semibold grad-btn text-white transition shadow-md"
              >
                Create Brain
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// X icon helper
const X = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
