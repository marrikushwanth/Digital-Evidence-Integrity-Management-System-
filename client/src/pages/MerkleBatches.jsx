import React, { useState, useEffect } from 'react';
import { Network, Layers, ShieldCheck, CheckCircle2, XCircle, ChevronRight, Lock } from 'lucide-react';
import SocCard from '../components/ui/SocCard';
import EditBatchModal from '../components/ui/EditBatchModal';
import { useApp } from '../context/AppContext';

export default function MerkleBatches() {
  const { apiFetch, hasRole } = useApp();
  const [batches, setBatches] = useState([]);
  const [evidences, setEvidences] = useState([]);
  const [selectedEvidences, setSelectedEvidences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [batchName, setBatchName] = useState('');
  const [deletingBatch, setDeletingBatch] = useState(null);
  
  const [cases, setCases] = useState([]);
  
  // Health Status
  const [blockchainHealth, setBlockchainHealth] = useState(null);
  
  // Proof verification state
  const [verifyBatchId, setVerifyBatchId] = useState('');
  const [verifyEvidenceId, setVerifyEvidenceId] = useState('');
  const [proofResult, setProofResult] = useState(null);

  useEffect(() => {
    fetchBatches();
    fetchEvidences();
    fetchCases();
    fetchBlockchainHealth();
  }, []);

  const fetchBlockchainHealth = async () => {
    try {
      const res = await apiFetch('/merkle/blockchain-status');
      if (res.data && res.data.success) {
        setBlockchainHealth(res.data.data);
      }
    } catch (err) {
      console.error("Health check failed", err);
    }
  };

  const fetchCases = async () => {
    try {
      const res = await apiFetch('/cases/');
      if (res.data && res.data.success) {
        setCases(res.data.data.items || res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await apiFetch('/merkle/batches');
      if (res.data && res.data.success && res.data.data.batches) {
        setBatches(res.data.data.batches);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEvidences = async () => {
    try {
      const res = await apiFetch('/evidence/');
      if (res.data && res.data.success) {
        setEvidences(res.data.data.items || res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateBatch = async () => {
    const trimmedName = batchName.trim();
    if (!trimmedName) {
      setError('Batch Name is required.');
      return;
    }
    if (trimmedName.length > 150) {
      setError('Batch Name must be under 150 characters.');
      return;
    }
    if (selectedEvidences.length === 0) {
      setError('Please select at least one evidence to batch.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await apiFetch('/merkle/batches', {
        method: 'POST',
        body: JSON.stringify({ batch_name: trimmedName, evidence_ids: selectedEvidences })
      });
      
      if (!res.data || !res.data.success) {
        setError(res.data?.message || 'Failed to create batch');
      } else {
        setSelectedEvidences([]);
        setBatchName('');
        setIsBatchNameManual(false);
        fetchBatches();
      }
    } catch (err) {
      setError(err.message || 'Failed to create batch');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeBatch = async (batchId) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/merkle/batches/${batchId}/finalize`, {
        method: 'POST'
      });
      if (!res.data || !res.data.success) {
        alert(res.data?.message || 'Failed to finalize batch');
      } else {
        fetchBatches();
      }
    } catch (err) {
      alert(err.message || 'Failed to finalize batch');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloneBatch = async (batchId) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/merkle/batches/${batchId}/clone`, {
        method: 'POST'
      });
      if (!res.data || !res.data.success) {
        alert(res.data?.message || 'Failed to clone batch');
      } else {
        fetchBatches();
      }
    } catch (err) {
      alert(err.message || 'Failed to clone batch');
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteBatch = async () => {
    if (!deletingBatch) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/merkle/batches/${deletingBatch.id}`, { method: 'DELETE' });
      if (res.data && res.data.success) {
        alert(res.data.message || 'Batch successfully removed');
        setDeletingBatch(null);
        fetchBatches();
      } else {
        setError(res.data?.message || 'Error deleting batch');
      }
    } catch (err) {
      setError(err.message || 'Network error while deleting batch');
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerifyProof = async () => {
    if (!verifyBatchId || !verifyEvidenceId) {
      setError('Please select a batch and evidence for proof verification');
      return;
    }
    
    setLoading(true);
    setProofResult(null);
    try {
      const proofRes = await apiFetch(`/merkle/batches/${verifyBatchId}/proof/${verifyEvidenceId}`);
      if (!proofRes.data || !proofRes.data.success) {
        setProofResult({ valid: false, message: proofRes.data?.message || 'Error getting proof' });
        setLoading(false);
        return;
      }
      
      const pData = proofRes.data.data;
      
      const verifyRes = await apiFetch('/merkle/verify', {
        method: 'POST',
        body: JSON.stringify({
          leaf_hash: pData.leaf_hash,
          proof: pData.proof,
          merkle_root: pData.merkle_root
        })
      });
      
      if (verifyRes.data && verifyRes.data.success && verifyRes.data.data.valid) {
        setProofResult({ valid: true, message: 'Merkle Proof is Valid!' });
      } else {
        setProofResult({ valid: false, message: 'Merkle Proof is Invalid!' });
      }
      
    } catch (err) {
      setProofResult({ valid: false, message: err.message || 'Error verifying proof' });
    } finally {
      setLoading(false);
    }
  };

  const [verifyEntireBatchId, setVerifyEntireBatchId] = useState('');
  const [entireBatchResult, setEntireBatchResult] = useState(null);
  const [verificationFiles, setVerificationFiles] = useState([]);

  const handleVerifyEntireBatch = async () => {
    if (!verifyEntireBatchId) {
      setError('Please select a batch to verify');
      return;
    }
    if (verificationFiles.length === 0) {
      setError('Please upload at least one file for verification');
      return;
    }
    
    setLoading(true);
    setEntireBatchResult(null);
    try {
      const formData = new FormData();
      Array.from(verificationFiles).forEach(file => {
        formData.append('files[]', file);
      });

      const res = await apiFetch(`/merkle/batches/${verifyEntireBatchId}/verify-uploaded`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header manually when sending FormData
      });
      
      if (!res.data || !res.data.success) {
        setEntireBatchResult({ 
          overall_status: 'ERROR', 
          message: res.data?.message || 'Error verifying batch' 
        });
        return;
      }
      
      setEntireBatchResult(res.data.data);
    } catch (err) {
      setEntireBatchResult({ overall_status: 'ERROR', message: err.message || 'Network or server error verifying batch' });
    } finally {
      setLoading(false);
      setVerificationFiles([]); // Clear files after attempt
    }
  };

  const [isBatchNameManual, setIsBatchNameManual] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  
  const [selectedCaseId, setSelectedCaseId] = useState('');

  const handleSelectAll = (checked) => {
    if (!selectedCaseId) return;
    
    if (checked) {
      const caseEvidences = evidences.filter(e => e.case_id === selectedCaseId).map(e => e.id);
      setSelectedEvidences(caseEvidences);
    } else {
      setSelectedEvidences([]);
    }
  };

  useEffect(() => {
    if (isBatchNameManual) return;
    if (selectedEvidences.length === 0) {
      setBatchName('');
      return;
    }
    
    // Auto-generate name
    const selectedEvs = evidences.filter(e => selectedEvidences.includes(e.id));
    if (selectedEvs.length === 0) return;
    
    const caseId = selectedEvs[0].case_id;
    const caseObj = cases.find(c => c.id === caseId);
    let baseName = caseObj ? caseObj.title : 'Case';
    
    // Normalization logic
    const normalize = (str) => {
      // Remove extensions, keep alphanumeric, _ and -
      return str.replace(/[^a-zA-Z0-9\-_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    };
    
    baseName = normalize(baseName);
    
    // Check if all files in the case are selected
    const allCaseEvidences = evidences.filter(e => e.case_id === caseId);
    if (allCaseEvidences.length > 0 && selectedEvs.length === allCaseEvidences.length) {
      setBatchName(`${baseName}_All_Files`);
      return;
    }
    
    let fileNames = selectedEvs.map(e => {
      // Remove extension by splitting at the last dot
      const lastDot = e.original_name.lastIndexOf('.');
      let n = lastDot !== -1 ? e.original_name.substring(0, lastDot) : e.original_name;
      return normalize(n);
    });
    
    let newName = baseName;
    for (let i = 0; i < fileNames.length; i++) {
      let appendStr = '_' + fileNames[i];
      if ((newName.length + appendStr.length) > 130) {
        newName += '_+' + (fileNames.length - i) + '_files';
        break;
      }
      newName += appendStr;
    }
    
    if (newName.length > 150) {
      newName = newName.substring(0, 150);
    }
    
    // Ensure no trailing underscores
    newName = newName.replace(/_+$/, '');
    
    setBatchName(newName);
  }, [selectedEvidences, evidences, cases, isBatchNameManual]);

  const toggleEvidence = (id) => {
    // Only allow selecting evidences from the same case
    const targetEv = evidences.find(e => e.id === id);
    if (!targetEv) return;
    
    if (selectedEvidences.length > 0 && !selectedEvidences.includes(id)) {
      const firstEv = evidences.find(e => e.id === selectedEvidences[0]);
      if (firstEv && firstEv.case_id !== targetEv.case_id) {
        setError('All evidence in a Merkle batch must belong to the same case.');
        return;
      }
    }
    setError('');
    
    if (selectedEvidences.includes(id)) {
      setSelectedEvidences(selectedEvidences.filter(e => e !== id));
    } else {
      setSelectedEvidences([...selectedEvidences, id]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <Layers className="text-blue-500" />
            Merkle Batches
          </h1>
          <p className="text-gray-400 mt-1">Batch multiple evidence records into a single blockchain transaction.</p>
        </div>
        
        {blockchainHealth && (
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 flex flex-col gap-1 text-sm shadow-xl">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-medium w-32">Blockchain:</span>
              {blockchainHealth.connected ? (
                <span className="text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> CONNECTED ({blockchainHealth.chain_id})</span>
              ) : (
                <span className="text-red-400 flex items-center gap-1"><XCircle className="w-3 h-3"/> DISCONNECTED</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-medium w-32">Merkle Contract:</span>
              {blockchainHealth.contract_bytecode_found ? (
                <span className="text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> DEPLOYED</span>
              ) : (
                <span className="text-red-400 flex items-center gap-1"><XCircle className="w-3 h-3"/> NOT DEPLOYED</span>
              )}
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SocCard title="Create New Batch" icon={<Network className="w-4 h-4" />}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Batch Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={batchName}
                onChange={(e) => {
                  setBatchName(e.target.value);
                  setIsBatchNameManual(true);
                }}
                placeholder="e.g. Conference Evidence - October 2026"
                className="w-full bg-slate-900 border border-slate-700 text-gray-200 rounded-lg p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                maxLength={150}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Case <span className="text-red-500">*</span></label>
              <select
                value={selectedCaseId}
                onChange={(e) => {
                  setSelectedCaseId(e.target.value);
                  setSelectedEvidences([]);
                  setIsBatchNameManual(false);
                  setBatchName('');
                }}
                className="w-full bg-slate-900 border border-slate-700 text-gray-200 rounded-lg p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="">-- Select a Case --</option>
                {cases.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            
            <p className="text-sm text-gray-400">Select evidence to include in the Merkle Tree.</p>
            
            {selectedCaseId && evidences.filter(e => e.case_id === selectedCaseId).length > 0 && (
              <div className="flex items-center gap-3 p-2 border-b border-slate-700/50 mb-2 pb-3">
                <input
                  type="checkbox"
                  id="selectAll"
                  checked={selectedEvidences.length === evidences.filter(e => e.case_id === selectedCaseId).length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 text-blue-500 bg-slate-900 border-slate-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="selectAll" className="text-sm font-medium text-gray-200 cursor-pointer select-none">
                  Select All Case Evidence
                </label>
              </div>
            )}
            
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {evidences.filter(e => e.case_id === selectedCaseId).map(ev => (
                <div key={ev.id} className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded-lg transition-colors border border-slate-700/50 cursor-pointer" onClick={() => toggleEvidence(ev.id)}>
                  <input
                    type="checkbox"
                    checked={selectedEvidences.includes(ev.id)}
                    onChange={() => {}}
                    className="w-4 h-4 text-blue-500 bg-slate-900 border-slate-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-200">{ev.original_name}</p>
                    <p className="text-xs text-gray-500 truncate w-48">Hash: {ev.file_hash}</p>
                  </div>
                </div>
              ))}
              {selectedCaseId && evidences.filter(e => e.case_id === selectedCaseId).length === 0 && (
                <p className="text-sm text-gray-500 italic p-2">No evidence found in this case.</p>
              )}
              {!selectedCaseId && (
                <p className="text-sm text-gray-500 italic p-2">Please select a case to view evidence.</p>
              )}
            </div>
            <button
              onClick={handleCreateBatch}
              disabled={loading || selectedEvidences.length === 0}
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-all"
            >
              {loading ? 'Processing...' : 'Generate Merkle Batch'}
              <ChevronRight size={16} />
            </button>
          </div>
        </SocCard>

        <SocCard title="Verify Merkle Proof" icon={<ShieldCheck className="w-4 h-4" />}>
          <div className="space-y-4">
             <p className="text-sm text-gray-400">Verify a specific evidence against a batch root.</p>
             <div>
               <label className="block text-xs text-gray-400 mb-1">Select Batch</label>
               <select
                 className="w-full bg-slate-900 border border-slate-700 text-gray-200 rounded-lg p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                 value={verifyBatchId}
                 onChange={(e) => setVerifyBatchId(e.target.value)}
               >
                 <option value="">-- Select Batch --</option>
                 {batches.map(b => (
                   <option key={b.id} value={b.id}>{b.batch_name || 'Unnamed_Batch_' + b.id.substring(0,8)} — {b.leaf_count} Files</option>
                 ))}
               </select>
             </div>
             
             <div>
               <label className="block text-xs text-gray-400 mb-1">Select Evidence</label>
               <select
                 className="w-full bg-slate-900 border border-slate-700 text-gray-200 rounded-lg p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                 value={verifyEvidenceId}
                 onChange={(e) => setVerifyEvidenceId(e.target.value)}
               >
                 <option value="">-- Select Evidence --</option>
                 {evidences.map(e => (
                   <option key={e.id} value={e.id}>{e.original_name}</option>
                 ))}
               </select>
             </div>
             
             <button
              onClick={handleVerifyProof}
              disabled={loading || !verifyBatchId || !verifyEvidenceId}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white border border-slate-600 rounded-lg transition-all"
             >
               Verify Proof
             </button>
             
             {proofResult && (
               <div className={`p-4 rounded-lg flex items-center gap-3 border ${proofResult.valid ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                 {proofResult.valid ? <CheckCircle2 /> : <XCircle />}
                 <span className="font-medium">{proofResult.message}</span>
               </div>
             )}
          </div>
        </SocCard>
      </div>

      <SocCard title="Verify Entire Batch" icon={<ShieldCheck className="w-4 h-4" />}>
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Verify all evidence records within a selected batch against the blockchain Merkle Root automatically.</p>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Select Batch</label>
              <select
                className="w-full bg-slate-900 border border-slate-700 text-gray-200 rounded-lg p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                value={verifyEntireBatchId}
                onChange={(e) => setVerifyEntireBatchId(e.target.value)}
              >
                <option value="">-- Select Batch --</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.batch_name || 'Unnamed_Batch_' + b.id.substring(0,8)} — {b.leaf_count} Files</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Upload Evidence Files for Verification</label>
              <input
                type="file"
                multiple
                className="w-full bg-slate-900 border border-slate-700 text-gray-200 rounded-lg p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                onChange={(e) => setVerificationFiles(e.target.files)}
              />
            </div>
            {verificationFiles.length > 0 && (
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Selected Files:</h4>
                <ul className="text-sm text-gray-400 space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                  {Array.from(verificationFiles).map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-blue-400" /> {f.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-2">
              <button
                onClick={handleVerifyEntireBatch}
                disabled={loading || !verifyEntireBatchId || verificationFiles.length === 0}
                className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-all"
              >
                {loading ? 'Verifying...' : 'VERIFY UPLOADED FILES'}
              </button>
            </div>
          </div>
          
          {entireBatchResult && (
            <div className="mt-6 border border-slate-700/50 rounded-lg overflow-hidden bg-slate-900/50">
              <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700/50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-200">MERKLE BATCH VERIFICATION</h3>
              </div>
              <div className="p-4 space-y-6">
                
                {entireBatchResult.overall_status === 'ERROR' ? (
                  <div className="text-red-400 flex items-center gap-2">
                    <XCircle /> <span>{entireBatchResult.message}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-1 text-sm text-gray-300">
                      <div>Batch: <span className="font-bold text-gray-100">{entireBatchResult.batch_name}</span></div>
                      <div className="mb-2">Batch ID: <span className="font-mono text-xs text-gray-400">{entireBatchResult.batch_id}</span></div>
                      
                      <div>Expected Files: <span className="font-bold">{entireBatchResult.expected_files}</span></div>
                      <div>Uploaded Files: <span className="font-bold">{entireBatchResult.uploaded_files}</span></div>
                    </div>
                    
                    <div className="space-y-4">
                      {entireBatchResult.files?.map((file, idx) => (
                        <div key={idx} className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1">
                            {file.status === 'VERIFIED' ? <span className="text-emerald-500 font-bold">✓</span> : 
                             file.status === 'FILE NOT IN SELECTED MERKLE BATCH' || file.status === 'NOT PROVIDED' ? <span className="text-amber-500 font-bold">—</span> : 
                             <span className="text-red-500 font-bold">✗</span>}
                            <span className="font-medium text-gray-200">{file.filename}</span>
                          </div>
                          
                          {file.status === 'FILE NOT IN SELECTED MERKLE BATCH' ? (
                            <div className="pl-5 text-xs text-amber-500 font-medium">FILE NOT IN SELECTED MERKLE BATCH</div>
                          ) : file.status === 'NOT PROVIDED' ? (
                            <div className="pl-5 text-xs text-amber-500 font-medium">NOT PROVIDED</div>
                          ) : (
                            <div className="pl-5 space-y-1 text-xs text-gray-400">
                              <div>SHA-256: {file.status === 'VERIFIED' ? <span className="text-emerald-400">MATCH</span> : <span className="text-red-400">MISMATCH</span>}</div>
                              <div>Merkle Proof: {file.status === 'VERIFIED' ? <span className="text-emerald-400">VALID</span> : <span className="text-red-400">INVALID</span>}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-4 border-t border-slate-700/50 space-y-4 text-sm">
                      <div className="flex gap-6">
                        <div className="text-emerald-400">Files Verified: <span className="font-bold">{entireBatchResult.verified_files}/{entireBatchResult.expected_files}</span></div>
                        <div className="text-red-400">Files Failed: <span className="font-bold">{entireBatchResult.failed_files}/{entireBatchResult.expected_files}</span></div>
                      </div>
                      
                      <div>
                        <div className="text-gray-400 mb-1">Blockchain Merkle Root:</div>
                        <div className={`font-bold ${entireBatchResult.blockchain_verified ? 'text-emerald-400' : 'text-gray-400'}`}>
                          {entireBatchResult.blockchain_verified ? 'VERIFIED' : 'UNMODIFIED ORIGINAL ROOT'}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-gray-400 mb-1">Overall Status:</div>
                        <div className={`text-lg font-bold ${
                          entireBatchResult.overall_status === 'FULLY VERIFIED' ? 'text-emerald-400' : 
                          entireBatchResult.overall_status === 'PARTIAL VERIFICATION' ? 'text-amber-400' : 
                          'text-red-400'
                        }`}>
                          {entireBatchResult.overall_status}
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
              </div>
            </div>
          )}
        </div>
      </SocCard>

      <SocCard title="Batch History" icon={<Lock className="w-4 h-4" />}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700/50 text-xs uppercase tracking-wider text-slate-400">
                <th className="p-3 font-medium">Batch Name</th>
                <th className="p-3 font-medium">Batch ID</th>
                <th className="p-3 font-medium">Files</th>
                <th className="p-3 font-medium">Merkle Root</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {batches.map((batch) => (
                <tr key={batch.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="p-3">
                    <div className="text-sm font-medium text-gray-200">
                      {batch.batch_name || 'Unnamed_Batch_' + batch.id.substring(0,8)}
                    </div>
                  </td>
                  <td className="p-3 text-sm text-gray-300 font-mono">
                    {batch.id.substring(0, 8)}...
                  </td>
                  <td className="p-3 text-sm text-gray-300">
                    {batch.leaf_count}
                  </td>
                  <td className="p-3 text-sm text-gray-400 font-mono truncate max-w-[200px]" title={batch.merkle_root}>
                    {batch.merkle_root}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      batch.status === 'FINALIZED' 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {batch.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2 items-center flex-wrap">
                      {batch.status === 'PENDING' ? (
                        <>
                          <button 
                            onClick={() => setEditingBatch(batch)}
                            disabled={loading}
                            className="text-xs px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleFinalizeBatch(batch.id)}
                            disabled={loading}
                            className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors disabled:opacity-50"
                          >
                            Finalize on Chain
                          </button>
                          {hasRole(['Super Admin', 'Admin']) && (
                            <button
                              onClick={() => setDeletingBatch(batch)}
                              disabled={loading}
                              className="text-xs px-3 py-1 bg-red-600/80 hover:bg-red-500 text-white rounded transition-colors disabled:opacity-50"
                            >
                              Delete
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => setEditingBatch(batch)}
                            disabled={loading}
                            className="text-xs px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors disabled:opacity-50"
                          >
                            Rename
                          </button>
                          <button 
                            onClick={() => handleCloneBatch(batch.id)}
                            disabled={loading}
                            className="text-xs px-3 py-1 bg-amber-600/80 hover:bg-amber-500 text-white rounded transition-colors disabled:opacity-50"
                          >
                            Clone to New Batch
                          </button>
                          <a 
                            href={`#`} 
                            className="text-xs text-blue-400 hover:text-blue-300 font-mono flex items-center ml-1"
                            title={batch.blockchain_tx_hash}
                          >
                            Tx: {batch.blockchain_tx_hash?.substring(0,6)}...
                          </a>
                          {hasRole(['Super Admin', 'Admin']) && (
                            <button
                              onClick={() => setDeletingBatch(batch)}
                              disabled={loading}
                              className="text-xs px-3 py-1 bg-red-600/80 hover:bg-red-500 text-white rounded transition-colors disabled:opacity-50"
                            >
                              Delete
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {batches.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-gray-500 text-sm">
                    No Merkle batches found. Create one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SocCard>
      
      {editingBatch && (
        <EditBatchModal 
          batch={editingBatch}
          evidences={evidences}
          onClose={() => setEditingBatch(null)}
          onRefresh={fetchBatches}
        />
      )}

      {deletingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-lg max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Delete this Merkle batch?</h3>
            <div className="space-y-2 text-sm text-gray-300 mb-6">
              <p><strong>Batch Name:</strong> {deletingBatch.batch_name || 'Unnamed'}</p>
              <p><strong>Batch ID:</strong> {deletingBatch.id}</p>
              <p><strong>Files:</strong> {deletingBatch.leaf_count}</p>
              <p><strong>Status:</strong> {deletingBatch.status}</p>
              <p><strong>Blockchain:</strong> {deletingBatch.blockchain_status || 'PENDING'}</p>
              <p className="mt-4 text-xs text-amber-400 p-2 bg-amber-500/10 border border-amber-500/20 rounded">
                Deleting the batch from DEIMS will not erase transactions already recorded on the blockchain.
              </p>
            </div>
            {error && <p className="text-red-400 text-xs mb-4">{error}</p>}
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setDeletingBatch(null)}
                disabled={loading}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteBatch}
                disabled={loading}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded transition-colors disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
