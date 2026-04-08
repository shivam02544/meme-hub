import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Save, Lock, Calendar, Image as ImageIcon, Mail } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function Profile({ user, onUserUpdate }) {
  const [name, setName] = useState(user.name || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  const [stats, setStats] = useState(null);

  const headers = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

  useEffect(() => {
    axios.get(`${API_URL}/users/${user.userId}/profile`)
      .then(res => setStats(res.data))
      .catch(() => {});
  }, [user.userId]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    setLoading(true);
    try {
      const res = await axios.put(`${API_URL}/users/profile`, { name }, headers);
      setMessage('Profile updated!');
      if (onUserUpdate) onUserUpdate(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwError(''); setPwMessage('');
    if (newPassword !== confirmPassword) return setPwError('Passwords do not match');
    setPwLoading(true);
    try {
      const res = await axios.put(`${API_URL}/users/change-password`, { currentPassword, newPassword }, headers);
      setPwMessage(res.data.message);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setPwError(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '520px', margin: '2rem auto', padding: '0 1rem' }}>

      {/* Profile header card */}
      <div style={{ background: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-outset)', padding: '2rem', marginBottom: '1.5rem', textAlign: 'center' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--surface-color)', boxShadow: 'var(--shadow-outset-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <User size={32} color="var(--primary-color)" />
        </div>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--text-active)', marginBottom: '0.25rem' }}>{user.name}</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>{user.email}</p>

        {stats && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem' }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-color)' }}>{stats.memeCount}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Memes</div>
            </div>
            <div style={{ width: '1px', background: 'var(--border-color)' }} />
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-active)' }}>
                {new Date(stats.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Joined</div>
            </div>
          </div>
        )}
      </div>

      {/* Edit name */}
      <div style={{ background: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-outset)', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <User size={18} color="var(--primary-color)" />
          <h3 style={{ fontSize: '1rem', margin: 0 }}>Edit Profile</h3>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleProfileSubmit}>
          <div className="form-group">
            <label className="form-label">Display Name</label>
            <input type="text" className="form-input" value={name}
              onChange={e => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={13} /> Email
            </label>
            <input type="email" className="form-input" value={user.email || ''} disabled style={{ opacity: 0.55 }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem', display: 'block' }}>Email cannot be changed</span>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            <Save size={15} /> {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div style={{ background: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-outset)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Lock size={18} color="var(--primary-color)" />
          <h3 style={{ fontSize: '1rem', margin: 0 }}>Change Password</h3>
        </div>

        {pwMessage && <div className="alert alert-success">{pwMessage}</div>}
        {pwError && <div className="alert alert-error">{pwError}</div>}

        <form onSubmit={handlePasswordSubmit}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input type="password" className="form-input" placeholder="••••••••"
              value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input type="password" className="form-input" placeholder="Min 6 characters"
              value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input type="password" className="form-input" placeholder="Repeat new password"
              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={pwLoading}>
            <Lock size={15} /> {pwLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

    </div>
  );
}
