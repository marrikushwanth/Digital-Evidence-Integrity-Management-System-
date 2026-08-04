import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Shield, Mail, Phone, Building, Briefcase, Key, Save } from 'lucide-react';
import SocCard from '../components/ui/SocCard';
import { useApp } from '../context/AppContext';

export default function Profile() {
  const { user, editUser, resetPassword } = useApp();
  
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '+1 (555) 019-8234',
    department: user?.department || 'Cyber Forensics Unit',
    organization: user?.organization || 'Federal Cyber Agency'
  });

  const [passwordData, setPasswordData] = useState({
    current: '',
    newPass: '',
    confirm: ''
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleProfileSave = (e) => {
    e.preventDefault();
    editUser(user.id, profileData);
    setIsEditing(false);
    alert("Profile metadata updated successfully.");
  };

  const handlePasswordSave = (e) => {
    e.preventDefault();
    if (passwordData.newPass !== passwordData.confirm) {
      alert("New cryptographic passkeys do not match.");
      return;
    }
    if (passwordData.current !== user.password) {
      alert("Current passkey is invalid.");
      return;
    }
    resetPassword(user.id, passwordData.newPass);
    setPasswordData({ current: '', newPass: '', confirm: '' });
    alert("Passkey successfully updated.");
  };

  if (!user) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-mono-tabular font-bold text-soc-text uppercase tracking-widest flex items-center gap-2">
          <User className="w-5 h-5 text-soc-cyan" /> Operator Profile
        </h1>
        <p className="text-xs text-soc-muted font-mono-tabular">Manage your secure identity and access credentials.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ID Card */}
        <div className="lg:col-span-1 space-y-6">
          <SocCard className="relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-soc-cyan via-soc-green to-soc-cyan" />
            
            <div className="flex flex-col items-center p-6 text-center border-b border-soc-panel-border bg-[#03070f]">
              <div className="w-24 h-24 rounded-full bg-[#0a1122] border-2 border-soc-cyan flex items-center justify-center mb-4 relative shadow-[0_0_20px_rgba(0,240,255,0.15)] group-hover:shadow-[0_0_30px_rgba(0,240,255,0.3)] transition-shadow">
                <span className="text-3xl font-black text-soc-cyan">{user.initials || user.fullName.charAt(0)}</span>
                {user.role === 'Super Admin' && (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-black rounded-full flex items-center justify-center border border-soc-panel-border" title="Super Admin">
                    <span className="text-lg">👑</span>
                  </div>
                )}
              </div>
              <h2 className="text-lg font-bold text-soc-text">{user.fullName}</h2>
              <p className="text-xs font-mono-tabular text-soc-cyan tracking-widest uppercase mt-1">{user.role}</p>
            </div>

            <div className="p-6 space-y-4 font-mono-tabular text-xs">
              <div>
                <span className="text-soc-muted block mb-1">Operator ID</span>
                <span className="text-soc-text">{user.id}</span>
              </div>
              <div>
                <span className="text-soc-muted block mb-1">Username</span>
                <span className="text-soc-text">{user.username}</span>
              </div>
              <div>
                <span className="text-soc-muted block mb-1">Clearance Status</span>
                <span className="text-soc-green flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-soc-green" /> ACTIVE</span>
              </div>
            </div>
          </SocCard>
        </div>

        {/* Edit Forms */}
        <div className="lg:col-span-2 space-y-6">
          <SocCard title="Identity Metadata">
            <form onSubmit={handleProfileSave} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono-tabular text-soc-muted uppercase tracking-wider block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soc-muted" />
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={profileData.fullName}
                      onChange={e => setProfileData({...profileData, fullName: e.target.value})}
                      className="w-full bg-[#03070f] border border-soc-panel-border rounded-md py-2.5 pl-10 pr-3 text-sm text-soc-text focus:outline-none focus:border-soc-cyan disabled:opacity-60"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono-tabular text-soc-muted uppercase tracking-wider block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soc-muted" />
                    <input
                      type="email"
                      disabled={!isEditing}
                      value={profileData.email}
                      onChange={e => setProfileData({...profileData, email: e.target.value})}
                      className="w-full bg-[#03070f] border border-soc-panel-border rounded-md py-2.5 pl-10 pr-3 text-sm text-soc-text focus:outline-none focus:border-soc-cyan disabled:opacity-60"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono-tabular text-soc-muted uppercase tracking-wider block">Contact Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soc-muted" />
                    <input
                      type="tel"
                      disabled={!isEditing}
                      value={profileData.phone}
                      onChange={e => setProfileData({...profileData, phone: e.target.value})}
                      className="w-full bg-[#03070f] border border-soc-panel-border rounded-md py-2.5 pl-10 pr-3 text-sm text-soc-text focus:outline-none focus:border-soc-cyan disabled:opacity-60"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono-tabular text-soc-muted uppercase tracking-wider block">Department</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soc-muted" />
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={profileData.department}
                      onChange={e => setProfileData({...profileData, department: e.target.value})}
                      className="w-full bg-[#03070f] border border-soc-panel-border rounded-md py-2.5 pl-10 pr-3 text-sm text-soc-text focus:outline-none focus:border-soc-cyan disabled:opacity-60"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-mono-tabular text-soc-muted uppercase tracking-wider block">Organization</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soc-muted" />
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={profileData.organization}
                      onChange={e => setProfileData({...profileData, organization: e.target.value})}
                      className="w-full bg-[#03070f] border border-soc-panel-border rounded-md py-2.5 pl-10 pr-3 text-sm text-soc-text focus:outline-none focus:border-soc-cyan disabled:opacity-60"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-soc-panel-border">
                {isEditing ? (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 border border-soc-panel-border text-soc-text text-xs rounded hover:bg-soc-panel-border">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-soc-cyan/10 border border-soc-cyan text-soc-cyan text-xs font-bold rounded flex items-center gap-2 hover:bg-soc-cyan hover:text-black">
                      <Save className="w-4 h-4" /> Save Metadata
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setIsEditing(true)} className="px-4 py-2 bg-[#0a1122] border border-soc-panel-border text-soc-text text-xs font-bold rounded hover:border-soc-cyan transition-colors">
                    Edit Metadata
                  </button>
                )}
              </div>
            </form>
          </SocCard>

          <SocCard title="Cryptographic Passkey Renewal">
            <form onSubmit={handlePasswordSave} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-mono-tabular text-soc-muted uppercase tracking-wider block">Current Passkey</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soc-muted" />
                  <input
                    type="password"
                    value={passwordData.current}
                    onChange={e => setPasswordData({...passwordData, current: e.target.value})}
                    className="w-full bg-[#03070f] border border-soc-panel-border rounded-md py-2.5 pl-10 pr-3 text-sm text-soc-text focus:outline-none focus:border-soc-cyan"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono-tabular text-soc-muted uppercase tracking-wider block">New Passkey</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soc-muted" />
                    <input
                      type="password"
                      value={passwordData.newPass}
                      onChange={e => setPasswordData({...passwordData, newPass: e.target.value})}
                      className="w-full bg-[#03070f] border border-soc-panel-border rounded-md py-2.5 pl-10 pr-3 text-sm text-soc-text focus:outline-none focus:border-soc-cyan"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono-tabular text-soc-muted uppercase tracking-wider block">Confirm New Passkey</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soc-muted" />
                    <input
                      type="password"
                      value={passwordData.confirm}
                      onChange={e => setPasswordData({...passwordData, confirm: e.target.value})}
                      className="w-full bg-[#03070f] border border-soc-panel-border rounded-md py-2.5 pl-10 pr-3 text-sm text-soc-text focus:outline-none focus:border-soc-cyan"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-soc-panel-border">
                <button type="submit" className="px-4 py-2 bg-rose-950/30 border border-soc-red text-soc-red text-xs font-bold rounded hover:bg-soc-red hover:text-black transition-colors">
                  Force Key Rotation
                </button>
              </div>
            </form>
          </SocCard>
        </div>
      </div>
    </motion.div>
  );
}
