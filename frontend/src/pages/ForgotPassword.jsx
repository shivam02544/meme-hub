import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { KeyRound, Mail, Lock } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function ForgotPassword() {
  const [step, setStep] = useState('email'); // 'email' | 'otp' | 'done'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setMessage(res.data.message);
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match');
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/reset-password`, { email, otp, newPassword });
      setMessage(res.data.message);
      setStep('done');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. Check your OTP.');
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
              {step === 'email' ? <Mail size={32} color="var(--primary-color)" /> : <KeyRound size={32} color="var(--primary-color)" />}
            </div>
          </div>
          <h1 className="auth-title">
            {step === 'email' ? 'Forgot Password?' : step === 'otp' ? 'Reset Password' : 'All Done! 🎉'}
          </h1>
          <p>
            {step === 'email' && "No worries! We'll send a reset OTP to your email."}
            {step === 'otp' && 'Enter the OTP from your email and set a new password.'}
            {step === 'done' && 'Redirecting you to login...'}
          </p>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {step === 'email' && (
          <form onSubmit={handleRequestOtp}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send Reset OTP'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label className="form-label">OTP Code</label>
              <input type="text" className="form-input" placeholder="123456"
                value={otp} onChange={(e) => setOtp(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" className="form-input" placeholder="Min 6 characters"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input type="password" className="form-input" placeholder="Repeat password"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <button type="button" className="btn mt-4" style={{ width: '100%' }}
              onClick={() => { setStep('email'); setError(''); setMessage(''); }}>
              Back
            </button>
          </form>
        )}

        <div className="text-center mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
          <p>Remembered it? <Link className="link" to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
