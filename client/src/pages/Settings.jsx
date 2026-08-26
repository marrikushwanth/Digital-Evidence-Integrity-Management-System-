import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Bell, Shield, Monitor, Key, TerminalSquare, ShieldCheck, LogOut, CheckCircle, Smartphone } from 'lucide-react';
import SocCard from '../components/ui/SocCard';
import { useApp } from '../context/AppContext';

export default function Settings() {
  const { user, apiFetch } = useApp();
  
  const [mfaSetup, setMfaSetup] = useState(null); // { secret, qr_code }
  const [mfaCode, setMfaCode] = useState('');
  const [mfaPassword, setMfaPassword] = useState(''); // for disabling
  const [recoveryCodes, setRecoveryCodes] = useState(null); // array of codes
  
  const [sessions, setSessions] = useState([]);
  
  const [pwd, setPwd] = useState({ old: '', new: '' });
  
  const [msg, setMsg] = useState({ type: '', text: '' });
  
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    const res = await apiFetch('/auth/sessions');
    if (res.data && res.data.success) {
      setSessions(res.data.data.sessions);
    }
  };

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 5000);
  };

  // MFA Handlers
  const handleEnableMfa = async () => {
    const res = await apiFetch('/auth/mfa/setup', { method: 'POST' });
    if (res.data && res.data.success) {
      setMfaSetup(res.data.data);
    } else {
      showMsg('error', res.data?.message || 'Failed to initialize MFA');
    }
  };

  const handleVerifyMfaSetup = async () => {
    const res = await apiFetch('/auth/mfa/verify-setup', { 
      method: 'POST', 
      body: JSON.stringify({ token: mfaCode }) 
    });
    if (res.data && res.data.success) {
      showMsg('success', 'MFA Enabled Successfully. Please save your recovery codes.');
      user.mfa_enabled = true; // Optimistic update
      setMfaSetup(null);
      setMfaCode('');
      if (res.data.data?.recovery_codes) {
        setRecoveryCodes(res.data.data.recovery_codes);
      }
    } else {
      showMsg('error', res.data?.message || 'Invalid code');
    }
  };

  const handleRegenerateCodes = async () => {
    if (!window.confirm("This will invalidate your old recovery codes. Are you sure?")) return;
    const pwd = window.prompt("Enter your password to regenerate recovery codes:");
    if (!pwd) return;
    
    const res = await apiFetch('/auth/mfa/recovery-codes/regenerate', {
      method: 'POST',
      body: JSON.stringify({ password: pwd })
    });
    
    if (res.data && res.data.success) {
      showMsg('success', 'Recovery Codes Regenerated');
      setRecoveryCodes(res.data.data.recovery_codes);
    } else {
      showMsg('error', res.data?.message || 'Failed to regenerate codes');
    }
  };

  const handleDisableMfa = async () => {
    const res = await apiFetch('/auth/mfa/disable', {
      method: 'POST',
      body: JSON.stringify({ password: mfaPassword })
    });
    if (res.data && res.data.success) {
      showMsg('success', 'MFA Disabled Successfully');
      user.mfa_enabled = false; // Optimistic update
      setMfaPassword('');
    } else {
      showMsg('error', res.data?.message || 'Failed to disable MFA');
    }
  };

  // Password Handlers
  const handleChangePassword = async (e) => {
    e.preventDefault();
    const res = await apiFetch('/auth/change-password', {
      method: 'PATCH',
      body: JSON.stringify({ old_password: pwd.old, new_password: pwd.new })
    });
    if (res.data && res.data.success) {
      showMsg('success', 'Password Changed Successfully');
      setPwd({ old: '', new: '' });
    } else {
      showMsg('error', res.data?.message || 'Failed to change password');
    }
  };

  // Session Handlers
  const handleRevokeSession = async (id) => {
    const res = await apiFetch(`/auth/sessions/${id}`, { method: 'DELETE' });
    if (res.data && res.data.success) {
      showMsg('success', 'Session Revoked');
      fetchSessions();
    } else {
      showMsg('error', 'Failed to revoke session');
    }
  };
  
  const handleLogoutAll = async () => {
    const res = await apiFetch('/auth/logout-all', { method: 'POST' });
    if (res.data && res.data.success) {
      showMsg('success', 'All sessions revoked');
      fetchSessions();
      window.location.reload();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-mono-tabular font-bold text-soc-text uppercase tracking-widest flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-soc-cyan" /> Security & Configuration
        </h1>
        <p className="text-xs text-soc-muted font-mono-tabular">Manage authentication, active sessions, and account security.</p>
      </div>

      {msg.text && (
        <div className={`p-3 text-xs font-mono-tabular rounded border flex items-center gap-2 ${msg.type === 'error' ? 'bg-rose-950/40 border-rose-500/50 text-soc-red' : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400'}`}>
          <TerminalSquare className="w-4 h-4" /> {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Multi-Factor Authentication */}
        <SocCard title="Multi-Factor Authentication" className="h-max">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-soc-cyan">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-widest">Two-Step Verification</h3>
              </div>
              {user?.mfa_enabled && <span className="px-2 py-1 bg-emerald-950/40 border border-emerald-500/50 text-emerald-400 text-[10px] rounded flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Active</span>}
            </div>

            {!user?.mfa_enabled ? (
              !mfaSetup ? (
                <div>
                  <p className="text-xs text-soc-muted mb-4">Protect your account with TOTP (Google Authenticator, Authy, etc).</p>
                  <button onClick={handleEnableMfa} className="w-full py-2 bg-soc-cyan/10 border border-soc-cyan text-soc-cyan text-xs font-mono-tabular font-bold rounded hover:bg-soc-cyan hover:text-black transition">
                    Setup MFA
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-soc-muted">Scan the QR code with your authenticator app, then enter the 6-digit code.</p>
                  <div className="flex justify-center p-4 bg-white rounded">
                    <img src={mfaSetup.qr_code} alt="QR Code" className="w-40 h-40" />
                  </div>
                  <div className="text-center text-xs font-mono text-soc-muted tracking-widest">{mfaSetup.secret}</div>
                  <input type="text" value={mfaCode} onChange={e=>setMfaCode(e.target.value)} placeholder="000000" className="w-full bg-[#03070f] border border-soc-panel-border rounded p-2 text-sm text-soc-text text-center tracking-widest" />
                  <div className="flex gap-2">
                    <button onClick={handleVerifyMfaSetup} className="flex-1 py-2 bg-soc-cyan/10 border border-soc-cyan text-soc-cyan text-xs rounded hover:bg-soc-cyan hover:text-black transition">Verify & Enable</button>
                    <button onClick={()=>setMfaSetup(null)} className="py-2 px-4 border border-soc-panel-border text-soc-muted text-xs rounded hover:text-white transition">Cancel</button>
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-4">
                {recoveryCodes && (
                  <div className="p-4 bg-soc-cyan/10 border border-soc-cyan/50 rounded mb-4">
                    <h4 className="text-soc-cyan text-xs font-bold uppercase mb-2">Save These Recovery Codes</h4>
                    <p className="text-xs text-soc-text mb-3">Store these safely. You can use them to login if you lose your device.</p>
                    <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono tracking-widest text-soc-text mb-3">
                      {recoveryCodes.map((c, i) => (
                        <div key={i} className="bg-[#03070f] p-1.5 rounded border border-soc-panel-border">{c}</div>
                      ))}
                    </div>
                    <button onClick={() => setRecoveryCodes(null)} className="w-full py-2 bg-soc-cyan text-black text-xs font-bold rounded hover:opacity-80 transition">
                      I have saved them
                    </button>
                  </div>
                )}
                
                <p className="text-xs text-soc-muted">MFA is currently enabled on your account.</p>
                <button onClick={handleRegenerateCodes} className="w-full py-2 bg-[#03070f] border border-soc-panel-border text-soc-muted text-xs rounded hover:text-white transition">
                  Regenerate Backup Codes
                </button>
                
                <hr className="border-soc-panel-border" />
                
                <p className="text-xs text-soc-muted mt-4">To disable MFA, confirm your password.</p>
                <input type="password" value={mfaPassword} onChange={e=>setMfaPassword(e.target.value)} placeholder="Current Password" className="w-full bg-[#03070f] border border-soc-panel-border rounded p-2 text-sm text-soc-text" />
                <button onClick={handleDisableMfa} className="w-full py-2 bg-rose-950/40 border border-rose-500/50 text-soc-red text-xs rounded hover:bg-rose-500 hover:text-white transition">
                  Disable MFA
                </button>
              </div>
            )}
          </div>
        </SocCard>

        {/* Change Password */}
        <SocCard title="Password Security" className="h-max">
          <form onSubmit={handleChangePassword} className="p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4 text-soc-cyan">
              <Key className="w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-widest">Change Password</h3>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] text-soc-muted uppercase tracking-wider block">Current Password</label>
              <input type="password" value={pwd.old} onChange={e=>setPwd({...pwd, old: e.target.value})} className="w-full bg-[#03070f] border border-soc-panel-border rounded py-2 px-3 text-sm text-soc-text focus:border-soc-cyan focus:outline-none" required />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] text-soc-muted uppercase tracking-wider block">New Password</label>
              <input type="password" value={pwd.new} onChange={e=>setPwd({...pwd, new: e.target.value})} className="w-full bg-[#03070f] border border-soc-panel-border rounded py-2 px-3 text-sm text-soc-text focus:border-soc-cyan focus:outline-none" required />
              <p className="text-[10px] text-soc-muted mt-1">Must be at least 8 chars, contain numbers, upper & lower case.</p>
            </div>
            
            <button type="submit" className="w-full py-2 bg-soc-cyan/10 border border-soc-cyan text-soc-cyan text-xs font-bold rounded hover:bg-soc-cyan hover:text-black transition">
              Update Password
            </button>
          </form>
        </SocCard>

        {/* Active Sessions */}
        <SocCard title="Active Sessions" className="lg:col-span-2">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-soc-cyan">
                <Monitor className="w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-widest">Device Activity</h3>
              </div>
              <button onClick={handleLogoutAll} className="flex items-center gap-2 px-3 py-1.5 bg-rose-950/40 border border-rose-500/50 text-soc-red text-[10px] rounded hover:bg-rose-500 hover:text-white transition">
                <LogOut className="w-3 h-3" /> Revoke All Devices
              </button>
            </div>

            <div className="overflow-x-auto border border-soc-panel-border rounded">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0a1122] border-b border-soc-panel-border">
                    <th className="p-3 text-[10px] font-mono text-soc-muted uppercase tracking-wider">Device</th>
                    <th className="p-3 text-[10px] font-mono text-soc-muted uppercase tracking-wider">IP Address</th>
                    <th className="p-3 text-[10px] font-mono text-soc-muted uppercase tracking-wider">Last Active</th>
                    <th className="p-3 text-[10px] font-mono text-soc-muted uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s.id} className="border-b border-soc-panel-border/50 hover:bg-[#03070f] transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2 text-xs text-soc-text">
                          <Smartphone className="w-4 h-4 text-soc-cyan" />
                          <span title={s.user_agent}>{s.device_info || 'Unknown Device'}</span>
                          {s.current && <span className="px-1.5 py-0.5 bg-soc-cyan/20 text-soc-cyan text-[8px] rounded border border-soc-cyan/30">CURRENT</span>}
                        </div>
                      </td>
                      <td className="p-3 text-xs text-soc-muted font-mono">{s.ip_address}</td>
                      <td className="p-3 text-xs text-soc-muted">{new Date(s.last_used_at).toLocaleString()}</td>
                      <td className="p-3 text-right">
                        {!s.current && (
                          <button onClick={() => handleRevokeSession(s.id)} className="text-[10px] text-soc-red hover:underline uppercase">Revoke</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {sessions.length === 0 && (
                    <tr><td colSpan="4" className="p-4 text-center text-xs text-soc-muted">No active sessions found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </SocCard>

      </div>
      
      {/* Notifications Preferences */}
      <SocCard title="Notification Preferences" className="mt-6">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 text-soc-cyan">
              <Bell className="w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-widest">Alert Channels</h3>
            </div>
          </div>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 border border-soc-panel-border rounded hover:bg-[#03070f] transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={user?.email_notifications_enabled ?? true} 
                  onChange={async (e) => {
                    const checked = e.target.checked;
                    const res = await apiFetch('/users/me/preferences', {
                      method: 'PATCH',
                      body: JSON.stringify({ email_notifications_enabled: checked })
                    });
                    if (res.data?.success) {
                      showMsg('success', 'Preferences updated');
                      user.email_notifications_enabled = checked;
                    }
                  }}
                  className="w-4 h-4 text-soc-cyan bg-[#0a1122] border-soc-panel-border focus:ring-soc-cyan" />
                <div>
                  <div className="text-sm text-soc-text font-bold">Email Alerts</div>
                  <div className="text-xs text-soc-muted">Receive security alerts for suspicious logins, password changes, etc.</div>
                </div>
              </div>
            </label>
            
            <label className="flex items-center justify-between p-3 border border-soc-panel-border/30 bg-[#0a1122]/50 rounded opacity-50 cursor-not-allowed">
              <div className="flex items-center gap-3">
                <input type="checkbox" disabled className="w-4 h-4" />
                <div>
                  <div className="text-sm text-soc-text font-bold flex items-center gap-2">SMS Alerts <span className="text-[10px] px-1.5 py-0.5 bg-soc-panel-border rounded text-soc-muted uppercase tracking-wider">Not Available</span></div>
                  <div className="text-xs text-soc-muted">SMS provider not configured for this instance.</div>
                </div>
              </div>
            </label>
          </div>
        </div>
      </SocCard>

    </motion.div>
  );
}
