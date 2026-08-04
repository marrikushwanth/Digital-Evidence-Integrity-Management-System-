import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HardDrive, Search, Download, Eye, FileText, UploadCloud, Trash2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import SocCard from '../components/ui/SocCard';
import StatusBadge from '../components/ui/StatusBadge';
import { useApp } from '../context/AppContext';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl soc-panel border-soc-cyan/30 p-6 bg-[#03070f]">
        <div className="flex justify-between items-center mb-6 border-b border-soc-panel-border pb-4">
          <h2 className="text-lg font-black text-soc-text tracking-widest uppercase">{title}</h2>
          <button onClick={onClose} className="text-soc-muted hover:text-soc-red">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default function EvidenceList() {
  const { evidence, hasRole, deleteEvidence, user } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedEv, setSelectedEv] = useState(null);

  const filteredEvidence = evidence.filter(e => 
    e.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.caseId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = (ev) => {
    // Mock download action
    alert(`Initiating secure download protocol for artifact: ${ev.fileName}\nDecryption keys requested...`);
  };

  const handleDelete = (ev) => {
    if (window.confirm(`Are you sure you want to permanently delete artifact ${ev.id}? This action will be permanently logged.`)) {
      deleteEvidence(ev.id);
      setIsDetailsOpen(false);
    }
  };

  const openDetails = (ev) => {
    setSelectedEv(ev);
    setIsDetailsOpen(true);
  };

  const canUpload = hasRole(['Super Admin', 'Admin', 'Investigator']);
  const canDelete = hasRole(['Super Admin', 'Admin']);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-mono-tabular font-bold text-soc-text uppercase tracking-widest flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-soc-cyan" /> Secure Evidence Vault
          </h1>
          <p className="text-xs text-soc-muted font-mono-tabular">Encrypted storage repository for digital artifacts.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soc-muted" />
            <input 
              type="text" 
              placeholder="Search artifacts..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0a1122] border border-soc-panel-border text-sm text-soc-text px-10 py-2 rounded-md focus:outline-none focus:border-soc-cyan focus:ring-1 focus:ring-soc-cyan font-mono-tabular"
            />
          </div>
          {canUpload && (
            <Link to="/upload" className="px-4 py-2 bg-soc-cyan/10 border border-soc-cyan text-soc-cyan text-xs font-mono-tabular font-bold tracking-wider rounded-md hover:bg-soc-cyan hover:text-black transition-colors flex items-center gap-2 shrink-0">
              <UploadCloud className="w-4 h-4" /> Upload
            </Link>
          )}
        </div>
      </div>

      <SocCard className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-mono-tabular text-soc-muted uppercase border-b border-soc-panel-border bg-[#03070f]">
              <th className="p-4 font-normal">Artifact ID</th>
              <th className="p-4 font-normal">File Name</th>
              <th className="p-4 font-normal">Case Ref</th>
              <th className="p-4 font-normal">Size</th>
              <th className="p-4 font-normal">Integrity</th>
              <th className="p-4 font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-soc-panel-border/50">
            {filteredEvidence.map((e) => (
              <tr key={e.id} className="hover:bg-[#0a1122] transition-colors group cursor-pointer" onClick={() => openDetails(e)}>
                <td className="p-4 text-xs font-mono-tabular text-soc-cyan font-bold">{e.id}</td>
                <td className="p-4 text-sm text-soc-text flex items-center gap-2">
                  <FileText className="w-4 h-4 text-soc-muted" />
                  {e.fileName}
                </td>
                <td className="p-4 text-xs font-mono-tabular text-soc-muted hover:text-soc-cyan">{e.caseId}</td>
                <td className="p-4 text-xs font-mono-tabular text-soc-muted">{formatSize(e.fileSize)}</td>
                <td className="p-4"><StatusBadge status={e.verificationStatus} /></td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={ev => ev.stopPropagation()}>
                    <button onClick={() => openDetails(e)} className="p-1.5 text-soc-muted hover:text-soc-cyan hover:bg-soc-cyan/10 rounded" title="View Details">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDownload(e)} className="p-1.5 text-soc-muted hover:text-soc-green hover:bg-soc-green/10 rounded" title="Download">
                      <Download className="w-4 h-4" />
                    </button>
                    {canDelete && (
                      <button onClick={() => handleDelete(e)} className="p-1.5 text-soc-muted hover:text-soc-red hover:bg-soc-red/10 rounded" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredEvidence.length === 0 && (
              <tr>
                <td colSpan="6" className="p-8 text-center text-sm text-soc-muted font-mono-tabular">No artifacts found matching search criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </SocCard>

      {/* Artifact Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Artifact Metadata Viewer">
        {selectedEv && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0a1122] p-4 rounded border border-soc-panel-border">
                <span className="text-[10px] uppercase text-soc-muted block mb-1">Artifact ID</span>
                <span className="font-mono-tabular text-soc-cyan">{selectedEv.id}</span>
              </div>
              <div className="bg-[#0a1122] p-4 rounded border border-soc-panel-border">
                <span className="text-[10px] uppercase text-soc-muted block mb-1">Linked Case</span>
                <span className="font-mono-tabular text-soc-text">{selectedEv.caseId}</span>
              </div>
              <div className="bg-[#0a1122] p-4 rounded border border-soc-panel-border">
                <span className="text-[10px] uppercase text-soc-muted block mb-1">File Name</span>
                <span className="text-sm text-soc-text">{selectedEv.fileName}</span>
              </div>
              <div className="bg-[#0a1122] p-4 rounded border border-soc-panel-border">
                <span className="text-[10px] uppercase text-soc-muted block mb-1">File Type</span>
                <span className="text-sm text-soc-text">{selectedEv.fileType}</span>
              </div>
              <div className="bg-[#0a1122] p-4 rounded border border-soc-panel-border">
                <span className="text-[10px] uppercase text-soc-muted block mb-1">File Size</span>
                <span className="font-mono-tabular text-soc-text">{formatSize(selectedEv.fileSize)}</span>
              </div>
              <div className="bg-[#0a1122] p-4 rounded border border-soc-panel-border">
                <span className="text-[10px] uppercase text-soc-muted block mb-1">Ingestion Date</span>
                <span className="font-mono-tabular text-soc-text">{new Date(selectedEv.uploadDate).toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-soc-bg p-4 rounded border border-soc-panel-border border-l-2 border-l-soc-cyan">
              <span className="text-[10px] uppercase text-soc-muted block mb-2 tracking-widest">SHA-256 Cryptographic Hash</span>
              <div className="font-mono-tabular text-xs text-soc-text break-all">
                {selectedEv.sha256}
              </div>
            </div>

            <div className="flex items-center gap-4 border-t border-soc-panel-border pt-6">
              <button onClick={() => handleDownload(selectedEv)} className="px-6 py-2 bg-soc-cyan/10 border border-soc-cyan text-soc-cyan text-xs font-mono-tabular font-bold tracking-widest rounded hover:bg-soc-cyan hover:text-black transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" /> Download Decrypted
              </button>
              {canDelete && (
                <button onClick={() => handleDelete(selectedEv)} className="px-6 py-2 bg-rose-950/30 border border-soc-red text-soc-red text-xs font-mono-tabular font-bold tracking-widest rounded hover:bg-soc-red hover:text-black transition-colors ml-auto flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Purge Artifact
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
