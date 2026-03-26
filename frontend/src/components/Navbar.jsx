import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Layout, User } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  return (
    <nav className="navbar">
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" className="nav-brand">
          <Layout color="var(--primary-color)" />
          <span>MemeHub</span>
        </Link>
        <div className="nav-links">
          <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.8, textDecoration: 'none', color: 'inherit' }}>
            <User size={18} />
            <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-active)' }}>{user.name}</span>
          </Link>
          <button onClick={onLogout} className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
