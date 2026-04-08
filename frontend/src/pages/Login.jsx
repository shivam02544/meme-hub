import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { LogIn, KeyRound } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      onLogin(res.data.user, res.data.token);
    } catch (err) {
      if (err.response?.status === 403) {
        setShowOtp(true);
        setError('Email not verified. A new OTP has been sent. Please verify to login.');
      } else {
        setError(err.response?.data?.error || 'Login failed. Please check credentials.');
      }
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
              {!showOtp ? <LogIn size={32} color="var(--primary-color)" /> : <KeyRound size={32} color="var(--primary-color)" />}
            </div>
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p>{showOtp ? 'Check your email for the OTP code' : 'Enter your credentials to access your memes'}</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {!showOtp ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} required />
              <div style={{ textAlign: 'right', marginTop: '0.4rem' }}>
                <Link className="link" to="/forgot-password" style={{ fontSize: '0.82rem' }}>
                  Forgot password?
                </Link>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label className="form-label">OTP Code</label>
              <input type="text" className="form-input" placeholder="123456"
                value={otp} onChange={(e) => setOtp(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP & Login'}
            </button>
            <button type="button" className="btn mt-4" style={{ width: '100%' }} onClick={() => setShowOtp(false)}>
              Back to Login
            </button>
          </form>
        )}

        <div className="text-center mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
          <p>Don't have an account? <Link className="link" to="/register">Sign up</Link></p>
        </div>
      </div>
    </div>
  );
}
