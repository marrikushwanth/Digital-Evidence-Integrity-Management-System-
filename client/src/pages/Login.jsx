import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, User, TerminalSquare, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [forgotPwd, setForgotPwd] = useState(false);
  const { loginUser } = useApp();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (forgotPwd) {
      alert("Password reset instructions have been sent to the registered email address if it exists.");
      setForgotPwd(false);
      return;
    }
    const result = loginUser(username, password, rememberMe);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-soc-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Cyber Rings */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
        <div className="w-[800px] h-[800px] rounded-full border border-soc-cyan animate-[spin_60s_linear_infinite]" />
        <div className="w-[600px] h-[600px] rounded-full border border-soc-green absolute animate-[spin_40s_linear_infinite_reverse]" />
      </div>

      <div className="w-full max-w-md soc-panel border-soc-cyan/30 z-10">
        <div className="p-8 border-b border-soc-panel-border bg-[#03070f] flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-soc-cyan/10 border border-soc-cyan/30 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-soc-cyan" />
          </div>
          <h1 className="text-2xl font-black text-soc-text tracking-widest">DEIMS</h1>
          <p className="text-xs font-mono-tabular text-soc-cyan tracking-[0.2em] uppercase mt-2">
            Secure Authentication Node
          </p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <div className="bg-rose-950/40 border border-rose-500/50 text-soc-red text-xs font-mono-tabular p-3 rounded-md flex items-start gap-2">
              <TerminalSquare className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!forgotPwd ? (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-mono-tabular text-soc-muted uppercase tracking-wider block">Operator ID / Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soc-muted" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#03070f] border border-soc-panel-border rounded-md py-2.5 pl-10 pr-3 text-sm text-soc-text focus:outline-none focus:border-soc-cyan focus:ring-1 focus:ring-soc-cyan font-mono-tabular"
                    placeholder="Enter username"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-mono-tabular text-soc-muted uppercase tracking-wider block">Passkey</label>
                  <button type="button" onClick={() => setForgotPwd(true)} className="text-[10px] text-soc-cyan hover:underline font-mono-tabular">
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soc-muted" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="rememberMe" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 bg-[#03070f] border-soc-panel-border rounded text-soc-cyan focus:ring-soc-cyan accent-soc-cyan" 
                />
                <label htmlFor="rememberMe" className="ml-2 text-xs font-mono-tabular text-soc-muted cursor-pointer">
                  Maintain persistent session (Remember Me)
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-soc-cyan/10 border border-soc-cyan text-soc-cyan text-xs font-mono-tabular font-bold uppercase tracking-widest rounded-md hover:bg-soc-cyan hover:text-black transition-colors shadow-[0_0_15px_rgba(0,240,255,0.2)] hover:shadow-[0_0_25px_rgba(0,240,255,0.4)]"
              >
                Initiate Connection
              </button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-mono-tabular text-soc-muted uppercase tracking-wider block">Registered Email or Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soc-muted" />
                  <input
                    type="text"
                    className="w-full bg-[#03070f] border border-soc-panel-border rounded-md py-2.5 pl-10 pr-3 text-sm text-soc-text focus:outline-none focus:border-soc-cyan focus:ring-1 focus:ring-soc-cyan font-mono-tabular"
                    placeholder="Enter email or username"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-soc-cyan/10 border border-soc-cyan text-soc-cyan text-xs font-mono-tabular font-bold uppercase tracking-widest rounded-md hover:bg-soc-cyan hover:text-black transition-colors shadow-[0_0_15px_rgba(0,240,255,0.2)]"
              >
                Request Password Reset
              </button>
              <button
                type="button"
                onClick={() => setForgotPwd(false)}
                className="w-full py-2 bg-transparent text-soc-muted text-xs font-mono-tabular hover:text-soc-text transition-colors"
              >
                Back to Login
              </button>
            </>
          )}
          
          <div className="text-center mt-6">
            <p className="text-xs text-soc-muted">
              Don't have an access node? <Link to="/register" className="text-soc-cyan hover:underline">Request clearance</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
