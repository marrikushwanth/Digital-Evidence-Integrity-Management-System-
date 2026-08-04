import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCommit, Search, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import SocCard from '../components/ui/SocCard';
import StatusBadge from '../components/ui/StatusBadge';
import { useApp } from '../context/AppContext';

export default function ChainOfCustody() {
  const { custodyTimeline, evidence } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState({});

  const toggleExpand = (evidenceId) => {
    setExpandedItems(prev => ({ ...prev, [evidenceId]: !prev[evidenceId] }));
  };

  // Group events by evidenceId
  const groupedEvents = custodyTimeline.reduce((acc, event) => {
    if (!acc[event.evidenceId]) {
      acc[event.evidenceId] = [];
    }
    acc[event.evidenceId].push(event);
    return acc;
  }, {});

  // Filter evidence based on search term
  const filteredEvidenceIds = Object.keys(groupedEvents).filter(id => {
    const ev = evidence.find(e => e.id === id);
    const searchLower = searchTerm.toLowerCase();
    return id.toLowerCase().includes(searchLower) || (ev && ev.fileName.toLowerCase().includes(searchLower));
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
        return 'border-soc-green bg-soc-green shadow-[0_0_10px_rgba(0,255,157,0.5)]';
      case 'tampered':
      case 'danger':
        return 'border-soc-red bg-soc-red shadow-[0_0_10px_rgba(255,0,60,0.5)]';
      default:
        return 'border-soc-cyan bg-soc-cyan shadow-[0_0_10px_rgba(0,240,255,0.5)]';
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-mono-tabular font-bold text-soc-text uppercase tracking-widest flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-soc-cyan" /> Chain of Custody
          </h1>
          <p className="text-xs text-soc-muted font-mono-tabular">Immutable chronological record of evidence handling.</p>
        </div>
        
        <div className="w-full md:w-72 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soc-muted" />
          <input 
            type="text" 
            placeholder="Search Evidence ID or File..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0a1122] border border-soc-panel-border text-sm text-soc-text px-10 py-2 rounded-md focus:outline-none focus:border-soc-cyan focus:ring-1 focus:ring-soc-cyan font-mono-tabular"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredEvidenceIds.length === 0 ? (
          <SocCard className="p-8 text-center text-sm text-soc-muted font-mono-tabular">
            No custody records found.
          </SocCard>
        ) : (
          filteredEvidenceIds.map((evidenceId) => {
            const evEvents = groupedEvents[evidenceId];
            const evDetails = evidence.find(e => e.id === evidenceId);
            const isExpanded = expandedItems[evidenceId];

            return (
              <SocCard key={evidenceId} className="overflow-hidden">
                <div 
                  className="p-4 bg-[#050b14] hover:bg-[#0a1122] cursor-pointer flex items-center justify-between border-b border-soc-panel-border transition-colors"
                  onClick={() => toggleExpand(evidenceId)}
                >
                  <div className="flex items-center gap-4">
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-soc-cyan" /> : <ChevronRight className="w-5 h-5 text-soc-muted" />}
                    <div>
                      <h2 className="text-sm font-mono-tabular font-bold text-soc-cyan tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4" /> {evidenceId}
                      </h2>
                      <p className="text-[10px] font-mono-tabular text-soc-text mt-1">
                        Case: <span className="text-soc-muted">{evDetails?.caseId || evEvents[0]?.caseId || 'Unknown'}</span>
                        {evDetails && <span className="ml-3">File: <span className="text-soc-muted">{evDetails.fileName}</span></span>}
                      </p>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono-tabular text-soc-muted">
                    {evEvents.length} Events Recorded
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-[#03070f]"
                    >
                      <div className="p-6 relative border-l-2 border-soc-panel-border ml-6 md:ml-10 my-4 space-y-8">
                        {evEvents.map((event, idx) => (
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={event.id} 
                            className="relative pl-6 md:pl-8"
                          >
                            {/* Timeline Node */}
                            <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 ${getStatusColor(event.status)}`}></div>
                            
                            <div className="bg-[#0a1122] border border-soc-panel-border p-4 rounded-lg shadow-md">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 border-b border-soc-panel-border/50 pb-2">
                                <div className="text-[10px] font-mono-tabular text-soc-muted bg-[#03070f] px-2 py-1 rounded">
                                  {new Date(event.timestamp).toLocaleString()}
                                </div>
                                <StatusBadge status={event.status} />
                              </div>
                              
                              <h3 className="text-sm font-bold text-soc-text tracking-wide mb-3">
                                {event.action}
                              </h3>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono-tabular">
                                <div>
                                  <span className="block text-[10px] text-soc-muted uppercase mb-1">Actor</span>
                                  <span className="text-soc-cyan">{event.actor}</span> <span className="text-soc-muted ml-1">({event.role})</span>
                                </div>
                                <div>
                                  <span className="block text-[10px] text-soc-muted uppercase mb-1">Location</span>
                                  <span className="text-soc-text">{event.location || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </SocCard>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
