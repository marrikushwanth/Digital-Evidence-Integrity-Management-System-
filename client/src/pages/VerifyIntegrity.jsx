import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Search, Hash, AlertTriangle, Fingerprint } from 'lucide-react';
import SocCard from '../components/ui/SocCard';
import { useApp } from '../context/AppContext';
import { generateSHA256 } from '../utils/cryptoUtils';

export default function VerifyIntegrity() {
  const { evidence, verifyEvidence, blockchainStatus } = useApp();
  const [selectedEvidenceId, setSelectedEvidenceId] = useState('');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const selectedEvidence = evidence.find(e => e.id === selectedEvidenceId);

  const handleVerify = async () => {
    if (!file || !selectedEvidence) return;
    setIsVerifying(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('evidence_id', selectedEvidence.id);
      
      const res = await verifyEvidence(formData);
      
      setResult({
        calculatedHash: res.data.calculated_hash || 'MISMATCH',
        originalHash: selectedEvidence.file_hash,
        isMatch: res.data.match,
        dbMatch: res.data.db_match,
        bcMatch: res.data.bc_match,
        bcStatus: res.data.bc_status,
        overallResult: res.message
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-mono-tabular font-bold text-soc-text uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-soc-cyan" /> Integrity Check
          </h1>
          <p className="text-xs text-soc-muted font-mono-tabular">Verify digital artifact integrity against the database and cryptographic ledger.</p>
        </div>
        
        {blockchainStatus && (
          <div className={`px-4 py-2 rounded-md border text-xs font-mono-tabular font-bold uppercase tracking-widest ${blockchainStatus.connected ? 'bg-soc-green/10 border-soc-green text-soc-green' : 'bg-soc-red/10 border-soc-red text-soc-red'}`}>
            Ledger: {blockchainStatus.status}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SocCard title="Target Specification">
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-mono-tabular text-soc-muted uppercase tracking-wider block mb-2">Artifact ID (Vault Reference)</label>
              <select 
                value={selectedEvidenceId}
                onChange={(e) => setSelectedEvidenceId(e.target.value)}
                className="w-full bg-[#0a1122] border border-soc-panel-border rounded-md py-2.5 px-3 text-sm text-soc-text focus:outline-none focus:border-soc-cyan focus:ring-1 focus:ring-soc-cyan font-mono-tabular appearance-none"
              >
                <option value="">-- Select Artifact to Verify --</option>
                {evidence.map(e => <option key={e.id} value={e.id}>{e.id} : {e.original_name}</option>)}
              </select>
            </div>

            {selectedEvidence && (
              <div className="bg-[#03070f] border border-soc-panel-border p-4 rounded-md space-y-3">
                <div>
                  <div className="text-[10px] font-mono-tabular text-soc-muted uppercase">Original Hash (Ledger)</div>
                  <div className="text-xs font-mono-tabular text-soc-cyan break-all">{selectedEvidence.file_hash}</div>
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] font-mono-tabular text-soc-muted uppercase tracking-wider block mb-2">Verification Sample</label>
              <div className="border-2 border-dashed border-soc-panel-border rounded-lg p-6 text-center hover:bg-[#0a1122] transition-colors cursor-pointer relative">
                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => setFile(e.target.files[0])} />
                <Fingerprint className="w-8 h-8 text-soc-muted mx-auto mb-2" />
                <p className="text-sm text-soc-text font-bold">{file ? file.name : 'Upload suspect file for comparison'}</p>
              </div>
            </div>

            <button 
              onClick={handleVerify}
              disabled={!file || !selectedEvidence || isVerifying}
              className={`w-full py-3 text-xs font-mono-tabular font-bold uppercase tracking-widest rounded-md transition-colors ${
                !file || !selectedEvidence || isVerifying ? 'bg-[#0a1122] text-soc-muted cursor-not-allowed' : 'bg-soc-cyan/10 border border-soc-cyan text-soc-cyan hover:bg-soc-cyan hover:text-black shadow-[0_0_15px_rgba(0,240,255,0.2)]'
              }`}
            >
              {isVerifying ? 'Running Cryptographic Audit...' : 'Execute Integrity Check'}
            </button>
          </div>
        </SocCard>

        <SocCard title="Audit Results">
          {!result && !isVerifying && (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 text-soc-muted">
              <Search className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm">Awaiting verification execution.</p>
            </div>
          )}

          {isVerifying && (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-full border-2 border-soc-cyan/30 border-t-soc-cyan animate-spin"></div>
              <p className="text-xs font-mono-tabular text-soc-cyan animate-pulse">Calculating SHA-256 Checksum...</p>
            </div>
          )}

          {result && !isVerifying && (
            <div className={`h-full min-h-[300px] p-6 border rounded-lg ${result.isMatch ? 'bg-emerald-950/20 border-soc-green/30' : 'bg-rose-950/20 border-soc-red/30'}`}>
              <div className="flex flex-col items-center text-center mb-6">
                {result.isMatch ? (
                  <ShieldCheck className="w-16 h-16 text-soc-green mb-3" />
                ) : (
                  <AlertTriangle className="w-16 h-16 text-soc-red mb-3 animate-pulse" />
                )}
                <h3 className={`text-xl font-black tracking-widest ${result.isMatch ? 'text-soc-green' : 'text-soc-red'}`}>
                  {result.overallResult || (result.isMatch ? 'INTEGRITY VERIFIED' : 'TAMPER DETECTED')}
                </h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-3 rounded border border-soc-panel-border ${result.dbMatch ? 'bg-soc-green/10 border-soc-green/30 text-soc-green' : 'bg-soc-red/10 border-soc-red/30 text-soc-red'}`}>
                    <div className="text-[10px] font-mono-tabular uppercase mb-1">Database Layer</div>
                    <div className="text-sm font-bold">{result.dbMatch ? 'MATCH' : 'MISMATCH'}</div>
                  </div>
                  
                  <div className={`p-3 rounded border border-soc-panel-border ${result.bcMatch === true ? 'bg-soc-green/10 border-soc-green/30 text-soc-green' : result.bcMatch === false ? 'bg-soc-red/10 border-soc-red/30 text-soc-red' : 'bg-[#0a1122] text-soc-muted'}`}>
                    <div className="text-[10px] font-mono-tabular uppercase mb-1">Blockchain Layer</div>
                    <div className="text-sm font-bold">
                      {result.bcMatch === true ? 'MATCH' : result.bcMatch === false ? 'MISMATCH' : result.bcStatus}
                    </div>
                  </div>
                </div>

                <div className="bg-[#03070f] p-3 rounded border border-soc-panel-border">
                  <div className="text-[10px] font-mono-tabular text-soc-muted uppercase mb-1">Calculated Sample Hash</div>
                  <div className={`text-xs font-mono-tabular break-all ${result.isMatch ? 'text-soc-green' : 'text-soc-red'}`}>
                    {result.calculatedHash}
                  </div>
                </div>
                <div className="bg-[#03070f] p-3 rounded border border-soc-panel-border">
                  <div className="text-[10px] font-mono-tabular text-soc-muted uppercase mb-1">Ledger Reference Hash</div>
                  <div className="text-xs font-mono-tabular text-soc-cyan break-all">
                    {result.originalHash}
                  </div>
                </div>
              </div>
            </div>
          )}
        </SocCard>
      </div>
    </motion.div>
  );
}
