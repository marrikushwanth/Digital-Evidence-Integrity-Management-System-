import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Bell, Shield, Globe, Monitor, Save } from 'lucide-react';
import SocCard from '../components/ui/SocCard';
import { useApp } from '../context/AppContext';

const Toggle = ({ label, description, isChecked, onChange }) => (
  <div className="flex items-center justify-between p-4 bg-[#0a1122] rounded border border-soc-panel-border">
    <div>
      <h4 className="text-sm text-soc-text">{label}</h4>
      <p className="text-[10px] text-soc-muted mt-1 max-w-[80%]">{description}</p>
    </div>
    <button 
      type="button"
      onClick={() => onChange(!isChecked)}
      className={`w-12 h-6 rounded-full relative transition-colors ${isChecked ? 'bg-soc-cyan' : 'bg-[#03070f] border border-soc-panel-border'}`}
    >
      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${isChecked ? 'translate-x-6' : 'translate-x-0.5'}`} />
    </button>
  </div>
);

export default function Settings() {
  const { addAuditLog } = useApp();
  const [settings, setSettings] = useState({
    emailAlerts: true,
    smsAlerts: false,
    mfaEnabled: true,
    autoLogout: true,
    darkMode: true,
    lang: 'en'
  });

  const handleChange = (key, val) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    addAuditLog('UPDATE_SETTINGS', 'System node preferences updated successfully.');
    alert("System preferences saved securely.");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-mono-tabular font-bold text-soc-text uppercase tracking-widest flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-soc-cyan" /> System Configuration
        </h1>
        <p className="text-xs text-soc-muted font-mono-tabular">Adjust global application preferences and security thresholds.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Security Settings */}
        <SocCard title="Security Policies" className="h-max">
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4 text-soc-cyan">
              <Shield className="w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-widest">Authentication</h3>
            </div>
            
            <Toggle 
              label="Multi-Factor Authentication (MFA)" 
              description="Require biometric or token-based verification for all access attempts." 
              isChecked={settings.mfaEnabled} 
              onChange={v => handleChange('mfaEnabled', v)} 
            />
            
            <Toggle 
              label="Aggressive Session Timeout" 
              description="Automatically terminate connection after 15 minutes of inactivity." 
              isChecked={settings.autoLogout} 
              onChange={v => handleChange('autoLogout', v)} 
            />
          </div>
        </SocCard>

        {/* Notification Settings */}
        <SocCard title="Alert Telemetry" className="h-max">
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4 text-soc-cyan">
              <Bell className="w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-widest">Notifications</h3>
            </div>
            
            <Toggle 
              label="Email Alert Digests" 
              description="Send automated threat intel and case updates via secure email channel." 
              isChecked={settings.emailAlerts} 
              onChange={v => handleChange('emailAlerts', v)} 
            />
            
            <Toggle 
              label="SMS / Pager Alerts" 
              description="Send critical 'Tampered Evidence' alerts directly to mobile devices." 
              isChecked={settings.smsAlerts} 
              onChange={v => handleChange('smsAlerts', v)} 
            />
          </div>
        </SocCard>

        {/* UI Settings */}
        <SocCard title="Interface Preferences" className="h-max">
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4 text-soc-cyan">
              <Monitor className="w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-widest">Display</h3>
            </div>
            
            <Toggle 
              label="Enforce Dark Mode" 
              description="Maintain strict dark/hacker aesthetic to reduce eye strain in low-light SOC environments." 
              isChecked={settings.darkMode} 
              onChange={v => handleChange('darkMode', v)} 
            />
            
            <div className="flex items-center justify-between p-4 bg-[#0a1122] rounded border border-soc-panel-border">
              <div>
                <h4 className="text-sm text-soc-text">System Language</h4>
                <p className="text-[10px] text-soc-muted mt-1 max-w-[80%]">Primary localization for logs and interfaces.</p>
              </div>
              <div className="relative">
                <Globe className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-soc-muted" />
                <select 
                  value={settings.lang}
                  onChange={e => handleChange('lang', e.target.value)}
                  className="bg-[#03070f] border border-soc-panel-border text-xs text-soc-text pl-7 pr-6 py-1.5 rounded focus:outline-none focus:border-soc-cyan appearance-none"
                >
                  <option value="en">English (US)</option>
                  <option value="uk">English (UK)</option>
                  <option value="de">German</option>
                  <option value="fr">French</option>
                </select>
              </div>
            </div>
          </div>
        </SocCard>

      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6">
        <button 
          onClick={handleSave}
          className="px-6 py-3 bg-soc-cyan/10 border border-soc-cyan text-soc-cyan text-xs font-mono-tabular font-bold tracking-widest uppercase rounded hover:bg-soc-cyan hover:text-black transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.2)]"
        >
          <Save className="w-4 h-4" /> Apply Configuration
        </button>
      </div>

    </motion.div>
  );
}
