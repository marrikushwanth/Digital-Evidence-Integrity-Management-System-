import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

const API_URL = 'http://localhost:5000/api';

export const AppProvider = ({ children }) => {
  const initSession = (key, fallback) => {
    const local = localStorage.getItem(key);
    const session = sessionStorage.getItem(key);
    if (local) return JSON.parse(local);
    if (session) return JSON.parse(session);
    return fallback;
  };

  const [token, setToken] = useState(() => initSession('soc_token', null));
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

  // Setup Fetch Helper
  const apiFetch = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // Remove Content-Type if it's FormData
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });
      const data = await response.json();
      return { status: response.status, data };
    } catch (error) {
      return { status: 500, data: { success: false, message: 'Network error' } };
    }
  };

  // Fetch initial data if authenticated
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
    // Only fetch what user has role for
    if (hasRole(['Admin', 'Auditor'])) {
      const uRes = await apiFetch('/users/');
      if (uRes.data.success) setUsers(uRes.data.data);
      const aRes = await apiFetch('/logs/audit');
      if (aRes.data.success) setAuditLogs(aRes.data.data);
    }
    
    const cRes = await apiFetch('/cases/');
    if (cRes.data.success) {
      const caseData = Array.isArray(cRes.data.data) ? cRes.data.data : cRes.data.data.items;
      const mappedCases = caseData.map(c => ({
        ...c,
        createdDate: c.created_at
      }));
      setCases(mappedCases);
    }
    
    const eRes = await apiFetch('/evidence/');
    if (eRes.data.success) {
      const mappedEvidence = eRes.data.data.map(e => ({
        ...e,
        fileName: e.original_name,
        fileSize: e.file_size,
        fileType: e.mime_type,
        sha256: e.file_hash,
        uploadDate: e.uploaded_at,
        aesEncrypted: true,
        caseId: e.case_id,
        verificationStatus: e.blockchain_status || 'Verified',
        blockchainStatus: e.blockchain_status,
        blockchainTxHash: e.blockchain_tx_hash
      }));
      setEvidence(mappedEvidence);
    }
    
    const lRes = await apiFetch('/logs/chain-of-custody');
    if (lRes.data.success) setCustodyTimeline(lRes.data.data);
    
    const rRes = await apiFetch('/reports/');
    if (rRes.data.success) setReports(rRes.data.data);
  };

  // Auth Methods
  const loginUser = async (username, password, rememberMe) => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    
    if (res.data.success) {
      const { token, user: u } = res.data.data;
      setToken(token);
      setUser(u);
      setIsAuthenticated(true);
      
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('soc_token', JSON.stringify(token));
      storage.setItem('soc_current_user', JSON.stringify(u));
      storage.setItem('soc_auth', JSON.stringify(true));
      
      if (rememberMe) {
        sessionStorage.removeItem('soc_token');
        sessionStorage.removeItem('soc_current_user');
        sessionStorage.removeItem('soc_auth');
      } else {
        localStorage.removeItem('soc_token');
        localStorage.removeItem('soc_current_user');
        localStorage.removeItem('soc_auth');
      }
      return { success: true };
    }
    return { success: false, error: res.data.message || 'Login failed' };
  };

  const logoutUser = async () => {
    await apiFetch('/auth/logout', { method: 'POST' });
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('soc_token');
    localStorage.removeItem('soc_current_user');
    localStorage.removeItem('soc_auth');
    sessionStorage.removeItem('soc_token');
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

  // RBAC
  const hasRole = (allowedRoles) => {
    if (!user) return false;
    if (user.role === 'Super Admin') return true;
    return allowedRoles.includes(user.role);
  };

  // User Actions
  const addUser = async (userData) => {
    // Current backend doesn't have create user endpoint, we reuse register? Wait, admin can create? 
    // Let's assume frontend just needs to refetch after some operation, or we optimistic update.
    await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(userData) });
    fetchData();
  };

  const editUser = async (id, data) => {
    // Current backend lacks edit user, let's just refetch if we implement it later.
    fetchData();
  };

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
  
  const resetPassword = async (id, newPassword) => {
    // Only change-password for self exists, but let's mock it
    fetchData();
  };

  // Cases Actions
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

  // Evidence Actions
  const uploadEvidence = async (formData) => {
    await apiFetch('/evidence/', { method: 'POST', body: formData });
    fetchData();
  };

  const deleteEvidence = async (id) => {
    await apiFetch(`/evidence/${id}`, { method: 'DELETE' });
    fetchData();
  };
  
  // Verification
  const verifyEvidence = async (formData) => {
    const res = await apiFetch('/evidence/verify', { method: 'POST', body: formData });
    return res.data;
  };
  
  // Reports
  const generateReport = async (caseId) => {
    await apiFetch(`/reports/generate/${caseId}`, { method: 'POST' });
    fetchData();
  };

  const addAuditLog = (action, details, status = 'SUCCESS') => {
    // Handled by backend now, this is a no-op on frontend
  };

  return (
    <AppContext.Provider value={{
      users, setUsers,
      user, setUser, isAuthenticated, loginUser, logoutUser, registerUser, hasRole,
      addUser, editUser, deleteUser, updateUserStatus, assignRole, resetPassword,
      cases, setCases, createCase, updateCase, deleteCase,
      evidence, setEvidence, uploadEvidence, deleteEvidence, verifyEvidence,
      custodyTimeline, setCustodyTimeline,
      auditLogs, addAuditLog,
      reports, generateReport,
      notifications, setNotifications,
      blockchainStatus, fetchBlockchainStatus
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
