import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    
    try {
      const res = await fetch(`${API_URL}/auth/password-reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setStatus('success');
        setMessage(data.message);
      } else {
        setStatus('error');
        setMessage(data.message || 'Failed to request reset');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Network error');
    }
  };

  return (
    <div className="min-h-screen bg-[#02050a] flex items-center justify-center p-4">
      
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-soc-cyan rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#03070f] border border-soc-cyan/30 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(0,255,255,0.2)]">
              <ShieldCheck className="w-8 h-8 text-soc-cyan" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-soc-text tracking-widest font-mono-tabular">DEIMS</h1>
          <p className="text-soc-muted tracking-[0.2em] text-xs mt-2 uppercase">Account Recovery</p>
        </div>

        <div className="soc-panel border-soc-cyan/30 p-8 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          {status === 'success' ? (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <Mail className="w-12 h-12 text-soc-cyan" />
              </div>
              <p className="text-sm text-soc-text font-mono-tabular">{message}</p>
              <button onClick={() => navigate('/login')} className="w-full py-3 bg-[#0a1122] border border-soc-panel-border text-soc-muted text-sm font-bold uppercase tracking-wider rounded flex items-center justify-center gap-2 hover:text-soc-text hover:border-soc-cyan transition-colors">
                <ArrowLeft className="w-4 h-4" /> Return to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-[10px] text-soc-muted uppercase tracking-wider block mb-2">Registered Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soc-muted" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-[#03070f] border border-soc-panel-border rounded py-2 pl-10 pr-3 text-sm text-soc-text focus:border-soc-cyan focus:outline-none focus:ring-1 focus:ring-soc-cyan"
                    placeholder="operator@deims.local"
                  />
                </div>
              </div>

              {status === 'error' && (
                <div className="text-soc-red text-xs p-3 border border-soc-red/30 bg-soc-red/10 rounded">
                  {message}
                </div>
              )}

              <button 
                type="submit" 
                disabled={status === 'loading'}
                className="w-full py-3 bg-soc-cyan/10 border border-soc-cyan text-soc-cyan text-sm font-bold uppercase tracking-wider rounded hover:bg-soc-cyan hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === 'loading' ? 'Processing...' : 'Send Reset Link'} <ArrowRight className="w-4 h-4" />
              </button>
              
              <div className="text-center">
                <button type="button" onClick={() => navigate('/login')} className="text-xs text-soc-muted hover:text-soc-cyan transition-colors">
                  Remember your password? Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
