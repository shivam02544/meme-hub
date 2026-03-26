import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, KeyRound } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function Register({ onLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post(`${API_URL}/auth/register`, { name, email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/auth/verify`, { email, otp });
      onLogin(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div style={{ boxShadow: 'var(--shadow-outset-sm)', padding: '1rem', borderRadius: '50%', background: 'var(--surface-color)' }}>
              {!showOtp ? <UserPlus size={32} color="var(--accent-color)" /> : <KeyRound size={32} color="var(--accent-color)" />}
            </div>
          </div>
          <h1 className="auth-title">Join MemeHub</h1>
          <p>{showOtp ? 'Check your email for the OTP code' : 'Create an account to start sharing memes'}</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {!showOtp ? (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="John Doe"
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
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label className="form-label">OTP Code</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP & Login'}
            </button>
          </form>
        )}

        <div className="text-center mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
          <p>Already have an account? <Link className="link" to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
