import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { User, Calendar, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import MemeCard from '../components/MemeCard';

const API_URL = 'http://localhost:5000/api';

export default function UserProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const [profileRes, memesRes] = await Promise.all([
          axios.get(`${API_URL}/users/${id}/profile`),
          axios.get(`${API_URL}/memes`, { params: { userId: id } })
        ]);
        setProfile(profileRes.data);
        setMemes(memesRes.data);
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [id]);

  const handleLike = async (memeId) => {
    try {
      const res = await axios.post(`${API_URL}/memes/${memeId}/like`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMemes(prev => prev.map(m => m.id === memeId ? {
        ...m, likeCount: res.data.liked ? m.likeCount + 1 : m.likeCount - 1
      } : m));
    } catch (err) { 
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      setError('Failed to like meme'); 
    }
  };

  if (loading) return <div className="container mt-4">Loading profile...</div>;
  if (error) return <div className="container mt-4 alert alert-error">{error}</div>;

  return (
    <div className="container">
      <Link to="/" className="btn" style={{ marginBottom: '2rem', display: 'inline-flex', gap: '0.5rem' }}>
        <ArrowLeft size={18} /> Back to Feed
      </Link>

      <div className="glass-card profile-card">
        <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--glass-bg-lite)', border: '2px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
          <User size={48} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>{profile.name}</h1>
          <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '1rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={16} /> Joined {new Date(profile.createdAt).toLocaleDateString()}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ImageIcon size={16} /> {profile.memeCount} Memes Shared
            </span>
          </div>
        </div>
      </div>

      <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-active)' }}>Collection</h2>
      <div className="meme-grid">
        {memes.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0', background: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-inset)' }}>
            <p>This user hasn't shared any memes yet.</p>
          </div>
        ) : (
          memes.map(meme => (
            <MemeCard 
              key={meme.id} 
              meme={meme} 
              onLike={handleLike}
            />
          ))
        )}
      </div>
    </div>
  );
}
