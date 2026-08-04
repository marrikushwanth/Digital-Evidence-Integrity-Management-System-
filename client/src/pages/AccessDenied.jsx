import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AccessDenied() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-soc-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Cyber Rings */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
        <div className="w-[800px] h-[800px] rounded-full border border-soc-red animate-[spin_60s_linear_infinite]" />
      </div>

      <div className="w-full max-w-lg soc-panel border-soc-red/30 z-10 text-center p-12">
        <div className="w-24 h-24 mx-auto rounded-full bg-rose-950/30 border-2 border-soc-red/50 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,0,60,0.2)]">
          <ShieldAlert className="w-12 h-12 text-soc-red animate-pulse" />
        </div>
        
        <h1 className="text-3xl font-black text-soc-red tracking-widest mb-2">ACCESS DENIED</h1>
        <h2 className="text-lg font-mono-tabular text-soc-text tracking-widest mb-6 border-b border-soc-panel-border pb-6">HTTP 403: FORBIDDEN</h2>
        
        <p className="text-sm font-mono-tabular text-soc-muted mb-8">
          Your current operator clearance level is insufficient to access this secure node. Any further unauthorized attempts will be logged and reported to the system administrators.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/" className="px-6 py-3 bg-[#0a1122] border border-soc-panel-border text-soc-text text-xs font-mono-tabular uppercase tracking-widest rounded-md hover:bg-soc-panel-border transition-colors w-full sm:w-auto">
            Return to Dashboard
          </Link>
          <Link to="/login" className="px-6 py-3 bg-rose-950/30 border border-soc-red text-soc-red text-xs font-mono-tabular font-bold uppercase tracking-widest rounded-md hover:bg-soc-red hover:text-black transition-colors shadow-[0_0_15px_rgba(255,0,60,0.2)] w-full sm:w-auto flex justify-center items-center gap-2">
            <LogOut className="w-4 h-4" /> End Session
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
