import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, User, TerminalSquare, Eye, EyeOff, Mail, Phone, Building, Briefcase } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    department: '',
    organization: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { registerUser } = useApp();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError("Cryptographic passkeys do not match.");
      return;
    }

    const { confirmPassword, ...userData } = formData;
    const result = registerUser(userData);
    
    if (result.success) {
      setSuccess("Registration submitted successfully. Waiting for Super Admin approval.");
      setTimeout(() => navigate('/login'), 4000);
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-soc-bg flex items-center justify-center p-4 relative overflow-hidden py-10">
      {/* Background Cyber Rings */}
      <div className="fixed inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
        <div className="w-[1000px] h-[1000px] rounded-full border border-soc-cyan animate-[spin_60s_linear_infinite]" />
      </div>

      <div className="w-full max-w-2xl soc-panel border-soc-cyan/30 z-10">
        <div className="p-6 border-b border-soc-panel-border bg-[#03070f] flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-soc-cyan/10 border border-soc-cyan/30 flex items-center justify-center mb-3">
            <Shield className="w-6 h-6 text-soc-cyan" />
          </div>
          <h1 className="text-xl font-black text-soc-text tracking-widest">DEIMS</h1>
          <p className="text-[10px] font-mono-tabular text-soc-cyan tracking-[0.2em] uppercase mt-1">
            Operator Clearance Request Form
          </p>
        </div>
        
        <form onSubmit={handleRegister} className="p-6 md:p-8 space-y-6">
          {error && (
            <div className="bg-rose-950/40 border border-rose-500/50 text-soc-red text-xs font-mono-tabular p-3 rounded-md flex items-start gap-2">
              <TerminalSquare className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="bg-emerald-950/40 border border-soc-green/50 text-soc-green text-xs font-mono-tabular p-3 rounded-md flex items-start gap-2">
              <Shield className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono-tabular text-soc-muted uppercase tracking-wider block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soc-muted" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full bg-[#03070f] border border-soc-panel-border rounded-md py-2.5 pl-10 pr-3 text-sm text-soc-text focus:outline-none focus:border-soc-cyan focus:ring-1 focus:ring-soc-cyan font-mono-tabular"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono-tabular text-soc-muted uppercase tracking-wider block">Operator Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soc-muted" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full bg-[#03070f] border border-soc-panel-border rounded-md py-2.5 pl-10 pr-3 text-sm text-soc-text focus:outline-none focus:border-soc-cyan focus:ring-1 focus:ring-soc-cyan font-mono-tabular"
                  placeholder="jdoe"
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
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-[#03070f] border border-soc-panel-border rounded-md py-2.5 pl-10 pr-3 text-sm text-soc-text focus:outline-none focus:border-soc-cyan focus:ring-1 focus:ring-soc-cyan font-mono-tabular"
                  placeholder="jdoe@agency.gov"
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
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-[#03070f] border border-soc-panel-border rounded-md py-2.5 pl-10 pr-3 text-sm text-soc-text focus:outline-none focus:border-soc-cyan focus:ring-1 focus:ring-soc-cyan font-mono-tabular"
                  placeholder="+1 (555) 000-0000"
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
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full bg-[#03070f] border border-soc-panel-border rounded-md py-2.5 pl-10 pr-3 text-sm text-soc-text focus:outline-none focus:border-soc-cyan focus:ring-1 focus:ring-soc-cyan font-mono-tabular"
                  placeholder="Cyber Forensics Unit"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono-tabular text-soc-muted uppercase tracking-wider block">Organization</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soc-muted" />
                <input
                  type="text"
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  className="w-full bg-[#03070f] border border-soc-panel-border rounded-md py-2.5 pl-10 pr-3 text-sm text-soc-text focus:outline-none focus:border-soc-cyan focus:ring-1 focus:ring-soc-cyan font-mono-tabular"
                  placeholder="Gov Cyber Agency"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono-tabular text-soc-muted uppercase tracking-wider block">Passkey</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soc-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-[#03070f] border border-soc-panel-border rounded-md py-2.5 pl-10 pr-10 text-sm text-soc-text focus:outline-none focus:border-soc-cyan focus:ring-1 focus:ring-soc-cyan font-mono-tabular"
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-soc-muted hover:text-soc-cyan"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono-tabular text-soc-muted uppercase tracking-wider block">Confirm Passkey</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soc-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-[#03070f] border border-soc-panel-border rounded-md py-2.5 pl-10 pr-10 text-sm text-soc-text focus:outline-none focus:border-soc-cyan focus:ring-1 focus:ring-soc-cyan font-mono-tabular"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!!success}
            className="w-full mt-4 py-3 bg-soc-cyan/10 border border-soc-cyan text-soc-cyan text-xs font-mono-tabular font-bold uppercase tracking-widest rounded-md hover:bg-soc-cyan hover:text-black transition-colors shadow-[0_0_15px_rgba(0,240,255,0.2)] hover:shadow-[0_0_25px_rgba(0,240,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Access Request
          </button>
          
          <div className="text-center mt-6">
            <p className="text-xs text-soc-muted">
              Already have an access node? <Link to="/login" className="text-soc-cyan hover:underline">Initiate Connection</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
