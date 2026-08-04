import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Activity, ShieldAlert, Cpu, Server, Network, TerminalSquare, AlertTriangle } from 'lucide-react';
import SocCard from '../components/ui/SocCard';
import StatusBadge from '../components/ui/StatusBadge';
import { useApp } from '../context/AppContext';
import { chartDataArea, mockThreatFeed } from '../data/mockData';

export default function Dashboard() {
  const { cases, evidence, auditLogs, users } = useApp();
  
  // Real-time ticker
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const totalCases = cases.length;
  const verifiedEvi = evidence.filter(e => e.verificationStatus === 'Verified').length;
  const tamperedEvi = evidence.filter(e => e.verificationStatus === 'Tampered').length;
  
  const pieData = [
    { name: 'Verified', value: verifiedEvi, color: '#00ff9d' },
    { name: 'Tampered', value: tamperedEvi, color: '#ff003c' }
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Top row: High-density metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SocCard className="bg-gradient-to-br from-[#050b14] to-[#0a1122]">
          <div className="flex justify-between items-start mb-2">
            <div className="text-[10px] font-mono-tabular text-soc-muted uppercase tracking-widest">Active Cases</div>
            <Activity className="w-4 h-4 text-soc-cyan" />
          </div>
          <div className="text-3xl font-mono-tabular text-soc-text font-bold mb-1">{totalCases}</div>
          <div className="text-[10px] font-mono-tabular text-soc-cyan">+2 from last shift</div>
        </SocCard>

        <SocCard className="bg-gradient-to-br from-[#050b14] to-[#0a1122]">
          <div className="flex justify-between items-start mb-2">
            <div className="text-[10px] font-mono-tabular text-soc-muted uppercase tracking-widest">Verified Hashes</div>
            <ShieldAlert className="w-4 h-4 text-soc-green" />
          </div>
          <div className="text-3xl font-mono-tabular text-soc-text font-bold mb-1">{verifiedEvi}</div>
          <div className="text-[10px] font-mono-tabular text-soc-green">99.9% Integrity Rate</div>
        </SocCard>

        <SocCard highlight className="bg-gradient-to-br from-[#1a0505] to-[#0a1122]">
          <div className="flex justify-between items-start mb-2">
            <div className="text-[10px] font-mono-tabular text-soc-red uppercase tracking-widest font-bold">Tamper Alerts</div>
            <AlertTriangle className="w-4 h-4 text-soc-red animate-pulse" />
          </div>
          <div className="text-3xl font-mono-tabular text-soc-red font-bold mb-1">{tamperedEvi}</div>
          <div className="text-[10px] font-mono-tabular text-soc-red">Immediate attention required</div>
        </SocCard>

        <SocCard className="bg-gradient-to-br from-[#050b14] to-[#0a1122] flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute inset-0 border-[3px] border-soc-cyan/10 rounded-lg pointer-events-none"></div>
          <div className="text-[10px] font-mono-tabular text-soc-cyan uppercase tracking-widest mb-2 z-10">System Time (UTC)</div>
          <div className="text-2xl font-mono-tabular text-soc-cyan font-bold tracking-widest z-10">
            {time.toISOString().substr(11, 8)}
          </div>
        </SocCard>
      </div>

      {/* Middle row: Charts & Node Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SocCard title="Network Traffic & Event Ingestion" className="lg:col-span-2" icon={<Network className="w-4 h-4" />}>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartDataArea}>
                <defs>
                  <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#050b14', borderColor: '#1e293b', fontFamily: 'monospace' }} />
                <Area type="monotone" dataKey="load" stroke="#00f0ff" strokeWidth={2} fillOpacity={1} fill="url(#colorLoad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SocCard>

        <SocCard title="Hardware Nodes" icon={<Server className="w-4 h-4" />}>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[10px] font-mono-tabular text-soc-muted mb-1">
                <span><Cpu className="w-3 h-3 inline mr-1 text-soc-cyan" /> Core Analysis Cluster</span>
                <span className="text-soc-cyan">76%</span>
              </div>
              <div className="w-full h-1 bg-[#0a1122] rounded-full overflow-hidden"><div className="h-full bg-soc-cyan w-[76%]"></div></div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-mono-tabular text-soc-muted mb-1">
                <span><Server className="w-3 h-3 inline mr-1 text-soc-green" /> Storage Array Alpha</span>
                <span className="text-soc-green">42%</span>
              </div>
              <div className="w-full h-1 bg-[#0a1122] rounded-full overflow-hidden"><div className="h-full bg-soc-green w-[42%]"></div></div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-mono-tabular text-soc-muted mb-1">
                <span><Server className="w-3 h-3 inline mr-1 text-soc-red" /> DB Replica (Syncing)</span>
                <span className="text-soc-red">98%</span>
              </div>
              <div className="w-full h-1 bg-[#0a1122] rounded-full overflow-hidden"><div className="h-full bg-soc-red w-[98%] animate-pulse"></div></div>
            </div>
          </div>
          
          <div className="mt-8 border-t border-soc-panel-border pt-4">
            <div className="flex items-center justify-center h-24">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={25} outerRadius={40} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#050b14', borderColor: '#1e293b', fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center text-[10px] font-mono-tabular text-soc-muted uppercase">Global Evidence Integrity</div>
          </div>
        </SocCard>
      </div>

      {/* Bottom row: Live Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SocCard title="Live Audit Stream" icon={<TerminalSquare className="w-4 h-4" />} className="h-80 overflow-y-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-mono-tabular text-soc-muted uppercase border-b border-soc-panel-border">
                <th className="pb-2 font-normal">Timestamp</th>
                <th className="pb-2 font-normal">Actor</th>
                <th className="pb-2 font-normal">Action</th>
                <th className="pb-2 font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soc-panel-border/50">
              {auditLogs.slice(0, 5).map(log => (
                <tr key={log.id} className="hover:bg-[#0a1122] transition-colors">
                  <td className="py-2.5 text-[10px] font-mono-tabular text-soc-muted">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  <td className="py-2.5 text-xs text-soc-text">{log.user}</td>
                  <td className="py-2.5 text-[10px] font-mono-tabular text-soc-cyan">{log.action}</td>
                  <td className="py-2.5"><StatusBadge status={log.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </SocCard>

        <SocCard title="SOC Threat Intelligence" highlight className="h-80 overflow-y-auto border-rose-900/30 shadow-none">
          <div className="space-y-0.5">
            {mockThreatFeed.map((threat) => (
              <div key={threat.id} className="flex items-start gap-3 p-2 bg-[#0a1122]/50 hover:bg-[#0a1122] transition-colors rounded border-l-2 border-transparent hover:border-soc-red group">
                <span className="text-[10px] font-mono-tabular text-soc-muted shrink-0 mt-0.5">{threat.time}</span>
                <div>
                  <span className={`text-[10px] font-mono-tabular font-bold uppercase ${
                    threat.type === 'CRITICAL' ? 'text-soc-red' : threat.type === 'WARNING' ? 'text-amber-400' : 'text-soc-cyan'
                  }`}>
                    [{threat.type}]
                  </span>
                  <p className="text-xs text-soc-text mt-0.5 font-mono-tabular">{threat.text}</p>
                </div>
              </div>
            ))}
          </div>
        </SocCard>
      </div>
    </motion.div>
  );
}
