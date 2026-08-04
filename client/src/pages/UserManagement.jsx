import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, CheckCircle, XCircle, Shield, Trash2, Edit2, Key, Search, Filter, Plus, Power, PowerOff } from 'lucide-react';
import SocCard from '../components/ui/SocCard';
import StatusBadge from '../components/ui/StatusBadge';
import { useApp } from '../context/AppContext';

// Simple Reusable Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg soc-panel border-soc-cyan/30 p-6 bg-[#03070f]">
        <div className="flex justify-between items-center mb-6 border-b border-soc-panel-border pb-4">
          <h2 className="text-lg font-black text-soc-text tracking-widest uppercase">{title}</h2>
          <button onClick={onClose} className="text-soc-muted hover:text-soc-red">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default function UserManagement() {
  const { users, addUser, editUser, deleteUser, updateUserStatus, assignRole, resetPassword, user: activeUser, hasRole } = useApp();
  
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form States
  const [formData, setFormData] = useState({ fullName: '', username: '', email: '', role: 'Viewer', password: '' });

  // Handlers
  const handleApprove = (userId) => updateUserStatus(userId, 'Active');
  const handleReject = (userId) => updateUserStatus(userId, 'Rejected');
  const handleSuspend = (userId) => updateUserStatus(userId, 'Suspended');
  const handleActivate = (userId) => updateUserStatus(userId, 'Active');
  
  const handleDelete = (userId) => {
    if (activeUser?.id === userId) {
      alert("The active Super Admin account cannot be deleted.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteUser(userId);
      alert("User deleted successfully.");
    }
  };

  const openEditModal = (u) => {
    if (u.role === 'Super Admin' && activeUser?.role !== 'Super Admin') {
      alert("Only Super Admins can modify other Super Admins.");
      return;
    }
    setSelectedUser(u);
    setFormData({ fullName: u.fullName, username: u.username, email: u.email, role: u.role });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    editUser(selectedUser.id, { fullName: formData.fullName, username: formData.username, email: formData.email });
    if (selectedUser.role !== formData.role) assignRole(selectedUser.id, formData.role);
    setIsEditModalOpen(false);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    addUser({ ...formData, status: 'Active' });
    setIsAddModalOpen(false);
    setFormData({ fullName: '', username: '', email: '', role: 'Viewer', password: '' });
  };

  const handleResetSubmit = (e) => {
    e.preventDefault();
    resetPassword(selectedUser.id, formData.password);
    setIsResetModalOpen(false);
    alert("Password reset successfully.");
  };

  // Filters and Pagination
  const pendingUsers = users.filter(u => u.status === 'Pending Approval');
  
  let activeUsers = users.filter(u => u.status !== 'Pending Approval');
  if (searchTerm) {
    activeUsers = activeUsers.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()) || u.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
  }
  if (roleFilter !== 'All') {
    activeUsers = activeUsers.filter(u => u.role === roleFilter);
  }

  const totalPages = Math.ceil(activeUsers.length / itemsPerPage);
  const paginatedUsers = activeUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const canManageAdmins = hasRole(['Super Admin']);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-mono-tabular font-bold text-soc-text uppercase tracking-widest flex items-center gap-2">
            <Users className="w-5 h-5 text-soc-cyan" /> Access Control
          </h1>
          <p className="text-xs text-soc-muted font-mono-tabular">Manage operator roles, permissions, and node access.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soc-muted" />
            <input 
              type="text" 
              placeholder="Search operators..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#0a1122] border border-soc-panel-border text-sm text-soc-text pl-9 pr-3 py-2 rounded-md focus:outline-none focus:border-soc-cyan font-mono-tabular"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soc-muted" />
            <select 
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              className="bg-[#0a1122] border border-soc-panel-border text-sm text-soc-text pl-9 pr-8 py-2 rounded-md focus:outline-none focus:border-soc-cyan font-mono-tabular appearance-none"
            >
              <option value="All">All Roles</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Admin">Admin</option>
              <option value="Investigator">Investigator</option>
              <option value="Auditor">Auditor</option>
              <option value="Editor">Editor</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>
          <button 
            onClick={() => { setFormData({ fullName: '', username: '', email: '', role: 'Viewer', password: '' }); setIsAddModalOpen(true); }}
            className="px-4 py-2 bg-soc-cyan/10 border border-soc-cyan text-soc-cyan text-xs font-mono-tabular font-bold tracking-wider rounded-md hover:bg-soc-cyan hover:text-black transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Operator
          </button>
        </div>
      </div>

      {/* Pending Users */}
      {pendingUsers.length > 0 && (
        <SocCard title="Pending Access Requests" highlight className="border-amber-400/30">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-mono-tabular text-soc-muted uppercase border-b border-soc-panel-border">
                  <th className="p-3 font-normal">Operator ID</th>
                  <th className="p-3 font-normal">Requested Role</th>
                  <th className="p-3 font-normal">Status</th>
                  <th className="p-3 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soc-panel-border/30">
                {pendingUsers.map(u => (
                  <tr key={u.id} className="hover:bg-[#0a1122]">
                    <td className="p-3 text-sm text-soc-text">{u.fullName} <span className="text-xs text-soc-muted block">{u.email}</span></td>
                    <td className="p-3"><StatusBadge status={u.role} type="role" /></td>
                    <td className="p-3"><StatusBadge status={u.status} /></td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleApprove(u.id)} className="p-1.5 bg-soc-green/10 text-soc-green rounded hover:bg-soc-green hover:text-black transition-colors">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleReject(u.id)} className="p-1.5 bg-soc-red/10 text-soc-red rounded hover:bg-soc-red hover:text-black transition-colors">
                          <XCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(u.id)} className="p-1.5 text-soc-muted hover:text-soc-red hover:bg-soc-red/10 rounded transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SocCard>
      )}

      {/* Active Users Table */}
      <SocCard title="Active Network Operators">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-mono-tabular text-soc-muted uppercase border-b border-soc-panel-border bg-[#03070f]">
                <th className="p-4 font-normal">Sys ID</th>
                <th className="p-4 font-normal">Operator</th>
                <th className="p-4 font-normal">Assigned Role</th>
                <th className="p-4 font-normal">Status</th>
                <th className="p-4 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soc-panel-border/50">
              {paginatedUsers.map(u => (
                <tr key={u.id} className="hover:bg-[#0a1122] transition-colors group">
                  <td className="p-4 text-xs font-mono-tabular text-soc-cyan">{u.id}</td>
                  <td className="p-4 text-sm text-soc-text">
                    <div className="flex items-center gap-2">
                      {u.fullName} 
                      {u.role === 'Super Admin' && <span title="Super Admin" className="text-yellow-500">👑</span>}
                    </div>
                    <span className="text-[10px] font-mono-tabular text-soc-muted block">{u.username}</span>
                  </td>
                  <td className="p-4"><StatusBadge status={u.role} type="role" /></td>
                  <td className="p-4"><StatusBadge status={u.status} /></td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {u.status === 'Active' ? (
                        <button onClick={() => handleSuspend(u.id)} className="p-1.5 text-soc-muted hover:text-amber-500 hover:bg-amber-500/10 rounded" title="Suspend">
                          <PowerOff className="w-4 h-4" />
                        </button>
                      ) : (
                        <button onClick={() => handleActivate(u.id)} className="p-1.5 text-soc-muted hover:text-soc-green hover:bg-soc-green/10 rounded" title="Activate">
                          <Power className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => { setSelectedUser(u); setIsResetModalOpen(true); }} className="p-1.5 text-soc-muted hover:text-soc-cyan hover:bg-soc-cyan/10 rounded" title="Reset Password">
                        <Key className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEditModal(u)} className="p-1.5 text-soc-muted hover:text-soc-cyan hover:bg-soc-cyan/10 rounded" title="Edit User">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="p-1.5 text-soc-muted hover:text-soc-red hover:bg-soc-red/10 rounded" title="Delete User">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-sm text-soc-muted font-mono-tabular">No operators found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center p-4 border-t border-soc-panel-border bg-[#03070f]">
            <span className="text-xs text-soc-muted font-mono-tabular">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-[#0a1122] border border-soc-panel-border text-soc-text text-xs rounded disabled:opacity-50"
              >
                Prev
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-[#0a1122] border border-soc-panel-border text-soc-text text-xs rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </SocCard>

      {/* Add User Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Provision New Operator">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <input type="text" placeholder="Full Name" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full bg-[#0a1122] border border-soc-panel-border rounded p-2 text-sm text-soc-text" />
          <input type="text" placeholder="Username" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-[#0a1122] border border-soc-panel-border rounded p-2 text-sm text-soc-text" />
          <input type="email" placeholder="Email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-[#0a1122] border border-soc-panel-border rounded p-2 text-sm text-soc-text" />
          <input type="password" placeholder="Password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-[#0a1122] border border-soc-panel-border rounded p-2 text-sm text-soc-text" />
          <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-[#0a1122] border border-soc-panel-border rounded p-2 text-sm text-soc-text appearance-none">
            {canManageAdmins && <option value="Super Admin">Super Admin</option>}
            <option value="Admin">Admin</option>
            <option value="Investigator">Investigator</option>
            <option value="Auditor">Auditor</option>
            <option value="Editor">Editor</option>
            <option value="Viewer">Viewer</option>
          </select>
          <button type="submit" className="w-full py-2 bg-soc-cyan/10 border border-soc-cyan text-soc-cyan text-xs font-bold rounded">PROVISION OPERATOR</button>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modify Operator Clearance">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <input type="text" placeholder="Full Name" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full bg-[#0a1122] border border-soc-panel-border rounded p-2 text-sm text-soc-text" />
          <input type="text" placeholder="Username" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-[#0a1122] border border-soc-panel-border rounded p-2 text-sm text-soc-text" />
          <input type="email" placeholder="Email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-[#0a1122] border border-soc-panel-border rounded p-2 text-sm text-soc-text" />
          <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-[#0a1122] border border-soc-panel-border rounded p-2 text-sm text-soc-text appearance-none">
            {canManageAdmins && <option value="Super Admin">Super Admin</option>}
            <option value="Admin">Admin</option>
            <option value="Investigator">Investigator</option>
            <option value="Auditor">Auditor</option>
            <option value="Editor">Editor</option>
            <option value="Viewer">Viewer</option>
          </select>
          <button type="submit" className="w-full py-2 bg-soc-cyan/10 border border-soc-cyan text-soc-cyan text-xs font-bold rounded">UPDATE CLEARANCE</button>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} title="Reset Security Passkey">
        <form onSubmit={handleResetSubmit} className="space-y-4">
          <p className="text-xs text-soc-muted mb-2">Assigning new passkey for: <span className="text-soc-cyan">{selectedUser?.username}</span></p>
          <input type="password" placeholder="New Passkey" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-[#0a1122] border border-soc-panel-border rounded p-2 text-sm text-soc-text" />
          <button type="submit" className="w-full py-2 bg-rose-950/30 border border-soc-red text-soc-red text-xs font-bold rounded">FORCE PASSWORD RESET</button>
        </form>
      </Modal>

    </motion.div>
  );
}
