import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';

// Layout
import SocLayout from './components/layout/SocLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import AccessDenied from './pages/AccessDenied';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import EvidenceList from './pages/EvidenceList';
import UploadEvidence from './pages/UploadEvidence';
import VerifyIntegrity from './pages/VerifyIntegrity';
import ChainOfCustody from './pages/ChainOfCustody';
import AuditLogs from './pages/AuditLogs';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

// Role Guard Wrapper
const RoleGuard = ({ children, allowedRoles }) => {
  const { isAuthenticated, hasRole } = useApp();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!hasRole(allowedRoles)) return <Navigate to="/403" replace />;
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/403" element={<AccessDenied />} />
      
      {/* Protected Routes inside SocLayout */}
      <Route path="/" element={<RoleGuard allowedRoles={['Super Admin', 'Admin', 'Investigator', 'Auditor', 'Editor', 'Viewer']}><SocLayout /></RoleGuard>}>
        
        {/* Dashboard: All roles */}
        <Route index element={<Dashboard />} />
        
        {/* Profile/Settings: All roles */}
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />

        {/* User Management: Super Admin & Admin */}
        <Route path="users" element={<RoleGuard allowedRoles={['Super Admin', 'Admin']}><UserManagement /></RoleGuard>} />
        
        {/* Cases: Super Admin, Admin, Investigator, Editor */}
        <Route path="cases" element={<RoleGuard allowedRoles={['Super Admin', 'Admin', 'Investigator', 'Editor']}><Cases /></RoleGuard>} />
        
        {/* Evidence Vault: All roles can view (Viewer, Auditor, etc.) */}
        <Route path="evidence" element={<RoleGuard allowedRoles={['Super Admin', 'Admin', 'Investigator', 'Auditor', 'Editor', 'Viewer']}><EvidenceList /></RoleGuard>} />
        
        {/* Upload Evidence: Super Admin, Admin, Investigator */}
        <Route path="upload" element={<RoleGuard allowedRoles={['Super Admin', 'Admin', 'Investigator']}><UploadEvidence /></RoleGuard>} />
        
        {/* Verify Integrity: Super Admin, Admin, Investigator */}
        <Route path="verify" element={<RoleGuard allowedRoles={['Super Admin', 'Admin', 'Investigator']}><VerifyIntegrity /></RoleGuard>} />
        
        {/* Chain of Custody: Super Admin, Admin, Investigator, Auditor */}
        <Route path="custody" element={<RoleGuard allowedRoles={['Super Admin', 'Admin', 'Investigator', 'Auditor']}><ChainOfCustody /></RoleGuard>} />
        
        {/* Audit Logs: Super Admin, Admin, Auditor */}
        <Route path="audit-logs" element={<RoleGuard allowedRoles={['Super Admin', 'Admin', 'Auditor']}><AuditLogs /></RoleGuard>} />
        
        {/* Reports: All roles */}
        <Route path="reports" element={<RoleGuard allowedRoles={['Super Admin', 'Admin', 'Investigator', 'Auditor', 'Editor', 'Viewer']}><Reports /></RoleGuard>} />

      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
