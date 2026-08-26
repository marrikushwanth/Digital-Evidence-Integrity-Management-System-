import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, File, ShieldCheck, AlertCircle, HardDrive, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SocCard from '../components/ui/SocCard';
import { useApp } from '../context/AppContext';

export default function UploadEvidence() {
  const { uploadEvidence, cases, user } = useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [file, setFile] = useState(null);
  const [caseId, setCaseId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0); // 0: Idle, 1: Hashing, 2: Encrypting, 3: Complete

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file || !caseId) return;
    
    setIsUploading(true);
    setProgress(0);
    setStep(1);

    // Simulate upload process
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + (Math.random() * 15);
        if (next > 40 && prev <= 40) setStep(2);
        if (next >= 100) {
          clearInterval(interval);
          setStep(3);
          completeUpload();
          return 100;
        }
        return next;
      });
    }, 300);
  };

  const completeUpload = async () => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('case_id', caseId);
    
    await uploadEvidence(formData);
    navigate('/evidence');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-mono-tabular font-bold text-soc-text uppercase tracking-widest flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-soc-cyan" /> Secure Ingestion Node
        </h1>
        <p className="text-xs text-soc-muted font-mono-tabular">Upload and encrypt digital artifacts for forensics analysis.</p>
      </div>

      <SocCard>
        <div className="space-y-8 p-4">
          
          <div className="space-y-2">
            <label className="text-[10px] font-mono-tabular text-soc-muted uppercase tracking-wider block">Target Investigation Case</label>
            <div className="relative">
              <HardDrive className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soc-muted" />
              <select 
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                className="w-full bg-[#03070f] border border-soc-panel-border rounded-md py-3 pl-10 pr-3 text-sm text-soc-text focus:outline-none focus:border-soc-cyan appearance-none"
              >
                <option value="" disabled>Select active case...</option>
                {cases.filter(c => c.status !== 'Closed').map(c => (
                  <option key={c.id} value={c.id}>{c.id} - {c.title}</option>
                ))}
              </select>
            </div>
          </div>

          {!file ? (
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-soc-panel-border rounded-lg p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:border-soc-cyan hover:bg-[#0a1122] transition-colors"
            >
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef}
                onChange={(e) => e.target.files && setFile(e.target.files[0])}
              />
              <div className="w-16 h-16 rounded-full bg-soc-cyan/10 flex items-center justify-center mb-4">
                <UploadCloud className="w-8 h-8 text-soc-cyan" />
              </div>
              <h3 className="text-lg font-mono-tabular text-soc-text mb-2">Initialize Artifact Upload</h3>
              <p className="text-xs text-soc-muted max-w-md">
                Drag and drop file here, or click to browse. Automatic SHA-256 hashing and AES-256 encryption will be applied post-upload.
              </p>
            </div>
          ) : (
            <div className="border border-soc-panel-border rounded-lg p-6 bg-[#03070f]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded bg-[#0a1122] border border-soc-panel-border flex items-center justify-center">
                    <File className="w-6 h-6 text-soc-cyan" />
                  </div>
                  <div>
                    <h4 className="text-sm font-mono-tabular text-soc-text">{file.name}</h4>
                    <p className="text-[10px] text-soc-muted uppercase mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'BINARY'}</p>
                  </div>
                </div>
                {!isUploading && (
                  <button onClick={() => setFile(null)} className="text-soc-muted hover:text-soc-red text-xs">
                    Clear
                  </button>
                )}
              </div>

              {isUploading && (
                <div className="mt-8 space-y-4">
                  <div className="flex justify-between text-[10px] font-mono-tabular uppercase tracking-widest text-soc-cyan">
                    <span>
                      {step === 1 && 'Calculating SHA-256...'}
                      {step === 2 && 'Applying AES-256 Encryption...'}
                      {step === 3 && 'Upload Complete'}
                    </span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 w-full bg-soc-bg rounded-full overflow-hidden border border-soc-panel-border">
                    <div 
                      className="h-full bg-soc-cyan shadow-[0_0_10px_#00f0ff] transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-[#0a1122] p-4 rounded-md border border-soc-panel-border text-xs text-soc-muted flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-soc-green shrink-0" />
            <p>
              By proceeding, you attest that this digital evidence is uploaded in accordance with organizational chain of custody protocols. An immutable audit log entry will be generated.
            </p>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || !caseId || isUploading}
            className={`w-full py-3 rounded-md font-mono-tabular font-bold uppercase tracking-widest text-xs transition-colors ${
              !file || !caseId || isUploading
                ? 'bg-soc-panel-border text-soc-muted cursor-not-allowed'
                : 'bg-soc-cyan/10 border border-soc-cyan text-soc-cyan hover:bg-soc-cyan hover:text-black shadow-[0_0_15px_rgba(0,240,255,0.2)]'
            }`}
          >
            {isUploading ? 'Processing Artifact...' : 'Commit Evidence to Vault'}
          </button>
        </div>
      </SocCard>
    </motion.div>
  );
}
