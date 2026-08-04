import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  HardDrive, 
  ShieldCheck, 
  GitCommit, 
  Terminal, 
  FileBarChart, 
  Users, 
  Settings, 
  User 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function LeftSidebar() {
  const { hasRole } = useApp();

  const allNavItems = [
    { label: 'Dashboard', icon: <LayoutDashboard />, path: '/', allowedRoles: ['Super Admin', 'Admin', 'Investigator', 'Auditor', 'Editor', 'Viewer'] },
    { label: 'Investigations', icon: <Briefcase />, path: '/cases', allowedRoles: ['Super Admin', 'Admin', 'Investigator', 'Editor'] },
    { label: 'Evidence Vault', icon: <HardDrive />, path: '/evidence', allowedRoles: ['Super Admin', 'Admin', 'Investigator', 'Auditor', 'Editor', 'Viewer'] },
    { label: 'Integrity Check', icon: <ShieldCheck />, path: '/verify', allowedRoles: ['Super Admin', 'Admin', 'Investigator'] },
    { label: 'Chain of Custody', icon: <GitCommit />, path: '/custody', allowedRoles: ['Super Admin', 'Admin', 'Investigator', 'Auditor'] },
    { label: 'System Audits', icon: <Terminal />, path: '/audit-logs', allowedRoles: ['Super Admin', 'Admin', 'Auditor'] },
    { label: 'Reports Gen', icon: <FileBarChart />, path: '/reports', allowedRoles: ['Super Admin', 'Admin', 'Investigator', 'Auditor', 'Editor', 'Viewer'] },
    { label: 'Access Control', icon: <Users />, path: '/users', allowedRoles: ['Super Admin', 'Admin'] },
    { label: 'Operator Profile', icon: <User />, path: '/profile', allowedRoles: ['Super Admin', 'Admin', 'Investigator', 'Auditor', 'Editor', 'Viewer'] },
    { label: 'Config', icon: <Settings />, path: '/settings', allowedRoles: ['Super Admin', 'Admin', 'Investigator', 'Auditor', 'Editor', 'Viewer'] }
  ];

  const visibleNavItems = allNavItems.filter(item => hasRole(item.allowedRoles));

  return (
    <aside className="w-16 lg:w-64 border-r border-soc-panel-border bg-[#03070f] flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto">
      <div className="p-3">
        <div className="text-[10px] font-mono-tabular text-soc-muted uppercase tracking-widest mb-3 px-2 hidden lg:block">System Modules</div>
        <nav className="space-y-1">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 py-2.5 rounded-md transition-all group ${
                  isActive 
                    ? 'bg-soc-cyan/10 text-soc-cyan border border-soc-cyan/30 shadow-[inset_2px_0_0_#00f0ff]' 
                    : 'text-soc-muted hover:bg-[#0a1122] hover:text-soc-text border border-transparent'
                }`
              }
              title={item.label}
            >
              <span className="[&>svg]:w-5 [&>svg]:h-5 shrink-0">{item.icon}</span>
              <span className="text-xs font-mono-tabular uppercase tracking-wider hidden lg:block group-hover:text-soc-cyan transition-colors">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      
      <div className="mt-auto p-4 border-t border-soc-panel-border hidden lg:block">
        <div className="flex items-center justify-between text-[10px] font-mono-tabular text-soc-muted">
          <span>v2.0.0-rc1</span>
          <span className="text-soc-green flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-soc-green"></span> Online</span>
        </div>
      </div>
    </aside>
  );
}
