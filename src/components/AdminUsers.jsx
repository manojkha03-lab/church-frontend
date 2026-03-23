import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { AdminMenu } from './AdminDashboard';
import { useToast } from '../context/ToastContext';
import { API_URL } from '../config/api';

const AdminUsers = () => {
  const { user, token } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    fetchUsers();
  }, [user, token]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    const res = await fetch(`${API_URL}/api/admin/approve/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setUsers(users.map(u => u._id === id ? { ...u, status: 'approved' } : u));
      toast.success('User approved');
    } else {
      toast.error('Failed to approve user');
    }
  };

  const handleReject = async (id) => {
    const res = await fetch(`${API_URL}/api/admin/reject/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setUsers(users.map(u => u._id === id ? { ...u, status: 'rejected' } : u));
      toast.success('User rejected');
    } else {
      toast.error('Failed to reject user');
    }
  };

  const handleRoleChange = async (id, newRole) => {
    const endpoint = newRole === 'admin' ? `${API_URL}/api/admin/promote/${id}` : `${API_URL}/api/admin/demote/${id}`;
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setUsers(users.map(u => u._id === id ? { ...u, role: newRole } : u));
      toast.success('Role updated');
    } else {
      toast.error('Failed to update role');
    }
  };

  const handleDelete = async (id) => {
    const res = await fetch(`${API_URL}/api/admin/delete/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setUsers(users.filter(u => u._id !== id));
      toast.success('User deleted');
      setConfirm(null);
    } else {
      toast.error('Failed to delete user');
    }
  };

  if (user?.role !== 'admin') return <Navigate to="/" />;

  const filtered = filter === 'all' ? users : users.filter(u => u.status === filter);
  const pendingCount = users.filter(u => u.status === 'pending').length;

  return (
    <div className="admin-container">
      <AdminMenu />
      <div className="admin-content">

        <div className="admin-topbar">
          <div>
            <h2 className="admin-page-title">Manage Users</h2>
            <p className="admin-page-sub">
              {users.length} total users{pendingCount > 0 && ` · ${pendingCount} pending approval`}
            </p>
          </div>
        </div>

        {/* Filter tabs - responsive */}
        <div className="flex flex-wrap gap-2 mb-6 sm:gap-3">
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                filter === f
                  ? 'admin-btn admin-btn--primary'
                  : 'admin-btn admin-btn--outline'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="admin-loading"><span className="dash-spinner" />Loading users...</div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">No {filter === 'all' ? '' : filter} users found.</div>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="block md:hidden space-y-4">
              {filtered.map(u => (
                <div key={u._id} className="bg-white rounded-xl shadow p-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 break-words">{u.name}</p>
                      <p className="text-sm text-gray-600 break-all truncate">{u.email}</p>
                    </div>
                    <span className={`admin-badge admin-badge--${u.status} flex-shrink-0 text-xs px-2 py-1`}>
                      {u.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-600 text-xs">Role</p>
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u._id, e.target.value)}
                        disabled={u._id === user._id}
                        className="w-full p-1 rounded border border-gray-200 text-xs mt-1"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-600 text-xs">Joined</p>
                      <p className="text-gray-900 font-medium mt-1">{new Date(u.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    {u.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleApprove(u._id)} 
                          className="w-full py-2 px-3 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleReject(u._id)} 
                          className="w-full py-2 px-3 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {u.status === 'rejected' && (
                      <button 
                        onClick={() => handleApprove(u._id)} 
                        className="w-full py-2 px-3 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
                      >
                        Approve
                      </button>
                    )}
                    {u._id !== user._id && (
                      <button
                        onClick={() => setConfirm({ id: u._id, name: u.name })}
                        className="w-full py-2 px-3 rounded-lg border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50 transition"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table view */}
            <div className="admin-table-wrap hidden md:block overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u._id}>
                      <td className="font-semibold break-words">{u.name}</td>
                      <td className="break-all">{u.email}</td>
                      <td>
                        <select
                          value={u.role}
                          onChange={e => handleRoleChange(u._id, e.target.value)}
                          disabled={u._id === user._id}
                          className="px-2 py-1 rounded border border-gray-200 text-xs"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>
                        <span className={`admin-badge admin-badge--${u.status}`}>
                          {u.status}
                        </span>
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="flex gap-2 flex-wrap">
                          {u.status === 'pending' && (
                            <>
                              <button onClick={() => handleApprove(u._id)} className="admin-btn admin-btn--primary text-xs px-3 py-2">
                                Approve
                              </button>
                              <button onClick={() => handleReject(u._id)} className="admin-btn admin-btn--outline text-xs px-3 py-2">
                                Reject
                              </button>
                            </>
                          )}
                          {u.status === 'rejected' && (
                            <button onClick={() => handleApprove(u._id)} className="admin-btn admin-btn--primary text-xs px-3 py-2">
                              Approve
                            </button>
                          )}
                          {u._id !== user._id && (
                            <button
                              onClick={() => setConfirm({ id: u._id, name: u.name })}
                              className="admin-btn admin-btn--danger text-xs px-3 py-2"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Delete confirmation modal */}
        {confirm && (
          <div className="admin-modal-backdrop" onClick={() => setConfirm(null)}>
            <div className="admin-modal mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="admin-modal__title">Delete User</h3>
              <p className="admin-modal__body">Are you sure you want to delete <strong>{confirm.name}</strong>? This cannot be undone.</p>
              <div className="admin-modal__footer flex gap-3">
                <button onClick={() => setConfirm(null)} className="admin-btn admin-btn--outline flex-1">Cancel</button>
                <button onClick={() => handleDelete(confirm.id)} className="admin-btn admin-btn--danger flex-1">Delete</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminUsers;