import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Key, ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [pwd, setPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  
  const [status, setStatus] = useState('verifying'); // verifying, valid, invalid, loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      setMessage('No reset token provided');
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/password-reset/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        const data = await res.json();
        
        if (res.ok && data.success) {
          setStatus('valid');
        } else {
          setStatus('invalid');
          setMessage(data.message || 'Invalid or expired reset token');
        }
      } catch (err) {
        setStatus('invalid');
        setMessage('Network error verifying token');
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pwd !== confirmPwd) {
      setStatus('error');
      setMessage('Passwords do not match');
      return;
    }
    
    setStatus('loading');
    
    try {
      const res = await fetch(`${API_URL}/auth/password-reset/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: pwd })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setStatus('success');
        setMessage('Password has been successfully reset. You can now login.');
      } else {
        setStatus('error');
        setMessage(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Network error');
    }
  };

  return (
    <div className="min-h-screen bg-[#02050a] flex items-center justify-center p-4">
      
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-soc-cyan rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
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
          <p className="text-soc-muted tracking-[0.2em] text-xs mt-2 uppercase">Create New Passkey</p>
        </div>

        <div className="soc-panel border-soc-cyan/30 p-8 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          {status === 'verifying' && (
            <div className="text-center text-soc-muted text-sm font-mono-tabular py-8">
              Verifying token security...
            </div>
          )}

          {status === 'invalid' && (
            <div className="text-center space-y-6">
              <div className="text-soc-red text-sm font-mono-tabular border border-soc-red/30 bg-soc-red/10 rounded p-4">
                {message}
              </div>
              <button onClick={() => navigate('/forgot-password')} className="w-full py-3 bg-[#0a1122] border border-soc-panel-border text-soc-muted text-sm font-bold uppercase tracking-wider rounded flex items-center justify-center gap-2 hover:text-soc-text hover:border-soc-cyan transition-colors">
                <ArrowLeft className="w-4 h-4" /> Request New Link
              </button>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-6">
              <div className="text-soc-green text-sm font-mono-tabular border border-soc-green/30 bg-soc-green/10 rounded p-4">
                {message}
              </div>
              <button onClick={() => navigate('/login')} className="w-full py-3 bg-[#0a1122] border border-soc-panel-border text-soc-muted text-sm font-bold uppercase tracking-wider rounded flex items-center justify-center gap-2 hover:text-soc-text hover:border-soc-cyan transition-colors">
                Proceed to Login <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {(status === 'valid' || status === 'loading' || status === 'error') && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-soc-muted uppercase tracking-wider block mb-2">New Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soc-muted" />
                  <input 
                    type="password" 
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    required
                    className="w-full bg-[#03070f] border border-soc-panel-border rounded py-2 pl-10 pr-3 text-sm text-soc-text focus:border-soc-cyan focus:outline-none focus:ring-1 focus:ring-soc-cyan"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-[10px] text-soc-muted uppercase tracking-wider block mb-2">Confirm New Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soc-muted" />
                  <input 
                    type="password" 
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    required
                    className="w-full bg-[#03070f] border border-soc-panel-border rounded py-2 pl-10 pr-3 text-sm text-soc-text focus:border-soc-cyan focus:outline-none focus:ring-1 focus:ring-soc-cyan"
                  />
                </div>
                <p className="text-[10px] text-soc-muted mt-2">Must be at least 8 chars, contain numbers, upper & lower case.</p>
              </div>

              {status === 'error' && (
                <div className="text-soc-red text-xs p-3 border border-soc-red/30 bg-soc-red/10 rounded">
                  {message}
                </div>
              )}

              <button 
                type="submit" 
                disabled={status === 'loading'}
                className="w-full py-3 mt-4 bg-soc-cyan/10 border border-soc-cyan text-soc-cyan text-sm font-bold uppercase tracking-wider rounded hover:bg-soc-cyan hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? 'Encrypting...' : 'Reset Passkey'}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
