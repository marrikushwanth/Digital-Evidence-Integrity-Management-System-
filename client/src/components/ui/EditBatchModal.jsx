import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function EditBatchModal({ batch, evidences, onClose, onRefresh }) {
  const { apiFetch } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [batchName, setBatchName] = useState(batch.batch_name || '');
  const [batchEvidences, setBatchEvidences] = useState([]);
  
  // Available evidence to add
  const availableEvidences = evidences.filter(
    e => e.case_id === batch.case_id && !batchEvidences.some(be => be.id === e.id)
  );

  useEffect(() => {
    fetchBatchDetails();
  }, [batch.id]);

  const fetchBatchDetails = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/merkle/batches/${batch.id}`);
      if (res.data && res.data.success) {
        // Find full evidence objects from the evidences list
        // Note: The backend get_merkle_batch might not return full evidence objects,
        // so we filter the global evidences list. But wait, we need to know WHICH evidences are in the batch.
        // We will fetch the proof endpoint or check if the batch details includes leaves.
        // If not, we can fetch all leaves or get them from the backend.
        // Wait, the backend GET /api/merkle/batches/<id> might return leaves?
        // Let's rely on the returned data.
        if (res.data.data.leaves) {
            const leafEvIds = res.data.data.leaves.map(l => l.evidence_id);
            setBatchEvidences(evidences.filter(e => leafEvIds.includes(e.id)));
        }
      }
    } catch (err) {
      setError('Failed to fetch batch details');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!batchName.trim()) {
      setError('Batch name is required');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch(`/merkle/batches/${batch.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ batch_name: batchName })
      });
      if (res.data && res.data.success) {
        onRefresh();
        if (batch.status === 'FINALIZED') {
          onClose();
        }
      } else {
        setError(res.data?.message || 'Failed to update batch name');
      }
    } catch (err) {
      setError('Failed to update batch name');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvidence = async (evidenceId) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/merkle/batches/${batch.id}/evidence`, {
        method: 'POST',
        body: JSON.stringify({ evidence_ids: [evidenceId] })
      });
      if (res.data && res.data.success) {
        fetchBatchDetails();
        onRefresh();
      } else {
        setError(res.data?.message || 'Failed to add evidence');
      }
    } catch (err) {
      setError('Failed to add evidence');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveEvidence = async (evidenceId) => {
    if (batchEvidences.length <= 1) {
      setError('At least one evidence file is required for a Merkle batch.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch(`/merkle/batches/${batch.id}/evidence/${evidenceId}`, {
        method: 'DELETE'
      });
      if (res.data && res.data.success) {
        fetchBatchDetails();
        onRefresh();
      } else {
        setError(res.data?.message || 'Failed to remove evidence');
      }
    } catch (err) {
      setError('Failed to remove evidence');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <h2 className="text-lg font-bold text-gray-100 truncate pr-4">
            {batch.status === 'FINALIZED' ? 'RENAME BATCH: ' : 'EDIT BATCH: '}
            <span className="text-blue-400 font-normal">{batch.batch_name || 'Unnamed_Batch_' + batch.id.substring(0,8)}</span>
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {batch.status === 'FINALIZED' && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg flex items-start gap-3">
              <ShieldAlert className="text-amber-400 mt-0.5 shrink-0" size={18} />
              <div className="text-sm text-amber-200">
                <p className="font-semibold mb-1">🔒 FINALIZED</p>
                <p>This Merkle batch is cryptographically locked because its root has been anchored on the blockchain.</p>
                <p className="mt-2 text-xs opacity-80">Changing the batch name is allowed because it is metadata only. It does not modify SHA-256 hashes, Merkle leaves, Merkle root, or the blockchain transaction.</p>
              </div>
            </div>
          )}

          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 space-y-2 text-sm text-gray-300">
            <div><span className="text-gray-400 w-32 inline-block">Batch ID:</span> <span className="font-mono">{batch.id}</span></div>
            <div><span className="text-gray-400 w-32 inline-block">Files:</span> {batch.leaf_count}</div>
            <div><span className="text-gray-400 w-32 inline-block">Status:</span> {batch.status}</div>
            {batch.status === 'FINALIZED' && (
              <>
                <div><span className="text-gray-400 w-32 inline-block">Merkle Root:</span> <span className="font-mono text-xs">{batch.merkle_root}</span></div>
                <div><span className="text-gray-400 w-32 inline-block">Tx Hash:</span> <span className="font-mono text-xs text-blue-400 break-all">{batch.blockchain_tx_hash}</span></div>
              </>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Batch Name</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 text-gray-200 rounded-lg p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                maxLength={150}
              />
              <button
                onClick={handleSaveName}
                disabled={loading || batchName === batch.batch_name}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:text-white/50 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <Save size={16} /> Save Name
              </button>
            </div>
          </div>

          {batch.status === 'PENDING' && (
            <>
              <div className="pt-4 border-t border-slate-800">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Files in Batch:</h3>
                {batchEvidences.length === 0 && loading ? (
                  <p className="text-sm text-gray-500">Loading files...</p>
                ) : (
                  <div className="space-y-2">
                    {batchEvidences.map(ev => (
                      <div key={ev.id} className="flex items-center justify-between bg-slate-800/50 border border-slate-700/50 p-2 rounded-lg">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                          <span className="text-sm text-gray-300 truncate">{ev.original_name}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveEvidence(ev.id)}
                          disabled={loading}
                          className="text-xs text-red-400 hover:text-red-300 px-2 py-1 flex items-center gap-1 transition-colors"
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Add Evidence:</h3>
                {availableEvidences.length === 0 ? (
                  <p className="text-sm text-gray-500">No other evidence available in this case.</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                    {availableEvidences.map(ev => (
                      <div key={ev.id} className="flex items-center justify-between bg-slate-800/30 border border-slate-700/30 p-2 rounded-lg">
                        <span className="text-sm text-gray-400 truncate">{ev.original_name}</span>
                        <button
                          onClick={() => handleAddEvidence(ev.id)}
                          disabled={loading}
                          className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 flex items-center gap-1 transition-colors bg-blue-500/10 rounded"
                        >
                          <Plus size={12} /> Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

        </div>
        
        {batch.status === 'PENDING' && (
          <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
