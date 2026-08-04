import React from 'react';
import { Search, ShieldAlert, Bell, User, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function TopHeader() {
  const { user, logoutUser, notifications } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <header className="h-14 border-b border-soc-panel-border bg-[#03070f] flex items-center justify-between px-4 sticky top-0 z-50">
      {/* Brand & Threat Level */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-soc-cyan" />
          <span className="font-bold tracking-widest text-soc-text">DEIMS <span className="text-soc-cyan font-mono-tabular">SOC</span></span>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-rose-950/30 border border-rose-500/20 rounded-md">
          <span className="w-2 h-2 rounded-full bg-soc-red animate-pulse"></span>
          <span className="text-[10px] font-mono-tabular text-rose-400 uppercase font-bold tracking-widest">Global Threat: Elevated</span>
        </div>
      </div>

      {/* Search */}
      <div className="hidden lg:flex flex-1 max-w-xl mx-8">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-soc-muted" />
          <input 
            type="text" 
            placeholder="Search hashes, IPs, cases or users... (Ctrl+K)" 
            className="w-full bg-[#0a1122] border border-soc-panel-border text-sm text-soc-text px-10 py-1.5 rounded-md focus:outline-none focus:border-soc-cyan focus:ring-1 focus:ring-soc-cyan transition-all font-mono-tabular placeholder:font-sans"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <button className="relative text-soc-muted hover:text-soc-cyan transition-colors">
          <Bell className="w-5 h-5" />
          {notifications?.length > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-soc-red rounded-full border border-[#03070f]"></span>
          )}
        </button>
        <div className="h-6 w-px bg-soc-panel-border"></div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-soc-text">{user?.fullName}</div>
            <div className="text-[10px] font-mono-tabular text-soc-cyan uppercase tracking-wider">{user?.role}</div>
          </div>
          <button onClick={() => navigate('/profile')} className="w-8 h-8 rounded bg-soc-panel-border flex items-center justify-center text-sm font-bold text-soc-cyan border border-soc-cyan/30 hover:bg-soc-cyan hover:text-black transition-colors">
            {user?.initials || 'U'}
          </button>
          <button onClick={handleLogout} className="text-soc-muted hover:text-soc-red transition-colors ml-2" title="End Session">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
