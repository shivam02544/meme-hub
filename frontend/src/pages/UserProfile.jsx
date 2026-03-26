import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { User, Calendar, Image as ImageIcon, ArrowLeft } from 'lucide-react';
// MemeCard logic is currently inline or can be extracted later

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
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [id]);

  if (loading) return <div className="container mt-4">Loading profile...</div>;
  if (error) return <div className="container mt-4 alert alert-error">{error}</div>;

  return (
    <div className="container">
      <Link to="/" className="btn" style={{ marginBottom: '2rem', display: 'inline-flex', gap: '0.5rem' }}>
        <ArrowLeft size={18} /> Back to Feed
      </Link>

      <div className="auth-card" style={{ maxWidth: '100%', marginBottom: '3rem', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--surface-color)', boxShadow: 'var(--shadow-outset)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
          <User size={48} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '2.5rem', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>{profile.name}</h1>
          <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '1rem' }}>
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
            <div key={meme.id} className="meme-card">
               {/* Simplified MemeCard logic for now or extract to separate component */}
               {meme.memeType === 'text' ? (
                 <div className="meme-text-content" style={{ minHeight: '150px' }}>
                   <p>{meme.description}</p>
                 </div>
               ) : (
                 <div className="meme-image-wrapper">
                    <img src={meme.imageUrl} alt={meme.title} className="meme-image" />
                 </div>
               )}
               <div className="meme-content">
                 <h3 className="meme-title">{meme.title}</h3>
                 <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>{meme.category}</p>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
