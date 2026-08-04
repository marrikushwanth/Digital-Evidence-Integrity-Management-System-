import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Search, Filter } from 'lucide-react';
import SocCard from '../components/ui/SocCard';
import StatusBadge from '../components/ui/StatusBadge';
import { useApp } from '../context/AppContext';

export default function AuditLogs() {
  const { auditLogs } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  let filteredLogs = auditLogs;
  
  if (searchTerm) {
    filteredLogs = filteredLogs.filter(log => 
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  if (filterAction !== 'All') {
    filteredLogs = filteredLogs.filter(log => log.action.includes(filterAction) || (filterAction === 'USER' && (log.action.includes('USER') || log.action.includes('ROLE') || log.action.includes('LOGIN'))));
  }

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Extract unique high-level actions for filter
  const actionTypes = ['All', 'USER', 'CASE', 'EVIDENCE', 'LOGIN'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-mono-tabular font-bold text-soc-text uppercase tracking-widest flex items-center gap-2">
            <Terminal className="w-5 h-5 text-soc-cyan" /> System Audit Stream
          </h1>
          <p className="text-xs text-soc-muted font-mono-tabular">Immutable chronological record of system activities.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soc-muted" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#0a1122] border border-soc-panel-border text-sm text-soc-text pl-9 pr-3 py-2 rounded-md focus:outline-none focus:border-soc-cyan font-mono-tabular w-48"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soc-muted" />
            <select 
              value={filterAction}
              onChange={(e) => { setFilterAction(e.target.value); setCurrentPage(1); }}
              className="bg-[#0a1122] border border-soc-panel-border text-sm text-soc-text pl-9 pr-8 py-2 rounded-md focus:outline-none focus:border-soc-cyan font-mono-tabular appearance-none"
            >
              {actionTypes.map(type => <option key={type} value={type}>{type} Actions</option>)}
            </select>
          </div>
        </div>
      </div>

      <SocCard className="overflow-hidden border border-soc-cyan/30 shadow-[0_0_20px_rgba(0,240,255,0.05)]">
        <div className="bg-[#03070f] p-3 border-b border-soc-panel-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
            </div>
            <span className="text-[10px] font-mono-tabular text-soc-muted ml-2">deims@core-node:~$ tail -f /var/log/syslog</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono-tabular">
            <thead>
              <tr className="text-[10px] text-soc-muted uppercase border-b border-soc-panel-border bg-[#0a1122]">
                <th className="p-3 font-normal">Timestamp</th>
                <th className="p-3 font-normal">Event ID</th>
                <th className="p-3 font-normal">Operator</th>
                <th className="p-3 font-normal">Action Type</th>
                <th className="p-3 font-normal">Details</th>
                <th className="p-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soc-panel-border/30">
              {paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#0a1122]/80 transition-colors">
                  <td className="p-3 text-[10px] text-soc-muted whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-3 text-[10px] text-soc-cyan">{log.id}</td>
                  <td className="p-3 text-[10px] text-soc-text">{log.user}</td>
                  <td className="p-3 text-[10px] text-amber-400">{log.action}</td>
                  <td className="p-3 text-xs text-soc-text max-w-md truncate" title={log.details}>{log.details}</td>
                  <td className="p-3"><StatusBadge status={log.status} /></td>
                </tr>
              ))}
              {paginatedLogs.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-sm text-soc-muted">No audit events match criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex justify-between items-center p-3 border-t border-soc-panel-border bg-[#03070f]">
            <span className="text-xs text-soc-muted font-mono-tabular">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-[#0a1122] border border-soc-panel-border text-soc-text text-xs rounded disabled:opacity-50"
              >
                Prev
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-[#0a1122] border border-soc-panel-border text-soc-text text-xs rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </SocCard>
    </motion.div>
  );
}
