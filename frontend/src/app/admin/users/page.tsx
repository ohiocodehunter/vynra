'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/lib/api';
import styles from './page.module.css';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  const fetchUsers = async () => {
    try {
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleVerifyToggle = async (userId: string, currentStatus: boolean) => {
    try {
      await adminService.updateUser(userId, { isVerified: !currentStatus });
      fetchUsers(); // Refresh list
    } catch (error) {
      alert('Error updating user');
    }
  };
  
  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      await adminService.updateUser(userId, { accountStatus: newStatus });
      fetchUsers();
    } catch (error) {
      alert('Error updating user status');
    }
  };

  const handleRoleChange = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const actionText = newRole === 'admin' ? 'promote this user to Admin' : 'remove Admin privileges from this user';
    
    if (window.confirm(`Are you sure you want to ${actionText}?`)) {
      try {
        const res = await adminService.updateUser(userId, { role: newRole });
        if (res.newAdminPin) {
          alert(`SUCCESS: User is now an Admin!\n\nTheir one-time Admin Passcode is: ${res.newAdminPin}\n\nPlease share this passcode with the user securely. They will need it to log in to the admin panel.`);
        } else if (newRole === 'admin') {
          alert(`User promoted to Admin successfully. They already have an existing admin passcode.`);
        }
        fetchUsers();
      } catch (error) {
        alert('Error updating user role');
      }
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('WARNING: Are you sure you want to PERMANENTLY delete this user AND all of their videos? This action cannot be undone.')) {
      try {
        await adminService.deleteUser(userId);
        fetchUsers();
      } catch (error) {
        alert('Error deleting user');
      }
    }
  };

  const filteredAndSortedUsers = users
    .filter(user => {
      if (!searchQuery) return true;
      const lowerQuery = searchQuery.toLowerCase();
      const username = user.username?.toLowerCase() || '';
      const channel = user.channelName?.toLowerCase() || '';
      const email = user.email?.toLowerCase() || '';
      return username.includes(lowerQuery) || channel.includes(lowerQuery) || email.includes(lowerQuery);
    })
    .sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortOrder === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortOrder === 'mostSubs') return (b.subscribersCount || 0) - (a.subscribersCount || 0);
      if (sortOrder === 'leastSubs') return (a.subscribersCount || 0) - (b.subscribersCount || 0);
      return 0;
    });

  if (loading) return <div>Loading users...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className={styles.pageTitle} style={{ marginBottom: 0 }}>Users Manager</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder="Search username, channel or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', color: '#fff', minWidth: '300px' }}
          />
          <select 
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', color: '#fff' }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="mostSubs">Most Subscribers</option>
            <option value="leastSubs">Least Subscribers</option>
          </select>
        </div>
      </div>
      
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Channel / User</th>
              <th>Email</th>
              <th>Subscribers</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedUsers.map(user => (
              <tr key={user._id}>
                <td>
                  <div className={styles.userCell}>
                    <img src={user.avatarUrl || '/default-avatar.png'} alt="avatar" className={styles.avatar} />
                    <div>
                      <div className={styles.channelName}>
                        {user.channelName} 
                        {user.isVerified && <span className={styles.verifiedBadge}>✓</span>}
                      </div>
                      <div className={styles.username}>@{user.username}</div>
                    </div>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>{user.subscribersCount}</td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <span className={user.role === 'admin' ? styles.roleAdmin : styles.roleUser}>
                      {user.role}
                    </span>
                    {user.accountStatus === 'suspended' && (
                      <span style={{ background: 'rgba(255,170,0,0.1)', color: '#ffaa00', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>
                        Suspended
                      </span>
                    )}
                    {user.accountStatus === 'banned' && (
                      <span style={{ background: 'rgba(255,51,51,0.1)', color: '#ff4d4d', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>
                        Banned
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <div className={styles.actions} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => handleVerifyToggle(user._id, user.isVerified)}
                      className={user.isVerified ? styles.btnWarning : styles.btnSuccess}
                    >
                      {user.isVerified ? 'Unverify' : 'Verify'}
                    </button>
                    
                    <button 
                      onClick={() => handleRoleChange(user._id, user.role)}
                      className={user.role === 'admin' ? styles.btnWarning : styles.btnSuccess}
                      style={user.role !== 'admin' ? { background: '#8a2be2', color: 'white', borderColor: '#8a2be2' } : {}}
                    >
                      {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                    </button>
                    
                    <select 
                      value={user.accountStatus || 'active'} 
                      onChange={(e) => handleStatusChange(user._id, e.target.value)}
                      style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspend</option>
                      <option value="banned">Ban</option>
                    </select>

                    <button onClick={() => handleDelete(user._id)} className={styles.btnDanger}>
                      Hard Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
