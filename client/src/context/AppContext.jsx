import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

// Set VITE_API_URL in Vercel to the deployed Flask API URL, ending in /api.
// For local development, the existing localhost API remains the fallback.
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export const AppProvider = ({ children }) => {
  const initSession = (key, fallback) => {
    const local = localStorage.getItem(key);
    const session = sessionStorage.getItem(key);
    if (local) return JSON.parse(local);
    if (session) return JSON.parse(session);
    return fallback;
  };

  const [token, setToken] = useState(() => initSession('soc_token', null));
  const [refreshToken, setRefreshToken] = useState(() => initSession('soc_refresh_token', null));
  const [user, setUser] = useState(() => initSession('soc_current_user', null));
  const [isAuthenticated, setIsAuthenticated] = useState(() => initSession('soc_auth', false));
  
  const [users, setUsers] = useState([]);
  const [cases, setCases] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [custodyTimeline, setCustodyTimeline] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [reports, setReports] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [blockchainStatus, setBlockchainStatus] = useState({ connected: false, status: 'UNKNOWN' });
  const [systemMetrics, setSystemMetrics] = useState(null);

  let isRefreshing = false;
  let refreshSubscribers = [];

  const onRefreshed = (token) => {
    refreshSubscribers.map(cb => cb(token));
    refreshSubscribers = [];
  };

  // Setup Fetch Helper
  const apiFetch = async (endpoint, options = {}, isRetry = false) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (token && !isRetry) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { success: false, message: text || `Server returned HTTP ${response.status}` };
      }
      
      if (response.status === 401 && !isRetry && token) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${refreshToken}`
              }
            });
            const refreshData = await refreshRes.json();
            if (refreshRes.status === 200 && refreshData.success) {
              const newToken = refreshData.data.token;
              setToken(newToken);
              if (localStorage.getItem('soc_token')) {
                localStorage.setItem('soc_token', JSON.stringify(newToken));
              } else {
                sessionStorage.setItem('soc_token', JSON.stringify(newToken));
              }
              onRefreshed(newToken);
              isRefreshing = false;
              // Retry original
              headers['Authorization'] = `Bearer ${newToken}`;
              return await apiFetch(endpoint, { ...options, headers }, true);
            } else {
              isRefreshing = false;
              logoutUser();
              return { status: 401, data: { success: false, message: 'Session expired' } };
            }
          } catch(e) {
            isRefreshing = false;
            logoutUser();
            return { status: 401, data: { success: false, message: 'Session expired' } };
          }
        } else {
          return new Promise(resolve => {
            refreshSubscribers.push(async (newToken) => {
              headers['Authorization'] = `Bearer ${newToken}`;
              resolve(await apiFetch(endpoint, { ...options, headers }, true));
            });
          });
        }
      }
      
      // If we got a JSON response but it's an error, make sure we extract the right message
      if (!response.ok && data && !data.message) {
        data.message = data.error || `HTTP ${response.status} Error`;
      }
      
      return { status: response.status, data };
    } catch (error) {
      console.error('Fetch error:', error);
      return { status: 500, data: { success: false, message: 'Unable to connect to the DEIMS server.' } };
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchData();
      fetchBlockchainStatus();
    } else {
      setUsers([]); setCases([]); setEvidence([]); setCustodyTimeline([]); setAuditLogs([]); setReports([]);
    }
  }, [isAuthenticated, token]);

  const fetchBlockchainStatus = async () => {
    const res = await apiFetch('/evidence/blockchain/status');
    if (res.data.success) {
      setBlockchainStatus(res.data.data);
    }
  };

  const fetchData = async () => {
    if (hasRole(['Super Admin', 'Admin', 'Auditor'])) {
      const uRes = await apiFetch('/users/');
      if (uRes.data && uRes.data.success) {
        const userData = Array.isArray(uRes.data.data) ? uRes.data.data : uRes.data.data.items;
        setUsers(userData || []);
      }
      const aRes = await apiFetch('/logs/audit');
      if (aRes.data && aRes.data.success) {
        const auditData = Array.isArray(aRes.data.data) ? aRes.data.data : aRes.data.data.items;
        setAuditLogs(auditData || []);
      }
      
      if (hasRole(['Super Admin', 'Admin'])) {
          const mRes = await apiFetch('/system/metrics');
          if (mRes.data && mRes.data.success) setSystemMetrics(mRes.data.data);
      }
    }
    
    const cRes = await apiFetch('/cases/');
    if (cRes.data && cRes.data.success) {
      const caseData = Array.isArray(cRes.data.data) ? cRes.data.data : cRes.data.data.items;
      const mappedCases = (caseData || []).map(c => ({
        ...c,
        createdDate: c.created_at
      }));
      setCases(mappedCases);
    }
    
    const eRes = await apiFetch('/evidence/');
    if (eRes.data && eRes.data.success) {
      const eviData = Array.isArray(eRes.data.data) ? eRes.data.data : eRes.data.data.items;
      const mappedEvidence = (eviData || []).map(e => ({
        ...e,
        fileName: e.original_name,
        fileSize: e.file_size,
        fileType: e.mime_type,
        sha256: e.file_hash,
        uploadDate: e.uploaded_at,
        aesEncrypted: true,
        caseId: e.case_id,
        verificationStatus: 'UNVERIFIED',
        blockchainStatus: e.blockchain_status,
        blockchainTxHash: e.blockchain_tx_hash
      }));
      setEvidence(mappedEvidence);
    }
    
    const lRes = await apiFetch('/logs/chain-of-custody');
    if (lRes.data && lRes.data.success) {
      const custodyData = Array.isArray(lRes.data.data) ? lRes.data.data : lRes.data.data.items;
      setCustodyTimeline(custodyData || []);
    }
    
    const rRes = await apiFetch('/reports/');
    if (rRes.data && rRes.data.success) {
      const reportData = Array.isArray(rRes.data.data) ? rRes.data.data : rRes.data.data.items;
      setReports(reportData || []);
    }
  };

  const loginUser = async (username, password, rememberMe) => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    
    if (res.data.success) {
      if (res.data.data.mfa_required) {
        return { success: true, mfaRequired: true, tempUserId: res.data.data.temp_user_id };
      }
      if (res.data.data.password_expired) {
        return { success: false, error: 'Password expired. Please contact administrator.' };
      }
      handleAuthSuccess(res.data.data, rememberMe);
      return { success: true };
    }
    return { success: false, error: res.data.message || 'Login failed', status: res.status };
  };

  const verifyMfa = async (tempUserId, code, rememberMe) => {
    const res = await apiFetch('/auth/mfa/verify', {
      method: 'POST',
      body: JSON.stringify({ temp_user_id: tempUserId, token: code })
    });
    if (res.data.success) {
      handleAuthSuccess(res.data.data, rememberMe);
      return { success: true };
    }
    return { success: false, error: res.data.message || 'MFA verification failed' };
  };

  const handleAuthSuccess = (data, rememberMe) => {
    const { token: t, refresh_token: rt, user: u } = data;
    setToken(t);
    setRefreshToken(rt);
    setUser(u);
    setIsAuthenticated(true);
    
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('soc_token', JSON.stringify(t));
    storage.setItem('soc_refresh_token', JSON.stringify(rt));
    storage.setItem('soc_current_user', JSON.stringify(u));
    storage.setItem('soc_auth', JSON.stringify(true));
    
    if (rememberMe) {
      sessionStorage.removeItem('soc_token');
      sessionStorage.removeItem('soc_refresh_token');
      sessionStorage.removeItem('soc_current_user');
      sessionStorage.removeItem('soc_auth');
    } else {
      localStorage.removeItem('soc_token');
      localStorage.removeItem('soc_refresh_token');
      localStorage.removeItem('soc_current_user');
      localStorage.removeItem('soc_auth');
    }
  };

  const logoutUser = async () => {
    if (token) {
      await apiFetch('/auth/logout', { method: 'POST' });
    }
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('soc_token');
    localStorage.removeItem('soc_refresh_token');
    localStorage.removeItem('soc_current_user');
    localStorage.removeItem('soc_auth');
    sessionStorage.removeItem('soc_token');
    sessionStorage.removeItem('soc_refresh_token');
    sessionStorage.removeItem('soc_current_user');
    sessionStorage.removeItem('soc_auth');
  };

  const registerUser = async (userData) => {
    const res = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    if (res.data.success) return { success: true };
    return { success: false, error: res.data.message || 'Registration failed' };
  };

  const hasRole = (allowedRoles) => {
    if (!user) return false;
    if (user.role === 'Super Admin') return true;
    return allowedRoles.includes(user.role);
  };

  // Additional methods... (keep the rest mostly intact)
  const addUser = async (userData) => {
    const payload = { ...userData, full_name: userData.fullName };
    const res = await apiFetch('/users/', { method: 'POST', body: JSON.stringify(payload) });
    if (res.status === 201 || (res.data && res.data.success)) {
      fetchData();
      return { success: true };
    } else {
      const errorMsg = res.data?.message || 'Failed to add user';
      alert(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const editUser = async (id, data) => fetchData();
  
  const deleteUser = async (id) => {
    await apiFetch(`/users/${id}`, { method: 'DELETE' });
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const updateUserStatus = async (id, status) => {
    if (status === 'Active') {
      await apiFetch(`/users/${id}/approve`, { method: 'PATCH' });
    } else if (status === 'Rejected') {
      await apiFetch(`/users/${id}/reject`, { method: 'PATCH' });
    } else {
      await apiFetch(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    }
    fetchData();
  };

  const assignRole = async (id, role) => {
    await apiFetch(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });
    fetchData();
  };
  
  const resetPassword = async (id, newPassword) => fetchData();
  
  const unlockAccount = async (id) => {
    await apiFetch(`/users/${id}/unlock`, { method: 'POST' });
    fetchData();
  };

  const createCase = async (caseData) => {
    await apiFetch('/cases/', { method: 'POST', body: JSON.stringify(caseData) });
    fetchData();
  };

  const updateCase = async (id, data) => {
    if (data.status) {
      await apiFetch(`/cases/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: data.status }) });
    } else {
      await apiFetch(`/cases/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    }
    fetchData();
  };

  const deleteCase = async (id) => {
    await apiFetch(`/cases/${id}`, { method: 'DELETE' });
    setCases(prev => prev.filter(c => c.id !== id));
  };

  const uploadEvidence = async (formData) => {
    const res = await apiFetch('/evidence/', { method: 'POST', body: formData });
    if (res.data && res.data.success) {
      fetchData();
      return { success: true, data: res.data };
    }
    return { success: false, error: res.data?.message || 'Failed to upload evidence' };
  };

  const deleteEvidence = async (id) => {
    const res = await apiFetch(`/evidence/${id}`, { method: 'DELETE' });
    if (res.data && res.data.success) {
        fetchData();
        return { success: true };
    } else {
        return { success: false, error: res.data?.message || 'Failed to delete evidence' };
    }
  };
  
  const verifyEvidence = async (formData) => {
    const res = await apiFetch('/evidence/verify', { method: 'POST', body: formData });
    return res.data;
  };
  
  const generateReport = async (caseId) => {
    await apiFetch(`/reports/generate/${caseId}`, { method: 'POST' });
    fetchData();
  };

  const downloadEvidence = async (id, fileName) => {
    try {
      const response = await fetch(`${API_URL}/evidence/${id}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        if (response.status === 401) {
          alert("Session expired. Please log in again.");
        } else {
          try {
            const err = await response.json();
            alert(err.message || "Failed to download evidence");
          } catch (e) {
            alert("Failed to download evidence");
          }
        }
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (e) {
      console.error("Download error:", e);
      alert("Error downloading file");
    }
  };

  const addAuditLog = (action, details, status = 'SUCCESS') => {};

  return (
    <AppContext.Provider value={{
      apiFetch, // expose it for use in other pages
      users, setUsers,
      user, setUser, isAuthenticated, loginUser, verifyMfa, logoutUser, registerUser, hasRole,
      addUser, editUser, deleteUser, updateUserStatus, assignRole, resetPassword, unlockAccount,
      cases, setCases, createCase, updateCase, deleteCase,
      evidence, setEvidence, uploadEvidence, deleteEvidence, verifyEvidence, downloadEvidence,
      custodyTimeline, setCustodyTimeline,
      auditLogs, addAuditLog,
      reports, generateReport,
      notifications, setNotifications,
      blockchainStatus, fetchBlockchainStatus,
      systemMetrics
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
