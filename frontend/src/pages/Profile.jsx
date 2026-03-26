import React, { useState } from 'react';
import axios from 'axios';
import { User, Save } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function Profile({ user, onUserUpdate }) {
  const [name, setName] = useState(user.name || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await axios.put(`${API_URL}/users/profile`, { name }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMessage('Profile updated successfully!');
      if (onUserUpdate) {
        onUserUpdate(res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: '500px' }}>
        <div className="auth-header">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div style={{ boxShadow: 'var(--shadow-outset-sm)', padding: '1.25rem', borderRadius: '50%', background: 'var(--surface-color)' }}>
              <User size={36} color="var(--primary-color)" />
            </div>
          </div>
          <h1 className="auth-title">Your Profile</h1>
          <p>Update your personal information</p>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={user.email || ''}
              disabled
              style={{ opacity: 0.6 }}
            />
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Email cannot be changed.
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            <Save size={18} />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
