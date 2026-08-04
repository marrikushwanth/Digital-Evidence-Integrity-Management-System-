import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

export default function StatusBadge({ status, type = 'status' }) {
  let config = {
    color: 'text-soc-muted',
    bg: 'bg-soc-panel-border',
    border: 'border-soc-panel-border',
    icon: null,
    glow: ''
  };

  if (type === 'status') {
    switch (status?.toUpperCase()) {
      case 'VERIFIED':
      case 'ACTIVE':
      case 'SUCCESS':
        config = {
          color: 'text-soc-green',
          bg: 'bg-emerald-950/40',
          border: 'border-soc-green/30',
          icon: <ShieldCheck className="w-3.5 h-3.5" />,
          glow: 'shadow-[0_0_10px_rgba(0,255,157,0.2)]'
        };
        break;
      case 'TAMPERED':
      case 'CRITICAL':
      case 'DANGER':
        config = {
          color: 'text-soc-red',
          bg: 'bg-rose-950/40',
          border: 'border-soc-red/30',
          icon: <ShieldAlert className="w-3.5 h-3.5" />,
          glow: 'shadow-[0_0_10px_rgba(255,0,60,0.2)]'
        };
        break;
      case 'WARNING':
      case 'UNDER REVIEW':
      case 'PENDING APPROVAL':
        config = {
          color: 'text-amber-400',
          bg: 'bg-amber-950/40',
          border: 'border-amber-400/30',
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
          glow: 'shadow-[0_0_10px_rgba(251,191,36,0.2)]'
        };
        break;
      case 'INFO':
        config = {
          color: 'text-soc-cyan',
          bg: 'bg-cyan-950/40',
          border: 'border-soc-cyan/30',
          icon: <CheckCircle className="w-3.5 h-3.5" />,
          glow: 'shadow-[0_0_10px_rgba(0,240,255,0.2)]'
        };
        break;
      default:
        config = {
          color: 'text-slate-400',
          bg: 'bg-slate-900',
          border: 'border-slate-700',
          icon: <Clock className="w-3.5 h-3.5" />,
          glow: ''
        };
    }
  } else if (type === 'role') {
    // Role styling
    if (status === 'Super Admin' || status === 'Admin') {
      config = { color: 'text-soc-cyan', bg: 'bg-cyan-950/30', border: 'border-soc-cyan/30', glow: '' };
    } else if (status === 'Investigator') {
      config = { color: 'text-purple-400', bg: 'bg-purple-950/30', border: 'border-purple-400/30', glow: '' };
    } else {
      config = { color: 'text-soc-muted', bg: 'bg-slate-900', border: 'border-slate-700', glow: '' };
    }
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono-tabular font-bold uppercase tracking-wider border ${config.bg} ${config.color} ${config.border} ${config.glow}`}>
      {config.icon}
      {status}
    </span>
  );
}
