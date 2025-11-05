import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  Mail,
  Calendar,
  Award,
  Zap,
  Shield,
  ShieldOff,
  X,
  Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminAPI from '../../services/adminAPI';

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);

  const [userForm, setUserForm] = useState({
    fullName: '',
    email: '',
    isAdmin: false,
    isActive: true
  });

  // Fetch users from database
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await AdminAPI.getAllUsers({
          page: 1,
          limit: 100, // Get more users for admin view
          search: searchTerm,
          status: filterStatus === 'all' ? '' : filterStatus
        });
        setUsers(response.data.users || []);
      } catch (error) {
  toast.error('Failed to fetch users');
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [searchTerm, filterStatus]);

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      fullName: user.fullName,
      email: user.email,
      isAdmin: user.isAdmin,
      isActive: user.isActive
    });
    setShowEditModal(true);
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (!userForm.fullName || !userForm.email) {
        throw new Error('Name and email are required');
      }

      // Here you would make an API call to update the user
  // Updating user
      
      // Mock API call - replace with real API
      // await AdminAPI.updateUserStatus(editingUser._id || editingUser.id, {
      //   isActive: userForm.isActive,
      //   isAdmin: userForm.isAdmin
      // });

      
      // Mock update for now
      await new Promise(resolve => setTimeout(resolve, 1000));

      setUsers(prev => prev.map(u => 
        u._id === editingUser._id ? { ...u, ...userForm } : u
      ));
      
      toast.success('User updated successfully!');
      handleCloseModal();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await AdminAPI.deleteUser(userId);
        setUsers(prev => prev.filter(u => (u._id || u.id) !== userId));
        toast.success('User deleted successfully!');
      } catch (error) {
  toast.error('Failed to delete user');
        toast.error('Failed to delete user');
      }
    }
  };

  const handleToggleAdminStatus = async (userId) => {
    const user = users.find(u => (u._id || u.id) === userId);
    if (window.confirm(`${user.isAdmin ? 'Remove admin privileges from' : 'Grant admin privileges to'} ${user.fullName}?`)) {
      try {
        await AdminAPI.updateUserStatus(userId, { isAdmin: !user.isAdmin });
        setUsers(prev => prev.map(u => 
          (u._id || u.id) === userId 
            ? { ...u, isAdmin: !u.isAdmin }
            : u
        ));
        toast.success(`Admin status ${user.isAdmin ? 'removed from' : 'granted to'} ${user.fullName}!`);
      } catch (error) {
  toast.error('Failed to update admin status');
        toast.error('Failed to update admin status');
      }
    }
  };

  const handleToggleActiveStatus = async (userId) => {
    const user = users.find(u => (u._id || u.id) === userId);
    try {
      await AdminAPI.updateUserStatus(userId, { isActive: !user.isActive });
      setUsers(prev => prev.map(u => 
        (u._id || u.id) === userId 
          ? { ...u, isActive: !u.isActive }
          : u
      ));
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully!`);
    } catch (error) {
  toast.error('Failed to update user status');
      toast.error('Failed to update user status');
    }
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditingUser(null);
    setUserForm({
      fullName: '',
      email: '',
      isAdmin: false,
      isActive: true
    });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || 
                       (filterRole === 'admin' && user.isAdmin) ||
                       (filterRole === 'user' && !user.isAdmin);
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.isActive) ||
                         (filterStatus === 'inactive' && !user.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-app">User Management</h2>
          <p className="muted-text">Manage platform users and their permissions</p>
        </div>
        <div className="flex items-center space-x-2 text-sm muted-text">
          <Users className="w-4 h-4" />
          <span>{filteredUsers.length} users</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface glass neon-card rounded-2xl border border-app p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users by name, email, or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
              />
            </div>
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="user">Users</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* User List */}
      <div className="bg-surface glass neon-card rounded-2xl border border-app overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-app">
              <tr>
                <th className="text-left p-4 font-medium text-app">User</th>
                <th className="text-left p-4 font-medium text-app">Role</th>
                <th className="text-left p-4 font-medium text-app">Status</th>
                <th className="text-left p-4 font-medium text-app">Member Since</th>
                <th className="text-left p-4 font-medium text-app">Last Active</th>
                <th className="text-left p-4 font-medium text-app">Actions</th>
                <th className='text-left p-4 font-medium text-app'>Points</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <motion.tr
                  key={user._id || user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-app/50 hover:bg-white/5 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      {user.profileImage ? (
                        <img 
                          src={user.profileImage} 
                          alt={user.fullName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-brand-dark flex items-center justify-center text-white font-bold">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-app">{user.fullName}</p>
                        <p className="text-sm muted-text">{user.email}</p>
                        <p className="text-xs muted-text">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      {user.isAdmin ? (
                        <>
                          <Shield className="w-4 h-4 text-purple-500" />
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-500">Admin</span>
                        </>
                      ) : (
                        <>
                          <Users className="w-4 h-4 text-blue-500" />
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">User</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.isActive 
                        ? 'bg-green-500/10 text-green-500' 
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2 text-sm muted-text">
                      <Calendar className="w-4 h-4" />
                      <span>Member since {formatDate(user.createdAt)}</span>
                    </div>
                  </td>

                  <td className="p-4">
                    <span className="text-sm muted-text">
                      {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-2 rounded-lg border border-app hover:bg-white/5 transition"
                        title="Edit user"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleAdminStatus(user._id || user.id)}
                        className={`p-2 rounded-lg border transition ${
                          user.isAdmin 
                            ? 'border-purple-300 text-purple-600 hover:bg-purple-50' 
                            : 'border-app hover:bg-white/5'
                        }`}
                        title={user.isAdmin ? 'Remove admin' : 'Make admin'}
                      >
                        {user.isAdmin ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleToggleActiveStatus(user._id || user.id)}
                        className={`p-2 rounded-lg border transition ${
                          user.isActive 
                            ? 'border-red-300 text-red-600 hover:bg-red-50' 
                            : 'border-green-300 text-green-600 hover:bg-green-50'
                        }`}
                        title={user.isActive ? 'Deactivate' : 'Activate'}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id || user.id)}
                        className="p-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>


                  </td>

                  <td>
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium text-app">{user.xp || 0}</span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No users found matching your criteria.</p>
        </div>
      )}

      {/* Edit User Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface glass neon-card rounded-2xl border border-app p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-app">Edit User</h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-lg hover:bg-white/5 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-app mb-2">Full Name</label>
                  <input
                    type="text"
                    value={userForm.fullName}
                    onChange={(e) => setUserForm(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-app mb-2">Email</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isAdmin"
                    checked={userForm.isAdmin}
                    onChange={(e) => setUserForm(prev => ({ ...prev, isAdmin: e.target.checked }))}
                    className="rounded border-app text-brand-purple focus:ring-brand-purple"
                  />
                  <label htmlFor="isAdmin" className="text-sm font-medium text-app">Administrator privileges</label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={userForm.isActive}
                    onChange={(e) => setUserForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-app text-brand-purple focus:ring-brand-purple"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-app">Active account</label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2.5 border border-app rounded-lg hover:bg-white/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 neon-btn px-4 py-2.5 rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManager;
