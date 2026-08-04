import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialUsers, initialCases, initialEvidence, initialCustodyTimeline, initialAuditLogs, initialNotifications } from '../data/mockData';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // State initialization with Local Storage fallback
  const initStorage = (key, fallback) => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  };
  
  const initSession = (key, fallback) => {
    const local = localStorage.getItem(key);
    const session = sessionStorage.getItem(key);
    if (local) return JSON.parse(local);
    if (session) return JSON.parse(session);
    return fallback;
  };

  const [users, setUsers] = useState(() => initStorage('soc_users_v3', initialUsers));
  const [user, setUser] = useState(() => initSession('soc_current_user', null));
  const [isAuthenticated, setIsAuthenticated] = useState(() => initSession('soc_auth', false));
  const [cases, setCases] = useState(() => initStorage('soc_cases_v3', initialCases));
  const [evidence, setEvidence] = useState(() => initStorage('soc_evidence', initialEvidence));
  const [custodyTimeline, setCustodyTimeline] = useState(() => initStorage('soc_custody_v3', initialCustodyTimeline));
  const [auditLogs, setAuditLogs] = useState(() => initStorage('soc_audit', initialAuditLogs));
  const [notifications, setNotifications] = useState(() => initStorage('soc_notif', initialNotifications));

  // Persistence Effects
  useEffect(() => localStorage.setItem('soc_users_v3', JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem('soc_cases_v3', JSON.stringify(cases)), [cases]);
  useEffect(() => localStorage.setItem('soc_evidence', JSON.stringify(evidence)), [evidence]);
  useEffect(() => localStorage.setItem('soc_custody_v3', JSON.stringify(custodyTimeline)), [custodyTimeline]);
  useEffect(() => localStorage.setItem('soc_audit', JSON.stringify(auditLogs)), [auditLogs]);
  useEffect(() => localStorage.setItem('soc_notif', JSON.stringify(notifications)), [notifications]);

  // Auth Methods
  const loginUser = (username, password, rememberMe) => {
    const found = users.find(u => u.username === username && u.password === password);
    if (!found) return { success: false, error: 'Invalid credentials.' };
    if (found.status === 'Pending Approval') return { success: false, error: 'Account pending approval.' };
    if (found.status === 'Suspended') return { success: false, error: 'Account suspended. Contact administrator.' };
    
    setUser(found);
    setIsAuthenticated(true);
    
    // Handle persistence based on "Remember Me"
    if (rememberMe) {
      localStorage.setItem('soc_current_user', JSON.stringify(found));
      localStorage.setItem('soc_auth', JSON.stringify(true));
      sessionStorage.removeItem('soc_current_user');
      sessionStorage.removeItem('soc_auth');
    } else {
      sessionStorage.setItem('soc_current_user', JSON.stringify(found));
      sessionStorage.setItem('soc_auth', JSON.stringify(true));
      localStorage.removeItem('soc_current_user');
      localStorage.removeItem('soc_auth');
    }

    addAuditLog('LOGIN', `User ${found.username} authenticated successfully.`);
    return { success: true };
  };

  const logoutUser = () => {
    addAuditLog('LOGOUT', `User ${user?.username} ended session.`);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('soc_current_user');
    localStorage.removeItem('soc_auth');
    sessionStorage.removeItem('soc_current_user');
    sessionStorage.removeItem('soc_auth');
  };

  const registerUser = (userData) => {
    const existing = users.find(u => u.username === userData.username || u.email === userData.email);
    if (existing) return { success: false, error: 'Username or email already exists.' };
    
    const newUser = {
      id: `USR-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      ...userData,
      status: 'Pending Approval',
      role: 'Viewer' // Default role for new registrations
    };
    
    setUsers(prev => [...prev, newUser]);
    addAuditLog('REGISTER', `New registration submitted for ${userData.username}`);
    return { success: true };
  };

  // RBAC
  const hasRole = (allowedRoles) => {
    if (!user) return false;
    if (user.role === 'Super Admin') return true; // Super Admin has implicit access to everything requested
    return allowedRoles.includes(user.role);
  };

  // User Actions
  const addUser = (userData) => {
    const newUser = {
      id: `USR-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      ...userData
    };
    setUsers(prev => [...prev, newUser]);
    addAuditLog('CREATE_USER', `Created user account for ${userData.username}`);
  };

  const editUser = (id, data) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
    addAuditLog('EDIT_USER', `Modified user profile for ${id}`);
  };

  const deleteUser = (id) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    addAuditLog('DELETE_USER', `User ${id} deleted by operator.`);
  };

  const updateUserStatus = (id, status) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u));
    addAuditLog('UPDATE_USER_STATUS', `Changed status of ${id} to ${status}`);
  };

  const assignRole = (id, role) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    addAuditLog('ASSIGN_ROLE', `Assigned role ${role} to user ${id}`);
  };
  
  const resetPassword = (id, newPassword) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, password: newPassword } : u));
    addAuditLog('RESET_PASSWORD', `Password reset for user ${id}`);
  };

  // Cases Actions
  const createCase = (caseData) => {
    const newCase = {
      id: `CAS-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      createdDate: new Date().toISOString(),
      evidenceCount: 0,
      status: 'Active',
      ...caseData
    };
    setCases(prev => [newCase, ...prev]);
    addAuditLog('CREATE_CASE', `Created case ${newCase.id}`);
  };

  const updateCase = (id, data) => {
    setCases(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    addAuditLog('UPDATE_CASE', `Modified case ${id}`);
  };

  const deleteCase = (id) => {
    setCases(prev => prev.filter(c => c.id !== id));
    addAuditLog('DELETE_CASE', `Case ${id} deleted by operator.`);
  };

  // Evidence Actions
  const uploadEvidence = (evidenceData) => {
    setEvidence(prev => [evidenceData, ...prev]);
    addAuditLog('UPLOAD_EVIDENCE', `Uploaded artifact ${evidenceData.id}`);
    
    // Also update case evidence count
    if (evidenceData.caseId) {
      setCases(prev => prev.map(c => c.id === evidenceData.caseId ? { ...c, evidenceCount: c.evidenceCount + 1 } : c));
    }
    
    // Add custody event
    setCustodyTimeline(prev => [{
      id: `CUST-${Math.floor(Math.random() * 10000)}`,
      evidenceId: evidenceData.id,
      caseId: evidenceData.caseId,
      action: 'Evidence Uploaded',
      actor: user?.username || 'SYSTEM',
      role: user?.role || 'System',
      status: 'Success',
      timestamp: new Date().toISOString(),
      location: 'Secure Forensics Vault'
    }, ...prev]);
  };

  const deleteEvidence = (id) => {
    const ev = evidence.find(e => e.id === id);
    if (ev && ev.caseId) {
      setCases(prev => prev.map(c => c.id === ev.caseId ? { ...c, evidenceCount: Math.max(0, c.evidenceCount - 1) } : c));
    }
    setEvidence(prev => prev.filter(e => e.id !== id));
    addAuditLog('DELETE_EVIDENCE', `Deleted artifact ${id}`);
  };

  // System actions
  const addAuditLog = (action, details, status = 'SUCCESS') => {
    setAuditLogs(prev => [{
      id: `LOG-${Math.floor(Math.random() * 100000)}`,
      timestamp: new Date().toISOString(),
      user: user?.username || 'SYSTEM',
      action, details, ipAddress: '192.168.1.100', status
    }, ...prev]);
  };

  return (
    <AppContext.Provider value={{
      users, setUsers,
      user, setUser, isAuthenticated, loginUser, logoutUser, registerUser, hasRole,
      addUser, editUser, deleteUser, updateUserStatus, assignRole, resetPassword,
      cases, setCases, createCase, updateCase, deleteCase,
      evidence, setEvidence, uploadEvidence, deleteEvidence,
      custodyTimeline, setCustodyTimeline,
      auditLogs, addAuditLog,
      notifications, setNotifications
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
