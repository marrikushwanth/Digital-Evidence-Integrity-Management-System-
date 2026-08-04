import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Search, Plus, Filter, Trash2, Edit2, Lock, Unlock, XCircle } from 'lucide-react';
import SocCard from '../components/ui/SocCard';
import StatusBadge from '../components/ui/StatusBadge';
import { useApp } from '../context/AppContext';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg soc-panel border-soc-cyan/30 p-6 bg-[#03070f]">
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

export default function Cases() {
  const { cases, hasRole, deleteCase, createCase, updateCase, user: activeUser } = useApp();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  
  const [formData, setFormData] = useState({ title: '', investigator: activeUser?.username || '', priority: 'Medium' });

  // Filter cases
  let filteredCases = cases;
  
  // Investigator can only see their own cases if the prompt strictly enforced it, 
  // but "View Own Cases" was in the prompt for Investigator. 
  // Let's filter by investigator if role is Investigator.
  if (activeUser?.role === 'Investigator') {
    filteredCases = filteredCases.filter(c => c.investigator === activeUser.username);
  }

  if (searchTerm) {
    filteredCases = filteredCases.filter(c => 
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.investigator.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  if (statusFilter !== 'All') {
    filteredCases = filteredCases.filter(c => c.status === statusFilter);
  }

  const handleAddSubmit = (e) => {
    e.preventDefault();
    createCase({ ...formData, investigator: formData.investigator || activeUser.username });
    setIsAddModalOpen(false);
    setFormData({ title: '', investigator: activeUser?.username || '', priority: 'Medium' });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updateCase(selectedCase.id, { title: formData.title, priority: formData.priority });
    setIsEditModalOpen(false);
  };

  const handleCloseCase = (id) => updateCase(id, { status: 'Closed' });
  const handleReopenCase = (id) => updateCase(id, { status: 'Active' });

  const canCreate = hasRole(['Super Admin', 'Admin', 'Investigator']);
  const canEditAny = hasRole(['Super Admin', 'Admin', 'Editor']);
  
  const canEditCase = (c) => {
    if (canEditAny) return true;
    if (activeUser?.role === 'Investigator' && c.investigator === activeUser.username) return true;
    return false;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-mono-tabular font-bold text-soc-text uppercase tracking-widest flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-soc-cyan" /> Investigations
          </h1>
          <p className="text-xs text-soc-muted font-mono-tabular">Active and closed security incident cases.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soc-muted" />
            <input 
              type="text" 
              placeholder="Search cases..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#0a1122] border border-soc-panel-border text-sm text-soc-text pl-9 pr-3 py-2 rounded-md focus:outline-none focus:border-soc-cyan font-mono-tabular"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soc-muted" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0a1122] border border-soc-panel-border text-sm text-soc-text pl-9 pr-8 py-2 rounded-md focus:outline-none focus:border-soc-cyan font-mono-tabular appearance-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Under Review">Under Review</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          {canCreate && (
            <button 
              onClick={() => { setFormData({ title: '', investigator: activeUser?.username || '', priority: 'Medium' }); setIsAddModalOpen(true); }}
              className="px-4 py-2 bg-soc-cyan/10 border border-soc-cyan text-soc-cyan text-xs font-mono-tabular font-bold tracking-wider rounded-md hover:bg-soc-cyan hover:text-black transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Case
            </button>
          )}
        </div>
      </div>

      <SocCard className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-mono-tabular text-soc-muted uppercase border-b border-soc-panel-border bg-[#03070f]">
              <th className="p-4 font-normal">Case ID</th>
              <th className="p-4 font-normal">Title</th>
              <th className="p-4 font-normal">Lead Investigator</th>
              <th className="p-4 font-normal">Created Date</th>
              <th className="p-4 font-normal">Status</th>
              <th className="p-4 font-normal">Priority</th>
              <th className="p-4 font-normal text-right">Evidence Count</th>
              <th className="p-4 font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-soc-panel-border/50">
            {filteredCases.map((c) => (
              <tr key={c.id} className="hover:bg-[#0a1122] transition-colors group">
                <td className="p-4 text-xs font-mono-tabular text-soc-cyan font-bold">{c.id}</td>
                <td className="p-4 text-sm text-soc-text">{c.title}</td>
                <td className="p-4 text-xs text-soc-text">{c.investigator}</td>
                <td className="p-4 text-[10px] font-mono-tabular text-soc-muted">{new Date(c.createdDate).toLocaleDateString()}</td>
                <td className="p-4"><StatusBadge status={c.status} /></td>
                <td className="p-4"><StatusBadge status={c.priority} /></td>
                <td className="p-4 text-xs font-mono-tabular text-soc-muted text-right">{c.evidenceCount} artifacts</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    
                    {canEditCase(c) && (
                      <>
                        {c.status !== 'Closed' ? (
                          <button onClick={() => handleCloseCase(c.id)} className="p-1.5 text-soc-muted hover:text-soc-green hover:bg-soc-green/10 rounded" title="Close Case">
                            <Lock className="w-4 h-4" />
                          </button>
                        ) : (
                          <button onClick={() => handleReopenCase(c.id)} className="p-1.5 text-soc-muted hover:text-amber-500 hover:bg-amber-500/10 rounded" title="Reopen Case">
                            <Unlock className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => { setSelectedCase(c); setFormData({ title: c.title, priority: c.priority, investigator: c.investigator }); setIsEditModalOpen(true); }} className="p-1.5 text-soc-muted hover:text-soc-cyan hover:bg-soc-cyan/10 rounded" title="Edit Case">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {hasRole(['Super Admin', 'Admin']) && (
                      <button 
                        onClick={() => { if(window.confirm('Delete case permanently?')) deleteCase(c.id); }}
                        className="p-1.5 text-soc-muted hover:text-soc-red hover:bg-soc-red/10 rounded"
                        title="Delete Case"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                  </div>
                </td>
              </tr>
            ))}
            {filteredCases.length === 0 && (
              <tr>
                <td colSpan="8" className="p-8 text-center text-sm text-soc-muted font-mono-tabular">No cases found matching search criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </SocCard>

      {/* Add Case Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Initialize Investigation">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <input type="text" placeholder="Incident Title / Designation" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-[#0a1122] border border-soc-panel-border rounded p-2 text-sm text-soc-text" />
          
          {hasRole(['Super Admin', 'Admin']) ? (
             <input type="text" placeholder="Lead Investigator Username" required value={formData.investigator} onChange={e => setFormData({...formData, investigator: e.target.value})} className="w-full bg-[#0a1122] border border-soc-panel-border rounded p-2 text-sm text-soc-text" />
          ) : (
            <p className="text-xs text-soc-muted">Investigator: <span className="text-soc-cyan">{activeUser?.username}</span></p>
          )}

          <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full bg-[#0a1122] border border-soc-panel-border rounded p-2 text-sm text-soc-text appearance-none">
            <option value="Low">Priority: Low</option>
            <option value="Medium">Priority: Medium</option>
            <option value="High">Priority: High</option>
            <option value="Critical">Priority: Critical</option>
          </select>
          <button type="submit" className="w-full py-2 bg-soc-cyan/10 border border-soc-cyan text-soc-cyan text-xs font-bold tracking-widest uppercase rounded hover:bg-soc-cyan hover:text-black transition-colors">INITIALIZE CASE</button>
        </form>
      </Modal>

      {/* Edit Case Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modify Case Details">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <input type="text" placeholder="Incident Title / Designation" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-[#0a1122] border border-soc-panel-border rounded p-2 text-sm text-soc-text" />
          <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full bg-[#0a1122] border border-soc-panel-border rounded p-2 text-sm text-soc-text appearance-none">
            <option value="Low">Priority: Low</option>
            <option value="Medium">Priority: Medium</option>
            <option value="High">Priority: High</option>
            <option value="Critical">Priority: Critical</option>
          </select>
          <button type="submit" className="w-full py-2 bg-soc-cyan/10 border border-soc-cyan text-soc-cyan text-xs font-bold tracking-widest uppercase rounded hover:bg-soc-cyan hover:text-black transition-colors">UPDATE CASE</button>
        </form>
      </Modal>
    </motion.div>
  );
}
